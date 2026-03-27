#!/usr/bin/env node

import { execFileSync, spawnSync } from "node:child_process";

const DEFAULT_OUTPUT_MODE = "pretty";
const DOC_ONLY_PREFIXES = [
  ".repo-ai-governor/",
  ".codex/",
  "docs/",
  "AGENTS.md",
  "CLAUDE.md",
  "README.md",
  "README.zh-CN.md",
];
const PACKAGE_LOCAL_PILOT_PREFIXES = [
  "packages/shared/",
  "packages/memory-store-adapter/",
  "packages/core-memory/",
  "packages/core-memory-semantics/",
];
const PACKAGE_LOCAL_PILOT_FILES = new Set([
  "turbo.json",
  "tsconfig.package-local-pilot.build.json",
  "packages/shared/tsconfig.build.json",
  "packages/memory-store-adapter/tsconfig.build.json",
  "packages/core-memory/tsconfig.build.json",
  "packages/core-memory-semantics/tsconfig.build.json",
]);

/**
 * Parses CLI flags for affected-gate execution.
 * @returns {{
 *   outputMode: "pretty" | "json";
 *   dryRun: boolean;
 *   verbose: boolean;
 *   changedFiles: string[];
 *   baseRef: string | null;
 *   headRef: string | null;
 * }}
 */
function parseArguments() {
  const args = process.argv.slice(2);
  /** @type {string[]} */
  const changedFiles = [];
  let outputMode = DEFAULT_OUTPUT_MODE;
  let dryRun = false;
  let verbose = false;
  let baseRef = null;
  let headRef = null;

  for (let index = 0; index < args.length; index += 1) {
    const argument = args[index];
    if (argument === "--output") {
      const candidateOutputMode = args[index + 1]?.trim();
      if (candidateOutputMode !== "pretty" && candidateOutputMode !== "json") {
        throw new Error('Expected "--output" to be followed by "pretty" or "json".');
      }
      outputMode = candidateOutputMode;
      index += 1;
      continue;
    }
    if (argument === "--changed-file") {
      const changedFile = args[index + 1]?.trim();
      if (!changedFile) {
        throw new Error(
          'Expected "--changed-file" to be followed by one repository-relative path.',
        );
      }
      changedFiles.push(changedFile);
      index += 1;
      continue;
    }
    if (argument === "--base-ref") {
      baseRef = args[index + 1]?.trim() || null;
      if (!baseRef) {
        throw new Error('Expected "--base-ref" to be followed by one git ref.');
      }
      index += 1;
      continue;
    }
    if (argument === "--head-ref") {
      headRef = args[index + 1]?.trim() || null;
      if (!headRef) {
        throw new Error('Expected "--head-ref" to be followed by one git ref.');
      }
      index += 1;
      continue;
    }
    if (argument === "--dry-run") {
      dryRun = true;
      continue;
    }
    if (argument === "--verbose") {
      verbose = true;
    }
  }

  return {
    outputMode,
    dryRun,
    verbose,
    changedFiles,
    baseRef,
    headRef,
  };
}

/**
 * Executes one git command and returns trimmed non-empty lines.
 * @param {string[]} args Git CLI arguments.
 * @returns {string[]}
 */
function readGitLines(args) {
  const stdout = execFileSync("git", args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  return stdout
    .split(/\r?\n/u)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);
}

/**
 * Resolves available base-ref candidates for CI/pr worktrees.
 * @param {string | null} explicitBaseRef User-provided base ref.
 * @returns {string[]}
 */
function resolveBaseRefCandidates(explicitBaseRef) {
  const candidates = [];
  const envBaseRef = process.env.REPO_AI_GOVERNOR_AFFECTED_BASE_REF ?? process.env.GITHUB_BASE_REF;
  const seedValues = [explicitBaseRef, envBaseRef].filter(
    (value) => typeof value === "string" && value.trim().length > 0,
  );

  for (const rawValue of seedValues) {
    const trimmedValue = rawValue.trim();
    candidates.push(trimmedValue);
    if (!trimmedValue.startsWith("origin/")) {
      candidates.push(`origin/${trimmedValue}`);
    }
  }

  return Array.from(new Set(candidates));
}

/**
 * Returns whether the git ref resolves in the current repository.
 * @param {string} gitRef Candidate git ref.
 * @returns {boolean}
 */
