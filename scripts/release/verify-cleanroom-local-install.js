#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import {
  copyFileSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';
import {
  REMOTE_API_SMOKE_ANTHROPIC_KEY,
  REMOTE_API_SMOKE_OPENAI_KEY,
  writeRemoteApiSmokeConfig,
} from './remote-api-smoke-runtime.js';

const GATE_NAME = 'release-verify-cleanroom-install';
const PACKAGE_BINARY = 'repo-ai-governor';
const DEFAULT_REPORT_PATH = resolve(tmpdir(), 'repo-ai-governor-cleanroom-validation-report.json');
const DEFAULT_MODE_LIST = ['path', 'link'];
const SUPPORTED_MODE_SET = new Set(['path', 'tgz', 'link']);
const DEFAULT_ITERATIONS = 3;
const DEFAULT_REQUIRED_CHAIN = ['--help', 'init', 'doctor', 'check'];
const DEFAULT_DISTRIBUTION_MODE = 'default';
const PLUGIN_ENABLED_DISTRIBUTION_MODE = 'plugin-enabled';
const PUBLISHED_PACKAGE_NAME = 'repo-ai-governor';
const WORKSPACE_ROLLBACK_BASELINE_MODE = 'path';
const READ_ONLY_ATTACH_PRECHECK_MODE = 'path';
const ACP_CLEANROOM_VERIFICATION_SCHEMA_VERSION = 'acp-cleanroom-verification-summary-v1';
const ACP_CLEANROOM_VERIFICATION_RECEIPTS_DIRECTORY = 'acp-cleanroom-verification.receipts';
const ACP_CLEANROOM_VERIFICATION_PROVENANCE_DIRECTORY = 'acp-cleanroom-verification.provenance';
const ACP_HOST_TRANSPORT_SCENARIOS = [
  {
    surfaceId: 'codex',
    runtimeArgs: [
      'host',
      'export',
      '--host',
      'codex',
      '--mode',
      'project-local',
      '--output-dir',
      '.repo-ai-governor/generated/hosts/codex',
      '--apply-to-repo',
      '.repo-ai-governor/generated/applied/codex',
    ],
    distributionArgs: [
      'host',
      'pack',
      '--host',
      'codex',
      '--mode',
      'plugin-bundle',
      '--output-dir',
      '.repo-ai-governor/generated/hosts/codex-plugin',
      '--bundle-dir',
      '.repo-ai-governor/generated/bundles/codex-plugin',
    ],
  },
  {
    surfaceId: 'claude-code',
    runtimeArgs: [
      'host',
      'export',
      '--host',
      'claude-code',
      '--mode',
      'project-local',
      '--output-dir',
      '.repo-ai-governor/generated/hosts/claude-code',
      '--apply-to-repo',
      '.repo-ai-governor/generated/applied/claude-code',
    ],
    distributionArgs: [
      'host',
      'pack',
      '--host',
      'claude-code',
      '--mode',
      'plugin-bundle',
      '--output-dir',
      '.repo-ai-governor/generated/hosts/claude-code-plugin',
      '--bundle-dir',
      '.repo-ai-governor/generated/bundles/claude-code-plugin',
    ],
  },
  {
    surfaceId: 'github-copilot',
    runtimeArgs: [
      'host',
      'export',
      '--host',
      'github-copilot',
      '--mode',
      'project-local',
      '--copilot-target',
      'repo-local',
      '--output-dir',
      '.repo-ai-governor/generated/hosts/github-copilot-repo-local',
      '--apply-to-repo',
      '.repo-ai-governor/generated/applied/github-copilot-repo-local',
    ],
    distributionArgs: [
      'host',
      'pack',
      '--host',
      'github-copilot',
      '--mode',
      'plugin-bundle',
      '--copilot-target',
      'cli-plugin',
      '--output-dir',
      '.repo-ai-governor/generated/hosts/github-copilot-cli-plugin',
      '--bundle-dir',
      '.repo-ai-governor/generated/bundles/github-copilot-cli-plugin',
    ],
  },
];

const DEFAULT_REPO_LOCAL_CONFIG_CONTENT = [
  'schemaVersion: "1.1"',
  'workspace:',
  '  mode: repo_local',
  '  migrationPolicy: copy_verify_switch_rollback',
  'i18n:',
  '  runtimeEngine: i18next',
  '  defaultLocale: zh-CN',
  '  fallbackLocale: en-US',
  '  supportedLocales:',
  '    - zh-CN',
  '    - en-US',
  'memory:',
  '  storeEngine: sqlite_fs',
  '  storeRoot: context/memory/sqlite',
  '  provider:',
  '    id: sqlite-fs',
  '',
].join('\n');

/**
 * Parses CLI options for clean-room verification.
 * @returns {{
 *   modes: string[];
 *   iterations: number;
 *   outputPath: string;
 *   keepTemp: boolean;
 *   includeAcpHostVerify: boolean;
 *   includeAcpExecutionVerify: boolean;
 *   emitAcpEvidencePath: string | null;
 *   distributionMode: "default" | "plugin-enabled";
 * }}
 */
