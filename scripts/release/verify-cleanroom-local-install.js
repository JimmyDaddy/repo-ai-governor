#!/usr/bin/env node

import { spawnSync } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  rmSync,
  unlinkSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { dirname, resolve } from "node:path";

import { gateFail, gateInfo, gatePass } from "../governance/gate-output.js";

const GATE_NAME = "release-verify-cleanroom-install";
const PACKAGE_BINARY = "repo-ai-governor";
const DEFAULT_REPORT_PATH =
  ".repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-077-cleanroom-validation-report.json";
const DEFAULT_MODE_LIST = ["path", "link"];
const SUPPORTED_MODE_SET = new Set(["path", "tgz", "link"]);
const DEFAULT_ITERATIONS = 3;
const DEFAULT_REQUIRED_CHAIN = ["--help", "init", "doctor", "check"];
const WORKSPACE_ROLLBACK_BASELINE_MODE = "path";
const READ_ONLY_ATTACH_PRECHECK_MODE = "path";

const DEFAULT_REPO_LOCAL_CONFIG_CONTENT = [
  'schemaVersion: "1.1"',
  "workspace:",
  "  mode: repo_local",
  "  migrationPolicy: copy_verify_switch_rollback",
  "i18n:",
  "  runtimeEngine: i18next",
  "  defaultLocale: zh-CN",
  "  fallbackLocale: en-US",
  "  supportedLocales:",
  "    - zh-CN",
  "    - en-US",
  "memory:",
  "  storeEngine: fs_csv",
  "  storeRoot: context/memory",
  "",
].join("\n");

/**
 * Parses CLI options for clean-room verification.
 * @returns {{
 *   modes: string[];
 *   iterations: number;
 *   outputPath: string;
 *   keepTemp: boolean;
 * }}
 */
function parseCliOptions() {
  const args = process.argv.slice(2);
  let modes = [...DEFAULT_MODE_LIST];
  let iterations = DEFAULT_ITERATIONS;
  let outputPath = DEFAULT_REPORT_PATH;
  let keepTemp = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--modes") {
      const value = args[index + 1];
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error('Expected a non-empty value after "--modes".');
      }
      modes = value
        .split(",")
        .map((candidate) => candidate.trim().toLowerCase())
        .filter((candidate) => candidate.length > 0);
      index += 1;
      continue;
    }

    if (arg === "--iterations") {
      const value = args[index + 1];
      if (!value || !/^\d+$/u.test(value)) {
        throw new Error('Expected an integer value after "--iterations".');
      }
      iterations = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg === "--output") {
      const value = args[index + 1];
      if (typeof value !== "string" || value.trim().length === 0) {
        throw new Error('Expected a non-empty value after "--output".');
      }
      outputPath = value.trim();
      index += 1;
      continue;
    }

    if (arg === "--keep-temp") {
      keepTemp = true;
      continue;
    }

    throw new Error(`Unsupported option: ${arg}`);
  }

  if (iterations < 1) {
    throw new Error(`"--iterations" must be >= 1. received=${iterations}`);
  }

  if (modes.length === 0) {
    throw new Error("At least one install mode is required.");
  }

  const dedupedModes = Array.from(new Set(modes));
  for (const mode of dedupedModes) {
    if (!SUPPORTED_MODE_SET.has(mode)) {
      throw new Error(
        `Unsupported install mode "${mode}". expected=${Array.from(SUPPORTED_MODE_SET).join("|")}`,
      );
    }
  }

  return {
    modes: dedupedModes,
    iterations,
    outputPath,
    keepTemp,
  };
}

/**
 * Runs one command and throws when execution fails.
 * @param {string} command Command binary.
 * @param {string[]} args Command args.
 * @param {{cwd: string; env?: NodeJS.ProcessEnv; label: string}} options Command options.
 * @returns {{
 *   command: string;
 *   exitCode: number;
 *   durationMs: number;
 *   stdout: string;
 *   stderr: string;
 * }}
 */