function gitRefExists(gitRef) {
  const result = spawnSync("git", ["rev-parse", "--verify", gitRef], {
    cwd: process.cwd(),
    stdio: "ignore",
  });
  return result.status === 0;
}

/**
 * Collects changed files either from explicit overrides, base-ref diff, or working tree state.
 * @param {{
 *   changedFiles: string[];
 *   baseRef: string | null;
 *   headRef: string | null;
 * }} options Affected-check source options.
 * @returns {{ changedFiles: string[]; source: string; baseRef: string | null; headRef: string | null }}
 */
function resolveChangedFiles(options) {
  if (options.changedFiles.length > 0) {
    return {
      changedFiles: Array.from(new Set(options.changedFiles.map(normalizeRepositoryPath))).sort(),
      source: "explicit",
      baseRef: null,
      headRef: null,
    };
  }

  const headRef = options.headRef ?? "HEAD";
  const baseRefCandidates = resolveBaseRefCandidates(options.baseRef);
  for (const baseRef of baseRefCandidates) {
    if (!gitRefExists(baseRef)) {
      continue;
    }

    const changedFiles = readGitLines([
      "diff",
      "--name-only",
      "--diff-filter=ACMR",
      `${baseRef}...${headRef}`,
    ]).map(normalizeRepositoryPath);
    return {
      changedFiles: Array.from(new Set(changedFiles)).sort(),
      source: "git_range",
      baseRef,
      headRef,
    };
  }

  const changedFiles = [
    ...readGitLines(["diff", "--name-only", "--diff-filter=ACMR"]),
    ...readGitLines(["diff", "--cached", "--name-only", "--diff-filter=ACMR"]),
    ...readGitLines(["ls-files", "--others", "--exclude-standard"]),
  ].map(normalizeRepositoryPath);

  return {
    changedFiles: Array.from(new Set(changedFiles)).sort(),
    source: "working_tree",
    baseRef: null,
    headRef: null,
  };
}

/**
 * Normalizes one repo-relative path for classification.
 * @param {string} filePath Raw repo-relative path.
 * @returns {string}
 */
function normalizeRepositoryPath(filePath) {
  return filePath.replace(/\\/gu, "/").replace(/^\.\//u, "");
}

/**
 * Returns whether one path is docs/governance-only and safe for fast-only affected checks.
 * @param {string} filePath Repository-relative path.
 * @returns {boolean}
 */
function isDocOnlyPath(filePath) {
  return DOC_ONLY_PREFIXES.some((prefix) => filePath === prefix || filePath.startsWith(prefix));
}

/**
 * Returns whether one path stays inside the sprint-003 package-local pilot scope.
 * @param {string} filePath Repository-relative path.
 * @returns {boolean}
 */
function isPackageLocalPilotPath(filePath) {
  return (
    PACKAGE_LOCAL_PILOT_FILES.has(filePath) ||
    PACKAGE_LOCAL_PILOT_PREFIXES.some((prefix) => filePath.startsWith(prefix))
  );
}

/**
 * Resolves affected execution mode from changed file scope.
 * @param {string[]} changedFiles Normalized changed file paths.
 * @returns {{
 *   selectionMode: "fast_only" | "package_local_pilot" | "full_fallback";
 *   reason: string;
 * }}
 */
function resolveSelectionMode(changedFiles) {
  if (changedFiles.length === 0) {
    return {
      selectionMode: "fast_only",
      reason: "no_changed_files_detected",
    };
  }

  const nonDocPaths = changedFiles.filter((filePath) => !isDocOnlyPath(filePath));
  if (nonDocPaths.length === 0) {
    return {
      selectionMode: "fast_only",
      reason: "docs_only_changes",
    };
  }

  if (nonDocPaths.every(isPackageLocalPilotPath)) {
    return {
      selectionMode: "package_local_pilot",
      reason: "package_local_pilot_scope_only",
    };
  }

  return {
    selectionMode: "full_fallback",
    reason: "changed_files_escape_package_local_pilot_scope",
  };
}

/**
 * Builds one pnpm command and optionally forwards verbose mode.
 * @param {string} scriptName Package script to execute.
 * @param {boolean} verbose Whether to pass `--verbose`.
 * @returns {string[]}
 */
function buildPnpmRunCommand(scriptName, verbose) {
  if (!verbose || (scriptName !== "check:fast" && scriptName !== "check:full")) {
    return ["pnpm", "run", scriptName];
  }
  return ["pnpm", "run", scriptName, "--", "--verbose"];
}

/**
 * Resolves concrete commands from affected selection mode.
 * @param {"fast_only" | "package_local_pilot" | "full_fallback"} selectionMode Selected mode.
 * @param {boolean} verbose Whether wrapper verbose mode is enabled.
 * @returns {string[][]}
 */
function buildCommandPlan(selectionMode, verbose) {
  if (selectionMode === "fast_only") {
    return [buildPnpmRunCommand("check:fast", verbose)];
  }

  if (selectionMode === "package_local_pilot") {
    return [
      buildPnpmRunCommand("check:fast", verbose),
      ["pnpm", "run", "check:package-local:pilot:incremental"],
      ["pnpm", "run", "check:package-local:pilot"],
    ];
  }

  return [buildPnpmRunCommand("check:full", verbose)];
}

/**
 * Executes one command.
 * @param {string[]} command Command argv.
 * @param {"pretty" | "json"} outputMode Output mode.
 * @returns {{ command: string[]; exitCode: number; stdout: string; stderr: string }}
 */
function runCommand(command, outputMode) {
  const [bin, ...args] = command;
  const result = spawnSync(bin, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: outputMode === "pretty" ? "inherit" : ["ignore", "pipe", "pipe"],
  });

  return {
    command,
    exitCode: result.status ?? 1,
    stdout: typeof result.stdout === "string" ? result.stdout : "",
    stderr: typeof result.stderr === "string" ? result.stderr : "",
  };
}