function parseCliOptions() {
  const args = process.argv.slice(2);
  let modes = [...DEFAULT_MODE_LIST];
  let iterations = DEFAULT_ITERATIONS;
  let outputPath = DEFAULT_REPORT_PATH;
  let keepTemp = false;
  let distributionMode = DEFAULT_DISTRIBUTION_MODE;
  let includeAcpHostVerify = false;
  let includeAcpExecutionVerify = false;
  let emitAcpEvidencePath = null;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--modes') {
      const value = args[index + 1];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Expected a non-empty value after "--modes".');
      }
      modes = value
        .split(',')
        .map((candidate) => candidate.trim().toLowerCase())
        .filter((candidate) => candidate.length > 0);
      index += 1;
      continue;
    }

    if (arg === '--iterations') {
      const value = args[index + 1];
      if (!value || !/^\d+$/u.test(value)) {
        throw new Error('Expected an integer value after "--iterations".');
      }
      iterations = Number.parseInt(value, 10);
      index += 1;
      continue;
    }

    if (arg === '--output') {
      const value = args[index + 1];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Expected a non-empty value after "--output".');
      }
      outputPath = value.trim();
      index += 1;
      continue;
    }

    if (arg === '--keep-temp') {
      keepTemp = true;
      continue;
    }

    if (arg === '--distribution-mode') {
      const value = args[index + 1];
      if (value !== DEFAULT_DISTRIBUTION_MODE && value !== PLUGIN_ENABLED_DISTRIBUTION_MODE) {
        throw new Error('Expected "--distribution-mode" to be "default" or "plugin-enabled".');
      }
      distributionMode = value;
      index += 1;
      continue;
    }

    if (arg === '--acp-host-verify') {
      includeAcpHostVerify = true;
      continue;
    }

    if (arg === '--acp-execution-verify') {
      includeAcpExecutionVerify = true;
      continue;
    }

    if (arg === '--emit-acp-evidence') {
      const value = args[index + 1];
      if (typeof value !== 'string' || value.trim().length === 0) {
        throw new Error('Expected a non-empty value after "--emit-acp-evidence".');
      }
      emitAcpEvidencePath = value.trim();
      index += 1;
      continue;
    }

    throw new Error(`Unsupported option: ${arg}`);
  }

  if (iterations < 1) {
    throw new Error(`"--iterations" must be >= 1. received=${iterations}`);
  }

  if (modes.length === 0) {
    throw new Error('At least one install mode is required.');
  }

  const dedupedModes = Array.from(new Set(modes));
  for (const mode of dedupedModes) {
    if (!SUPPORTED_MODE_SET.has(mode)) {
      throw new Error(
        `Unsupported install mode "${mode}". expected=${Array.from(SUPPORTED_MODE_SET).join('|')}`,
      );
    }
  }

  if (emitAcpEvidencePath && !includeAcpHostVerify) {
    throw new Error('"--emit-acp-evidence" requires "--acp-host-verify".');
  }

  return {
    modes: dedupedModes,
    iterations,
    outputPath,
    keepTemp,
    includeAcpHostVerify,
    includeAcpExecutionVerify,
    emitAcpEvidencePath,
    distributionMode,
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
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  const durationMs = Date.now() - startedAtMs;

  if (result.error) {
    throw new Error(`${options.label} failed to execute: ${result.error.message}`);
  }

  const exitCode = typeof result.status === 'number' ? result.status : 1;
  const stdout = result.stdout ?? '';
  const stderr = result.stderr ?? '';
  const commandLine = `${command} ${args.join(' ')}`;

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
  return value.replace(/\s+/gu, ' ').trim().slice(0, 500);
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
    if (!parsed || typeof parsed !== 'object') {
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
      if (!parsed || typeof parsed !== 'object') {
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
  if (payload.status !== 'success') {
    throw new Error(`CLI step "${stepId}" returned non-success status: ${String(payload.status)}`);
  }
}

/**
 * Builds runtime env overrides for isolated clean-room runs.
 * @param {string} homePath Isolated HOME path.
 * @returns {NodeJS.ProcessEnv}
 */
function buildIsolatedRuntimeEnv(homePath) {
  const xdgConfigHomePath = resolve(homePath, '.config');
  mkdirSync(xdgConfigHomePath, { recursive: true });

  return {
    ...process.env,
    HOME: homePath,
    USERPROFILE: homePath,
    XDG_CONFIG_HOME: xdgConfigHomePath,
    CI: '1',
  };
}

/**
 * Asserts one actual memory-provider summary against expected string fields.
 * @param {unknown} actualMemoryProvider Actual summary payload.
 * @param {Record<string, string>} expectedMemoryProvider Expected summary fields.
 * @param {string} label Assertion label.
 */
function assertExpectedMemoryProvider(actualMemoryProvider, expectedMemoryProvider, label) {
  if (
    !actualMemoryProvider ||
    typeof actualMemoryProvider !== 'object' ||
    Array.isArray(actualMemoryProvider)
  ) {
    throw new Error(`${label} did not provide a memoryProvider payload.`);
  }

  for (const [fieldName, expectedValue] of Object.entries(expectedMemoryProvider)) {
    if (actualMemoryProvider[fieldName] !== expectedValue) {
      throw new Error(
        `${label} returned memoryProvider.${fieldName}="${String(actualMemoryProvider[fieldName])}", expected "${expectedValue}"`,
      );
    }
  }
}

/**
 * Resolves expected service-host memory-provider summary for one distribution mode.
 * @param {"default" | "plugin-enabled"} distributionMode Selected distribution mode.
 * @returns {Record<string, string>}
 */
function resolveExpectedServiceHostMemoryProvider(distributionMode) {
  if (distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE) {
    return {
      memoryStoreEngine: 'sqlite_fs',
      memoryStoreProvider: '@repo-ai-governor/memory-provider-sqlite-fs',
      memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
      memoryStoreProviderModule: '@repo-ai-governor/memory-provider-sqlite-fs',
      memoryStoreDistributionMode: 'optional',
      memoryStoreResolutionSource: 'plugin_module',
      memoryStoreHostSurface: 'local_orchestration_service',
      memoryStoreRuntimeMode: 'daemon',
    };
  }

  return {
    memoryStoreEngine: 'sqlite_fs',
    memoryStoreProvider: 'SqliteFsMemoryStoreProvider',
    memoryStoreProviderId: 'sqlite-fs',
    memoryStoreDistributionMode: 'default',
    memoryStoreResolutionSource: 'legacy_store_engine',
    memoryStoreHostSurface: 'local_orchestration_service',
    memoryStoreRuntimeMode: 'daemon',
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
    resolve(repositoryPath, 'package.json'),
    `${JSON.stringify(
      {
        name: repositoryName,
        private: true,
        version: '0.0.0',
        type: 'module',
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
}

/**
 * Seeds one minimal repository-local skill tree so installed-package host export/pack commands can
 * generate truthful host artifacts inside clean-room target repositories.
 * @param {string} repositoryPath Absolute repository path.
 */
function seedHostDistributionFixtureRepository(repositoryPath) {
  mkdirSync(resolve(repositoryPath, '.codex', 'skills', 'sample-host-skill'), {
    recursive: true,
  });
  writeFileSync(
    resolve(repositoryPath, 'AGENTS.md'),
    '# Clean-room Host Fixture\n\nThis repository exists for ACP host-facing clean-room verification.\n',
    'utf8',
  );
  writeFileSync(
    resolve(repositoryPath, '.codex', 'skills', 'sample-host-skill', 'SKILL.md'),
    [
      '---',
      'name: sample-host-skill',
      'description: Sample host skill used by ACP clean-room verification.',
      '---',
      '',
      '# Sample Host Skill',
      '',
      'This fixture proves installed-package host export/pack/verify behavior in clean-room repos.',
      '',
    ].join('\n'),
    'utf8',
  );
}

/**
 * Resolves install specifier for one mode.
 * @param {string} mode Install mode.
 * @param {{repositoryRoot: string; tarballPath: string | null}} installAssets Install assets.
 * @returns {string}
 */
function resolveInstallSpecifier(mode, installAssets) {
  if (mode === 'path') {
    return installAssets.repositoryRoot;
  }

  if (mode === 'link') {
    return `link:${installAssets.repositoryRoot}`;
  }

  if (mode === 'tgz') {
    if (!installAssets.tarballPath) {
      throw new Error('tgz mode requested but tarball is unavailable.');
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
  const installResult = runCommand('pnpm', ['add', '--save-exact', installSpecifier], {
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
  const result = runCommand('pnpm', ['exec', PACKAGE_BINARY, ...options.args], {
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
 * Starts the remote-api stub server in a separate child process so sync child commands can reach it.
 * @returns {Promise<{
 *   openAiEndpoint: string;
 *   anthropicEndpoint: string;
 *   close: () => Promise<void>;
 * }>}
 */
async function startRemoteApiSmokeServerProcess() {
  const child = spawn(process.execPath, ['./scripts/release/remote-api-smoke-server.entry.js'], {
    cwd: process.cwd(),
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  let stdoutBuffer = '';
  let stderrBuffer = '';

  const readyPayload = await new Promise((resolvePromise, rejectPromise) => {
    const cleanup = () => {
      child.stdout?.off('data', handleStdout);
      child.stderr?.off('data', handleStderr);
      child.off('exit', handleExit);
      child.off('error', handleError);
    };

    const handleStdout = (chunk) => {
      stdoutBuffer += chunk.toString();
      const newlineIndex = stdoutBuffer.indexOf('\n');
      if (newlineIndex === -1) {
        return;
      }
      const line = stdoutBuffer.slice(0, newlineIndex).trim();
      if (!line) {
        return;
      }
      try {
        const parsed = JSON.parse(line);
        cleanup();
        resolvePromise(parsed);
      } catch (error) {
        cleanup();
        rejectPromise(error);
      }
    };

    const handleStderr = (chunk) => {
      stderrBuffer += chunk.toString();
    };

    const handleExit = (code) => {
      cleanup();
      rejectPromise(
        new Error(
          `Remote API smoke server exited before ready. code=${String(code)} stderr="${stderrBuffer.trim()}"`,
        ),
      );
    };

    const handleError = (error) => {
      cleanup();
      rejectPromise(error);
    };

    child.stdout?.on('data', handleStdout);
    child.stderr?.on('data', handleStderr);
    child.once('exit', handleExit);
    child.once('error', handleError);
  });

  return {
    openAiEndpoint: readyPayload.openAiEndpoint,
    anthropicEndpoint: readyPayload.anthropicEndpoint,
    close: async () => {
      if (child.exitCode !== null) {
        return;
      }
      await new Promise((resolvePromise) => {
        child.once('exit', () => resolvePromise(undefined));
        child.kill('SIGTERM');
      });
    },
  };
}

/**
 * Resolves one diagnostics artifact path from CLI JSON payload.
 * @param {Record<string, unknown>} payload CLI output payload.
 * @param {string} artifactId Artifact id.
 * @param {string} label Human-readable label.
 * @returns {string}
 */
function resolveArtifactPath(payload, artifactId, label) {
  const artifacts = Array.isArray(payload.command_result?.artifacts)
    ? payload.command_result.artifacts
    : [];
  const artifact = artifacts.find((candidate) => candidate?.id === artifactId);
  if (!artifact || typeof artifact.path !== 'string' || artifact.path.trim().length === 0) {
    throw new Error(`${label} did not produce artifact "${artifactId}".`);
  }
  return artifact.path;
}

/**
 * Reads one JSON file and asserts it is parseable.
 * @param {string} filePath Absolute file path.
 * @param {string} label Human-readable label.
 * @returns {Record<string, unknown>}
 */
function readJsonFile(filePath, label) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'));
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${label} is not valid JSON. path=${filePath} detail=${detail}`);
  }
}

/**
 * Ensures one host verification summary ended in pass.
 * @param {string} summaryPath Absolute verification summary path.
 * @param {string} label Human-readable label.
 * @returns {Record<string, unknown>}
 */
function assertHostVerificationPass(summaryPath, label) {
  const summary = readJsonFile(summaryPath, label);
  if (summary.status !== 'pass') {
    throw new Error(
      `${label} expected host verification status=pass. actual=${String(summary.status)}`,
    );
  }
  return summary;
}

/**
 * Asserts one adapter verification payload exposes remote-api transport truth.
 * @param {Record<string, unknown>} verification Adapter verification payload.
 * @param {string} label Human-readable label.
 */
function assertRemoteApiVerificationPayload(verification, label) {
  if (!verification || typeof verification !== 'object') {
    throw new Error(`${label} is missing verification payload.`);
  }

  const tools = Array.isArray(verification.tools) ? verification.tools : [];
  const codex = tools.find((tool) => tool?.toolId === 'codex');
  const claudeCode = tools.find((tool) => tool?.toolId === 'claude-code');
  if (!codex || !claudeCode) {
    throw new Error(`${label} is missing codex/claude-code tool snapshots.`);
  }

  assertRemoteApiToolHealth(codex, {
    label: `${label}/codex`,
    providerKind: 'openai',
    vendorBindingKind: 'openai_responses',
  });
  assertRemoteApiToolHealth(claudeCode, {
    label: `${label}/claude-code`,
    providerKind: 'anthropic',
    vendorBindingKind: 'anthropic_messages',
  });
}

/**
 * Asserts one tool-level health payload.
 * @param {Record<string, unknown>} toolSnapshot Tool snapshot payload.
 * @param {{label: string; providerKind: string; vendorBindingKind: string}} expectations Expectations.
 */
function assertRemoteApiToolHealth(toolSnapshot, expectations) {
  const healthCheck = toolSnapshot.healthCheck;
  if (!healthCheck || typeof healthCheck !== 'object') {
    throw new Error(`${expectations.label} is missing healthCheck payload.`);
  }

  const expectedFields = {
    transportKind: 'remote_api',
    providerKind: expectations.providerKind,
    vendorBindingKind: expectations.vendorBindingKind,
    credentialSource: 'env_explicit',
    endpointSource: 'config_explicit',
  };

  for (const [fieldName, expectedValue] of Object.entries(expectedFields)) {
    if (healthCheck[fieldName] !== expectedValue) {
      throw new Error(
        `${expectations.label} returned healthCheck.${fieldName}="${String(healthCheck[fieldName])}", expected "${expectedValue}"`,
      );
    }
  }
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
    `iteration-${String(options.iteration).padStart(2, '0')}`,
  );
  const repositoryPath = resolve(iterationRoot, 'target-repo');
  const homePath = resolve(iterationRoot, 'home');
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);

  initializeCleanroomRepository(
    repositoryPath,
    `cleanroom-${options.mode}-${String(options.iteration).padStart(2, '0')}`,
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
    args: ['--help'],
    label: `help(${options.mode}/${options.iteration})`,
  });
  steps.push({
    stepId: '--help',
    command: helpStep.command,
    durationMs: helpStep.durationMs,
    outputSample: compactOutput(helpStep.stdout),
  });

  for (const commandName of ['init', 'doctor', 'check']) {
    const commandStep = runCleanroomCliCommand({
      repositoryPath,
      runtimeEnv,
      args: ['--output', 'json', commandName],
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
    status: 'passed',
    repositoryPath,
    homePath,
    install,
    steps,
  };
}

/**
 * Runs one installed-package remote-api doctor/verify rehearsal against a local stub server.
 * @param {{
 *   mode: string;
 *   workingRoot: string;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 * }} options Scenario options.
 * @returns {Promise<Record<string, unknown>>}
 */
async function runRemoteApiSmokeScenario(options) {
  const scenarioRoot = resolve(options.workingRoot, `remote-api-smoke-${options.mode}`);
  const repositoryPath = resolve(scenarioRoot, 'target-repo');
  const homePath = resolve(scenarioRoot, 'home');
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, `cleanroom-remote-api-${options.mode}`);
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });

  const server = await startRemoteApiSmokeServerProcess();
  try {
    const configPath = writeRemoteApiSmokeConfig(repositoryPath, {
      openAiEndpoint: server.openAiEndpoint,
      anthropicEndpoint: server.anthropicEndpoint,
    });
    const scenarioEnv = {
      ...runtimeEnv,
      OPENAI_API_KEY: REMOTE_API_SMOKE_OPENAI_KEY,
      ANTHROPIC_API_KEY: REMOTE_API_SMOKE_ANTHROPIC_KEY,
    };

    const doctorStep = runCleanroomCliCommand({
      repositoryPath,
      runtimeEnv: scenarioEnv,
      args: ['--output', 'json', 'doctor', '--adapters', '--fix'],
      label: `doctor(remote-api/${options.mode})`,
    });
    const doctorPayload = parseJsonOutput(doctorStep.stdout, `doctor(remote-api/${options.mode})`);
    assertCliSuccessPayload(doctorPayload, `doctor(remote-api/${options.mode})`);
    const doctorDiagnosticsPath = resolveArtifactPath(
      doctorPayload,
      'doctor_diagnostics',
      `doctor(remote-api/${options.mode})`,
    );
    const doctorDiagnostics = JSON.parse(readFileSync(doctorDiagnosticsPath, 'utf8'));
    assertRemoteApiVerificationPayload(
      doctorDiagnostics.verification,
      `doctor(remote-api/${options.mode})`,
    );

    const doctorRecheckStep = runCleanroomCliCommand({
      repositoryPath,
      runtimeEnv: scenarioEnv,
      args: ['--output', 'json', 'doctor', '--adapters'],
      label: `doctor-recheck(remote-api/${options.mode})`,
    });
    const doctorRecheckPayload = parseJsonOutput(
      doctorRecheckStep.stdout,
      `doctor-recheck(remote-api/${options.mode})`,
    );
    assertCliSuccessPayload(doctorRecheckPayload, `doctor-recheck(remote-api/${options.mode})`);
    const doctorRecheckDiagnosticsPath = resolveArtifactPath(
      doctorRecheckPayload,
      'doctor_diagnostics',
      `doctor-recheck(remote-api/${options.mode})`,
    );
    const doctorRecheckDiagnostics = JSON.parse(readFileSync(doctorRecheckDiagnosticsPath, 'utf8'));
    assertRemoteApiVerificationPayload(
      doctorRecheckDiagnostics.verification,
      `doctor-recheck(remote-api/${options.mode})`,
    );

    return {
      mode: options.mode,
      status: 'passed',
      repositoryPath,
      configPath,
      install,
      doctor: {
        command: doctorStep.command,
        durationMs: doctorStep.durationMs,
        diagnosticsPath: doctorDiagnosticsPath,
        verificationStatus: doctorDiagnostics.verification?.overallStatus ?? null,
      },
      doctorRecheck: {
        command: doctorRecheckStep.command,
        durationMs: doctorRecheckStep.durationMs,
        diagnosticsPath: doctorRecheckDiagnosticsPath,
        verificationStatus: doctorRecheckDiagnostics.verification?.overallStatus ?? null,
      },
      endpoints: {
        openAi: server.openAiEndpoint,
        anthropic: server.anthropicEndpoint,
      },
    };
  } finally {
    await server.close();
  }
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
  const scenarioRoot = resolve(options.workingRoot, 'readonly-attach-precheck');
  const repositoryPath = resolve(scenarioRoot, 'target-repo');
  const homePath = resolve(scenarioRoot, 'home');
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, 'cleanroom-readonly-attach');
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
    args: ['--output', 'json', 'doctor'],
    label: 'doctor(readonly-attach)',
  });
  const doctorPayload = parseJsonOutput(doctorStep.stdout, 'doctor(readonly-attach)');
  assertCliSuccessPayload(doctorPayload, 'doctor(readonly-attach)');
  const afterDoctorEntries = listTopLevelEntries(repositoryPath);

  const initStep = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ['--output', 'json', 'init'],
    label: 'init(readonly-attach)',
  });
  const initPayload = parseJsonOutput(initStep.stdout, 'init(readonly-attach)');
  assertCliSuccessPayload(initPayload, 'init(readonly-attach)');
  const afterInitEntries = listTopLevelEntries(repositoryPath);

  const doctorDiff = diffEntries(beforeEntries, afterDoctorEntries);
  const initDiff = diffEntries(beforeEntries, afterInitEntries);

  if (doctorDiff.added.length > 0 || doctorDiff.removed.length > 0) {
    throw new Error(
      `doctor precheck wrote to target repository. added=${doctorDiff.added.join('|')} removed=${doctorDiff.removed.join('|')}`,
    );
  }

  if (initDiff.added.length > 0 || initDiff.removed.length > 0) {
    throw new Error(
      `init precheck wrote to target repository under tool_managed mode. added=${initDiff.added.join('|')} removed=${initDiff.removed.join('|')}`,
    );
  }

  return {
    mode: options.mode,
    status: 'passed',
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
  const scenarioRoot = resolve(options.workingRoot, 'workspace-switch-rollback');
  const repositoryPath = resolve(scenarioRoot, 'target-repo');
  const homePath = resolve(scenarioRoot, 'home');
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, 'cleanroom-workspace-switch');
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });

  const defaultInit = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ['--output', 'json', 'init'],
    label: 'init(workspace-switch/default)',
  });
  const defaultInitPayload = parseJsonOutput(defaultInit.stdout, 'init(workspace-switch/default)');
  assertCliSuccessPayload(defaultInitPayload, 'init(workspace-switch/default)');
  const defaultDiagnostics = defaultInitPayload.diagnostics ?? {};
  if (defaultDiagnostics.workspaceMode !== 'tool_managed') {
    throw new Error(
      `Expected tool_managed mode before switch. actual=${String(defaultDiagnostics.workspaceMode)}`,
    );
  }
  const toolManagedRoot = String(defaultDiagnostics.workspaceRoot);
  const toolManagedConfigPath = resolve(toolManagedRoot, 'governor.yaml');
  if (!existsSync(toolManagedConfigPath)) {
    throw new Error(`Missing tool_managed config path after init: ${toolManagedConfigPath}`);
  }

  const repoLocalConfigPath = resolve(repositoryPath, '.repo-ai-governor', 'governor.yaml');
  mkdirSync(dirname(repoLocalConfigPath), { recursive: true });
  writeFileSync(repoLocalConfigPath, DEFAULT_REPO_LOCAL_CONFIG_CONTENT, 'utf8');

  const repoLocalDoctor = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ['--output', 'json', 'doctor'],
    label: 'doctor(workspace-switch/repo-local)',
  });
  const repoLocalDoctorPayload = parseJsonOutput(
    repoLocalDoctor.stdout,
    'doctor(workspace-switch/repo-local)',
  );
  assertCliSuccessPayload(repoLocalDoctorPayload, 'doctor(workspace-switch/repo-local)');
  const repoLocalDiagnostics = repoLocalDoctorPayload.diagnostics ?? {};
  if (repoLocalDiagnostics.workspaceMode !== 'repo_local') {
    throw new Error(
      `Expected repo_local mode after switch. actual=${String(repoLocalDiagnostics.workspaceMode)}`,
    );
  }

  const repoLocalInit = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ['--output', 'json', 'init'],
    label: 'init(workspace-switch/repo-local)',
  });
  const repoLocalInitPayload = parseJsonOutput(
    repoLocalInit.stdout,
    'init(workspace-switch/repo-local)',
  );
  assertCliSuccessPayload(repoLocalInitPayload, 'init(workspace-switch/repo-local)');
  const repoLocalRoot = String(repoLocalInitPayload.diagnostics?.workspaceRoot ?? '');
  if (!repoLocalRoot.endsWith('.repo-ai-governor')) {
    throw new Error(`Unexpected repo_local workspace root: ${repoLocalRoot}`);
  }
  if (!existsSync(repoLocalConfigPath)) {
    throw new Error(`Missing repo_local config path after repo_local init: ${repoLocalConfigPath}`);
  }

  unlinkSync(repoLocalConfigPath);

  const rollbackDoctor = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ['--output', 'json', 'doctor'],
    label: 'doctor(workspace-switch/rollback)',
  });
  const rollbackDoctorPayload = parseJsonOutput(
    rollbackDoctor.stdout,
    'doctor(workspace-switch/rollback)',
  );
  assertCliSuccessPayload(rollbackDoctorPayload, 'doctor(workspace-switch/rollback)');
  const rollbackDiagnostics = rollbackDoctorPayload.diagnostics ?? {};
  if (rollbackDiagnostics.workspaceMode !== 'tool_managed') {
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
    status: 'passed',
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
 * Runs one plugin-enabled memory-provider scenario in clean-room install.
 * @param {{
 *   mode: string;
 *   workingRoot: string;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 * }} options Scenario options.
 * @returns {Record<string, unknown>}
 */
function runPluginEnabledMemoryProviderScenario(options) {
  const scenarioRoot = resolve(options.workingRoot, `plugin-memory-${options.mode}`);
  const repositoryPath = resolve(scenarioRoot, 'target-repo');
  const homePath = resolve(scenarioRoot, 'home');
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, `cleanroom-plugin-memory-${options.mode}`);
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });

  const repoLocalConfigPath = resolve(repositoryPath, '.repo-ai-governor', 'governor.yaml');
  mkdirSync(dirname(repoLocalConfigPath), { recursive: true });
  writeFileSync(
    repoLocalConfigPath,
    [
      'schemaVersion: "1.1"',
      'workspace:',
      '  mode: repo_local',
      '  migrationPolicy: copy_verify_switch_rollback',
      'i18n:',
      '  runtimeEngine: i18next',
      '  defaultLocale: zh-CN',
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - zh-CN',
      '    - en-US',
      'memory:',
      '  storeEngine: sqlite_fs',
      '  storeRoot: context/memory/plugin-sqlite',
      '  provider:',
      '    module: "@repo-ai-governor/memory-provider-sqlite-fs"',
      '    exportName: "createMemoryStoreProvider"',
      '',
    ].join('\n'),
    'utf8',
  );

  const initStep = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ['--output', 'json', 'init'],
    label: `init(plugin-memory/${options.mode})`,
  });
  const initPayload = parseJsonOutput(initStep.stdout, `init(plugin-memory/${options.mode})`);
  assertCliSuccessPayload(initPayload, `init(plugin-memory/${options.mode})`);

  const checkStep = runCleanroomCliCommand({
    repositoryPath,
    runtimeEnv,
    args: ['--output', 'json', 'check'],
    label: `check(plugin-memory/${options.mode})`,
  });
  const checkPayload = parseJsonOutput(checkStep.stdout, `check(plugin-memory/${options.mode})`);
  assertCliSuccessPayload(checkPayload, `check(plugin-memory/${options.mode})`);

  const initDiagnostics =
    initPayload.diagnostics && typeof initPayload.diagnostics === 'object'
      ? initPayload.diagnostics
      : {};
  if (initDiagnostics.memoryStoreResolutionSource !== 'plugin_module') {
    throw new Error(
      `Expected plugin_module memory resolution in clean-room plugin scenario. actual=${String(initDiagnostics.memoryStoreResolutionSource)}`,
    );
  }
  if (initDiagnostics.memoryStoreProviderModule !== '@repo-ai-governor/memory-provider-sqlite-fs') {
    throw new Error(
      `Expected sqlite plugin module diagnostics in clean-room plugin scenario. actual=${String(initDiagnostics.memoryStoreProviderModule)}`,
    );
  }

  return {
    mode: options.mode,
    status: 'passed',
    repositoryPath,
    install,
    init: {
      command: initStep.command,
      durationMs: initStep.durationMs,
      diagnostics: initPayload.diagnostics ?? null,
    },
    check: {
      command: checkStep.command,
      durationMs: checkStep.durationMs,
      diagnostics: checkPayload.diagnostics ?? null,
      commandResult: checkPayload.command_result ?? null,
    },
  };
}

