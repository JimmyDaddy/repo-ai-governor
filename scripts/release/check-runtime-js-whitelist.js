#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const ROOT_DIR = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..", "..");
const DEFAULT_CONFIG_PATH = path.join(ROOT_DIR, "scripts", "release", "runtime-js-whitelist.json");

function normalizeRelativePath(value) {
  return String(value ?? "")
    .replace(/\\/g, "/")
    .trim()
    .replace(/^\.\//, "")
    .replace(/^\/+/, "");
}

function findNpmCommand() {
  if (process.env.npm_execpath && fs.existsSync(process.env.npm_execpath)) {
    return [process.execPath, [process.env.npm_execpath]];
  }

  if (fs.existsSync("/opt/homebrew/bin/npm")) {
    return ["/opt/homebrew/bin/npm", []];
  }

  return ["npm", []];
}

function runNpm(argumentsList, cwd) {
  const [command, prefixArguments] = findNpmCommand();
  return execFileSync(command, [...prefixArguments, ...argumentsList], {
    cwd,
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `/opt/homebrew/bin:${process.env.PATH ?? ""}`,
    },
  });
}

function parseArguments(argv) {
  let format = "summary";
  let configPath = DEFAULT_CONFIG_PATH;

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--format=json") {
      format = "json";
      continue;
    }

    if (argument === "--config") {
      configPath = path.resolve(argv[index + 1] ?? configPath);
      index += 1;
      continue;
    }

    if (argument.startsWith("--config=")) {
      configPath = path.resolve(argument.slice("--config=".length));
      continue;
    }

    throw new Error(`Unknown argument: ${argument}`);
  }

  return {
    format,
    configPath,
  };
}

function parseOwnerAndPurpose(entry, fieldName) {
  const owner = typeof entry?.owner === "string" ? entry.owner.trim() : "";
  const purpose = typeof entry?.purpose === "string" ? entry.purpose.trim() : "";

  if (!owner) {
    throw new Error(`${fieldName} entry must provide non-empty owner.`);
  }

  if (!purpose) {
    throw new Error(`${fieldName} entry must provide non-empty purpose.`);
  }

  return {
    owner,
    purpose,
  };
}

function loadConfig(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new Error(`Runtime JS whitelist config not found: ${configPath}`);
  }

  const parsed = JSON.parse(fs.readFileSync(configPath, "utf8"));
  const distAllowListRaw = Array.isArray(parsed.distAllowList) ? parsed.distAllowList : [];
  const pathAllowListRaw = Array.isArray(parsed.pathAllowList) ? parsed.pathAllowList : [];
  const distAllowList = new Map();
  const pathAllowList = new Map();

  for (const entry of distAllowListRaw) {
    if (!entry || typeof entry !== "object" || typeof entry.pathPrefix !== "string") {
      throw new Error("distAllowList entries must include string pathPrefix.");
    }

    const pathPrefix = normalizeRelativePath(entry.pathPrefix).replace(/\/+$/, "");
    if (!pathPrefix) {
      throw new Error("distAllowList pathPrefix cannot be empty.");
    }

    const metadata = parseOwnerAndPurpose(entry, "distAllowList");
    distAllowList.set(pathPrefix, {
      pathPrefix,
      owner: metadata.owner,
      purpose: metadata.purpose,
    });
  }

  for (const entry of pathAllowListRaw) {
    if (!entry || typeof entry !== "object" || typeof entry.path !== "string") {
      throw new Error("pathAllowList entries must include string path.");
    }

    const pathValue = normalizeRelativePath(entry.path);
    if (!pathValue || !pathValue.endsWith(".js")) {
      throw new Error(`pathAllowList path must be a .js file path: ${entry.path}`);
    }

    const metadata = parseOwnerAndPurpose(entry, "pathAllowList");
    pathAllowList.set(pathValue, {
      path: pathValue,
      owner: metadata.owner,
      purpose: metadata.purpose,
    });
  }

  return {
    distAllowList: Array.from(distAllowList.values()).sort((left, right) =>
      left.pathPrefix.localeCompare(right.pathPrefix),
    ),
    pathAllowList: Array.from(pathAllowList.values()).sort((left, right) =>
      left.path.localeCompare(right.path),
    ),
  };
}

