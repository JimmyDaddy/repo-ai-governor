#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const DEFAULT_SCOPES = Object.freeze(["src", "test"]);
const DEFAULT_CONFIG_PATH = "scripts/governance/ts-only-whitelist.json";
const DEFAULT_OUT_OF_SCOPE_ALLOW_LIST = Object.freeze([]);
const REPOSITORY_SCAN_EXCLUDE_DIRECTORIES = new Set([".git", "node_modules", "coverage"]);

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
  let format = "summary";
  let cwd = process.cwd();
  let configPath = DEFAULT_CONFIG_PATH;

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

    if (argument === "--config") {
      configPath = argv[index + 1] ?? configPath;
      index += 1;
      continue;
    }

    if (argument.startsWith("--config=")) {
      configPath = argument.slice("--config=".length);
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return {
    format,
    cwd,
    configPath,
  };
}

function walkFiles(baseDirectory, onFile, options = {}) {
  const excludedDirectories = options.excludedDirectories ?? new Set();

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
      const entryPath = path.join(currentDirectory, entry.name);
      if (entry.isDirectory()) {
        if (excludedDirectories.has(entry.name)) {
          continue;
        }

        stack.push(entryPath);
        continue;
      }

      onFile(entryPath);
    }
  }
}

function loadConfig(rootDirectory, configPath) {
  const resolvedConfigPath = path.resolve(rootDirectory, configPath);
  if (!fs.existsSync(resolvedConfigPath)) {
    return {
      configPath: normalizeRelativePath(path.relative(rootDirectory, resolvedConfigPath)),
      scopes: [...DEFAULT_SCOPES],
      allowList: [],
      pathAllowList: [],
      outOfScopeAllowList: [...DEFAULT_OUT_OF_SCOPE_ALLOW_LIST],
    };
  }

  const parsed = JSON.parse(fs.readFileSync(resolvedConfigPath, "utf8"));
  const scopes = Array.isArray(parsed.scopes) ? parsed.scopes.map(normalizeRelativePath) : [];
  const allowList = Array.isArray(parsed.allowList) ? parsed.allowList : [];
  const pathAllowList = Array.isArray(parsed.pathAllowList) ? parsed.pathAllowList : [];
  const outOfScopeAllowList = Array.isArray(parsed.outOfScopeAllowList)
    ? parsed.outOfScopeAllowList
    : [];
  const pathAllowListByPath = new Map();
  const outOfScopeAllowListByPath = new Map();

  for (const entry of pathAllowList) {
    if (!entry || typeof entry !== "object" || typeof entry.path !== "string") {
      continue;
    }

    const pathValue = normalizeRelativePath(entry.path);
    if (!pathValue) {
      continue;
    }

    const reason = typeof entry.reason === "string" ? String(entry.reason).trim() : "";
    pathAllowListByPath.set(pathValue, {
      path: pathValue,
      reason,
      source: "pathAllowList",
    });
  }

  for (const entry of allowList) {
    const pathValue = normalizeRelativePath(entry);
    if (!pathValue || pathAllowListByPath.has(pathValue)) {
      continue;
    }

    pathAllowListByPath.set(pathValue, {
      path: pathValue,
      reason: "legacy allowList entry; migrate to pathAllowList with explicit reason",
      source: "allowList",
    });
  }

  const mergedPathAllowList = Array.from(pathAllowListByPath.values()).sort((left, right) =>
    left.path.localeCompare(right.path),
  );

  for (const entry of outOfScopeAllowList) {
    if (!entry || typeof entry !== "object" || typeof entry.path !== "string") {
      continue;
    }

    const pathValue = normalizeRelativePath(entry.path);
    if (!pathValue) {
      continue;
    }

    const reason = typeof entry.reason === "string" ? String(entry.reason).trim() : "";
    outOfScopeAllowListByPath.set(pathValue, {
      path: pathValue,
      reason,
    });
  }

  const mergedOutOfScopeAllowList = Array.from(outOfScopeAllowListByPath.values()).sort(
    (left, right) => left.path.localeCompare(right.path),
  );

  return {
    configPath: normalizeRelativePath(path.relative(rootDirectory, resolvedConfigPath)),
    scopes: scopes.length > 0 ? scopes : [...DEFAULT_SCOPES],
    allowList: mergedPathAllowList.map((entry) => entry.path),
    pathAllowList: mergedPathAllowList,
    outOfScopeAllowList: mergedOutOfScopeAllowList,
  };
}