/**
 * Builds one clean-room script that validates service-host memory-provider reuse through the installed package.
 * @param {"default" | "plugin-enabled"} distributionMode Selected distribution mode.
 * @returns {string}
 */
function createServiceHostMemoryProviderCheckScript(distributionMode) {
  const memoryConfigSource =
    distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE
      ? `{
  storeEngine: "sqlite_fs",
  storeRoot: "context/memory/service-host-plugin",
  provider: {
    module: "@repo-ai-governor/memory-provider-sqlite-fs",
    exportName: "createMemoryStoreProvider",
  },
}`
      : `{
  storeEngine: "sqlite_fs",
  storeRoot: "context/memory/service-host-default",
}`;

  return [
    'import { resolve } from "node:path";',
    'import {',
    '  LocalOrchestrationServiceSidecarClient,',
    '  OrchestrationClientSurface,',
    '  OrchestrationExecutionKind,',
    `} from "${PUBLISHED_PACKAGE_NAME}/service-host";`,
    '',
    'const repositoryPath = process.cwd();',
    "const workspaceRoot = resolve(repositoryPath, '.repo-ai-governor');",
    `const memoryConfig = ${memoryConfigSource};`,
    'const runtime = new LocalOrchestrationServiceSidecarClient(workspaceRoot, {',
    '  memoryConfig,',
    '});',
    '',
    'try {',
    '  const health = await runtime.getHealth();',
    '  const started = await runtime.startExecution(',
    '    {',
    '      workspaceId: "cleanroom-service-host",',
    '      workspaceRoot,',
    '      executionKind: OrchestrationExecutionKind.RUN,',
    '      clientSurface: OrchestrationClientSurface.DESKTOP,',
    '    },',
    '    {',
    '      processId: "cleanroom-service-host-process",',
    `      executionId: "cleanroom-service-host-${distributionMode}",`,
    `      executionSessionId: "cleanroom-service-host-session-${distributionMode}",`,
    '    },',
    '  );',
    '  const summary = await runtime.getExecution(started.executionId);',
    '  const listed = await runtime.listExecutions({',
    '    filter: {',
    '      workspaceId: "cleanroom-service-host",',
    '    },',
    '  });',
    '  console.log(',
    '    JSON.stringify({',
    '      health,',
    '      started,',
    '      summary,',
    '      listed,',
    '    }),',
    '  );',
    '} finally {',
    '  await runtime.dispose();',
    '}',
    '',
  ].join('\n');
}

