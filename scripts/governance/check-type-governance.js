#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts"]);
const DEFAULT_SCAN_DIR = "src";
const DEFAULT_INTERFACES_DIR = "src/types/interfaces";
const DEFAULT_ALIASES_DIR = "src/types/aliases";
const DEFAULT_WHITELIST_PATH = "scripts/governance/type-governance-whitelist.json";
const TYPE_SHAPE_ALLOW_COMMENT_PATTERN = /type-shape-allowed:\s*\S+/i;

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
    scanDir: DEFAULT_SCAN_DIR,
    interfacesDir: DEFAULT_INTERFACES_DIR,
    aliasesDir: DEFAULT_ALIASES_DIR,
    whitelistPath: DEFAULT_WHITELIST_PATH
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

    if (token === "--scan-dir") {
      options.scanDir = String(argv[index + 1] ?? options.scanDir).trim();
      index += 1;
      continue;
    }

    if (token === "--interfaces-dir") {
      options.interfacesDir = String(argv[index + 1] ?? options.interfacesDir).trim();
      index += 1;
      continue;
    }

    if (token === "--aliases-dir") {
      options.aliasesDir = String(argv[index + 1] ?? options.aliasesDir).trim();
      index += 1;
      continue;
    }

    if (token === "--whitelist") {
      options.whitelistPath = String(argv[index + 1] ?? options.whitelistPath).trim();
      index += 1;
      continue;
    }

    throw new Error(`Unknown argument: ${token}`);
  }

  return options;
}

function loadWhitelist(cwd, whitelistPath) {
  const resolvedPath = path.resolve(cwd, whitelistPath);

  if (!fs.existsSync(resolvedPath)) {
    return {
      configPath: normalizeRelativePath(path.relative(cwd, resolvedPath)),
      pathAllowList: new Set()
    };
  }

  const parsed = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  const entries = Array.isArray(parsed.pathAllowList) ? parsed.pathAllowList : [];
  const normalizedEntries = entries
    .map((entry) => {
      if (typeof entry === "string") {
        return normalizeRelativePath(entry);
      }

      if (entry && typeof entry.path === "string") {
        return normalizeRelativePath(entry.path);
      }

      return "";
    })
    .filter(Boolean);

  return {
    configPath: normalizeRelativePath(path.relative(cwd, resolvedPath)),
    pathAllowList: new Set(normalizedEntries)
  };
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

  const entries = fs.readdirSync(targetPath, { withFileTypes: true });

  for (const entry of entries) {
    collectSourceFiles(path.resolve(targetPath, entry.name), files);
  }

  return files;
}

function getScriptKind(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".tsx") {
    return ts.ScriptKind.TSX;
  }

  return ts.ScriptKind.TS;
}

function hasAllowComment(lines, zeroBasedLineNumber) {
  const startLine = Math.max(0, zeroBasedLineNumber - 2);

  for (let lineNumber = startLine; lineNumber <= zeroBasedLineNumber; lineNumber += 1) {
    if (TYPE_SHAPE_ALLOW_COMMENT_PATTERN.test(lines[lineNumber] ?? "")) {
      return true;
    }
  }

  return false;
}

function unwrapTypeNode(node) {
  let current = node;

  while (ts.isParenthesizedTypeNode(current)) {
    current = current.type;
  }

  return current;
}

function analyzeFile(filePath, cwd) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(filePath)
  );
  const relativePath = normalizeRelativePath(path.relative(cwd, filePath));
  const lines = sourceText.split(/\r?\n/);
  const typeAliases = [];
  const interfaces = [];

  function visit(node) {
    if (ts.isTypeAliasDeclaration(node)) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      const unwrappedType = unwrapTypeNode(node.type);
      typeAliases.push({
        name: node.name.text,
        line: position.line + 1,
        isObjectShape: ts.isTypeLiteralNode(unwrappedType),
        hasAllowComment: hasAllowComment(lines, position.line)
      });
    }

    if (ts.isInterfaceDeclaration(node)) {
      const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
      interfaces.push({
        name: node.name.text,
        line: position.line + 1
      });
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return {
    file: relativePath,
    typeAliases,
    interfaces
  };
}

