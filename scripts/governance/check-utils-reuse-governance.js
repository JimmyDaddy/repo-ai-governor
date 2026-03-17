#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);
const DEFAULT_UTILS_DIR = "src/utils";
const DEFAULT_WHITELIST_PATH = "scripts/governance/utils-reuse-whitelist.json";
const DEFAULT_CONTEXT_PATH = ".repo-ai-governor/context/current-context.md";

function toPosixPath(value) {
  return String(value).replace(/\\/g, "/");
}

function normalizeRelativePath(value) {
  return toPosixPath(String(value ?? ""))
    .trim()
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    format: "summary",
    utilsDir: DEFAULT_UTILS_DIR,
    whitelistPath: DEFAULT_WHITELIST_PATH,
    contextPath: DEFAULT_CONTEXT_PATH,
    executionNotesPath: ""
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--format=json") {
      options.format = "json";
      continue;
    }

    if (token === "--cwd") {
      options.cwd = path.resolve(argv[index + 1] ?? options.cwd);
      index += 1;
      continue;
    }

    if (token === "--utils-dir") {
      options.utilsDir = String(argv[index + 1] ?? options.utilsDir).trim();
      index += 1;
      continue;
    }

    if (token === "--whitelist") {
      options.whitelistPath = String(argv[index + 1] ?? options.whitelistPath).trim();
      index += 1;
      continue;
    }

    if (token === "--context") {
      options.contextPath = String(argv[index + 1] ?? options.contextPath).trim();
      index += 1;
      continue;
    }

    if (token === "--execution-notes") {
      options.executionNotesPath = String(argv[index + 1] ?? options.executionNotesPath).trim();
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function collectSourceFiles(targetPath, files = []) {
  if (!fs.existsSync(targetPath)) {
    return files;
  }

  const stats = fs.statSync(targetPath);

  if (stats.isFile()) {
    if (SOURCE_EXTENSIONS.has(path.extname(targetPath))) {
      files.push(targetPath);
    }

    return files;
  }

  const children = fs.readdirSync(targetPath, { withFileTypes: true });

  for (const child of children) {
    collectSourceFiles(path.resolve(targetPath, child.name), files);
  }

  return files;
}

function loadWhitelist(cwd, whitelistPath) {
  const resolvedPath = path.resolve(cwd, whitelistPath);

  if (!fs.existsSync(resolvedPath)) {
    return {
      configPath: normalizeRelativePath(path.relative(cwd, resolvedPath)),
      allowList: new Set(),
      executionNotesPath: ""
    };
  }

  const parsed = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  const allowList = Array.isArray(parsed.allowList)
    ? parsed.allowList
        .map((entry) => {
          if (typeof entry === "string") {
            return normalizeRelativePath(entry);
          }

          if (entry && typeof entry.signature === "string") {
            return normalizeRelativePath(entry.signature);
          }

          return "";
        })
        .filter(Boolean)
    : [];
  const executionNotesPath =
    typeof parsed.executionNotesPath === "string"
      ? normalizeRelativePath(parsed.executionNotesPath)
      : "";

  return {
    configPath: normalizeRelativePath(path.relative(cwd, resolvedPath)),
    allowList: new Set(allowList),
    executionNotesPath
  };
}

function resolveDocsRootFromContext(cwd, contextPath) {
  const resolvedPath = path.resolve(cwd, contextPath);

  if (!fs.existsSync(resolvedPath)) {
    return "";
  }

  const content = fs.readFileSync(resolvedPath, "utf8");
  const match = content.match(/- Docs root:\s*`([^`]+)`/);
  return match ? normalizeRelativePath(match[1]) : "";
}

function getScriptKind(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".tsx") {
    return ts.ScriptKind.TSX;
  }

  return ts.ScriptKind.TS;
}

function hasExportModifier(node) {
  return Boolean(node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword));
}

function isFunctionLikeInitializer(node) {
  return ts.isArrowFunction(node) || ts.isFunctionExpression(node);
}

function collectExportedFunctionsFromFile(filePath, cwd) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(filePath)
  );
  const relativeFile = normalizeRelativePath(path.relative(cwd, filePath));
  const records = [];

  for (const statement of sourceFile.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name && hasExportModifier(statement)) {
      const position = sourceFile.getLineAndCharacterOfPosition(statement.name.getStart(sourceFile));
      const functionName = statement.name.text;
      records.push({
        file: relativeFile,
        name: functionName,
        line: position.line + 1,
        signature: `${relativeFile}#${functionName}`
      });
      continue;
    }

    if (ts.isVariableStatement(statement) && hasExportModifier(statement)) {
      for (const declaration of statement.declarationList.declarations) {
        if (!ts.isIdentifier(declaration.name) || !declaration.initializer) {
          continue;
        }

        if (!isFunctionLikeInitializer(declaration.initializer)) {
          continue;
        }

        const position = sourceFile.getLineAndCharacterOfPosition(
          declaration.name.getStart(sourceFile)
        );
        const functionName = declaration.name.text;
        records.push({
          file: relativeFile,
          name: functionName,
          line: position.line + 1,
          signature: `${relativeFile}#${functionName}`
        });
      }
    }
  }

  return records;
}