function runCommand(command, args, options) {
  const startedAtMs = Date.now();
  const result = spawnSync(command, args, {
    cwd: options.cwd,
    env: options.env ?? process.env,
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  const durationMs = Date.now() - startedAtMs;

  if (result.error) {
    throw new Error(`${options.label} failed to execute: ${result.error.message}`);
  }

  const exitCode = typeof result.status === "number" ? result.status : 1;
  const stdout = result.stdout ?? "";
  const stderr = result.stderr ?? "";
  const commandLine = `${command} ${args.join(" ")}`;

  if (exitCode !== 0) {
    const compactStdout = compactOutput(stdout);
    const compactStderr = compactOutput(stderr);
    throw new Error(
      `${options.label} failed (exit=${exitCode}) command="${commandLine}" stdout="${compactStdout}" stderr="${compactStderr}"`,
    );
  }

  return {
    command: commandLine,
    exitCode,
    durationMs,
    stdout,
    stderr,
  };
}

/**
 * Compacts command output for stable diagnostics.
 * @param {string} value Raw stdout/stderr.
 * @returns {string}
 */
function compactOutput(value) {
  return value.replace(/\s+/gu, " ").trim().slice(0, 500);
}

/**
 * Parses JSON payload from command stdout.
 * Why: some wrappers may prepend lines before JSON output.
 * @param {string} rawOutput Raw stdout payload.
 * @param {string} label Parse label.
 * @returns {Record<string, unknown>}
 */
function parseJsonOutput(rawOutput, label) {
  const normalizedOutput = rawOutput.trim();
  if (normalizedOutput.length === 0) {
    throw new Error(`${label} returned empty stdout.`);
  }

  try {
    const parsed = JSON.parse(normalizedOutput);
    if (!parsed || typeof parsed !== "object") {
      throw new Error(`${label} returned non-object JSON payload.`);
    }
    return parsed;
  } catch {
    // Why: keep line-by-line fallback to tolerate wrappers around JSON output.
  }

  const lines = normalizedOutput.split(/\r?\n/u).reverse();
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }

    try {
      const parsed = JSON.parse(trimmed);
      if (!parsed || typeof parsed !== "object") {
        continue;
      }
      return parsed;
    } catch {
      // Why: continue scanning until a valid JSON line is found.
    }
  }

  throw new Error(`${label} did not contain parseable JSON output.`);
}

/**
 * Ensures one CLI JSON payload indicates successful execution.
 * @param {Record<string, unknown>} payload CLI output payload.
 * @param {string} stepId Current step id.
 */
function assertCliSuccessPayload(payload, stepId) {
  if (payload.status !== "success") {
    throw new Error(`CLI step "${stepId}" returned non-success status: ${String(payload.status)}`);
  }
}

/**
 * Builds runtime env overrides for isolated clean-room runs.
 * @param {string} homePath Isolated HOME path.
 * @returns {NodeJS.ProcessEnv}
 */
function buildIsolatedRuntimeEnv(homePath) {
  const xdgConfigHomePath = resolve(homePath, ".config");
  mkdirSync(xdgConfigHomePath, { recursive: true });

  return {
    ...process.env,
    HOME: homePath,
    USERPROFILE: homePath,
    XDG_CONFIG_HOME: xdgConfigHomePath,
    CI: "1",
  };
}

/**
 * Prepares one clean-room repository with minimal package.json.
 * @param {string} repositoryPath Absolute repository path.
 * @param {string} repositoryName Repository display name.
 */
