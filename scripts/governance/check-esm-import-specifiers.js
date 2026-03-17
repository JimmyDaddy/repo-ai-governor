#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SOURCE_EXTENSIONS = new Set([".js", ".mjs", ".cjs"]);
const DEFAULT_SCAN_DIRECTORIES = ["src", "test", "scripts", "bin"];
const ALLOWED_RELATIVE_IMPORT_EXTENSIONS = new Set([
  ".js",
  ".mjs",
  ".cjs",
  ".json",
  ".node"
]);

function parseArguments(argv) {
  const options = {
    cwd: process.cwd(),
    paths: [...DEFAULT_SCAN_DIRECTORIES]
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

function collectImportSpecifiers(content) {
  const specifiers = [];
  const patterns = [
    /\bimport\s+(?:[\s\S]*?\s+from\s+)?["']([^"']+)["']/g,
    /\bexport\s+[\s\S]*?\s+from\s+["']([^"']+)["']/g,
    /\bimport\s*\(\s*["']([^"']+)["']\s*\)/g
  ];

  for (const pattern of patterns) {
    let match = pattern.exec(content);

    while (match) {
      specifiers.push(match[1]);
      match = pattern.exec(content);
    }
  }

  return specifiers;
}

function extractExtension(specifier) {
  const cleanSpecifier = String(specifier).split("?")[0].split("#")[0];
  return path.extname(cleanSpecifier);
}

function isRelativeSpecifier(specifier) {
  return specifier.startsWith("./") || specifier.startsWith("../");
}

function validateRelativeSpecifier(specifier) {
  const cleanSpecifier = String(specifier).split("?")[0].split("#")[0];

  if (cleanSpecifier.endsWith("/")) {
    return {
      valid: false,
      reason: "directory import is not allowed"
    };
  }

  const extension = extractExtension(cleanSpecifier);

  if (!ALLOWED_RELATIVE_IMPORT_EXTENSIONS.has(extension)) {
    return {
      valid: false,
      reason: `relative specifier must include one of: ${[
        ...ALLOWED_RELATIVE_IMPORT_EXTENSIONS
      ].join(", ")}`
    };
  }

  return {
    valid: true,
    reason: null
  };
}

function main() {
  const options = parseArguments(process.argv.slice(2));
  const cwd = options.cwd;
  const scanTargets = options.paths.map((target) => path.resolve(cwd, target));
  const files = scanTargets.flatMap((target) => collectSourceFiles(target));
  const failures = [];

  for (const filePath of files) {
    const content = fs.readFileSync(filePath, "utf8");
    const specifiers = collectImportSpecifiers(content);

    for (const specifier of specifiers) {
      if (!isRelativeSpecifier(specifier)) {
        continue;
      }

      const validation = validateRelativeSpecifier(specifier);

      if (validation.valid) {
        continue;
      }

      failures.push({
        file: toRelativePath(cwd, filePath),
        specifier,
        reason: validation.reason
      });
    }
  }

  if (failures.length > 0) {
    process.stdout.write("esm-import-specifier-check\n");
    process.stdout.write(`status=fail\n`);
    process.stdout.write(`files=${files.length}\n`);
    process.stdout.write(`failures=${failures.length}\n`);

    for (const failure of failures) {
      process.stderr.write(
        `${failure.file}: invalid import specifier "${failure.specifier}" (${failure.reason})\n`
      );
    }

    process.exitCode = 1;
    return;
  }

  process.stdout.write("esm-import-specifier-check\n");
  process.stdout.write("status=pass\n");
  process.stdout.write(`files=${files.length}\n`);
  process.stdout.write("failures=0\n");
}

main();