/**
 * Builds one clean-room script that verifies ACP execution through the installed package by
 * exercising invoke/stream/confirmation/cancel semantics from the packaged runtime.
 * @returns {string}
 */
function createAcpExecutionCheckScript() {
  return [
    'import { createRequire } from "node:module";',
    'import { dirname, resolve } from "node:path";',
    'import { pathToFileURL } from "node:url";',
    '',
    'const require = createRequire(import.meta.url);',
    'const packageJsonPath = require.resolve("repo-ai-governor/package.json");',
    'const packageRoot = dirname(packageJsonPath);',
    '/* dynamic-import-allowed: the clean-room harness must load the installed package dist output by resolved file path so it validates packaged runtime behavior instead of the source workspace. */',
    'const importInstalledModule = async (relativePath) =>',
    '  await import(pathToFileURL(resolve(packageRoot, relativePath)).href);',
    'const assert = (condition, message) => {',
    '  if (!condition) {',
    '    throw new Error(message);',
    '  }',
    '};',
    '',
    'const { CliAdapterRoutingRuntime } = await importInstalledModule(',
    '  "dist/apps/cli/src/runtime/adapter-routing-runtime.js",',
    ');',
    'const { CliAcpSessionRuntime } = await importInstalledModule(',
    '  "dist/apps/cli/src/runtime/cli-acp-session-runtime.js",',
    ');',
    'const { CliAcpPromptTurnRuntime } = await importInstalledModule(',
    '  "dist/apps/cli/src/runtime/cli-acp-prompt-turn-runtime.js",',
    ');',
    'const { CliAcpTransportClientRuntime } = await importInstalledModule(',
    '  "dist/apps/cli/src/runtime/cli-acp-transport-client-runtime.js",',
    ');',
    'const { CliAcpHostOperationRuntime } = await importInstalledModule(',
    '  "dist/apps/cli/src/runtime/cli-acp-host-operation-runtime.js",',
    ');',
    '',
    'const ACP_LOCALIZE_TEXT = (_english, chinese) => chinese;',
    '',
    'const createStreamRequest = (input, overrides = {}) => ({',
    '  processId: overrides.processId ?? "process-acp-001",',
    '  executionId: overrides.executionId ?? "execution-acp-001",',
    '  stageId: overrides.stageId ?? "stage-acp-001",',
    '  routeKey: overrides.routeKey ?? "session.main",',
    '  input,',
    '});',
    '',
    'const createConfirmationRequest = (overrides = {}, metadata) => ({',
    '  processId: overrides.processId ?? "process-acp-001",',
    '  executionId: overrides.executionId ?? "execution-acp-001",',
    '  stageId: overrides.stageId ?? "stage-acp-001",',
    '  routeKey: overrides.routeKey ?? "session.main",',
    '  prompt: "Confirm this ACP tool call.",',
    '  ...(metadata ? { metadata } : {}),',
    '});',
    '',
    'const collectStreamEvents = async (runtime, request) => {',
    '  const events = [];',
    '  for await (const event of runtime.streamEvents(request)) {',
    '    events.push(event);',
    '  }',
    '  return events;',
    '};',
    '',
    'const createPromptTurnHarness = () => {',
    '  const sessionRuntime = new CliAcpSessionRuntime();',
    '  const transportClientRuntime = new CliAcpTransportClientRuntime({',
    '    forgetInvocationState: (invocationState) =>',
    '      sessionRuntime.forgetInvocationState(invocationState),',
    '  });',
    '  const promptTurnRuntime = new CliAcpPromptTurnRuntime({',
    '    surfaceId: "codex",',
    '    localizeText: ACP_LOCALIZE_TEXT,',
    '    sessionRuntime,',
    '    transportClientRuntime,',
    '  });',
    '  const hostOperationRuntime = new CliAcpHostOperationRuntime({',
    '    surfaceId: "codex",',
    '    localizeText: ACP_LOCALIZE_TEXT,',
    '    sessionRuntime,',
    '    transportClientRuntime,',
    '  });',
    '  return {',
    '    sessionRuntime,',
    '    promptTurnRuntime,',
    '    hostOperationRuntime,',
    '  };',
    '};',
    '',
    'const routingRuntime = new CliAdapterRoutingRuntime(',
    '  {',
    '    roles: [',
    '      {',
    '        roleId: "reviewer",',
    '        roleProfileId: "reviewer-default",',
    '        requiredCapabilities: [],',
    '        required: true,',
    '      },',
    '    ],',
    '    routing: {',
    '      roleBindings: {',
    '        reviewer: {',
    '          primarySurface: "codex",',
    '        },',
    '      },',
    '    },',
    '    tools: [',
    '      {',
    '        toolId: "codex",',
    '        enabled: true,',
    '        availability: "available",',
    '        transport: "acp_exec",',
    '      },',
    '    ],',
    '  },',
    '  {',
    '    localizeText: ACP_LOCALIZE_TEXT,',
    '  },',
    ');',
    'const protocolBySurface = routingRuntime.createProtocolBySurface(',
    '  routingRuntime.createToolConfigBySurfaceMap(),',
    ');',
    'const routedInvokeResult = await protocolBySurface.codex.invokeStage({',
    '  processId: "process-001",',
    '  executionId: "execution-001",',
    '  stageId: "stage-001",',
    '  routeKey: "session.main",',
    '  input: {',
    '    prompt: "通过 ACP bridge 执行一次 prompt turn。",',
    '  },',
    '});',
    'assert(',
    '  routedInvokeResult.output.responseText === "ACP（codex）：通过 ACP bridge 执行一次 prompt turn。",',
    '  "ACP clean-room routed invoke result did not preserve the expected response text.",',
    ');',
    'assert(',
    '  routedInvokeResult.output.acpSessionId ===',
    '    "codex::process-001::execution-001::stage-001::acp-session",',
    '  "ACP clean-room routed invoke result did not preserve the expected session id.",',
    ');',
    '',
    'const toolHarness = createPromptTurnHarness();',
    'const toolRequest = createStreamRequest({',
    '  prompt: "Run ACP terminal and filesystem bridge operations.",',
    '  acpCapabilities: {',
    '    terminal: true,',
    '    fsReadTextFile: true,',
    '  },',
    '  toolCalls: [',
    '    {',
    '      toolCallId: "tool-call-terminal-001",',
    '      toolName: "terminal/create",',
    '      terminalId: "terminal-001",',
    '      detail: "Create the ACP terminal session.",',
    '    },',
    '    {',
    '      toolCallId: "tool-call-fs-001",',
    '      toolName: "fs/read_text_file",',
    '      detail: "Read one governed file through ACP.",',
    '    },',
    '  ],',
    '});',
    'const toolInvokeResult = await toolHarness.promptTurnRuntime.invokeStage(toolRequest);',
    'const toolEvents = await collectStreamEvents(toolHarness.promptTurnRuntime, toolRequest);',
    'const toolState = toolHarness.sessionRuntime.ensureInvocationState("codex", toolRequest);',
    'assert(',
    '  JSON.stringify(toolEvents.map((event) => event.eventType)) ===',
    '    JSON.stringify(["status", "tool_call", "tool_call", "token", "completed"]),',
    '  "ACP clean-room bridge events did not preserve the expected tool-call replay sequence.",',
    ');',
    'assert(',
    '  JSON.stringify(',
    '    toolEvents',
    '      .filter((event) => event.eventType === "tool_call")',
    '      .map((event) => event.payload.toolName),',
    '  ) === JSON.stringify(["terminal/create", "fs/read_text_file"]),',
    '  "ACP clean-room bridge events did not preserve the expected tool names.",',
    ');',
    'assert(',
    '  JSON.stringify(toolState.terminalIds) === JSON.stringify(["terminal-001"]),',
    '  "ACP clean-room bridge state did not preserve the tracked terminal ids.",',
    ');',
    '',
    'const permissionHarness = createPromptTurnHarness();',
    'const permissionRequest = createStreamRequest({',
    '  prompt: "Bridge this ACP confirmation request through active tool-call metadata.",',
    '  toolCalls: [',
    '    {',
    '      toolCallId: "tool-call-001",',
    '      toolName: "approval/request",',
    '      detail: "Bridge approval metadata onto the live ACP turn.",',
    '      requiredCapabilities: [],',
    '    },',
    '  ],',
    '});',
    'const permissionInvokePromise = permissionHarness.promptTurnRuntime.invokeStage(',
    '  permissionRequest,',
    ');',
    'let permissionState = permissionHarness.sessionRuntime.ensureInvocationState(',
    '  "codex",',
    '  permissionRequest,',
    ');',
    'for (',
    '  let attempt = 0;',
    '  attempt < 5 && !permissionState.emittedToolCallIds.includes("tool-call-001");',
    '  attempt += 1',
    ') {',
    '  await Promise.resolve();',
    '  permissionState = permissionHarness.sessionRuntime.ensureInvocationState(',
    '    "codex",',
    '    permissionRequest,',
    '  );',
    '}',
    'const confirmationResult = await permissionHarness.hostOperationRuntime.requestConfirmation(',
    '  createConfirmationRequest({}, {',
    '    acpPermissionRequestId: "permission-001",',
    '    toolCallId: "tool-call-001",',
    '    allowedDecisions: ["approve", "reject"],',
    '    decision: "approve",',
    '    constraints: ["workspace.write"],',
    '    reason: "Approved from the active ACP permission bridge.",',
    '  }),',
    ');',
    'await permissionInvokePromise;',
    'assert(',
    '  confirmationResult.decision === "approve",',
    '  "ACP clean-room confirmation bridge did not preserve the approved decision.",',
    ');',
    'assert(',
    '  JSON.stringify(permissionState.permissionRequestIds) === JSON.stringify(["permission-001"]),',
    '  "ACP clean-room confirmation bridge did not persist the tracked permission request id.",',
    ');',
    '',
    'const cancelHarness = createPromptTurnHarness();',
    'const cancelRequest = createStreamRequest({',
    '  prompt: "Cancel one ACP terminal bridge turn after the tool call starts.",',
    '  acpCapabilities: {',
    '    terminal: true,',
    '  },',
    '  toolCalls: [',
    '    {',
    '      toolCallId: "tool-call-terminal-002",',
    '      toolName: "terminal/create",',
    '      terminalId: "terminal-002",',
    '      detail: "Create the cancellable ACP terminal session.",',
    '    },',
    '  ],',
    '});',
    'const cancelInvokePromise = cancelHarness.promptTurnRuntime.invokeStage(cancelRequest);',
    'let cancelState = cancelHarness.sessionRuntime.ensureInvocationState("codex", cancelRequest);',
    'for (let attempt = 0; attempt < 5 && cancelState.terminalIds.length === 0; attempt += 1) {',
    '  await Promise.resolve();',
    '  cancelState = cancelHarness.sessionRuntime.ensureInvocationState("codex", cancelRequest);',
    '}',
    'const cancelAcknowledgement = await cancelHarness.hostOperationRuntime.cancel({',
    '  processId: cancelRequest.processId,',
    '  executionId: cancelRequest.executionId,',
    '  stageId: cancelRequest.stageId,',
    '  routeKey: cancelRequest.routeKey,',
    '  scope: "stage",',
    '  reason: "user_requested",',
    '});',
    'let cancelFailure = null;',
    'try {',
    '  await cancelInvokePromise;',
    '} catch (error) {',
    '  cancelFailure = {',
    '    code: error?.code ?? null,',
    '    message: error?.message ?? String(error),',
    '  };',
    '}',
    'const cancelEvents = await collectStreamEvents(cancelHarness.promptTurnRuntime, cancelRequest);',
    'assert(',
    '  cancelAcknowledgement.acknowledged === true,',
    '  "ACP clean-room cancellation bridge did not acknowledge the live turn cancellation.",',
    ');',
    'assert(',
    '  cancelFailure?.code === "PROCESS_RUNTIME_CANCELLED",',
    '  "ACP clean-room cancellation bridge did not surface the expected cancellation code.",',
    ');',
    'assert(',
    '  JSON.stringify(cancelState.terminalIds) === JSON.stringify([]),',
    '  "ACP clean-room cancellation bridge did not clear tracked terminal ids.",',
    ');',
    'assert(',
    '  JSON.stringify(cancelEvents.map((event) => event.eventType)) ===',
    '    JSON.stringify(["status", "tool_call", "failed"]),',
    '  "ACP clean-room cancellation bridge did not preserve the expected failed replay sequence.",',
    ');',
    '',
    'console.log(',
    '  JSON.stringify({',
    '    status: "passed",',
    '    routeInvoke: {',
    '      responseText: routedInvokeResult.output.responseText,',
    '      acpSessionId: routedInvokeResult.output.acpSessionId,',
    '      acpInvocationKey: routedInvokeResult.output.acpInvocationKey,',
    '    },',
    '    toolBridge: {',
    '      responseText: toolInvokeResult.output.responseText,',
    '      eventTypes: toolEvents.map((event) => event.eventType),',
    '      toolNames: toolEvents',
    '        .filter((event) => event.eventType === "tool_call")',
    '        .map((event) => event.payload.toolName),',
    '      terminalIds: [...toolState.terminalIds],',
    '    },',
    '    permissionBridge: {',
    '      decision: confirmationResult.decision,',
    '      reason: confirmationResult.reason,',
    '      permissionRequestIds: [...permissionState.permissionRequestIds],',
    '      emittedToolCallIds: [...permissionState.emittedToolCallIds],',
    '    },',
    '    cancellation: {',
    '      acknowledged: cancelAcknowledgement.acknowledged,',
    '      failureCode: cancelFailure?.code ?? null,',
    '      eventTypes: cancelEvents.map((event) => event.eventType),',
    '      terminalIdsAfterCancel: [...cancelState.terminalIds],',
    '    },',
    '  }),',
    ');',
    '',
  ].join('\n');
}

