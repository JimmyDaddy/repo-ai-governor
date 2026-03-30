import { execFileSync } from 'node:child_process';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

const ROOT = process.cwd();
const DIST_BIN_PATH = resolve(ROOT, 'dist', 'bin', 'repo-ai-governor.js');

function createDeterministicEnvironment() {
  return {
    ...process.env,
    REPO_AI_GOVERNOR_ENABLE_TEST_FIXTURES: '1',
    REPO_AI_GOVERNOR_CODEX_EXEC_FIXTURE: 'success',
    REPO_AI_GOVERNOR_CLAUDE_CODE_EXEC_FIXTURE: 'success',
    REPO_AI_GOVERNOR_GITHUB_COPILOT_EXEC_FIXTURE: 'success',
  };
}

async function createFixtureRepository() {
  const repositoryRoot = await mkdtemp(resolve(tmpdir(), 'project-030-smoke-'));
  const workspaceRoot = resolve(repositoryRoot, '.repo-ai-governor');
  await mkdir(workspaceRoot, { recursive: true });
  await writeFile(
    resolve(workspaceRoot, 'governor.yaml'),
    [
      'schemaVersion: "1.1"',
      'workspace:',
      '  mode: repo_local',
      '  migrationPolicy: copy_verify_switch_rollback',
      'i18n:',
      '  runtimeEngine: i18next',
      '  defaultLocale: en-US',
      '  fallbackLocale: zh-CN',
      '  supportedLocales:',
      '    - en-US',
      '    - zh-CN',
      'adapters:',
      '  roles:',
      '    - roleId: planner',
      '      roleProfileId: planner-default',
      '      requiredCapabilities:',
      '        - structured_output',
      '      required: true',
      '    - roleId: coder',
      '      roleProfileId: coder-default',
      '      requiredCapabilities:',
      '        - tool_calling',
      '      required: true',
      '    - roleId: reviewer',
      '      roleProfileId: reviewer-default',
      '      requiredCapabilities:',
      '        - structured_output',
      '      required: true',
      '  routing:',
      '    roleBindings:',
      '      planner:',
      '        primarySurface: codex',
      '        fallbackSurfaces:',
      '          - claude-code',
      '      coder:',
      '        primarySurface: codex',
      '        fallbackSurfaces:',
      '          - github-copilot',
      '      reviewer:',
      '        primarySurface: claude-code',
      '        fallbackSurfaces:',
      '          - codex',
      '  tools:',
      '    - toolId: codex',
      '      enabled: true',
      '      availability: available',
      '    - toolId: claude-code',
      '      enabled: true',
      '      availability: available',
      '    - toolId: github-copilot',
      '      enabled: true',
      '      availability: available',
      '',
    ].join('\n'),
    'utf8',
  );
  execFileSync('git', ['init'], { cwd: repositoryRoot, stdio: 'ignore' });
  return repositoryRoot;
}

function runJsonCommand(repositoryRoot, args) {
  const stdout = execFileSync(
    'node',
    [DIST_BIN_PATH, '--locale', 'en-US', '--output', 'json', ...args],
    {
      cwd: repositoryRoot,
      env: createDeterministicEnvironment(),
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    },
  );
  return JSON.parse(stdout);
}

function assertSuccess(payload, expectedOperation) {
  if (payload.status !== 'success') {
    throw new Error(
      `Expected success payload for ${expectedOperation}, received ${payload.status}.`,
    );
  }
  if (payload.command_result?.operation !== expectedOperation) {
    throw new Error(
      `Expected operation ${expectedOperation}, received ${payload.command_result?.operation ?? 'none'}.`,
    );
  }
}

function findArtifactPath(payload, artifactId) {
  const artifact = payload.command_result?.artifacts?.find((entry) => entry.id === artifactId);
  return typeof artifact?.path === 'string' ? artifact.path : null;
}

async function main() {
  const repositoryRoot = await createFixtureRepository();

  try {
    const connectPayload = runJsonCommand(repositoryRoot, [
      'connect',
      '--preset',
      'multi-tool-default',
    ]);
    assertSuccess(connectPayload, 'adapter_connect');

    const diffPayload = runJsonCommand(repositoryRoot, ['connect', 'diff', '--latest']);
    assertSuccess(diffPayload, 'adapter_connect_diff');

    const applyPayload = runJsonCommand(repositoryRoot, ['connect', 'apply', '--latest']);
    assertSuccess(applyPayload, 'adapter_connect_apply');

    const doctorPayload = runJsonCommand(repositoryRoot, ['doctor', '--adapters']);
    assertSuccess(doctorPayload, 'env_doctor');

    const verifyPayload = runJsonCommand(repositoryRoot, ['verify', '--adapters']);
    assertSuccess(verifyPayload, 'adapter_verify');

    const runPayload = runJsonCommand(repositoryRoot, ['run', '--dry-run', '--trace']);
    assertSuccess(runPayload, 'governance_run');

    const persistedConfigContent = await readFile(
      resolve(repositoryRoot, '.repo-ai-governor', 'governor.yaml'),
      'utf8',
    );
    if (!persistedConfigContent.includes('adapters:')) {
      throw new Error('Expected connect apply to persist adapters config into governor.yaml.');
    }

    const summary = {
      repositoryRoot,
      connectOperation: connectPayload.command_result.operation,
      diffPath: diffPayload.command_result.details?.diff_path ?? null,
      applyReceiptPath: applyPayload.command_result.details?.apply_receipt_path ?? null,
      doctorDiagnosticsPath: findArtifactPath(doctorPayload, 'doctor_diagnostics'),
      verifyDiagnosticsPath: verifyPayload.command_result.details?.diagnostics_path ?? null,
      runReportPath: findArtifactPath(runPayload, 'execution_report'),
      runReplayPath: findArtifactPath(runPayload, 'replay_explain'),
    };

    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  } finally {
    await rm(repositoryRoot, { recursive: true, force: true });
  }
}

main().catch((error) => {
  const message = error instanceof Error ? (error.stack ?? error.message) : String(error);
  process.stderr.write(`${message}\n`);
  process.exitCode = 1;
});
