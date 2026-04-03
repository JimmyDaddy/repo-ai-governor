#!/usr/bin/env node

import { spawn, spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, resolve } from 'node:path';

import { gateFail, gateInfo, gatePass } from '../governance/gate-output.js';
import {
  REMOTE_API_SMOKE_ANTHROPIC_KEY,
  REMOTE_API_SMOKE_OPENAI_KEY,
  writeRemoteApiSmokeConfig,
} from './remote-api-smoke-runtime.js';

const GATE_NAME = 'release-verify-local';
const DEFAULT_DISTRIBUTION_MODE = 'default';
const PLUGIN_ENABLED_DISTRIBUTION_MODE = 'plugin-enabled';
const DIST_CLI_ENTRY_PATH = 'dist/bin/repo-ai-governor.js';
const REQUIRED_PACKED_PATH_SUFFIXES = [
  'dist/bin/repo-ai-governor.js',
  'dist/apps/cli/src/main.js',
  'dist/node_modules/@repo-ai-governor/cli/package.json',
  'dist/node_modules/@repo-ai-governor/cli/dist/src/main.js',
  'dist/node_modules/@repo-ai-governor/artifact-registry/package.json',
  'dist/node_modules/@repo-ai-governor/artifact-registry/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/config/package.json',
  'dist/node_modules/@repo-ai-governor/config/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/core-agent-projection/package.json',
  'dist/node_modules/@repo-ai-governor/core-agent-projection/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/core-memory-semantics/package.json',
  'dist/node_modules/@repo-ai-governor/core-memory-semantics/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/core-orchestration-service/package.json',
  'dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-client.js',
  'dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-host.js',
  'dist/node_modules/@repo-ai-governor/core-orchestration-service/dist/src/local-orchestration-service-sidecar-entry.js',
  'dist/node_modules/@repo-ai-governor/core-runtime-langgraph/package.json',
  'dist/node_modules/@repo-ai-governor/core-runtime-langgraph/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/memory-provider-registry/package.json',
  'dist/node_modules/@repo-ai-governor/memory-provider-registry/dist/src/index.js',
  'dist/packages/memory-providers/sqlite-fs/src/index.js',
  'dist/node_modules/@repo-ai-governor/memory-provider-sqlite-fs/package.json',
  'dist/node_modules/@repo-ai-governor/memory-provider-sqlite-fs/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/notification-provider-chat-im/package.json',
  'dist/node_modules/@repo-ai-governor/notification-provider-chat-im/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/notification-provider-webhook/package.json',
  'dist/node_modules/@repo-ai-governor/notification-provider-webhook/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/orchestration-service-client/package.json',
  'dist/node_modules/@repo-ai-governor/orchestration-service-client/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/shared/package.json',
  'dist/node_modules/@repo-ai-governor/shared/dist/src/index.js',
  'dist/node_modules/@repo-ai-governor/cli/dist/src/runtime/orchestration-service-runtime.js',
  'dist/packages/published-surfaces/service-host.js',
  'dist/packages/published-surfaces/service-host.d.ts',
  'dist/packages/shared/src/index.js',
  'docs/local-adoption-playbook.md',
  'docs/local-adoption-playbook.zh-CN.md',
  'examples/README.md',
  'examples/single-role-minimal-flow/scenario.json',
  'examples/single-role-minimal-flow/expected/runtime-baseline.json',
  'integrations/ide/README.md',
  'integrations/desktop/README.md',
  'integrations/desktop/examples/README.md',
  'integrations/desktop/examples/desktop-sidecar-runtime.sample.json',
  'integrations/ide/examples/vscode-task.sample.json',
  'integrations/ide/examples/jetbrains-run-configuration.sample.xml',
  'integrations/ide/examples/cursor-task.sample.json',
  'integrations/ide/examples/claude-code-commands.sample.json',
  '.codex/skills/technical-solution-promotion/SKILL.md',
  '.codex/skills/technical-solution-promotion/agents/openai.yaml',
  '.codex/skills/workspace-code-review-workflow/SKILL.md',
  '.codex/skills/workspace-code-review-workflow/agents/openai.yaml',
  '.codex/skills/workspace-delivery-finisher/SKILL.md',
  '.codex/skills/workspace-delivery-finisher/agents/openai.yaml',
];
const PLUGIN_ENABLED_REQUIRED_PACKED_PATH_SUFFIXES = [];
const FORBIDDEN_DEFAULT_PACKED_PATH_FRAGMENTS = [];
const DOCUMENT_TRUTHFULNESS_ASSERTIONS = [
  {
    filePath: 'README.md',
    requiredFragments: [
      'docs/local-adoption-playbook.md',
      '.codex/skills/',
      'npm registry',
      'offline/self-contained',
    ],
  },
  {
    filePath: 'README.zh-CN.md',
    requiredFragments: [
      'docs/local-adoption-playbook.zh-CN.md',
      '.codex/skills/',
      'npm registry',
      '离线自包含',
    ],
  },
  {
    filePath: 'docs/local-adoption-playbook.md',
    requiredFragments: [
      '.codex/skills/',
      'npm registry',
      'offline/self-contained',
      'remote-api rehearsal',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
    ],
  },
  {
    filePath: 'docs/local-adoption-playbook.zh-CN.md',
    requiredFragments: [
      '.codex/skills/',
      'npm registry',
      '离线自包含',
      'remote-api rehearsal',
      'OPENAI_API_KEY',
      'ANTHROPIC_API_KEY',
    ],
  },
];