/**
 * Executes clean-room installed-package host export/pack/verify across ACP-capable surfaces and
 * captures a machine-readable evidence packet per mode.
 * @param {{
 *   mode: string;
 *   workingRoot: string;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 * }} options Scenario options.
 * @returns {Record<string, unknown>}
 */
function runAcpHostTransportScenario(options) {
  const scenarioRoot = resolve(options.workingRoot, `acp-host-transport-${options.mode}`);
  const repositoryPath = resolve(scenarioRoot, 'target-repo');
  const homePath = resolve(scenarioRoot, 'home');
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, `cleanroom-acp-host-transport-${options.mode}`);
  seedHostDistributionFixtureRepository(repositoryPath);
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });

  const surfaces = ACP_HOST_TRANSPORT_SCENARIOS.map((scenario) => {
    const runtimeLabel = `host-export(acp/${scenario.surfaceId}/${options.mode})`;
    const runtimeStep = runCleanroomCliCommand({
      repositoryPath,
      runtimeEnv,
      args: ['--output', 'json', ...scenario.runtimeArgs],
      label: runtimeLabel,
    });
    const runtimePayload = parseJsonOutput(runtimeStep.stdout, runtimeLabel);
    assertCliSuccessPayload(runtimePayload, runtimeLabel);
    const runtimeManifestPath = resolveArtifactPath(
      runtimePayload,
      'host_export_manifest',
      runtimeLabel,
    );
    const runtimeSummaryPath = resolveArtifactPath(
      runtimePayload,
      'host_verification_summary',
      runtimeLabel,
    );
    assertHostVerificationPass(runtimeSummaryPath, `${runtimeLabel}/summary`);

    const runtimeVerifyLabel = `host-verify(acp/${scenario.surfaceId}/${options.mode}/runtime)`;
    const runtimeVerifyStep = runCleanroomCliCommand({
      repositoryPath,
      runtimeEnv,
      args: ['--output', 'json', 'host', 'verify', '--manifest', runtimeManifestPath],
      label: runtimeVerifyLabel,
    });
    const runtimeVerifyPayload = parseJsonOutput(runtimeVerifyStep.stdout, runtimeVerifyLabel);
    assertCliSuccessPayload(runtimeVerifyPayload, runtimeVerifyLabel);
    const runtimeVerifiedSummaryPath = resolveArtifactPath(
      runtimeVerifyPayload,
      'host_verification_summary',
      runtimeVerifyLabel,
    );
    assertHostVerificationPass(runtimeVerifiedSummaryPath, `${runtimeVerifyLabel}/summary`);

    const distributionLabel = `host-pack(acp/${scenario.surfaceId}/${options.mode})`;
    const distributionStep = runCleanroomCliCommand({
      repositoryPath,
      runtimeEnv,
      args: ['--output', 'json', ...scenario.distributionArgs],
      label: distributionLabel,
    });
    const distributionPayload = parseJsonOutput(distributionStep.stdout, distributionLabel);
    assertCliSuccessPayload(distributionPayload, distributionLabel);
    const distributionManifestPath = resolveArtifactPath(
      distributionPayload,
      'host_export_manifest',
      distributionLabel,
    );
    const distributionSummaryPath = resolveArtifactPath(
      distributionPayload,
      'host_verification_summary',
      distributionLabel,
    );
    assertHostVerificationPass(distributionSummaryPath, `${distributionLabel}/summary`);

    const distributionVerifyLabel = `host-verify(acp/${scenario.surfaceId}/${options.mode}/distribution)`;
    const distributionVerifyStep = runCleanroomCliCommand({
      repositoryPath,
      runtimeEnv,
      args: ['--output', 'json', 'host', 'verify', '--manifest', distributionManifestPath],
      label: distributionVerifyLabel,
    });
    const distributionVerifyPayload = parseJsonOutput(
      distributionVerifyStep.stdout,
      distributionVerifyLabel,
    );
    assertCliSuccessPayload(distributionVerifyPayload, distributionVerifyLabel);
    const distributionVerifiedSummaryPath = resolveArtifactPath(
      distributionVerifyPayload,
      'host_verification_summary',
      distributionVerifyLabel,
    );
    assertHostVerificationPass(
      distributionVerifiedSummaryPath,
      `${distributionVerifyLabel}/summary`,
    );

    return {
      surfaceId: scenario.surfaceId,
      runtimeService: {
        exportCommand: runtimeStep.command,
        exportDurationMs: runtimeStep.durationMs,
        verifyCommand: runtimeVerifyStep.command,
        verifyDurationMs: runtimeVerifyStep.durationMs,
        exportManifestPath: runtimeManifestPath,
        verificationSummaryPath: runtimeVerifiedSummaryPath,
        status: 'pass',
      },
      packagedDistribution: {
        packCommand: distributionStep.command,
        packDurationMs: distributionStep.durationMs,
        verifyCommand: distributionVerifyStep.command,
        verifyDurationMs: distributionVerifyStep.durationMs,
        exportManifestPath: distributionManifestPath,
        verificationSummaryPath: distributionVerifiedSummaryPath,
        status: 'pass',
      },
    };
  });

  return {
    mode: options.mode,
    status: 'passed',
    repositoryPath,
    install,
    surfaces,
  };
}