function initializeCleanroomRepository(repositoryPath, repositoryName) {
  mkdirSync(repositoryPath, { recursive: true });
  writeFileSync(
    resolve(repositoryPath, "package.json"),
    `${JSON.stringify(
      {
        name: repositoryName,
        private: true,
        version: "0.0.0",
        type: "module",
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
}

/**
 * Resolves install specifier for one mode.
 * @param {string} mode Install mode.
 * @param {{repositoryRoot: string; tarballPath: string | null}} installAssets Install assets.
 * @returns {string}
 */
function resolveInstallSpecifier(mode, installAssets) {
  if (mode === "path") {
    return installAssets.repositoryRoot;
  }

  if (mode === "link") {
    return `link:${installAssets.repositoryRoot}`;
  }

  if (mode === "tgz") {
    if (!installAssets.tarballPath) {
      throw new Error("tgz mode requested but tarball is unavailable.");
    }
    return installAssets.tarballPath;
  }

  throw new Error(`Unsupported install mode: ${mode}`);
}

/**
 * Installs repo-ai-governor package into one clean-room repository.
 * @param {{
 *   mode: string;
 *   repositoryPath: string;
 *   runtimeEnv: NodeJS.ProcessEnv;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 * }} options Install options.
 * @returns {{command: string; durationMs: number}}
 */
function installCleanroomPackage(options) {
  const installSpecifier = resolveInstallSpecifier(options.mode, options.installAssets);
  const installResult = runCommand("pnpm", ["add", "--save-exact", installSpecifier], {
    cwd: options.repositoryPath,
    env: options.runtimeEnv,
    label: `install(${options.mode})`,
  });

  gateInfo(
    GATE_NAME,
    `installed mode=${options.mode} repo=${options.repositoryPath} duration_ms=${installResult.durationMs}`,
  );

  return {
    command: installResult.command,
    durationMs: installResult.durationMs,
  };
}

/**
 * Runs one CLI command through pnpm exec in clean-room repo.
 * @param {{
 *   repositoryPath: string;
 *   runtimeEnv: NodeJS.ProcessEnv;
 *   args: string[];
 *   label: string;
 * }} options Command options.
 * @returns {{command: string; durationMs: number; stdout: string; stderr: string}}
 */
function runCleanroomCliCommand(options) {
  const result = runCommand("pnpm", ["exec", PACKAGE_BINARY, ...options.args], {
    cwd: options.repositoryPath,
    env: options.runtimeEnv,
    label: options.label,
  });

  return {
    command: result.command,
    durationMs: result.durationMs,
    stdout: result.stdout,
    stderr: result.stderr,
  };
}

/**
 * Executes one clean-room smoke chain iteration.
 * @param {{
 *   mode: string;
 *   iteration: number;
 *   workingRoot: string;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 * }} options Iteration options.
 * @returns {{
 *   mode: string;
 *   iteration: number;
 *   status: "passed";
 *   repositoryPath: string;
 *   homePath: string;
 *   install: {command: string; durationMs: number};
 *   steps: Array<Record<string, unknown>>;
 * }}
 */
function runSmokeIteration(options) {
  const iterationRoot = resolve(
    options.workingRoot,
    `iteration-${String(options.iteration).padStart(2, "0")}`,
  );
  const repositoryPath = resolve(iterationRoot, "target-repo");
  const homePath = resolve(iterationRoot, "home");
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);

  initializeCleanroomRepository(
    repositoryPath,
    `cleanroom-${options.mode}-${String(options.iteration).padStart(2, "0")}`,
  );
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });

  /** @type {Array<Record<string, unknown>>} */
  const steps = [];

  const helpStep = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ["--help"],
    label: `help(${options.mode}/${options.iteration})`,
  });
  steps.push({
    stepId: "--help",
    command: helpStep.command,
    durationMs: helpStep.durationMs,
    outputSample: compactOutput(helpStep.stdout),
  });

  for (const commandName of ["init", "doctor", "check"]) {
    const commandStep = runCleanroomCliCommand({
      repositoryPath,
      runtimeEnv,
      args: ["--output", "json", commandName],
      label: `${commandName}(${options.mode}/${options.iteration})`,
    });
    const payload = parseJsonOutput(commandStep.stdout, commandName);
    assertCliSuccessPayload(payload, commandName);
    steps.push({
      stepId: commandName,
      command: commandStep.command,
      durationMs: commandStep.durationMs,
      status: payload.status,
      diagnostics: payload.diagnostics ?? null,
      commandResult: payload.command_result ?? null,
    });
  }

  return {
    mode: options.mode,
    iteration: options.iteration,
    status: "passed",
    repositoryPath,
    homePath,
    install,
    steps,
  };
}

/**
 * Reads top-level entries under one directory.
 * Why: attach precheck focuses on whether CLI commands write new root-level artifacts.
 * @param {string} directoryPath Absolute directory path.
 * @returns {string[]}
 */
function listTopLevelEntries(directoryPath) {
  return readdirSync(directoryPath)
    .slice()
    .sort((left, right) => left.localeCompare(right));
}

/**
 * Diffs two entry arrays.
 * @param {string[]} beforeEntries Snapshot before.
 * @param {string[]} afterEntries Snapshot after.
 * @returns {{added: string[]; removed: string[]}}
 */
function diffEntries(beforeEntries, afterEntries) {
  const beforeSet = new Set(beforeEntries);
  const afterSet = new Set(afterEntries);
  const added = afterEntries.filter((entry) => !beforeSet.has(entry));
  const removed = beforeEntries.filter((entry) => !afterSet.has(entry));

  return {
    added,
    removed,
  };
}

/**
 * Runs read-only attach precheck for doctor/init behavior in tool-managed mode.
 * @param {{
 *   mode: string;
 *   workingRoot: string;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 * }} options Scenario options.
 * @returns {Record<string, unknown>}
 */
function runReadOnlyAttachPrecheck(options) {
  const scenarioRoot = resolve(options.workingRoot, "readonly-attach-precheck");
  const repositoryPath = resolve(scenarioRoot, "target-repo");
  const homePath = resolve(scenarioRoot, "home");
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, "cleanroom-readonly-attach");
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });

  const beforeEntries = listTopLevelEntries(repositoryPath);
  const doctorStep = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ["--output", "json", "doctor"],
    label: "doctor(readonly-attach)",
  });
  const doctorPayload = parseJsonOutput(doctorStep.stdout, "doctor(readonly-attach)");
  assertCliSuccessPayload(doctorPayload, "doctor(readonly-attach)");
  const afterDoctorEntries = listTopLevelEntries(repositoryPath);

  const initStep = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ["--output", "json", "init"],
    label: "init(readonly-attach)",
  });
  const initPayload = parseJsonOutput(initStep.stdout, "init(readonly-attach)");
  assertCliSuccessPayload(initPayload, "init(readonly-attach)");
  const afterInitEntries = listTopLevelEntries(repositoryPath);

  const doctorDiff = diffEntries(beforeEntries, afterDoctorEntries);
  const initDiff = diffEntries(beforeEntries, afterInitEntries);

  if (doctorDiff.added.length > 0 || doctorDiff.removed.length > 0) {
    throw new Error(
      `doctor precheck wrote to target repository. added=${doctorDiff.added.join("|")} removed=${doctorDiff.removed.join("|")}`,
    );
  }

  if (initDiff.added.length > 0 || initDiff.removed.length > 0) {
    throw new Error(
      `init precheck wrote to target repository under tool_managed mode. added=${initDiff.added.join("|")} removed=${initDiff.removed.join("|")}`,
    );
  }

  return {
    mode: options.mode,
    status: "passed",
    repositoryPath,
    install,
    doctor: {
      command: doctorStep.command,
      durationMs: doctorStep.durationMs,
      attachMode: doctorPayload.command_result?.attach_mode ?? null,
      diagnostics: doctorPayload.diagnostics ?? null,
    },
    init: {
      command: initStep.command,
      durationMs: initStep.durationMs,
      diagnostics: initPayload.diagnostics ?? null,
    },
    targetRepoMutation: {
      doctor: doctorDiff,
      init: initDiff,
    },
  };
}

/**
 * Runs workspace-mode switch validation: tool_managed -> repo_local -> rollback.
 * @param {{
 *   mode: string;
 *   workingRoot: string;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 * }} options Scenario options.
 * @returns {Record<string, unknown>}
 */
function runWorkspaceSwitchRollbackScenario(options) {
  const scenarioRoot = resolve(options.workingRoot, "workspace-switch-rollback");
  const repositoryPath = resolve(scenarioRoot, "target-repo");
  const homePath = resolve(scenarioRoot, "home");
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, "cleanroom-workspace-switch");
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });

  const defaultInit = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ["--output", "json", "init"],
    label: "init(workspace-switch/default)",
  });
  const defaultInitPayload = parseJsonOutput(defaultInit.stdout, "init(workspace-switch/default)");
  assertCliSuccessPayload(defaultInitPayload, "init(workspace-switch/default)");
  const defaultDiagnostics = defaultInitPayload.diagnostics ?? {};
  if (defaultDiagnostics.workspaceMode !== "tool_managed") {
    throw new Error(
      `Expected tool_managed mode before switch. actual=${String(defaultDiagnostics.workspaceMode)}`,
    );
  }
  const toolManagedRoot = String(defaultDiagnostics.workspaceRoot);
  const toolManagedConfigPath = resolve(toolManagedRoot, "governor.yaml");
  if (!existsSync(toolManagedConfigPath)) {
    throw new Error(`Missing tool_managed config path after init: ${toolManagedConfigPath}`);
  }

  const repoLocalConfigPath = resolve(repositoryPath, ".repo-ai-governor", "governor.yaml");
  mkdirSync(dirname(repoLocalConfigPath), { recursive: true });
  writeFileSync(repoLocalConfigPath, DEFAULT_REPO_LOCAL_CONFIG_CONTENT, "utf8");

  const repoLocalDoctor = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ["--output", "json", "doctor"],
    label: "doctor(workspace-switch/repo-local)",
  });
  const repoLocalDoctorPayload = parseJsonOutput(
    repoLocalDoctor.stdout,
    "doctor(workspace-switch/repo-local)",
  );
  assertCliSuccessPayload(repoLocalDoctorPayload, "doctor(workspace-switch/repo-local)");
  const repoLocalDiagnostics = repoLocalDoctorPayload.diagnostics ?? {};
  if (repoLocalDiagnostics.workspaceMode !== "repo_local") {
    throw new Error(
      `Expected repo_local mode after switch. actual=${String(repoLocalDiagnostics.workspaceMode)}`,
    );
  }

  const repoLocalInit = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ["--output", "json", "init"],
    label: "init(workspace-switch/repo-local)",
  });
  const repoLocalInitPayload = parseJsonOutput(
    repoLocalInit.stdout,
    "init(workspace-switch/repo-local)",
  );
  assertCliSuccessPayload(repoLocalInitPayload, "init(workspace-switch/repo-local)");
  const repoLocalRoot = String(repoLocalInitPayload.diagnostics?.workspaceRoot ?? "");
  if (!repoLocalRoot.endsWith(".repo-ai-governor")) {
    throw new Error(`Unexpected repo_local workspace root: ${repoLocalRoot}`);
  }
  if (!existsSync(repoLocalConfigPath)) {
    throw new Error(`Missing repo_local config path after repo_local init: ${repoLocalConfigPath}`);
  }

  unlinkSync(repoLocalConfigPath);

  const rollbackDoctor = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ["--output", "json", "doctor"],
    label: "doctor(workspace-switch/rollback)",
  });
  const rollbackDoctorPayload = parseJsonOutput(
    rollbackDoctor.stdout,
    "doctor(workspace-switch/rollback)",
  );
  assertCliSuccessPayload(rollbackDoctorPayload, "doctor(workspace-switch/rollback)");
  const rollbackDiagnostics = rollbackDoctorPayload.diagnostics ?? {};
  if (rollbackDiagnostics.workspaceMode !== "tool_managed") {
    throw new Error(
      `Expected tool_managed mode after rollback. actual=${String(rollbackDiagnostics.workspaceMode)}`,
    );
  }
  if (rollbackDiagnostics.workspaceRoot !== toolManagedRoot) {
    throw new Error(
      `Expected rollback workspace root=${toolManagedRoot}, actual=${String(
        rollbackDiagnostics.workspaceRoot,
      )}`,
    );
  }
  if (!existsSync(toolManagedConfigPath)) {
    throw new Error(`Missing tool_managed config path after rollback: ${toolManagedConfigPath}`);
  }

  return {
    mode: options.mode,
    status: "passed",
    repositoryPath,
    install,
    toolManagedInit: {
      command: defaultInit.command,
      durationMs: defaultInit.durationMs,
      diagnostics: defaultInitPayload.diagnostics ?? null,
    },
    repoLocalDoctor: {
      command: repoLocalDoctor.command,
      durationMs: repoLocalDoctor.durationMs,
      diagnostics: repoLocalDoctorPayload.diagnostics ?? null,
    },
    repoLocalInit: {
      command: repoLocalInit.command,
      durationMs: repoLocalInit.durationMs,
      diagnostics: repoLocalInitPayload.diagnostics ?? null,
    },
    rollbackDoctor: {
      command: rollbackDoctor.command,
      durationMs: rollbackDoctor.durationMs,
      diagnostics: rollbackDoctorPayload.diagnostics ?? null,
    },
    workspaceRoots: {
      toolManagedRoot,
      repoLocalRoot,
    },
    rollbackValidation: {
      toolManagedConfigPath,
      repoLocalConfigPath,
    },
  };
}

/**
 * Parses `pnpm pack --json` output payload.
 * @param {string} rawOutput Raw stdout from `pnpm pack --json`.
 * @returns {{filename: string}}
 */
function parsePackResult(rawOutput) {
  const normalizedOutput = rawOutput.trim();
  if (!normalizedOutput) {
    throw new Error("pnpm pack --json returned empty stdout.");
  }

  /** @type {unknown} */
  let parsed;
  try {
    parsed = JSON.parse(normalizedOutput);
  } catch {
    const lines = normalizedOutput.split(/\r?\n/u).reverse();
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) {
        continue;
      }
      try {
        parsed = JSON.parse(trimmed);
        break;
      } catch {
        // Why: continue scanning until valid JSON line is found.
      }
    }
  }

  if (!parsed) {
    throw new Error("Unable to parse pnpm pack --json output.");
  }

  const firstRecord = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!firstRecord || typeof firstRecord !== "object") {
    throw new Error("pnpm pack --json payload is not an object.");
  }

  const filename = firstRecord.filename;
  if (typeof filename !== "string" || filename.trim().length === 0) {
    throw new Error("pnpm pack --json payload is missing filename.");
  }

  return {
    filename: filename.trim(),
  };
}

/**
 * Creates install assets required by selected modes.
 * @param {string[]} modes Selected install modes.
 * @returns {{repositoryRoot: string; tarballPath: string | null}}
 */
function prepareInstallAssets(modes) {
  const repositoryRoot = process.cwd();
  runCommand("pnpm", ["run", "build"], {
    cwd: repositoryRoot,
    label: "build",
  });
  gateInfo(GATE_NAME, "build completed for clean-room install validation.");

  if (!modes.includes("tgz")) {
    return {
      repositoryRoot,
      tarballPath: null,
    };
  }

  const packResult = runCommand("pnpm", ["pack", "--json"], {
    cwd: repositoryRoot,
    label: "pack",
  });
  const packPayload = parsePackResult(packResult.stdout);
  const tarballPath = resolve(repositoryRoot, packPayload.filename);
  if (!existsSync(tarballPath)) {
    throw new Error(`pnpm pack produced missing tarball: ${tarballPath}`);
  }
  gateInfo(GATE_NAME, `tgz asset ready: ${tarballPath}`);

  return {
    repositoryRoot,
    tarballPath,
  };
}

/**
 * Writes verification report payload.
 * @param {string} reportPath Relative report path.
 * @param {Record<string, unknown>} reportPayload Report payload.
 */
function writeReport(reportPath, reportPayload) {
  const absolutePath = resolve(process.cwd(), reportPath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(reportPayload, null, 2)}\n`, "utf8");
}

