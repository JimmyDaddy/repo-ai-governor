#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const SOURCE_EXTENSIONS = new Set([".ts", ".tsx", ".mts", ".cts", ".js", ".mjs", ".cjs"]);
const DEFAULT_SCAN_DIRECTORIES = ["src"];
const DEFAULT_CONSTANTS_DIRECTORY = "src/constants";
const DEFAULT_WHITELIST_PATH = "scripts/governance/literal-set-whitelist.json";
const ALLOW_COMMENT_PATTERN = /literal-set-allowed:\s*\S+/i;

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    paths: [...DEFAULT_SCAN_DIRECTORIES],
    constantsDir: DEFAULT_CONSTANTS_DIRECTORY,
    whitelistPath: DEFAULT_WHITELIST_PATH,
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

    if (token === "--constants-dir") {
      options.constantsDir = String(argv[index + 1] ?? options.constantsDir).trim();
      index += 1;
      continue;
    }

    if (token === "--whitelist") {
      options.whitelistPath = String(argv[index + 1] ?? options.whitelistPath).trim();
      index += 1;
      continue;
    }

    if (token === "--format=json") {
      options.format = "json";
    }
  }

  return options;
}

function normalizePath(value) {
  return String(value).replace(/\\/g, "/").replace(/^\.\//, "").replace(/^\/+/, "");
}

function toRelativePath(cwd, absolutePath) {
  return normalizePath(path.relative(cwd, absolutePath));
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

  if (extension === ".ts" || extension === ".mts" || extension === ".cts") {
    return ts.ScriptKind.TS;
  }

  if (extension === ".tsx") {
    return ts.ScriptKind.TSX;
  }

  return ts.ScriptKind.JS;
}

function loadWhitelist(cwd, whitelistPath) {
  const resolvedPath = path.resolve(cwd, whitelistPath);

  if (!fs.existsSync(resolvedPath)) {
    return {
      configPath: normalizePath(path.relative(cwd, resolvedPath)),
      pathAllowList: new Set(),
    };
  }

  const payload = JSON.parse(fs.readFileSync(resolvedPath, "utf8"));
  const entries = Array.isArray(payload.pathAllowList) ? payload.pathAllowList : [];
  const normalizedEntries = entries
    .map((entry) => {
      if (typeof entry === "string") {
        return normalizePath(entry);
      }

      if (entry && typeof entry.path === "string") {
        return normalizePath(entry.path);
      }

      return "";
    })
    .filter(Boolean);

  return {
    configPath: normalizePath(path.relative(cwd, resolvedPath)),
    pathAllowList: new Set(normalizedEntries),
  };
}

function unwrapExpression(node) {
  let current = node;

  while (
    ts.isParenthesizedExpression(current) ||
    ts.isAsExpression(current) ||
    ts.isTypeAssertionExpression(current) ||
    ts.isSatisfiesExpression(current)
  ) {
    current = current.expression;
  }

  return current;
}

function isLiteralLike(node) {
  if (
    ts.isStringLiteral(node) ||
    ts.isNumericLiteral(node) ||
    node.kind === ts.SyntaxKind.TrueKeyword ||
    node.kind === ts.SyntaxKind.FalseKeyword ||
    node.kind === ts.SyntaxKind.NullKeyword
  ) {
    return true;
  }

  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return true;
  }

  return false;
}

function getLiteralSetSize(expression) {
  const unwrappedExpression = unwrapExpression(expression);

  if (ts.isArrayLiteralExpression(unwrappedExpression)) {
    if (unwrappedExpression.elements.length < 2) {
      return null;
    }

    const allLiteral = unwrappedExpression.elements.every((element) =>
      isLiteralLike(unwrapExpression(element)),
    );
    return allLiteral ? unwrappedExpression.elements.length : null;
  }

  if (ts.isObjectLiteralExpression(unwrappedExpression)) {
    const propertyInitializers = unwrappedExpression.properties
      .filter(
        (property) =>
          ts.isPropertyAssignment(property) || ts.isShorthandPropertyAssignment(property),
      )
      .map((property) => {
        if (ts.isShorthandPropertyAssignment(property)) {
          return null;
        }

        return property.initializer;
      })
      .filter((initializer) => initializer !== null);

    if (propertyInitializers.length < 2) {
      return null;
    }

    const allLiteral = propertyInitializers.every((initializer) =>
      isLiteralLike(unwrapExpression(initializer)),
    );
    return allLiteral ? propertyInitializers.length : null;
  }

  if (
    ts.isCallExpression(unwrappedExpression) &&
    ts.isPropertyAccessExpression(unwrappedExpression.expression) &&
    ts.isIdentifier(unwrappedExpression.expression.expression) &&
    unwrappedExpression.expression.expression.text === "Object" &&
    unwrappedExpression.expression.name.text === "freeze" &&
    unwrappedExpression.arguments.length >= 1
  ) {
    return getLiteralSetSize(unwrappedExpression.arguments[0]);
  }

  return null;
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

function isConstVariableDeclaration(node) {
  const variableDeclarationList = node.parent;
  const variableStatement = variableDeclarationList?.parent;

  return Boolean(
    variableDeclarationList &&
      ts.isVariableDeclarationList(variableDeclarationList) &&
      variableStatement &&
      ts.isVariableStatement(variableStatement) &&
      (variableDeclarationList.flags & ts.NodeFlags.Const) !== 0,
  );
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
    if (ts.isVariableDeclaration(node) && isConstVariableDeclaration(node) && node.initializer) {
      const literalSetSize = getLiteralSetSize(node.initializer);

      if (literalSetSize !== null) {
        const position = sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile));
        const allowed = hasAllowComment(lines, position.line);

        if (!allowed) {
          findings.push({
            file: toRelativePath(cwd, filePath),
            line: position.line + 1,
            identifier: ts.isIdentifier(node.name) ? node.name.text : "(pattern)",
            size: literalSetSize,
            message:
              "Finite literal set should be defined under src/constants or annotated with // literal-set-allowed: reason for one-off local checks.",
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
      "finite-literal-set-check",
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
  const constantsPrefix = `${normalizePath(options.constantsDir).replace(/\/+$/, "")}/`;
  const whitelist = loadWhitelist(cwd, options.whitelistPath);
  const scanTargets = options.paths.map((target) => path.resolve(cwd, target));
  const candidateFiles = scanTargets.flatMap((target) => collectSourceFiles(target));
  const files = candidateFiles.filter((filePath) => {
    const relativePath = toRelativePath(cwd, filePath);

    if (relativePath.startsWith(constantsPrefix)) {
      return false;
    }

    if (whitelist.pathAllowList.has(relativePath)) {
      return false;
    }

    return true;
  });

  const findings = files.flatMap((filePath) => analyzeFile(filePath, cwd));
  const payload = {
    status: findings.length === 0 ? "pass" : "fail",
    cwd,
    paths: options.paths,
    constantsDir: normalizePath(options.constantsDir),
    whitelistPath: whitelist.configPath,
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
        `${finding.file}:${finding.line} [${finding.identifier}] ${finding.message}\n`,
      );
    }

    process.exitCode = 1;
  }
}

main();