/**
 * Executes one clean-room ACP execution harness against the installed package and records the
 * invoke/stream/confirm/cancel boundary through the packaged runtime.
 * @param {{
 *   mode: string;
 *   workingRoot: string;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 * }} options Scenario options.
 * @returns {Record<string, unknown>}
 */
function runAcpExecutionScenario(options) {
  const scenarioRoot = resolve(options.workingRoot, `acp-execution-${options.mode}`);
  const repositoryPath = resolve(scenarioRoot, 'target-repo');
  const homePath = resolve(scenarioRoot, 'home');
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, `cleanroom-acp-execution-${options.mode}`);
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });
  const scriptRelativePath = 'verify-acp-execution.mjs';
  const scriptPath = resolve(repositoryPath, scriptRelativePath);
  writeFileSync(scriptPath, createAcpExecutionCheckScript(), 'utf8');

  const executionStep = runCommand(process.execPath, [scriptRelativePath], {
    cwd: repositoryPath,
    env: runtimeEnv,
    label: `acp-execution(${options.mode})`,
  });
  const payload = parseJsonOutput(executionStep.stdout, `acp-execution(${options.mode})`);
  if (payload.status !== 'passed') {
    throw new Error(
      `ACP clean-room execution scenario for mode=${options.mode} returned status=${String(payload.status)}.`,
    );
  }

  return {
    mode: options.mode,
    status: 'passed',
    repositoryPath,
    install,
    executionCommand: executionStep.command,
    executionDurationMs: executionStep.durationMs,
    summary: payload,
  };
}

/**
 * Writes one aggregated ACP clean-room evidence summary for runtime consumption.
 * @param {{
 *   outputPath: string;
 *   sourceReportPath: string;
 *   overallStatus: "passed" | "failed";
 *   distributionMode: "default" | "plugin-enabled";
 *   scenarios: Array<Record<string, unknown>>;
 * }} options Summary options.
 */
function writeAcpCleanroomEvidenceSummary(options) {
  /** @type {Map<string, {
   *   surfaceId: string;
   *   status: "pass";
   *   verifiedModes: string[];
   *   runtimeServiceVerificationSummaryPaths: string[];
   *   packagedDistributionVerificationSummaryPaths: string[];
   * }>} */
  const summaryBySurface = new Map();

  for (const scenario of options.scenarios) {
    const mode = typeof scenario.mode === 'string' ? scenario.mode : null;
    const surfaces = Array.isArray(scenario.surfaces) ? scenario.surfaces : [];
    for (const surface of surfaces) {
      const surfaceId = typeof surface.surfaceId === 'string' ? surface.surfaceId : null;
      if (!surfaceId || !mode) {
        continue;
      }
      const current = summaryBySurface.get(surfaceId) ?? {
        surfaceId,
        status: 'pass',
        verifiedModes: [],
        runtimeServiceVerificationSummaryPaths: [],
        packagedDistributionVerificationSummaryPaths: [],
      };
      current.verifiedModes.push(mode);
      if (typeof surface.runtimeService?.verificationSummaryPath === 'string') {
        current.runtimeServiceVerificationSummaryPaths.push(
          persistAcpCleanroomReceipt({
            summaryOutputPath: options.outputPath,
            surfaceId,
            mode,
            receiptKind: 'runtime-service',
            sourcePath: surface.runtimeService.verificationSummaryPath,
          }),
        );
      }
      if (typeof surface.packagedDistribution?.verificationSummaryPath === 'string') {
        current.packagedDistributionVerificationSummaryPaths.push(
          persistAcpCleanroomReceipt({
            summaryOutputPath: options.outputPath,
            surfaceId,
            mode,
            receiptKind: 'packaged-distribution',
            sourcePath: surface.packagedDistribution.verificationSummaryPath,
          }),
        );
      }
      summaryBySurface.set(surfaceId, current);
    }
  }

  const payload = {
    schemaVersion: ACP_CLEANROOM_VERIFICATION_SCHEMA_VERSION,
    overallStatus: options.overallStatus,
    verifiedAt: new Date().toISOString(),
    sourceReportPath: toPortableWorkspacePath(options.sourceReportPath),
    distributionMode: options.distributionMode,
    surfaces: Array.from(summaryBySurface.values())
      .map((surface) => ({
        ...surface,
        verifiedModes: Array.from(new Set(surface.verifiedModes)).sort(),
        runtimeServiceVerificationSummaryPaths: Array.from(
          new Set(surface.runtimeServiceVerificationSummaryPaths),
        ).sort(),
        packagedDistributionVerificationSummaryPaths: Array.from(
          new Set(surface.packagedDistributionVerificationSummaryPaths),
        ).sort(),
      }))
      .sort((left, right) => left.surfaceId.localeCompare(right.surfaceId)),
  };

  writeReport(options.outputPath, payload);
}

/**
 * Copies one ACP clean-room receipt into a workspace-owned durable path before temp cleanup.
 * @param {{
 *   summaryOutputPath: string;
 *   surfaceId: string;
 *   mode: string;
 *   receiptKind: "runtime-service" | "packaged-distribution";
 *   sourcePath: string;
 * }} options Receipt copy options.
 * @returns {string}
 */
function persistAcpCleanroomReceipt(options) {
  const sourcePath = resolve(process.cwd(), options.sourcePath);
  if (!existsSync(sourcePath)) {
    throw new Error(`ACP clean-room receipt missing: ${sourcePath}`);
  }

  const summaryOutputAbsolutePath = resolve(process.cwd(), options.summaryOutputPath);
  const receiptDirectory = resolve(
    dirname(summaryOutputAbsolutePath),
    ACP_CLEANROOM_VERIFICATION_RECEIPTS_DIRECTORY,
    sanitizeReceiptPathSegment(options.surfaceId),
    options.receiptKind,
  );
  mkdirSync(receiptDirectory, { recursive: true });

  const targetPath = resolve(
    receiptDirectory,
    `${sanitizeReceiptPathSegment(options.mode)}.host-verification.summary.json`,
  );
  const receiptPayload = JSON.parse(readFileSync(sourcePath, 'utf8'));
  const provenanceRoot = resolve(
    dirname(summaryOutputAbsolutePath),
    ACP_CLEANROOM_VERIFICATION_PROVENANCE_DIRECTORY,
    sanitizeReceiptPathSegment(options.surfaceId),
    options.receiptKind,
    sanitizeReceiptPathSegment(options.mode),
  );
  const receiptPathRewrites = persistTrackedReceiptProvenance({
    receiptPayload,
    provenanceRoot,
  });
  const portableReceiptPayload = sanitizeTrackedReceiptPayload(receiptPayload, receiptPathRewrites);
  assertTrackedReceiptPayloadPathsExist(portableReceiptPayload, targetPath);
  writeFileSync(targetPath, `${JSON.stringify(portableReceiptPayload, null, 2)}\n`, 'utf8');
  formatRepoJsonReportIfNeeded(targetPath);
  return toPortableRelativePath(dirname(summaryOutputAbsolutePath), targetPath);
}

/**
 * Sanitizes one filesystem path segment for durable ACP receipt storage.
 * @param {string} value Raw segment value.
 * @returns {string}
 */
function sanitizeReceiptPathSegment(value) {
  const sanitized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/gu, '-')
    .replace(/^-+|-+$/gu, '');
  return sanitized.length > 0 ? sanitized : 'unknown';
}

/**
 * Converts one filesystem path into a portable relative path string for tracked JSON evidence.
 * @param {string} fromDirectory Base directory for relative emission.
 * @param {string} targetPath Target file path.
 * @returns {string}
 */
function toPortableRelativePath(fromDirectory, targetPath) {
  return relative(fromDirectory, targetPath).split(sep).join('/');
}

/**
 * Converts one workspace-owned path into a portable repo-relative JSON value when possible.
 * @param {string} pathValue Raw path value.
 * @returns {string}
 */
function toPortableWorkspacePath(pathValue) {
  const workspaceRoot = resolve(process.cwd());
  const absolutePath = resolve(workspaceRoot, pathValue);
  const workspaceRelativePath = relative(workspaceRoot, absolutePath);
  if (
    workspaceRelativePath.length === 0 ||
    workspaceRelativePath.startsWith('..') ||
    isAbsolute(workspaceRelativePath)
  ) {
    return pathValue.replaceAll('\\', '/');
  }
  return workspaceRelativePath.split(sep).join('/');
}

/**
 * Recursively sanitizes one copied receipt payload so tracked evidence does not retain temp-root paths.
 * @param {unknown} value Raw JSON payload fragment.
 * @param {{from: string; to: string}[]} receiptPathRewrites Path rewrite rules.
 * @returns {unknown}
 */
export function sanitizeTrackedReceiptPayload(value, receiptPathRewrites) {
  if (Array.isArray(value)) {
    return value.map((entry) => sanitizeTrackedReceiptPayload(entry, receiptPathRewrites));
  }
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value).map(([key, entry]) => [
        key,
        sanitizeTrackedReceiptPayload(entry, receiptPathRewrites),
      ]),
    );
  }
  if (typeof value === 'string') {
    return sanitizeTrackedReceiptString(value, receiptPathRewrites);
  }
  return value;
}

/**
 * Rewrites temp-root absolute paths embedded in tracked receipt JSON into portable repo-relative strings.
 * @param {string} value Raw string value.
 * @param {{from: string; to: string}[]} receiptPathRewrites Path rewrite rules.
 * @returns {string}
 */
function sanitizeTrackedReceiptString(value, receiptPathRewrites) {
  const normalizedValue = value.replaceAll('\\', '/');
  let rewrittenValue = normalizedValue;
  for (const rewrite of receiptPathRewrites) {
    rewrittenValue = rewrittenValue.replaceAll(rewrite.from, rewrite.to);
  }
  return rewrittenValue;
}

/**
 * Copies one receipt's source provenance files into a workspace-owned durable snapshot and returns
 * the rewrite rules needed to retarget tracked receipt JSON onto that snapshot.
 * @param {{
 *   receiptPayload: unknown;
 *   provenanceRoot: string;
 * }} options Provenance persistence options.
 * @returns {{from: string; to: string}[]}
 */
