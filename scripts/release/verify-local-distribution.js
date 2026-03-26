#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "release-verify-local";
const DEFAULT_DISTRIBUTION_MODE = "default";
const PLUGIN_ENABLED_DISTRIBUTION_MODE = "plugin-enabled";
const DIST_CLI_ENTRY_PATH = "dist/bin/repo-ai-governor.js";
const REQUIRED_PACKED_PATH_SUFFIXES = [
  "dist/bin/repo-ai-governor.js",
  "dist/apps/cli/src/main.js",
  "dist/node_modules/@repo-ai-governor/cli/package.json",
  "dist/node_modules/@repo-ai-governor/cli/dist/src/main.js",
  "dist/node_modules/@repo-ai-governor/config/package.json",
  "dist/node_modules/@repo-ai-governor/config/dist/src/index.js",
  "dist/node_modules/@repo-ai-governor/core-orchestration-service/package.json",
  "dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/index.js",
  "dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-client.js",
  "dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-host.js",
  "dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-entry.js",
  "dist/node_modules/@repo-ai-governor/core-runtime-langgraph/package.json",
  "dist/node_modules/@repo-ai-governor/core-runtime-langgraph/dist/src/index.js",
  "dist/node_modules/@repo-ai-governor/memory-provider-registry/package.json",
  "dist/node_modules/@repo-ai-governor/memory-provider-registry/dist/src/index.js",
  "dist/node_modules/@repo-ai-governor/orchestration-service-client/package.json",
  "dist/node_modules/@repo-ai-governor/orchestration-service-client/dist/src/index.js",
  "dist/node_modules/@repo-ai-governor/cli/dist/src/runtime/orchestration-service-runtime.js",
  "dist/packages/shared/src/index.js",
  "examples/README.md",
  "examples/single-role-minimal-flow/scenario.json",
  "examples/single-role-minimal-flow/expected/runtime-baseline.json",
  "integrations/ide/README.md",
  "integrations/desktop/README.md",
  "integrations/desktop/examples/README.md",
  "integrations/desktop/examples/desktop-sidecar-runtime.sample.json",
  "integrations/ide/examples/vscode-task.sample.json",
  "integrations/ide/examples/jetbrains-run-configuration.sample.xml",
  "integrations/ide/examples/cursor-task.sample.json",
  "integrations/ide/examples/claude-code-commands.sample.json",
];
const PLUGIN_ENABLED_REQUIRED_PACKED_PATH_SUFFIXES = [
  "dist/packages/memory-providers/sqlite-fs/src/index.js",
  "dist/node_modules/@repo-ai-governor/memory-provider-sqlite-fs/package.json",
  "dist/node_modules/@repo-ai-governor/memory-provider-sqlite-fs/dist/src/index.js",
];
const FORBIDDEN_DEFAULT_PACKED_PATH_FRAGMENTS = [
  "dist/packages/memory-providers/sqlite-fs/",
  "dist/node_modules/@repo-ai-governor/memory-provider-sqlite-fs/",
];

/**
 * Parses CLI args for local-distribution verification.
 * @returns {{distributionMode: "default" | "plugin-enabled"}}
 */
function parseCliOptions() {
  const rawArgs = process.argv.slice(2);
  const distributionModeIndex = rawArgs.findIndex((arg) => arg === "--distribution-mode");
  if (distributionModeIndex === -1) {
    return {
      distributionMode: DEFAULT_DISTRIBUTION_MODE,
    };
  }

  const candidateMode = rawArgs[distributionModeIndex + 1]?.trim();
  if (
    candidateMode !== DEFAULT_DISTRIBUTION_MODE &&
    candidateMode !== PLUGIN_ENABLED_DISTRIBUTION_MODE
  ) {
    throw new Error('Expected "--distribution-mode" to be "default" or "plugin-enabled".');
  }

  return {
    distributionMode: candidateMode,
  };
}

/**
 * Runs one shell command and throws on non-zero status.
 * @param {string} command Command binary.
 * @param {string[]} args Command arguments.
 * @param {string} label Human-readable command label.
 * @returns {import("node:child_process").SpawnSyncReturns<string>}
 */