function readExecutionNotes(cwd, executionNotesPath) {
  if (!executionNotesPath) {
    return "";
  }

  const resolvedPath = path.resolve(cwd, executionNotesPath);
  if (!fs.existsSync(resolvedPath)) {
    return "";
  }

  return fs.readFileSync(resolvedPath, "utf8");
}

function writeSummary(payload) {
  process.stdout.write(
    [
      "utils-reuse-check",
      `status=${payload.status}`,
      `utilsDir=${payload.utilsDir}`,
      `functions=${payload.functionCount}`,
      `newFunctions=${payload.newFunctionCount}`,
      `findings=${payload.findings.length}`
    ].join("\n") + "\n"
  );
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const cwd = path.resolve(options.cwd);
    const utilsDir = normalizeRelativePath(options.utilsDir);
    const whitelist = loadWhitelist(cwd, options.whitelistPath);
    const docsRootFromContext = resolveDocsRootFromContext(cwd, options.contextPath);
    const executionNotesPath =
      normalizeRelativePath(options.executionNotesPath) ||
      whitelist.executionNotesPath ||
      (docsRootFromContext ? `${docsRootFromContext}/execution_notes.md` : "");
    const utilsDirectoryPath = path.resolve(cwd, utilsDir);
    const sourceFiles = collectSourceFiles(utilsDirectoryPath);
    const functions = sourceFiles
      .flatMap((sourceFilePath) => collectExportedFunctionsFromFile(sourceFilePath, cwd))
      .sort((left, right) => left.signature.localeCompare(right.signature));
    const nameToEntries = new Map();

    for (const entry of functions) {
      const existing = nameToEntries.get(entry.name) ?? [];
      existing.push(entry);
      nameToEntries.set(entry.name, existing);
    }

    const findings = [];

    for (const [functionName, entries] of nameToEntries) {
      if (entries.length <= 1) {
        continue;
      }

      for (const entry of entries) {
        findings.push({
          code: "utils_duplicate_name",
          file: entry.file,
          line: entry.line,
          name: functionName,
          message: `Duplicate util function name "${functionName}" found. Reuse existing implementation instead of adding duplicates.`
        });
      }
    }

    const newFunctions = functions.filter((entry) => !whitelist.allowList.has(entry.signature));
    const executionNotesContent = readExecutionNotes(cwd, executionNotesPath);

    for (const entry of newFunctions) {
      if (executionNotesContent.includes(entry.signature)) {
        continue;
      }

      findings.push({
        code: "utils_reuse_note_missing",
        file: entry.file,
        line: entry.line,
        name: entry.name,
        message: `Missing reuse evaluation record for "${entry.signature}" in execution notes (${executionNotesPath || "unresolved"}).`
      });
    }

    const payload = {
      status: findings.length === 0 ? "pass" : "fail",
      cwd: normalizeRelativePath(cwd),
      utilsDir,
      whitelistPath: whitelist.configPath,
      executionNotesPath,
      functionCount: functions.length,
      newFunctionCount: newFunctions.length,
      functions,
      newFunctions,
      findings
    };

    if (options.format === "json") {
      writeJson(payload);
    } else {
      writeSummary(payload);
    }

    if (findings.length > 0) {
      for (const finding of findings) {
        process.stderr.write(`${finding.file}:${finding.line} [${finding.code}] ${finding.message}\n`);
      }
      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

main();