/**
 * Writes one summary payload in the requested output mode.
 * @param {{
 *   outputMode: "pretty" | "json";
 *   summary: Record<string, unknown>;
 * }} options Summary write options.
 */
function writeSummary(options) {
  if (options.outputMode === "json") {
    process.stdout.write(`${JSON.stringify(options.summary, null, 2)}\n`);
    return;
  }

  console.info(
    `[affected-check] mode=${options.summary.selection_mode} reason=${options.summary.reason} source=${options.summary.changed_files_source}`,
  );
}

try {
  const options = parseArguments();
  const changedFilesResolution = resolveChangedFiles(options);
  const selection = resolveSelectionMode(changedFilesResolution.changedFiles);
  const commandPlan = buildCommandPlan(selection.selectionMode, options.verbose);

  /** @type {Array<{ command: string[]; exitCode: number; stdout?: string; stderr?: string }>} */
  const commandResults = [];
  let exitCode = 0;

  if (!options.dryRun) {
    if (options.outputMode === "pretty") {
      console.info(
        `[affected-check] source=${changedFilesResolution.source} changed_files=${changedFilesResolution.changedFiles.length}`,
      );
      for (const changedFile of changedFilesResolution.changedFiles) {
        console.info(`[affected-check] file=${changedFile}`);
      }
    }

    for (const command of commandPlan) {
      if (options.outputMode === "pretty") {
        console.info(`[affected-check] run=${command.join(" ")}`);
      }
      const commandResult = runCommand(command, options.outputMode);
      commandResults.push(commandResult);
      if (commandResult.exitCode !== 0) {
        exitCode = commandResult.exitCode;
        break;
      }
    }
  }

  writeSummary({
    outputMode: options.outputMode,
    summary: {
      profile: "affected",
      selection_mode: selection.selectionMode,
      reason: selection.reason,
      changed_files_source: changedFilesResolution.source,
      base_ref: changedFilesResolution.baseRef,
      head_ref: changedFilesResolution.headRef,
      changed_files: changedFilesResolution.changedFiles,
      dry_run: options.dryRun,
      commands: commandPlan.map((command) => command.join(" ")),
      command_results:
        options.outputMode === "json"
          ? commandResults.map((commandResult) => ({
              command: commandResult.command.join(" "),
              exit_code: commandResult.exitCode,
              stdout: commandResult.stdout,
              stderr: commandResult.stderr,
            }))
          : commandResults.map((commandResult) => ({
              command: commandResult.command.join(" "),
              exit_code: commandResult.exitCode,
            })),
    },
  });

  process.exit(exitCode);
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[affected-check] ${errorMessage}\n`);
  process.exit(1);
}