/**
 * Parses CLI args for local-distribution verification.
 * @returns {{distributionMode: "default" | "plugin-enabled"; outputPath: string | null}}
 */
function parseCliOptions() {
  const rawArgs = process.argv.slice(2);
  let distributionMode = DEFAULT_DISTRIBUTION_MODE;
  let outputPath = null;

  for (let index = 0; index < rawArgs.length; index += 1) {
    const arg = rawArgs[index];

    if (arg === '--distribution-mode') {
      const candidateMode = rawArgs[index + 1]?.trim();
      if (
        candidateMode !== DEFAULT_DISTRIBUTION_MODE &&
        candidateMode !== PLUGIN_ENABLED_DISTRIBUTION_MODE
      ) {
        throw new Error('Expected "--distribution-mode" to be "default" or "plugin-enabled".');
      }
      distributionMode = candidateMode;
      index += 1;
      continue;
    }

    if (arg === '--output') {
      const candidatePath = rawArgs[index + 1]?.trim();
      if (!candidatePath) {
        throw new Error('Expected a non-empty value after "--output".');
      }
      outputPath = candidatePath;
      index += 1;
      continue;
    }

    throw new Error(`Unsupported option: ${arg}`);
  }

  return {
    distributionMode,
    outputPath,
  };
}

/**
 * Runs one shell command and throws on non-zero status.
 * @param {string} command Command binary.
 * @param {string[]} args Command arguments.
 * @param {string} label Human-readable command label.
 * @param {{cwd?: string; env?: NodeJS.ProcessEnv}} [options] Process options.
 * @returns {import("node:child_process").SpawnSyncReturns<string>}
 */