function collectScopedJavaScriptFiles(rootDirectory, scopes) {
  const collected = [];

  for (const scope of scopes) {
    const scopeDirectory = path.join(rootDirectory, scope);

    walkFiles(scopeDirectory, (filePath) => {
      if (!filePath.endsWith(".js")) {
        return;
      }

      collected.push(normalizeRelativePath(path.relative(rootDirectory, filePath)));
    });
  }

  return collected.sort((left, right) => left.localeCompare(right));
}

function collectRepositoryJavaScriptFiles(rootDirectory) {
  const collected = [];

  walkFiles(
    rootDirectory,
    (filePath) => {
      if (!filePath.endsWith(".js")) {
        return;
      }

      collected.push(normalizeRelativePath(path.relative(rootDirectory, filePath)));
    },
    {
      excludedDirectories: REPOSITORY_SCAN_EXCLUDE_DIRECTORIES,
    },
  );

  return Array.from(new Set(collected)).sort((left, right) => left.localeCompare(right));
}

function collectTrackedJavaScriptFiles(rootDirectory) {
  try {
    const output = execFileSync("git", ["-C", rootDirectory, "ls-files", "*.js"], {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    });
    const files = String(output)
      .split(/\r?\n/)
      .map(normalizeRelativePath)
      .filter(Boolean)
      .sort((left, right) => left.localeCompare(right));

    return {
      source: "git",
      files,
    };
  } catch {
    return {
      source: "filesystem",
      files: collectRepositoryJavaScriptFiles(rootDirectory),
    };
  }
}

function isPathInScope(filePath, scopes) {
  return scopes.some((scopePath) => {
    const normalizedScope = normalizeRelativePath(scopePath).replace(/\/+$/, "");
    if (!normalizedScope) {
      return false;
    }

    return filePath === normalizedScope || filePath.startsWith(`${normalizedScope}/`);
  });
}

function isPathInOutOfScopeAllowList(filePath, outOfScopeAllowList) {
  return outOfScopeAllowList.some((entry) => {
    const normalizedEntryPath = normalizeRelativePath(entry.path).replace(/\/+$/, "");
    if (!normalizedEntryPath) {
      return false;
    }

    return filePath === normalizedEntryPath || filePath.startsWith(`${normalizedEntryPath}/`);
  });
}

function formatSummary(payload) {
  return [
    "ts-only-check",
    `status=${payload.status}`,
    `root=${payload.root}`,
    `scopes=${payload.scopes.join(",")}`,
    `jsFiles=${payload.jsFiles.length}`,
    `violations=${payload.violations.length}`,
    `outsideScopeJsFiles=${payload.outsideScopeJsFiles.length}`,
    `outsideScopeViolations=${payload.outsideScopeViolations.length}`,
  ].join("\n");
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const rootDirectory = path.resolve(options.cwd);
    const config = loadConfig(rootDirectory, options.configPath);
    const jsFiles = collectScopedJavaScriptFiles(rootDirectory, config.scopes);
    const allowSet = new Set(config.allowList);
    const violations = jsFiles.filter((filePath) => !allowSet.has(filePath));
    const repositoryJs = collectTrackedJavaScriptFiles(rootDirectory);
    const outsideScopeJsFiles = repositoryJs.files.filter(
      (filePath) => !isPathInScope(filePath, config.scopes),
    );
    const outsideScopeViolations = outsideScopeJsFiles.filter(
      (filePath) => !isPathInOutOfScopeAllowList(filePath, config.outOfScopeAllowList),
    );
    const hasViolations = violations.length > 0 || outsideScopeViolations.length > 0;
    const payload = {
      status: hasViolations ? "fail" : "pass",
      root: normalizeRelativePath(rootDirectory),
      configPath: config.configPath,
      scopes: config.scopes,
      allowList: config.allowList,
      pathAllowList: config.pathAllowList,
      jsFiles,
      violations,
      repositoryJsSource: repositoryJs.source,
      outsideScopeAllowList: config.outOfScopeAllowList,
      outsideScopeJsFiles,
      outsideScopeViolations,
    };

    if (options.format === "json") {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      process.stdout.write(`${formatSummary(payload)}\n`);
    }

    if (hasViolations) {
      for (const violation of violations) {
        process.stderr.write(`TS-only violation: ${violation}\n`);
      }

      for (const violation of outsideScopeViolations) {
        process.stderr.write(`TS-only out-of-scope JS violation: ${violation}\n`);
      }

      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

main();
