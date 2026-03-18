#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const SCAN_ROOTS = Object.freeze(["apps", "packages"]);
const EXCLUDED_DIRECTORIES = new Set([".git", "node_modules", "dist", "coverage"]);
const KEBAB_CASE_SEGMENT_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const TYPESCRIPT_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.ts$/;
const TYPESCRIPT_DECLARATION_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.d\.ts$/;
const TYPESCRIPT_CONFIG_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.config\.ts$/;
const TEST_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*(?:\.(?:contract|integration|e2e))?\.test\.ts$/;
const MARKDOWN_FILE_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*\.md$/;
const ALLOWED_SPECIAL_FILE_NAMES = new Set([
  "index.ts",
  "package.json",
  "README.md",
  "CHANGELOG.md",
  ".gitkeep",
]);

function toPosixPath(value) {
  return String(value).replace(/\\/g, "/");
}

function normalizeRelativePath(value) {
  return toPosixPath(String(value ?? "")).replace(/^\.\//, "");
}

function parseArguments(argv) {
  let format = "summary";
  let cwd = process.cwd();

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--format=json") {
      format = "json";
      continue;
    }

    if (argument === "--cwd") {
      cwd = path.resolve(argv[index + 1] ?? cwd);
      index += 1;
      continue;
    }

    if (argument.startsWith("--cwd=")) {
      cwd = path.resolve(argument.slice("--cwd=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return {
    format,
    cwd,
  };
}

function isKebabCaseSegment(value) {
  return KEBAB_CASE_SEGMENT_PATTERN.test(String(value));
}

function isValidTypeScriptFileName(fileName) {
  if (ALLOWED_SPECIAL_FILE_NAMES.has(fileName)) {
    return true;
  }

  return (
    TYPESCRIPT_FILE_PATTERN.test(fileName) ||
    TYPESCRIPT_DECLARATION_FILE_PATTERN.test(fileName) ||
    TYPESCRIPT_CONFIG_FILE_PATTERN.test(fileName)
  );
}

function isValidMarkdownFileName(fileName) {
  if (ALLOWED_SPECIAL_FILE_NAMES.has(fileName)) {
    return true;
  }

  return MARKDOWN_FILE_PATTERN.test(fileName);
}

function looksLikeModuleDirectory(modulePath) {
  return ["src", "test", "README.md", "package.json"].some((entry) =>
    fs.existsSync(path.join(modulePath, entry)),
  );
}

function collectModuleDirectories(rootDirectory, scopeName) {
  if (!fs.existsSync(rootDirectory)) {
    return [];
  }

  const entries = fs
    .readdirSync(rootDirectory, {
      withFileTypes: true,
    })
    .filter((entry) => entry.isDirectory() && !EXCLUDED_DIRECTORIES.has(entry.name));

  if (scopeName === "apps") {
    return entries.map((entry) => path.join(rootDirectory, entry.name));
  }

  const modules = [];

  for (const entry of entries) {
    const firstLevelPath = path.join(rootDirectory, entry.name);
    if (looksLikeModuleDirectory(firstLevelPath)) {
      modules.push(firstLevelPath);
      continue;
    }

    const secondLevelEntries = fs
      .readdirSync(firstLevelPath, {
        withFileTypes: true,
      })
      .filter((child) => child.isDirectory() && !EXCLUDED_DIRECTORIES.has(child.name));

    for (const child of secondLevelEntries) {
      modules.push(path.join(firstLevelPath, child.name));
    }
  }

  return modules;
}

function validateModuleLayout(modulePath, rootDirectory, violations) {
  const relativeModulePath = normalizeRelativePath(path.relative(rootDirectory, modulePath));

  if (!fs.existsSync(path.join(modulePath, "src"))) {
    violations.push({
      rule: "monorepo.module_layout.src_required",
      path: relativeModulePath,
      message: `Module "${relativeModulePath}" must include a src/ directory.`,
    });
  }

  if (!fs.existsSync(path.join(modulePath, "test"))) {
    violations.push({
      rule: "monorepo.module_layout.test_required",
      path: relativeModulePath,
      message: `Module "${relativeModulePath}" must include a test/ directory.`,
    });
  }

  if (!fs.existsSync(path.join(modulePath, "README.md"))) {
    violations.push({
      rule: "monorepo.module_layout.readme_required",
      path: relativeModulePath,
      message: `Module "${relativeModulePath}" must include README.md.`,
    });
  }
}

function validatePathSegments(relativePath, violations) {
  const segments = normalizeRelativePath(relativePath).split("/").filter(Boolean);

  for (let index = 0; index < segments.length - 1; index += 1) {
    const segment = segments[index];
    if (segment.startsWith(".")) {
      continue;
    }

    if (!isKebabCaseSegment(segment)) {
      violations.push({
        rule: "monorepo.directory.kebab_case_required",
        path: normalizeRelativePath(relativePath),
        message: `Directory segment "${segment}" must use lowercase kebab-case.`,
      });
      return;
    }
  }
}

function validateFileName(relativePath, violations) {
  const normalizedPath = normalizeRelativePath(relativePath);
  const fileName = path.basename(normalizedPath);
  const inTestDirectory = normalizedPath.includes("/test/");

  if (fileName.endsWith(".ts")) {
    if (inTestDirectory && fileName.endsWith(".test.ts") && !TEST_FILE_PATTERN.test(fileName)) {
      violations.push({
        rule: "monorepo.test_file.naming_required",
        path: normalizedPath,
        message:
          "Test file names must follow *.test.ts, *.contract.test.ts, *.integration.test.ts, or *.e2e.test.ts.",
      });
      return;
    }

    if (!isValidTypeScriptFileName(fileName)) {
      violations.push({
        rule: "monorepo.file.kebab_case_required",
        path: normalizedPath,
        message: `TypeScript file "${fileName}" must use lowercase kebab-case naming.`,
      });
      return;
    }

    if (normalizedPath.includes("/types/interfaces/") && !fileName.endsWith(".interface.ts")) {
      violations.push({
        rule: "monorepo.types.interface_suffix_required",
        path: normalizedPath,
        message: "Files under types/interfaces must end with .interface.ts.",
      });
      return;
    }

    if (normalizedPath.includes("/types/aliases/") && !fileName.endsWith(".type.ts")) {
      violations.push({
        rule: "monorepo.types.alias_suffix_required",
        path: normalizedPath,
        message: "Files under types/aliases must end with .type.ts.",
      });
    }

    return;
  }

  if (fileName.endsWith(".json")) {
    if (normalizedPath.includes("/src/") && !fileName.endsWith(".schema.json")) {
      violations.push({
        rule: "monorepo.schema.suffix_required",
        path: normalizedPath,
        message: "JSON files under src/ must end with .schema.json.",
      });
    }

    return;
  }

  if (fileName.endsWith(".md") && !isValidMarkdownFileName(fileName)) {
    violations.push({
      rule: "monorepo.markdown.kebab_case_required",
      path: normalizedPath,
      message: `Markdown file "${fileName}" must use kebab-case or a reserved standard name.`,
    });
  }
}

function walkAndValidate(baseDirectory, rootDirectory, violations, metrics) {
  if (!fs.existsSync(baseDirectory)) {
    return;
  }

  const stack = [baseDirectory];

  while (stack.length > 0) {
    const currentDirectory = stack.pop();
    const entries = fs.readdirSync(currentDirectory, {
      withFileTypes: true,
    });

    for (const entry of entries) {
      if (EXCLUDED_DIRECTORIES.has(entry.name)) {
        continue;
      }

      const absolutePath = path.join(currentDirectory, entry.name);
      const relativePath = normalizeRelativePath(path.relative(rootDirectory, absolutePath));

      if (entry.isDirectory()) {
        validatePathSegments(relativePath, violations);
        stack.push(absolutePath);
        continue;
      }

      metrics.scannedFiles += 1;
      validatePathSegments(relativePath, violations);
      validateFileName(relativePath, violations);
    }
  }
}

function formatSummary(payload) {
  return [
    "monorepo-naming-check",
    `status=${payload.status}`,
    `root=${payload.root}`,
    `scopes=${payload.scopes.join(",")}`,
    `modules=${payload.moduleCount}`,
    `scannedFiles=${payload.scannedFiles}`,
    `violations=${payload.violations.length}`,
  ].join("\n");
}

function main() {
  const { format, cwd } = parseArguments(process.argv.slice(2));
  const rootDirectory = path.resolve(cwd);
  const violations = [];
  const metrics = {
    scannedFiles: 0,
  };
  const moduleDirectories = [];

  for (const scopeName of SCAN_ROOTS) {
    const scopePath = path.join(rootDirectory, scopeName);
    walkAndValidate(scopePath, rootDirectory, violations, metrics);
    moduleDirectories.push(...collectModuleDirectories(scopePath, scopeName));
  }

  for (const modulePath of moduleDirectories) {
    validateModuleLayout(modulePath, rootDirectory, violations);
  }

  const payload = {
    status: violations.length === 0 ? "pass" : "fail",
    root: normalizeRelativePath(rootDirectory),
    scopes: [...SCAN_ROOTS],
    moduleCount: moduleDirectories.length,
    scannedFiles: metrics.scannedFiles,
    violations,
  };

  if (format === "json") {
    process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
  } else {
    process.stdout.write(`${formatSummary(payload)}\n`);

    if (violations.length > 0) {
      for (const violation of violations) {
        process.stderr.write(`${violation.rule}: ${violation.path} -> ${violation.message}\n`);
      }
    }
  }

  process.exitCode = payload.status === "pass" ? 0 : 1;
}

try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`monorepo-naming-check failed: ${message}\n`);
  process.exitCode = 1;
}