function collectBundledJsFiles() {
  const output = runNpm(["pack", "--json", "--dry-run"], ROOT_DIR);
  const parsed = JSON.parse(output);
  const latestPack = Array.isArray(parsed) ? parsed.at(-1) : parsed;
  const files = Array.isArray(latestPack?.files) ? latestPack.files : [];
  const bundledJsFiles = files
    .map((entry) => normalizeRelativePath(entry.path))
    .filter((entry) => entry.endsWith(".js"))
    .sort((left, right) => left.localeCompare(right));

  return {
    tarball: latestPack?.filename ?? null,
    bundledJsFiles,
  };
}

function isAllowedByDistPrefix(filePath, distAllowList) {
  return distAllowList.some((entry) => {
    const normalizedPrefix = normalizeRelativePath(entry.pathPrefix).replace(/\/+$/, "");
    if (!normalizedPrefix) {
      return false;
    }

    return filePath === normalizedPrefix || filePath.startsWith(`${normalizedPrefix}/`);
  });
}

function formatSummary(payload) {
  return [
    "runtime-js-whitelist-check",
    `status=${payload.status}`,
    `config=${payload.configPath}`,
    `tarball=${payload.tarball}`,
    `bundledJs=${payload.bundledJsFiles.length}`,
    `nonDistBundledJs=${payload.nonDistBundledJsFiles.length}`,
    `unownedBundledJs=${payload.unownedBundledJsFiles.length}`,
    `staleAllowListEntries=${payload.staleAllowListEntries.length}`,
  ].join("\n");
}

function main() {
  try {
    const options = parseArguments(process.argv.slice(2));
    const config = loadConfig(options.configPath);
    const packageSnapshot = collectBundledJsFiles();
    const exactAllowSet = new Set(config.pathAllowList.map((entry) => entry.path));
    const distMatchedFiles = [];
    const explicitMatchedFiles = [];
    const unownedBundledJsFiles = [];

    for (const filePath of packageSnapshot.bundledJsFiles) {
      if (isAllowedByDistPrefix(filePath, config.distAllowList)) {
        distMatchedFiles.push(filePath);
        continue;
      }

      if (exactAllowSet.has(filePath)) {
        explicitMatchedFiles.push(filePath);
        continue;
      }

      unownedBundledJsFiles.push(filePath);
    }

    const nonDistBundledJsFiles = packageSnapshot.bundledJsFiles.filter(
      (filePath) => !isAllowedByDistPrefix(filePath, config.distAllowList),
    );
    const staleAllowListEntries = config.pathAllowList
      .map((entry) => entry.path)
      .filter((pathValue) => !packageSnapshot.bundledJsFiles.includes(pathValue))
      .sort((left, right) => left.localeCompare(right));
    const payload = {
      status: unownedBundledJsFiles.length === 0 ? "pass" : "fail",
      configPath: normalizeRelativePath(path.relative(ROOT_DIR, options.configPath)),
      tarball: packageSnapshot.tarball,
      distAllowList: config.distAllowList,
      pathAllowList: config.pathAllowList,
      bundledJsFiles: packageSnapshot.bundledJsFiles,
      nonDistBundledJsFiles,
      distMatchedFiles,
      explicitMatchedFiles,
      unownedBundledJsFiles,
      staleAllowListEntries,
    };

    if (options.format === "json") {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
    } else {
      process.stdout.write(`${formatSummary(payload)}\n`);
    }

    if (payload.status === "fail") {
      for (const filePath of unownedBundledJsFiles) {
        process.stderr.write(`Runtime JS whitelist violation: ${filePath}\n`);
      }

      process.exitCode = 1;
    }
  } catch (error) {
    process.stderr.write(`${error instanceof Error ? error.message : String(error)}\n`);
    process.exitCode = 1;
  }
}

main();