export function persistTrackedReceiptProvenance(options) {
  const provenanceRoot = options.provenanceRoot;
  mkdirSync(provenanceRoot, { recursive: true });
  const provenanceRootRelativePath = toPortableWorkspacePath(provenanceRoot);
  const discoveredAbsolutePaths = new Set(
    collectTrackedReceiptAbsolutePaths(options.receiptPayload),
  );
  const pendingAbsolutePaths = Array.from(discoveredAbsolutePaths);

  for (let index = 0; index < pendingAbsolutePaths.length; index += 1) {
    const absolutePath = pendingAbsolutePaths[index];
    if (!absolutePath.endsWith('.json')) {
      continue;
    }

    for (const nestedPath of collectTrackedAbsolutePathsFromJsonFile(absolutePath)) {
      if (discoveredAbsolutePaths.has(nestedPath)) {
        continue;
      }
      discoveredAbsolutePaths.add(nestedPath);
      pendingAbsolutePaths.push(nestedPath);
    }
  }

  const pathRewriteMap = new Map();
  for (const absolutePath of discoveredAbsolutePaths) {
    const portablePath = extractPortableWorkspacePath(absolutePath);
    if (!portablePath) {
      continue;
    }

    const portableSuffix = stripPortableWorkspacePrefix(portablePath);
    const targetRelativePath = `${provenanceRootRelativePath}/${portableSuffix}`.replaceAll(
      '\\',
      '/',
    );
    pathRewriteMap.set(absolutePath.replaceAll('\\', '/'), targetRelativePath);
    pathRewriteMap.set(portablePath, targetRelativePath);
  }

  const pathRewrites = Array.from(pathRewriteMap.entries())
    .map(([from, to]) => ({ from, to }))
    .sort((left, right) => right.from.length - left.from.length);

  const copiedJsonPayloads = [];
  for (const absolutePath of discoveredAbsolutePaths) {
    const portablePath = extractPortableWorkspacePath(absolutePath);
    if (!portablePath) {
      continue;
    }

    const portableSuffix = stripPortableWorkspacePrefix(portablePath);
    const targetPath = resolve(provenanceRoot, portableSuffix);
    mkdirSync(dirname(targetPath), { recursive: true });
    const sourceStats = statSync(absolutePath);

    if (sourceStats.isDirectory()) {
      mkdirSync(targetPath, { recursive: true });
      continue;
    }

    if (absolutePath.endsWith('.json')) {
      const sanitizedPayload = sanitizeTrackedReceiptPayload(
        JSON.parse(readFileSync(absolutePath, 'utf8')),
        pathRewrites,
      );
      writeFileSync(targetPath, `${JSON.stringify(sanitizedPayload, null, 2)}\n`, 'utf8');
      formatRepoJsonReportIfNeeded(targetPath);
      copiedJsonPayloads.push({ payload: sanitizedPayload, targetPath });
      continue;
    }

    copyFileSync(absolutePath, targetPath);
  }

  for (const copiedJsonPayload of copiedJsonPayloads) {
    assertTrackedReceiptPayloadPathsExist(copiedJsonPayload.payload, copiedJsonPayload.targetPath);
  }

  return pathRewrites;
}

/**
 * Collects nested absolute repo-owned source paths from one JSON provenance file.
 * @param {string} filePath Absolute JSON file path.
 * @returns {Set<string>}
 */
function collectTrackedAbsolutePathsFromJsonFile(filePath) {
  return collectTrackedReceiptAbsolutePaths(JSON.parse(readFileSync(filePath, 'utf8')));
}

/**
 * Collects absolute repo-owned source paths from one receipt payload.
 * @param {unknown} value Receipt payload fragment.
 * @returns {Set<string>}
 */
export function collectTrackedReceiptAbsolutePaths(value) {
  const collectedPaths = new Set();

  if (Array.isArray(value)) {
    for (const entry of value) {
      for (const pathValue of collectTrackedReceiptAbsolutePaths(entry)) {
        collectedPaths.add(pathValue);
      }
    }
    return collectedPaths;
  }

  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) {
      for (const pathValue of collectTrackedReceiptAbsolutePaths(entry)) {
        collectedPaths.add(pathValue);
      }
    }
    return collectedPaths;
  }

  if (typeof value !== 'string') {
    return collectedPaths;
  }

  for (const matchedPath of collectRepoOwnedAbsolutePathMatches(value)) {
    if (!existsSync(matchedPath)) {
      continue;
    }
    collectedPaths.add(matchedPath);
  }

  return collectedPaths;
}

/**
 * Extracts one portable repo-relative path from an absolute or portable workspace-owned path.
 * @param {string} value Raw path value.
 * @returns {string | null}
 */
function extractPortableWorkspacePath(value) {
  const normalizedValue = value.replaceAll('\\', '/');
  if (normalizedValue === '.repo-ai-governor' || normalizedValue.startsWith('.repo-ai-governor/')) {
    return normalizedValue;
  }

  const repoDirectoryMarker = '/.repo-ai-governor/';
  const repoDirectoryMarkerIndex = normalizedValue.lastIndexOf(repoDirectoryMarker);
  if (repoDirectoryMarkerIndex >= 0) {
    return normalizedValue.slice(repoDirectoryMarkerIndex + 1);
  }

  const repoRootMarker = '/.repo-ai-governor';
  const repoRootMarkerIndex = normalizedValue.lastIndexOf(repoRootMarker);
  if (repoRootMarkerIndex >= 0) {
    return normalizedValue.slice(repoRootMarkerIndex + 1);
  }

  const repoMarkerIndex = normalizedValue.indexOf('.repo-ai-governor/');
  if (repoMarkerIndex >= 0) {
    return normalizedValue.slice(repoMarkerIndex);
  }

  return null;
}

/**
 * Removes the leading `.repo-ai-governor/` prefix so provenance snapshots can keep tidy relative
 * paths beneath their own durable root.
 * @param {string} portablePath Portable repo-relative path.
 * @returns {string}
 */
function stripPortableWorkspacePrefix(portablePath) {
  if (portablePath === '.repo-ai-governor') {
    return '.repo-ai-governor';
  }

  return portablePath.startsWith('.repo-ai-governor/')
    ? portablePath.slice('.repo-ai-governor/'.length)
    : portablePath;
}

/**
 * Asserts that all repo-relative provenance paths embedded in one tracked receipt payload resolve
 * inside the current worktree.
 * @param {unknown} value Sanitized tracked receipt payload.
 * @param {string} receiptPath Durable tracked receipt path.
 */
export function assertTrackedReceiptPayloadPathsExist(value, receiptPath) {
  const workspaceRoot = resolve(process.cwd());
  const missingPaths = Array.from(collectTrackedReceiptWorkspacePaths(value)).filter(
    (pathValue) => !existsSync(resolve(workspaceRoot, pathValue)),
  );
  if (missingPaths.length === 0) {
    return;
  }

  throw new Error(
    `ACP tracked receipt ${receiptPath} still references missing repo-relative path(s): ${missingPaths.join(', ')}`,
  );
}

/**
 * Collects repo-relative provenance paths from one tracked receipt payload fragment.
 * @param {unknown} value Receipt payload fragment.
 * @returns {Set<string>}
 */
function collectTrackedReceiptWorkspacePaths(value) {
  const collectedPaths = new Set();

  if (Array.isArray(value)) {
    for (const entry of value) {
      for (const pathValue of collectTrackedReceiptWorkspacePaths(entry)) {
        collectedPaths.add(pathValue);
      }
    }
    return collectedPaths;
  }

  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) {
      for (const pathValue of collectTrackedReceiptWorkspacePaths(entry)) {
        collectedPaths.add(pathValue);
      }
    }
    return collectedPaths;
  }

  if (typeof value !== 'string') {
    return collectedPaths;
  }

  for (const matchedPath of collectRepoOwnedWorkspacePathMatches(value)) {
    collectedPaths.add(matchedPath);
  }

  return collectedPaths;
}

/**
 * Collects absolute repo-owned path matches from one string value while preserving spaces inside
 * the path itself.
 * @param {string} value Raw string value.
 * @returns {Set<string>}
 */