function runCommand(command, args, label, options = {}) {
  const result = spawnSync(command, args, {
    cwd: options.cwd ?? process.cwd(),
    env: options.env ?? process.env,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  if (result.error) {
    throw new Error(`${label} failed to execute: ${result.error.message}`);
  }

  if (result.status !== 0) {
    const stderr = result.stderr?.trim() ?? '';
    const stdout = result.stdout?.trim() ?? '';
    throw new Error(
      `${label} exited with code ${result.status}. stdout="${stdout}" stderr="${stderr}"`,
    );
  }

  return result;
}

/**
 * Parses CLI JSON output by scanning from the last line upwards.
 * @param {string} rawOutput Raw command stdout.
 * @param {string} label Parse label.
 * @returns {Record<string, unknown>}
 */
function parseJsonOutput(rawOutput, label) {
  const normalizedOutput = rawOutput.trim();
  if (!normalizedOutput) {
    throw new Error(`${label} returned empty stdout.`);
  }

  try {
    const parsed = JSON.parse(normalizedOutput);
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Why: keep line-by-line fallback for wrappers that prepend logs.
  }

  for (const line of normalizedOutput.split(/\r?\n/u).reverse()) {
    const trimmed = line.trim();
    if (!trimmed) {
      continue;
    }
    try {
      const parsed = JSON.parse(trimmed);
      if (parsed && typeof parsed === 'object') {
        return parsed;
      }
    } catch {
      // Why: continue until one valid JSON line is found.
    }
  }

  throw new Error(`${label} did not contain parseable JSON output.`);
}

/**
 * Parses `pnpm pack --json` output by scanning from the last line upwards.
 * @param {string} rawOutput Raw command stdout.
 * @returns {unknown}
 */
function parsePackOutputJson(rawOutput) {
  const normalizedOutput = rawOutput.trim();
  if (normalizedOutput.length === 0) {
    throw new Error('pnpm pack --json returned empty stdout.');
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

  throw new Error('Unable to parse JSON payload from pnpm pack --json output.');
}

/**
 * Resolves one pack result object from parsed pack payload.
 * @param {unknown} packJson Parsed pack JSON.
 * @returns {Record<string, unknown>}
 */
function resolvePackRecord(packJson) {
  if (Array.isArray(packJson)) {
    const firstRecord = packJson[0];
    if (!firstRecord || typeof firstRecord !== 'object') {
      throw new Error('pnpm pack --json returned an empty or invalid array payload.');
    }
    return firstRecord;
  }

  if (!packJson || typeof packJson !== 'object') {
    throw new Error('pnpm pack --json returned unsupported payload shape.');
  }

  return packJson;
}

/**
 * Normalizes a file path for stable suffix checks.
 * @param {string} filePath Candidate file path.
 * @returns {string}
 */
function normalizeFilePath(filePath) {
  return filePath.replace(/\\/g, '/');
}

/**
 * Resolves packed file path list from a pack record payload.
 * @param {Record<string, unknown>} packRecord Parsed pack record.
 * @returns {string[]}
 */
function readPackedFilePaths(packRecord) {
  const files = packRecord.files;
  if (!Array.isArray(files) || files.length === 0) {
    throw new Error('pnpm pack --json did not provide file manifest.');
  }

  const normalizedPaths = [];
  for (const fileEntry of files) {
    if (typeof fileEntry === 'string' && fileEntry.trim().length > 0) {
      normalizedPaths.push(normalizeFilePath(fileEntry.trim()));
      continue;
    }

    if (
      fileEntry &&
      typeof fileEntry === 'object' &&
      typeof fileEntry.path === 'string' &&
      fileEntry.path.trim().length > 0
    ) {
      normalizedPaths.push(normalizeFilePath(fileEntry.path.trim()));
    }
  }

  if (normalizedPaths.length === 0) {
    throw new Error('pnpm pack file manifest contains no usable path entries.');
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

/**
 * Reads one UTF-8 text file from the repository root.
 * @param {string} relativeFilePath Relative repository path.
 * @returns {string}
 */
function readTextFile(relativeFilePath) {
  const absoluteFilePath = resolve(process.cwd(), relativeFilePath);
  if (!existsSync(absoluteFilePath)) {
    throw new Error(`Required truthfulness source file is missing: ${relativeFilePath}`);
  }

  return readFileSync(absoluteFilePath, 'utf8');
}

/**
 * Verifies user-facing docs describe the supported packaged surface accurately.
 */
function verifyDocumentationTruthfulness() {
  for (const assertion of DOCUMENT_TRUTHFULNESS_ASSERTIONS) {
    const fileContent = readTextFile(assertion.filePath);
    for (const requiredFragment of assertion.requiredFragments) {
      if (!fileContent.includes(requiredFragment)) {
        throw new Error(
          `Documentation truthfulness drift: ${assertion.filePath} is missing "${requiredFragment}"`,
        );
      }
    }
  }
}

/**
 * Initializes one minimal target repository for dist-binary smoke.
 * @param {string} repositoryPath Target repository path.
 */
function initializeSmokeRepository(repositoryPath) {
  mkdirSync(repositoryPath, { recursive: true });
  writeFileSync(
    resolve(repositoryPath, 'package.json'),
    `${JSON.stringify(
      {
        name: 'repo-ai-governor-dist-remote-api-smoke',
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
 * Writes one JSON verification report.
 * @param {string} outputPath Output report path.
 * @param {Record<string, unknown>} reportPayload Report payload.
 */
function writeReport(outputPath, reportPayload) {
  const absolutePath = resolve(process.cwd(), outputPath);
  mkdirSync(dirname(absolutePath), { recursive: true });
  writeFileSync(absolutePath, `${JSON.stringify(reportPayload, null, 2)}\n`, 'utf8');
}

/**
 * Starts the remote-api stub server in a separate child process.
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
 * Resolves one artifact path from CLI JSON payload.
 * @param {Record<string, unknown>} payload CLI JSON payload.
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
 * Asserts one adapter verification payload exposes the expected remote-api truth.
 * @param {Record<string, unknown>} verification Adapter verification payload.
 * @param {string} label Human-readable assertion label.
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

  assertToolHealth(codex, {
    label: `${label}/codex`,
    providerKind: 'openai',
    vendorBindingKind: 'openai_responses',
  });
  assertToolHealth(claudeCode, {
    label: `${label}/claude-code`,
    providerKind: 'anthropic',
    vendorBindingKind: 'anthropic_messages',
  });
}

/**
 * Asserts one tool snapshot health payload.
 * @param {Record<string, unknown>} toolSnapshot Tool snapshot payload.
 * @param {{label: string; providerKind: string; vendorBindingKind: string}} expectations Expectations.
 */
function assertToolHealth(toolSnapshot, expectations) {
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
 * Executes one dist-binary remote-api smoke scenario against the local stub server.
 * @returns {Promise<Record<string, unknown>>}
 */
async function runRemoteApiDistSmokeScenario() {
  const scenarioRoot = mkdtempSync(resolve(tmpdir(), 'repo-ai-governor-dist-remote-api-'));
  const repositoryPath = resolve(scenarioRoot, 'target-repo');
  const homePath = resolve(scenarioRoot, 'home');
  const xdgConfigHome = resolve(homePath, '.config');
  const cliEntryPath = resolve(process.cwd(), DIST_CLI_ENTRY_PATH);
  mkdirSync(xdgConfigHome, { recursive: true });
  initializeSmokeRepository(repositoryPath);

  const server = await startRemoteApiSmokeServerProcess();
  let shouldCleanup = true;
  try {
    const configPath = writeRemoteApiSmokeConfig(repositoryPath, {
      openAiEndpoint: server.openAiEndpoint,
      anthropicEndpoint: server.anthropicEndpoint,
    });
    const runtimeEnv = {
      ...process.env,
      HOME: homePath,
      USERPROFILE: homePath,
      XDG_CONFIG_HOME: xdgConfigHome,
      CI: '1',
      OPENAI_API_KEY: REMOTE_API_SMOKE_OPENAI_KEY,
      ANTHROPIC_API_KEY: REMOTE_API_SMOKE_ANTHROPIC_KEY,
    };

    const doctorResult = runCommand(
      'node',
      [cliEntryPath, '--output', 'json', 'doctor', '--adapters', '--fix'],
      'Dist remote-api doctor smoke',
      {
        cwd: repositoryPath,
        env: runtimeEnv,
      },
    );
    const doctorPayload = parseJsonOutput(doctorResult.stdout ?? '', 'dist remote-api doctor');
    const doctorArtifactPath = resolveArtifactPath(
      doctorPayload,
      'doctor_diagnostics',
      'dist remote-api doctor',
    );
    const doctorDiagnostics = JSON.parse(readFileSync(doctorArtifactPath, 'utf8'));
    assertRemoteApiVerificationPayload(doctorDiagnostics.verification, 'dist remote-api doctor');

    const verifyResult = runCommand(
      'node',
      [cliEntryPath, '--output', 'json', 'verify', '--adapters'],
      'Dist remote-api verify smoke',
      {
        cwd: repositoryPath,
        env: runtimeEnv,
      },
    );
    const verifyPayload = parseJsonOutput(verifyResult.stdout ?? '', 'dist remote-api verify');
    const verifyArtifactPath = resolveArtifactPath(
      verifyPayload,
      'verify_diagnostics',
      'dist remote-api verify',
    );
    const verifyDiagnostics = JSON.parse(readFileSync(verifyArtifactPath, 'utf8'));
    assertRemoteApiVerificationPayload(verifyDiagnostics.verification, 'dist remote-api verify');

    return {
      status: 'passed',
      repositoryPath,
      configPath,
      homePath,
      doctor: {
        command: `node ${cliEntryPath} --output json doctor --adapters --fix`,
        diagnosticsPath: doctorArtifactPath,
        overallStatus: doctorDiagnostics.verification?.overallStatus ?? null,
      },
      verify: {
        command: `node ${cliEntryPath} --output json verify --adapters`,
        diagnosticsPath: verifyArtifactPath,
        overallStatus: verifyDiagnostics.verification?.overallStatus ?? null,
      },
      endpoints: {
        openAi: server.openAiEndpoint,
        anthropic: server.anthropicEndpoint,
      },
    };
  } catch (error) {
    shouldCleanup = false;
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(`${detail} temp_root=${scenarioRoot}`);
  } finally {
    await server.close();
    if (shouldCleanup) {
      rmSync(scenarioRoot, { recursive: true, force: true });
    }
  }
}

async function main() {
  const options = parseCliOptions();
  const absoluteCliEntryPath = resolve(process.cwd(), DIST_CLI_ENTRY_PATH);
  if (!existsSync(absoluteCliEntryPath)) {
    throw new Error(`Distribution CLI entry is missing: ${DIST_CLI_ENTRY_PATH}`);
  }

  runCommand('node', [DIST_CLI_ENTRY_PATH, '--help'], 'CLI help smoke check');
  gateInfo(GATE_NAME, 'CLI help smoke check passed.');
  runCommand(
    'node',
    [
      './scripts/examples/check-desktop-entry-smoke.js',
      ...(options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE
        ? ['--distribution-mode', PLUGIN_ENABLED_DISTRIBUTION_MODE]
        : []),
    ],
    'Desktop entry smoke check',
  );
  gateInfo(GATE_NAME, 'Desktop entry smoke check passed.');
  runCommand(
    'node',
    [
      './scripts/examples/check-examples-runtime.js',
      ...(options.distributionMode === PLUGIN_ENABLED_DISTRIBUTION_MODE
        ? ['--distribution-mode', PLUGIN_ENABLED_DISTRIBUTION_MODE]
        : []),
    ],
    'Examples runtime smoke check',
  );
  gateInfo(
    GATE_NAME,
    `Examples runtime smoke check passed for distribution_mode=${options.distributionMode}.`,
  );

  const remoteApiDistSmoke = await runRemoteApiDistSmokeScenario();
  gateInfo(GATE_NAME, 'Dist-binary remote-api smoke passed.');

  const packResult = runCommand('pnpm', ['pack', '--json'], 'pnpm pack --json');
  const parsedPackJson = parsePackOutputJson(packResult.stdout ?? '');
  const packRecord = resolvePackRecord(parsedPackJson);
  const packedFilePaths = readPackedFilePaths(packRecord);

  verifyDocumentationTruthfulness();

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
  if (typeof rawFilename !== 'string' || rawFilename.trim().length === 0) {
    throw new Error('pnpm pack --json did not provide tarball filename.');
  }
  const packTarballPath = resolve(process.cwd(), rawFilename.trim());
  if (!existsSync(packTarballPath)) {
    throw new Error(`Pack tarball file is missing: ${rawFilename}`);
  }

  if (options.outputPath) {
    writeReport(options.outputPath, {
      reportType: 'local_distribution_verification_v2',
      generatedAt: new Date().toISOString(),
      distributionMode: options.distributionMode,
      distCliEntryPath: DIST_CLI_ENTRY_PATH,
      packFile: rawFilename.trim(),
      packedFileCount: packedFilePaths.length,
      requiredPackedPathCount: REQUIRED_PACKED_PATH_SUFFIXES.length,
      remoteApiDistSmoke,
    });
    gateInfo(GATE_NAME, `report generated at ${options.outputPath}`);
  }

  rmSync(packTarballPath, { force: true });
  gatePass(
    GATE_NAME,
    `local distribution verified. distribution_mode=${options.distributionMode} pack_file=${rawFilename.trim()} files=${packedFilePaths.length}`,
  );
}

try {
  await main();
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error);
  gateFail(GATE_NAME, errorMessage);
  process.exit(1);
}