function writeSummary(payload) {
  process.stdout.write(
    [
      "type-governance-check",
      `status=${payload.status}`,
      `scanDir=${payload.scanDir}`,
      `files=${payload.fileCount}`,
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
    const scanDir = normalizeRelativePath(options.scanDir);
    const interfacesDir = normalizeRelativePath(options.interfacesDir).replace(/\/+$/, "");
    const aliasesDir = normalizeRelativePath(options.aliasesDir).replace(/\/+$/, "");
    const whitelist = loadWhitelist(cwd, options.whitelistPath);
    const findings = [];

    const requiredFiles = [
      `${interfacesDir}/index.ts`,
      `${aliasesDir}/index.ts`
    ];

    for (const requiredFile of requiredFiles) {
      if (!fs.existsSync(path.resolve(cwd, requiredFile))) {
        findings.push({
          code: "types_index_missing",
          file: requiredFile,
          line: 1,
          message: `Required type export aggregator is missing: ${requiredFile}`
        });
      }
    }

    const sourceFiles = collectSourceFiles(path.resolve(cwd, scanDir));
    const analyses = sourceFiles.map((sourceFilePath) => analyzeFile(sourceFilePath, cwd));
    const interfacesPrefix = `${interfacesDir}/`;
    const aliasesPrefix = `${aliasesDir}/`;

    for (const analysis of analyses) {
      const basename = path.basename(analysis.file);
      const inInterfacesDir = analysis.file.startsWith(interfacesPrefix);
      const inAliasesDir = analysis.file.startsWith(aliasesPrefix);
      const allowedLegacyPath = whitelist.pathAllowList.has(analysis.file);
      const hasDeclarations = analysis.interfaces.length > 0 || analysis.typeAliases.length > 0;

      if (inInterfacesDir && basename !== "index.ts" && !basename.endsWith(".interface.ts")) {
        findings.push({
          code: "interface_file_name_invalid",
          file: analysis.file,
          line: 1,
          message: `Interface files must end with .interface.ts: ${analysis.file}`
        });
      }

      if (inAliasesDir && basename !== "index.ts" && !basename.endsWith(".type.ts")) {
        findings.push({
          code: "alias_file_name_invalid",
          file: analysis.file,
          line: 1,
          message: `Type alias files must end with .type.ts: ${analysis.file}`
        });
      }

      if (inInterfacesDir) {
        for (const alias of analysis.typeAliases) {
          findings.push({
            code: "interface_dir_contains_type_alias",
            file: analysis.file,
            line: alias.line,
            message: `Type alias "${alias.name}" should be placed in ${aliasesDir}.`
          });
        }
      }

      if (inAliasesDir) {
        for (const declaration of analysis.interfaces) {
          findings.push({
            code: "alias_dir_contains_interface",
            file: analysis.file,
            line: declaration.line,
            message: `Interface "${declaration.name}" should be placed in ${interfacesDir}.`
          });
        }
      }

      if (!inInterfacesDir && !inAliasesDir && hasDeclarations && !allowedLegacyPath) {
        findings.push({
          code: "type_declaration_outside_managed_dirs",
          file: analysis.file,
          line: 1,
          message: `Move type/interface declarations into ${interfacesDir} or ${aliasesDir}.`
        });
      }

      for (const alias of analysis.typeAliases) {
        if (!alias.isObjectShape || alias.hasAllowComment || allowedLegacyPath) {
          continue;
        }

        findings.push({
          code: "type_shape_alias_forbidden",
          file: analysis.file,
          line: alias.line,
          message: `Object structure contract "${alias.name}" must use interface. Add // type-shape-allowed: reason only for explicit exceptions.`
        });
      }
    }

    const payload = {
      status: findings.length === 0 ? "pass" : "fail",
      cwd: normalizeRelativePath(cwd),
      scanDir,
      interfacesDir,
      aliasesDir,
      whitelistPath: whitelist.configPath,
      fileCount: analyses.length,
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