const options = parseCliOptions();
const createdTempRoot = mkdtempSync(resolve(tmpdir(), "repo-ai-governor-cleanroom-"));
const installAssets = prepareInstallAssets(options.modes);

let overallStatus = "passed";
let overallFailure = null;
/** @type {Array<Record<string, unknown>>} */
const modeResults = [];
/** @type {Record<string, unknown> | null} */
let workspaceSwitchRollback = null;
/** @type {Record<string, unknown> | null} */
let readOnlyAttachPrecheck = null;

try {
  for (const mode of options.modes) {
    const modeRoot = resolve(createdTempRoot, mode);
    mkdirSync(modeRoot, { recursive: true });

    /** @type {Array<Record<string, unknown>>} */
    const iterationResults = [];
    for (let iteration = 1; iteration <= options.iterations; iteration += 1) {
      const iterationResult = runSmokeIteration({
        mode,
        iteration,
        workingRoot: modeRoot,
        installAssets,
      });
      iterationResults.push(iterationResult);
      gateInfo(
        GATE_NAME,
        `mode=${mode} iteration=${iteration}/${options.iterations} passed chain=${DEFAULT_REQUIRED_CHAIN.join(
          "->",
        )}`,
      );
    }

    modeResults.push({
      mode,
      status: "passed",
      passedIterations: iterationResults.length,
      iterations: iterationResults,
    });
  }

  workspaceSwitchRollback = runWorkspaceSwitchRollbackScenario({
    mode: options.modes.includes(WORKSPACE_ROLLBACK_BASELINE_MODE)
      ? WORKSPACE_ROLLBACK_BASELINE_MODE
      : options.modes[0],
    workingRoot: createdTempRoot,
    installAssets,
  });
  gateInfo(GATE_NAME, "workspace switch rollback scenario passed.");

  readOnlyAttachPrecheck = runReadOnlyAttachPrecheck({
    mode: options.modes.includes(READ_ONLY_ATTACH_PRECHECK_MODE)
      ? READ_ONLY_ATTACH_PRECHECK_MODE
      : options.modes[0],
    workingRoot: createdTempRoot,
    installAssets,
  });
  gateInfo(GATE_NAME, "read-only attach precheck passed.");
} catch (error) {
  overallStatus = "failed";
  overallFailure = error instanceof Error ? error.message : String(error);
}

