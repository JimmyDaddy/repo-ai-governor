#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";

const DEFAULT_SCOPES = Object.freeze(["src", "test"]);
const DEFAULT_CONFIG_PATH = "scripts/governance/ts-only-whitelist.json";

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

function walkFiles(baseDirectory, onFile) {
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
    };
  }

  const parsed = JSON.parse(fs.readFileSync(resolvedConfigPath, "utf8"));
  const scopes = Array.isArray(parsed.scopes) ? parsed.scopes.map(normalizeRelativePath) : [];
  const allowList = Array.isArray(parsed.allowList)
    ? parsed.allowList.map(normalizeRelativePath)
    : [];

  return {
    configPath: normalizeRelativePath(path.relative(rootDirectory, resolvedConfigPath)),
    scopes: scopes.length > 0 ? scopes : [...DEFAULT_SCOPES],
    allowList,
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

function formatSummary(payload) {
  return [
    "ts-only-check",
    `status=${payload.status}`,
    `root=${payload.root}`,
    `scopes=${payload.scopes.join(",")}`,
    `jsFiles=${payload.jsFiles.length}`,
    `violations=${payload.violations.length}`,
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
    const payload = {
      status: violations.length === 0 ? "pass" : "fail",
      root: normalizeRelativePath(rootDirectory),
      configPath: config.configPath,
      scopes: config.scopes,
      allowList: config.allowList,
      jsFiles,
      violations,
    };

    if (options.format === "json") {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      process.stdout.write(`${formatSummary(payload)}\n`);
    }

    if (violations.length > 0) {
      for (const violation of violations) {
        process.stderr.write(`TS-only violation: ${violation}\n`);
      }

      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

main();