function runCommand(command, args, label) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });

  if (result.error) {
    throw new Error(`${label} failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() ?? "";
    const stdout = result.stdout?.trim() ?? "";
    throw new Error(
      `${label} exited with code ${result.status}. stdout="${stdout}" stderr="${stderr}"`,
    );
  }

  return result;
}

/**
 * Parses `pnpm pack --json` output by scanning from the last line upwards.
 * Why: pnpm may print non-JSON log lines before the JSON payload.
 * @param {string} rawOutput Raw command stdout.
 * @returns {unknown}
 */
function parsePackOutputJson(rawOutput) {
  const normalizedOutput = rawOutput.trim();
  if (normalizedOutput.length === 0) {
    throw new Error("pnpm pack --json returned empty stdout.");
  }

  try {
    return JSON.parse(normalizedOutput);
  } catch {
    // Why: keep line-by-line fallback for CLI wrappers that append extra preamble lines.
  }

  const candidateLines = normalizedOutput.split(/\r?\n/u).reverse();
  for (const candidateLine of candidateLines) {
    const trimmedLine = candidateLine.trim();
    if (trimmedLine.length === 0) {
      continue;
    }

    try {
      return JSON.parse(trimmedLine);
    } catch {
      // Why: continue searching to tolerate preamble lines generated by package manager hooks.
    }
  }

  throw new Error("Unable to parse JSON payload from pnpm pack --json output.");
}

/**
 * Resolves one pack result object from parsed pack payload.
 * @param {unknown} packJson Parsed pack JSON.
 * @returns {Record<string, unknown>}
 */
function resolvePackRecord(packJson) {
  if (Array.isArray(packJson)) {
    const firstRecord = packJson[0];
    if (!firstRecord || typeof firstRecord !== "object") {
      throw new Error("pnpm pack --json returned an empty or invalid array payload.");
    }
    return firstRecord;
  }

  if (!packJson || typeof packJson !== "object") {
    throw new Error("pnpm pack --json returned unsupported payload shape.");
  }

  return packJson;
}

/**
 * Normalizes a file path for stable suffix checks.
 * @param {string} filePath Candidate file path.
 * @returns {string}
 */
function normalizeFilePath(filePath) {
  return filePath.replace(/\\/g, "/");
}

/**
 * Resolves packed file path list from a pack record payload.
 * @param {Record<string, unknown>} packRecord Parsed pack record.
 * @returns {string[]}
 */
function readPackedFilePaths(packRecord) {
  const files = packRecord.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error("pnpm pack --json did not provide file manifest.");
  }

  const normalizedPaths = [];
  for (const fileEntry of files) {
    if (typeof fileEntry === "string" && fileEntry.trim().length > 0) {
      normalizedPaths.push(normalizeFilePath(fileEntry.trim()));
      continue;
    }

    if (
      fileEntry &&
      typeof fileEntry === "object" &&
      typeof fileEntry.path === "string" &&
      fileEntry.path.trim().length > 0
    ) {
      normalizedPaths.push(normalizeFilePath(fileEntry.path.trim()));
    }
  }

  if (normalizedPaths.length === 0) {
    throw new Error("pnpm pack file manifest contains no usable path entries.");
  }

  return normalizedPaths;
}

/**
 * Returns whether a packed file manifest contains one required path suffix.
 * @param {string[]} packedFilePaths Packed file path list.
 * @param {string} requiredSuffix Required path suffix.
 * @returns {boolean}
 */
function hasPackedPathSuffix(packedFilePaths, requiredSuffix) {
  const normalizedSuffix = normalizeFilePath(requiredSuffix);
  return packedFilePaths.some((candidatePath) => {
    return candidatePath === normalizedSuffix || candidatePath.endsWith(`/${normalizedSuffix}`);
  });
}

/**
 * Returns whether a packed file manifest still contains one forbidden fragment.
 * @param {string[]} packedFilePaths Packed file path list.
 * @param {string} forbiddenFragment Forbidden path fragment.
 * @returns {boolean}
 */
function hasPackedPathFragment(packedFilePaths, forbiddenFragment) {
  const normalizedFragment = normalizeFilePath(forbiddenFragment);
  return packedFilePaths.some((candidatePath) => candidatePath.includes(normalizedFragment));
}

try {
  const options = parseCliOptions();
  const absoluteCliEntryPath = resolve(process.cwd(), DIST_CLI_ENTRY_PATH);
  if (!existsSync(absoluteCliEntryPath)) {
    throw new Error(`Distribution CLI entry is missing: ${DIST_CLI_ENTRY_PATH}`);
  }

  runCommand("node", [DIST_CLI_ENTRY_PATH, "--help"], "CLI help smoke check");
  gateInfo(GATE_NAME, "CLI help smoke check passed.");
  runCommand(
    "node",
    ["./scripts/examples/check-desktop-entry-smoke.js"],
    "Desktop entry smoke check",
  );
  gateInfo(GATE_NAME, "Desktop entry smoke check passed.");
  runCommand(
    "node",
    [
      "./scripts/examples/check-examples-runtime.js",
      ...(options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE
        ? ["--distribution-mode", PLUGIN_ENABLED_DISTRIBUTION_MODE]
        : []),
    ],
    "Examples runtime smoke check",
  );
  gateInfo(
    GATE_NAME,
    `Examples runtime smoke check passed for distribution_mode=${options.distributionMode}.`,
  );

  const packResult = runCommand("pnpm", ["pack", "--json"], "pnpm pack --json");
  const parsedPackJson = parsePackOutputJson(packResult.stdout ?? "");
  const packRecord = resolvePackRecord(parsedPackJson);
  const packedFilePaths = readPackedFilePaths(packRecord);

  for (const requiredSuffix of REQUIRED_PACKED_PATH_SUFFIXES) {
    if (!hasPackedPathSuffix(packedFilePaths, requiredSuffix)) {
      throw new Error(`Packed artifact is missing required path suffix: ${requiredSuffix}`);
    }
  }

  if (options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE) {
    for (const requiredSuffix of PLUGIN_ENABLED_REQUIRED_PACKED_PATH_SUFFIXES) {
      if (!hasPackedPathSuffix(packedFilePaths, requiredSuffix)) {
        throw new Error(
          `Plugin-enabled packed artifact is missing required path suffix: ${requiredSuffix}`,
        );
      }
    }
  } else {
    for (const forbiddenFragment of FORBIDDEN_DEFAULT_PACKED_PATH_FRAGMENTS) {
      if (hasPackedPathFragment(packedFilePaths, forbiddenFragment)) {
        throw new Error(
          `Packed artifact contains optional built-in provider payload in default distribution: ${forbiddenFragment}`,
        );
      }
    }
  }

  const rawFilename = packRecord.filename;
  if (typeof rawFilename !== "string" || rawFilename.trim().length === 0) {
    throw new Error("pnpm pack --json did not provide tarball filename.");
  }
  const packTarballPath = resolve(process.cwd(), rawFilename.trim());
  if (!existsSync(packTarballPath)) {
    throw new Error(`Pack tarball file is missing: ${rawFilename}`);
  }

  rmSync(packTarballPath, { force: true });
  gatePass(
    GATE_NAME,
    `local distribution verified. distribution_mode=${options.distributionMode} pack_file=${rawFilename.trim()} files=${packedFilePaths.length}`,
  );
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