const reportPayload = {
  reportType: "cleanroom_local_install_verification_v1",
  status: overallStatus,
  generatedAt: new Date().toISOString(),
  repositoryRoot: process.cwd(),
  selectedModes: options.modes,
  selectedModeCount: options.modes.length,
  iterationsPerMode: options.iterations,
  requiredCommandChain: DEFAULT_REQUIRED_CHAIN,
  modeResults,
  workspaceSwitchRollback,
  readOnlyAttachPrecheck,
  stage9aHardExit: {
    requiredModeMinimum: 2,
    selectedModeCount: options.modes.length,
    perModeIterationsMinimum: 3,
    configuredIterations: options.iterations,
    commandChain: DEFAULT_REQUIRED_CHAIN,
    passed: overallStatus === "passed" && options.modes.length >= 2 && options.iterations >= 3,
  },
  notes: {
    tgzModeSelected: options.modes.includes("tgz"),
    cleanupPolicy: options.keepTemp || overallStatus === "failed" ? "keep_temp" : "remove_temp",
  },
};

if (overallFailure) {
  reportPayload.errorMessage = overallFailure;
}

try {
  writeReport(options.outputPath, reportPayload);
  gateInfo(GATE_NAME, `report generated at ${options.outputPath}`);
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, `failed to persist report: ${message}`);
  process.exit(1);
}

if (!options.keepTemp && overallStatus === "passed") {
  rmSync(createdTempRoot, { recursive: true, force: true });
}

if (installAssets.tarballPath && existsSync(installAssets.tarballPath)) {
  rmSync(installAssets.tarballPath, { force: true });
}

if (overallStatus === "passed") {
  gatePass(
    GATE_NAME,
    `clean-room validation passed. modes=${options.modes.join(",")} iterations=${options.iterations}`,
  );
} else {
  gateFail(GATE_NAME, overallFailure ?? "clean-room validation failed.");
  gateInfo(GATE_NAME, `temp artifacts kept at ${createdTempRoot}`);
  process.exit(1);
}