function collectRepoOwnedAbsolutePathMatches(value) {
  const normalizedValue = value.replaceAll('\\', '/');
  const collectedPaths = new Set();
  const absolutePathPatterns = [
    /[A-Za-z]:\/[^"',`\r\n]*\.repo-ai-governor(?:\/[^"',`\r\n]*)?/gu,
    /\/[^"',`\r\n]*\.repo-ai-governor(?:\/[^"',`\r\n]*)?/gu,
  ];

  for (const pattern of absolutePathPatterns) {
    for (const match of normalizedValue.matchAll(pattern)) {
      const matchedPath = match[0]?.trim();
      if (!matchedPath) {
        continue;
      }
      collectedPaths.add(matchedPath);
    }
  }

  return collectedPaths;
}

/**
 * Collects repo-relative workspace path matches from one string value while preserving spaces
 * inside the path itself.
 * @param {string} value Raw string value.
 * @returns {Set<string>}
 */
function collectRepoOwnedWorkspacePathMatches(value) {
  const collectedPaths = new Set();
  const pathPattern = /\.repo-ai-governor(?:\/[^"',`\r\n]*)?/gu;

  for (const match of value.matchAll(pathPattern)) {
    const matchedPath = match[0]?.trim();
    if (!matchedPath) {
      continue;
    }
    collectedPaths.add(matchedPath);
  }

  return collectedPaths;
}

/**
 * Runs one installed-package service-host memory-provider scenario.
 * @param {{
 *   mode: string;
 *   workingRoot: string;
 *   installAssets: {repositoryRoot: string; tarballPath: string | null};
 *   distributionMode: "default" | "plugin-enabled";
 * }} options Scenario options.
 * @returns {Record<string, unknown>}
 */
function runServiceHostMemoryProviderScenario(options) {
  const scenarioRoot = resolve(options.workingRoot, `service-host-memory-${options.mode}`);
  const repositoryPath = resolve(scenarioRoot, 'target-repo');
  const homePath = resolve(scenarioRoot, 'home');
  const runtimeEnv = buildIsolatedRuntimeEnv(homePath);
  initializeCleanroomRepository(repositoryPath, `cleanroom-service-host-${options.mode}`);
  const install = installCleanroomPackage({
    mode: options.mode,
    repositoryPath,
    runtimeEnv,
    installAssets: options.installAssets,
  });

  const scriptPath = resolve(repositoryPath, 'service-host-memory-check.mjs');
  writeFileSync(
    scriptPath,
    createServiceHostMemoryProviderCheckScript(options.distributionMode),
    'utf8',
  );

  const executionStep = runCommand('node', [scriptPath], {
    cwd: repositoryPath,
    env: runtimeEnv,
    label: `service-host-memory(${options.mode}/${options.distributionMode})`,
  });
  const executionPayload = parseJsonOutput(
    executionStep.stdout,
    `service-host-memory(${options.mode}/${options.distributionMode})`,
  );
  const expectedMemoryProvider = resolveExpectedServiceHostMemoryProvider(options.distributionMode);

  if (executionPayload.health?.serviceHostKind !== 'sidecar') {
    throw new Error(
      `Expected service-host health host kind to be "sidecar". actual=${String(executionPayload.health?.serviceHostKind)}`,
    );
  }
  if (executionPayload.health?.serviceTransportKind !== 'ipc') {
    throw new Error(
      `Expected service-host health transport kind to be "ipc". actual=${String(executionPayload.health?.serviceTransportKind)}`,
    );
  }
  assertExpectedMemoryProvider(
    executionPayload.health?.memoryProvider,
    expectedMemoryProvider,
    'service-host health',
  );
  assertExpectedMemoryProvider(
    executionPayload.started?.memoryProvider,
    expectedMemoryProvider,
    'service-host startExecution',
  );
  assertExpectedMemoryProvider(
    executionPayload.summary?.memoryProvider,
    expectedMemoryProvider,
    'service-host getExecution',
  );
  assertExpectedMemoryProvider(
    executionPayload.listed?.executions?.[0]?.memoryProvider,
    expectedMemoryProvider,
    'service-host listExecutions',
  );

  return {
    mode: options.mode,
    status: 'passed',
    distributionMode: options.distributionMode,
    repositoryPath,
    install,
    serviceHostCheck: {
      command: executionStep.command,
      durationMs: executionStep.durationMs,
      payload: executionPayload,
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
    throw new Error('pnpm pack --json returned empty stdout.');
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
    throw new Error('Unable to parse pnpm pack --json output.');
  }

  const firstRecord = Array.isArray(parsed) ? parsed[0] : parsed;
  if (!firstRecord || typeof firstRecord !== 'object') {
    throw new Error('pnpm pack --json payload is not an object.');
  }

  const filename = firstRecord.filename;
  if (typeof filename !== 'string' || filename.trim().length === 0) {
    throw new Error('pnpm pack --json payload is missing filename.');
  }

  return {
    filename: filename.trim(),
  };
}

/**
 * Creates install assets required by selected modes.
 * @param {string[]} modes Selected install modes.
 * @param {"default" | "plugin-enabled"} distributionMode Selected distribution mode.
 * @returns {{repositoryRoot: string; tarballPath: string | null}}
 */
function prepareInstallAssets(modes, distributionMode) {
  const repositoryRoot = process.cwd();
  const buildScriptName =
    distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE ? 'build:plugin-enabled' : 'build';
  runCommand('pnpm', ['run', buildScriptName], {
    cwd: repositoryRoot,
    label: 'build',
  });
  gateInfo(
    GATE_NAME,
    `build completed for clean-room install validation. distribution_mode=${distributionMode}`,
  );

  if (!modes.includes('tgz')) {
    return {
      repositoryRoot,
      tarballPath: null,
    };
  }

  const packResult = runCommand('pnpm', ['pack', '--json'], {
    cwd: repositoryRoot,
    label: 'pack',
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
  writeFileSync(absolutePath, `${JSON.stringify(reportPayload, null, 2)}\n`, 'utf8');
  formatRepoJsonReportIfNeeded(absolutePath);
}

/**
 * Formats one governed repo-local JSON report with Biome so tracked governance outputs stay stable after regeneration.
 * @param {string} absolutePath Absolute report path.
 */
function formatRepoJsonReportIfNeeded(absolutePath) {
  const workspaceRoot = resolve(process.cwd());
  const governedReportRoot = resolve(workspaceRoot, '.repo-ai-governor');
  const governedRelativePath = relative(governedReportRoot, absolutePath);
  if (
    !absolutePath.endsWith('.json') ||
    governedRelativePath.length === 0 ||
    governedRelativePath.startsWith('..') ||
    isAbsolute(governedRelativePath)
  ) {
    return;
  }

  const result = spawnSync('pnpm', ['exec', 'biome', 'format', '--write', absolutePath], {
    cwd: workspaceRoot,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  if (result.error) {
    throw new Error(`failed to format JSON report ${absolutePath}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(
      `failed to format JSON report ${absolutePath}: ${(result.stderr || result.stdout || '').trim()}`,
    );
  }
}

async function main() {
  const options = parseCliOptions();
  const createdTempRoot = mkdtempSync(resolve(tmpdir(), 'repo-ai-governor-cleanroom-'));
  const installAssets = prepareInstallAssets(options.modes, options.distributionMode);

  let overallStatus = 'passed';
  let overallFailure = null;
  /** @type {Array<Record<string, unknown>>} */
  const modeResults = [];
  /** @type {Record<string, unknown> | null} */
  let workspaceSwitchRollback = null;
  /** @type {Record<string, unknown> | null} */
  let readOnlyAttachPrecheck = null;
  /** @type {Array<Record<string, unknown>>} */
  let pluginEnabledMemoryProviderScenarios = [];
  /** @type {Array<Record<string, unknown>>} */
  let serviceHostMemoryProviderScenarios = [];
  /** @type {Array<Record<string, unknown>>} */
  const remoteApiScenarios = [];
  /** @type {Array<Record<string, unknown>>} */
  let acpHostTransportScenarios = [];
  /** @type {Array<Record<string, unknown>>} */
  let acpExecutionScenarios = [];

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
            '->',
          )}`,
        );
      }

      modeResults.push({
        mode,
        status: 'passed',
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
    gateInfo(GATE_NAME, 'workspace switch rollback scenario passed.');

    readOnlyAttachPrecheck = runReadOnlyAttachPrecheck({
      mode: options.modes.includes(READ_ONLY_ATTACH_PRECHECK_MODE)
        ? READ_ONLY_ATTACH_PRECHECK_MODE
        : options.modes[0],
      workingRoot: createdTempRoot,
      installAssets,
    });
    gateInfo(GATE_NAME, 'read-only attach precheck passed.');

    serviceHostMemoryProviderScenarios = options.modes.map((mode) => {
      const scenario = runServiceHostMemoryProviderScenario({
        mode,
        workingRoot: createdTempRoot,
        installAssets,
        distributionMode: options.distributionMode,
      });
      gateInfo(
        GATE_NAME,
        `service-host memory provider scenario passed for mode=${mode} distribution_mode=${options.distributionMode}.`,
      );
      return scenario;
    });

    for (const mode of options.modes) {
      const scenario = await runRemoteApiSmokeScenario({
        mode,
        workingRoot: createdTempRoot,
        installAssets,
      });
      gateInfo(GATE_NAME, `remote-api smoke scenario passed for mode=${mode}.`);
      remoteApiScenarios.push(scenario);
    }

    if (options.includeAcpHostVerify) {
      acpHostTransportScenarios = options.modes.map((mode) => {
        const scenario = runAcpHostTransportScenario({
          mode,
          workingRoot: createdTempRoot,
          installAssets,
        });
        gateInfo(GATE_NAME, `ACP host transport clean-room scenario passed for mode=${mode}.`);
        return scenario;
      });
    }

    if (options.includeAcpExecutionVerify) {
      acpExecutionScenarios = options.modes.map((mode) => {
        const scenario = runAcpExecutionScenario({
          mode,
          workingRoot: createdTempRoot,
          installAssets,
        });
        gateInfo(GATE_NAME, `ACP execution clean-room scenario passed for mode=${mode}.`);
        return scenario;
      });
    }

    if (options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE) {
      pluginEnabledMemoryProviderScenarios = options.modes.map((mode) => {
        const scenario = runPluginEnabledMemoryProviderScenario({
          mode,
          workingRoot: createdTempRoot,
          installAssets,
        });
        gateInfo(GATE_NAME, `plugin-enabled memory provider scenario passed for mode=${mode}.`);
        return scenario;
      });
    }
  } catch (error) {
    overallStatus = 'failed';
    overallFailure = error instanceof Error ? error.message : String(error);
  }

  const reportPayload = {
    reportType: 'cleanroom_local_install_verification_v2',
    status: overallStatus,
    generatedAt: new Date().toISOString(),
    repositoryRoot: process.cwd(),
    selectedModes: options.modes,
    selectedModeCount: options.modes.length,
    iterationsPerMode: options.iterations,
    distributionMode: options.distributionMode,
    requiredCommandChain: DEFAULT_REQUIRED_CHAIN,
    modeResults,
    workspaceSwitchRollback,
    readOnlyAttachPrecheck,
    serviceHostMemoryProviderScenarios,
    remoteApiScenarios,
    acpHostTransportScenarios,
    acpExecutionScenarios,
    pluginEnabledMemoryProviderScenarios,
    stage9aHardExit: {
      requiredModeMinimum: 2,
      selectedModeCount: options.modes.length,
      perModeIterationsMinimum: 3,
      configuredIterations: options.iterations,
      commandChain: DEFAULT_REQUIRED_CHAIN,
      passed: overallStatus === 'passed' && options.modes.length >= 2 && options.iterations >= 3,
    },
    notes: {
      tgzModeSelected: options.modes.includes('tgz'),
      pluginEnabledDistribution: options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE,
      acpHostVerifySelected: options.includeAcpHostVerify,
      acpExecutionVerifySelected: options.includeAcpExecutionVerify,
      cleanupPolicy: options.keepTemp || overallStatus === 'failed' ? 'keep_temp' : 'remove_temp',
    },
  };

  if (overallFailure) {
    reportPayload.errorMessage = overallFailure;
  }

  try {
    writeReport(options.outputPath, reportPayload);
    gateInfo(GATE_NAME, `report generated at ${options.outputPath}`);
    if (options.includeAcpHostVerify && options.emitAcpEvidencePath) {
      writeAcpCleanroomEvidenceSummary({
        outputPath: options.emitAcpEvidencePath,
        sourceReportPath: resolve(process.cwd(), options.outputPath),
        overallStatus,
        distributionMode: options.distributionMode,
        scenarios: acpHostTransportScenarios,
      });
      gateInfo(GATE_NAME, `ACP evidence generated at ${options.emitAcpEvidencePath}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    gateFail(GATE_NAME, `failed to persist report: ${message}`);
    process.exit(1);
  }

  if (!options.keepTemp && overallStatus === 'passed') {
    rmSync(createdTempRoot, { recursive: true, force: true });
  }

  if (installAssets.tarballPath && existsSync(installAssets.tarballPath)) {
    rmSync(installAssets.tarballPath, { force: true });
  }

  if (overallStatus === 'passed') {
    gatePass(
      GATE_NAME,
      `clean-room validation passed. modes=${options.modes.join(',')} iterations=${options.iterations}`,
    );
    return;
  }

  gateFail(GATE_NAME, overallFailure ?? 'clean-room validation failed.');
  gateInfo(GATE_NAME, `temp artifacts kept at ${createdTempRoot}`);
  process.exit(1);
}

const IS_DIRECT_EXECUTION =
  typeof process.argv[1] === 'string' &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url));

if (IS_DIRECT_EXECUTION) {
  try {
    await main();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    gateFail(GATE_NAME, message);
    process.exit(1);
  }
}
