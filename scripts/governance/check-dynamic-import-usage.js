#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"]);
const DEFAULT_SCAN_DIRECTORIES = ["src", "test", "scripts", "bin"];
const ALLOW_COMMENT_PATTERN = /dynamic-import-allowed:\s*\S+/i;

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    paths: [...DEFAULT_SCAN_DIRECTORIES],
    format: "summary",
  };

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];

    if (token === "--cwd") {
      options.cwd = path.resolve(argv[index + 1] ?? options.cwd);
      index += 1;
      continue;
    }

    if (token === "--paths") {
      const rawValue = String(argv[index + 1] ?? "").trim();
      index += 1;

      if (rawValue.length > 0) {
        options.paths = rawValue
          .split(",")
          .map((segment) => segment.trim())
          .filter(Boolean);
      }

      continue;
    }

    if (token === "--format=json") {
      options.format = "json";
    }
  }

  return options;
}

function toRelativePath(cwd, absolutePath) {
  const relativePath = path.relative(cwd, absolutePath).split(path.sep).join("/");
  return relativePath || ".";
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

  for (const entry of fs.readdirSync(targetPath)) {
    collectSourceFiles(path.resolve(targetPath, entry), files);
  }

  return files;
}

function getScriptKind(filePath) {
  const extension = path.extname(filePath).toLowerCase();

  if (extension === ".ts") {
    return ts.ScriptKind.TS;
  }

  if (extension === ".tsx") {
    return ts.ScriptKind.TSX;
  }

  if (extension === ".mts" || extension === ".cts") {
    return ts.ScriptKind.TS;
  }

  return ts.ScriptKind.JS;
}

function hasAllowComment(lines, zeroBasedLineNumber) {
  const startLine = Math.max(0, zeroBasedLineNumber - 2);

  for (let lineNumber = startLine; lineNumber <= zeroBasedLineNumber; lineNumber += 1) {
    if (ALLOW_COMMENT_PATTERN.test(lines[lineNumber] ?? "")) {
      return true;
    }
  }

  return false;
}

function analyzeFile(filePath, cwd) {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.ESNext,
    true,
    getScriptKind(filePath),
  );
  const lines = sourceText.split(/\r?\n/);
  const findings = [];

  function visit(node) {
    if (ts.isCallExpression(node)) {
      let usageType = null;

      if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
        usageType = "dynamic-import";
      } else if (ts.isIdentifier(node.expression) && node.expression.text === "require") {
        usageType = "require";
      }

      if (usageType !== null) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const hasComment = hasAllowComment(lines, position.line);

        if (!hasComment) {
          findings.push({
            file: toRelativePath(cwd, filePath),
            line: position.line + 1,
            type: usageType,
            message:
              "Missing allow comment. Add `// dynamic-import-allowed: reason` near this dependency load.",
          });
        }
      }
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return findings;
}

function writeSummary(payload) {
  process.stdout.write(
    `${[
      "dynamic-import-usage-check",
      `status=${payload.status}`,
      `files=${payload.fileCount}`,
      `findings=${payload.findings.length}`,
    ].join("\n")}\n`,
  );
}

function writeJson(payload) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const cwd = path.resolve(options.cwd);
  const scanTargets = options.paths.map((target) => path.resolve(cwd, target));
  const files = scanTargets.flatMap((target) => collectSourceFiles(target));
  const findings = files.flatMap((filePath) => analyzeFile(filePath, cwd));
  const payload = {
    status: findings.length === 0 ? "pass" : "fail",
    cwd,
    paths: options.paths,
    fileCount: files.length,
    findings,
  };

  if (options.format === "json") {
    writeJson(payload);
  } else {
    writeSummary(payload);
  }

  if (findings.length > 0) {
    for (const finding of findings) {
      process.stderr.write(
        `${finding.file}:${finding.line} [${finding.type}] ${finding.message}\n`,
      );
    }

    process.exitCode = 1;
  }
}

main();
