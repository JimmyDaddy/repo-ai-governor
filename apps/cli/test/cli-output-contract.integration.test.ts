import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  CliClaudeCodeExecFixtureEnvironmentKey,
  CliClaudeCodeExecFixtureMode,
} from '../src/constants/claude-code-exec-fixture.constant.js';
import { CliSessionShellExitReason } from '../src/constants/cli-session-shell.constant.js';
import {
  CliCodexExecFixtureEnvironmentKey,
  CliCodexExecFixtureMode,
} from '../src/constants/codex-exec-fixture.constant.js';
import {
  CliGithubCopilotExecFixtureEnvironmentKey,
  CliGithubCopilotExecFixtureMode,
} from '../src/constants/github-copilot-exec-fixture.constant.js';
import { runCli } from '../src/main.js';
import type { CliCommandProgressEvent, CliSessionShellRunResult } from '../src/types/index.js';

function createDeterministicCliEnvironment(overrides: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...Object.fromEntries(
      Object.entries(process.env).filter(([environmentKey]) => {
        return !environmentKey.startsWith('REPO_AI_GOVERNOR_');
      }),
    ),
    [CliCodexExecFixtureEnvironmentKey.ENABLE_FIXTURES]: '1',
    [CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliCodexExecFixtureMode.SUCCESS,
    [CliClaudeCodeExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliClaudeCodeExecFixtureMode.SUCCESS,
    [CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]:
      CliGithubCopilotExecFixtureMode.SUCCESS,
    ...overrides,
  };
}

/**
 * Creates buffered IO adapters for output-contract integration tests.
 * @param isStdoutTty Whether runtime stdout should be treated as TTY.
 * @returns Buffers and IO adapters used by CLI runtime.
 */
function createBufferedIo(
  isStdoutTty: boolean,
  currentWorkingDirectory: string = process.cwd(),
  environmentOverrides: NodeJS.ProcessEnv = {},
): {
  stdoutBuffer: string[];
  stderrBuffer: string[];
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
    isStdoutTty: () => boolean;
    isStdinTty: () => boolean;
    isStderrTty: () => boolean;
    env: () => NodeJS.ProcessEnv;
  };
} {
  const stdoutBuffer: string[] = [];
  const stderrBuffer: string[] = [];
  const environment = createDeterministicCliEnvironment(environmentOverrides);

  return {
    stdoutBuffer,
    stderrBuffer,
    io: {
      stdout: (value: string) => {
        stdoutBuffer.push(value);
      },
      stderr: (value: string) => {
        stderrBuffer.push(value);
      },
      cwd: () => currentWorkingDirectory,
      isStdoutTty: () => isStdoutTty,
      isStdinTty: () => isStdoutTty,
      isStderrTty: () => isStdoutTty,
      env: () => environment,
    },
  };
}

/**
 * Creates one stub session-shell runner result used by no-subcommand entrypoint tests.
 * @returns Minimal clean exit result for the injected session-shell runner.
 */
function createStubSessionShellResult(): CliSessionShellRunResult {
  return {
    exitReason: CliSessionShellExitReason.SLASH_EXIT,
    transcriptItems: [],
  };
}

/**
 * Creates one temporary git repository with migration-like changed path for policy-gate testing.
 * @returns Temporary repository absolute path.
 */
async function createPolicyGateFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-policy-'));
  const workspaceRoot = resolve(temporaryRepositoryRoot, '.repo-ai-governor');
  execFileSync('git', ['init'], {
    cwd: temporaryRepositoryRoot,
    stdio: 'ignore',
  });
  await mkdir(resolve(workspaceRoot, 'context', 'memory'), { recursive: true });
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
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - en-US',
      'memory:',
      '  storeEngine: fs_csv',
      '  storeRoot: context/memory',
      '',
    ].join('\n'),
    'utf8',
  );
  await mkdir(resolve(temporaryRepositoryRoot, 'migrations'), { recursive: true });
  await writeFile(
    resolve(temporaryRepositoryRoot, 'migrations', '001.sql'),
    '-- migration\n',
    'utf8',
  );
  return temporaryRepositoryRoot;
}

/**
 * Creates one temporary repo with profile-level adapters tool override and no base adapters block.
 * @returns Temporary repository absolute path.
 */
async function createProfileOnlyAdaptersFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-profile-adapters-'));
  const workspaceRoot = resolve(temporaryRepositoryRoot, '.repo-ai-governor');
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
      '  defaultLocale: zh-CN',
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - zh-CN',
      '    - en-US',
      'profiles:',
      '  tool-only:',
      '    adapters:',
      '      tools:',
      '        - toolId: github-copilot',
      '          enabled: true',
      '          availability: degraded',
      '',
    ].join('\n'),
    'utf8',
  );
  return temporaryRepositoryRoot;
}

/**
 * Creates one temporary repo that configures a blocked plugin memory provider module.
 * @returns Temporary repository absolute path.
 */
async function createBlockedMemoryProviderFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-memory-plugin-'));
  const workspaceRoot = resolve(temporaryRepositoryRoot, '.repo-ai-governor');
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
      '  defaultLocale: zh-CN',
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - zh-CN',
      '    - en-US',
      'memory:',
      '  storeEngine: fs_csv',
      '  storeRoot: context/memory',
      '  provider:',
      '    module: "@acme/memory-provider-postgres"',
      '    exportName: "createMemoryStoreProvider"',
      '',
    ].join('\n'),
    'utf8',
  );
  return temporaryRepositoryRoot;
}

/**
 * Creates one temporary repo with explicit repo-local workspace config for workspace-command tests.
 * @returns Temporary repository absolute path.
 */
async function createWorkspaceMigrationFixtureRepo(
  options: {
    uiTheme?: 'governor' | 'catppuccin' | 'calm';
  } = {},
): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-workspace-'));
  const workspaceRoot = resolve(temporaryRepositoryRoot, '.repo-ai-governor');
  await mkdir(resolve(workspaceRoot, 'context', 'memory'), { recursive: true });
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
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - en-US',
      ...(options.uiTheme ? ['ui:', '  react:', `    theme: ${options.uiTheme}`] : []),
      'memory:',
      '  storeEngine: fs_csv',
      '  storeRoot: context/memory',
      '',
    ].join('\n'),
    'utf8',
  );
  return temporaryRepositoryRoot;
}

/**
 * Creates one temporary repo with an active plan stream and sprint Task Package inputs.
 * @returns Temporary repository absolute path.
 */
async function createPlanFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-plan-'));
  const workspaceRoot = resolve(temporaryRepositoryRoot, '.repo-ai-governor');
  const projectId = 'project-042-plan-output-fixture';
  const sprintId = 'sprint-002-plan-output-fixture';
  const existingTaskId = 'TK-523';
  const docsRootRelative = `.repo-ai-governor/context/dev/${projectId}`;
  const sprintRootRelative = `${docsRootRelative}/${sprintId}`;
  const tasksRelative = `${sprintRootRelative}/tasks/`;
  const reviewRelative = `${sprintRootRelative}/review/`;
  const checklistRelative = `${tasksRelative}checklist.md`;
  const csvRelative = `${tasksRelative}tasks.csv`;
  const tasksDirPath = resolve(workspaceRoot, 'context', 'dev', projectId, sprintId, 'tasks');
  const reviewDirPath = resolve(workspaceRoot, 'context', 'dev', projectId, sprintId, 'review');
  const sprintPlanPath = resolve(workspaceRoot, 'context', 'dev', projectId, sprintId, 'plan.md');
  const projectPlanPath = resolve(workspaceRoot, 'context', 'dev', projectId, 'plan.md');

  await mkdir(resolve(workspaceRoot, 'context', 'memory'), { recursive: true });
  await mkdir(tasksDirPath, { recursive: true });
  await mkdir(reviewDirPath, { recursive: true });
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
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - en-US',
      'memory:',
      '  storeEngine: fs_csv',
      '  storeRoot: context/memory',
      '',
    ].join('\n'),
    'utf8',
  );
  await writeFile(
    resolve(workspaceRoot, 'context', 'current-context.md'),
    [
      '# Workspace Current Context',
      '',
      '## Primary Stream',
      '',
      '- Status: active',
      `- Project: \`${projectId}\``,
      `- Sprint: \`${sprintId}\``,
      `- Docs root: \`${docsRootRelative}\``,
      `- Task records: \`${tasksRelative}\``,
      `- Review records: \`${reviewRelative}\``,
      '',
      '## Active Streams',
      '',
      `- \`active-1\`: role=\`primary\`, project=\`${projectId}\`, sprint=\`${sprintId}\`, docs=\`${docsRootRelative}\`, plan=\`${docsRootRelative}/plan.md\`, tasks=\`${tasksRelative}\`, checklist=\`${checklistRelative}\`, csv=\`${csvRelative}\`, review=\`${reviewRelative}\`, status=\`active\`, note=\`fixture for plan output tests\``,
      '',
    ].join('\n'),
    'utf8',
  );
  await writeFile(
    projectPlanPath,
    [
      `# ${projectId} 计划`,
      '',
      '- Status: active',
      '- Date: 2026-04-04',
      '- Stage Mapping: fixture',
      '',
      '## 1. 目标',
      '',
      '1. Validate plan CLI output and commit contract.',
      '',
    ].join('\n'),
    'utf8',
  );
  await writeFile(
    sprintPlanPath,
    [
      `# ${sprintId} 计划`,
      '',
      '- Status: active',
      '- Date: 2026-04-04',
      `- Project: \`${projectId}\``,
      '- Sprint Goal: Productize plan preview and commit.',
      '',
      '## 1. Task Package',
      '',
      `1. \`${existingTaskId}\` keep existing plan preview baseline`,
      '2. align plan commit presenter and regression acceptance',
      '',
      '## 2. Exit Criteria',
      '',
      '1. plan preview and commit artifacts remain replayable and diagnosable.',
      '',
    ].join('\n'),
    'utf8',
  );
  await writeFile(
    resolve(tasksDirPath, `${existingTaskId}-keep-existing-plan-preview-baseline.md`),
    [
      `# ${existingTaskId} keep existing plan preview baseline`,
      '',
      '- Status: planned',
      '- Date: 2026-04-04',
      '- Owner: AI-Agent',
      '- Priority: P0',
      `- Project: \`${projectId}\``,
      `- Sprint: \`${sprintId}\``,
      '',
      '## 1. 任务目标',
      '',
      '保留现有 plan preview 基线，并为 commit 契约回归提供输入。',
      '',
      '## 2. Depends On',
      '',
      '1. `session.main` planning contract',
      '',
      '## 3. 预期产物',
      '',
      '1. 现有 preview 基线',
      '',
      '## 4. Required Inputs',
      '',
      `1. \`${sprintPlanPath}\``,
      `2. \`${projectPlanPath}\``,
      '',
      '## 5. Traceback References',
      '',
      '1. `context/plan/*.preview.json`',
      '',
      '## 6. 实施计划',
      '',
      '1. 保持 preview 行为稳定。',
      '',
      '## 7. Development Verification',
      '',
      '1. 覆盖 plan 输出契约测试。',
      '',
      '## 8. Delivery Verification',
      '',
      '1. 覆盖 plan commit 受控提交测试。',
      '',
      '## 9. 执行记录',
      '',
      '1. 2026-04-04：任务创建，状态初始化为 `planned`。',
      '',
      '## 10. 产出',
      '',
      '1. 待执行：keep existing plan preview baseline',
      '',
    ].join('\n'),
    'utf8',
  );

  return temporaryRepositoryRoot;
}

/**
 * Creates one isolated HOME directory with a persisted global CLI theme preference file.
 * @param themePreset Global React-shell theme preset to persist.
 * @returns Absolute HOME directory used by the preference file.
 */
async function createGlobalThemePreferenceHome(
  themePreset: 'governor' | 'catppuccin' | 'calm',
): Promise<string> {
  const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-theme-home-'));
  await mkdir(resolve(temporaryHomeRoot, '.repo-ai-governor'), { recursive: true });
  await writeFile(
    resolve(temporaryHomeRoot, '.repo-ai-governor', 'cli-preferences.yaml'),
    ['ui:', '  react:', `    theme: ${themePreset}`, ''].join('\n'),
    'utf8',
  );
  return temporaryHomeRoot;
}

/**
 * Creates one temporary repo with initialized workspace baseline for workflow preview tests.
 * @returns Temporary repository absolute path.
 */
async function createWorkflowPreviewFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-workflow-'));
  const workspaceRoot = resolve(temporaryRepositoryRoot, '.repo-ai-governor');
  await mkdir(resolve(workspaceRoot, 'context', 'memory'), { recursive: true });
  await mkdir(resolve(workspaceRoot, 'context', 'compiled-ir'), { recursive: true });
  const schemaVersion = '1.1';
  await writeFile(
    resolve(workspaceRoot, 'governor.yaml'),
    [
      `schemaVersion: "${schemaVersion}"`,
      'workspace:',
      '  mode: repo_local',
      ...(schemaVersion === '1.1' ? ['  migrationPolicy: copy_verify_switch_rollback'] : []),
      'i18n:',
      '  runtimeEngine: i18next',
      '  defaultLocale: en-US',
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - en-US',
      'memory:',
      '  storeEngine: fs_csv',
      '  storeRoot: context/memory',
      '',
    ].join('\n'),
    'utf8',
  );
  return temporaryRepositoryRoot;
}

/**
 * Creates one temporary repo with a legacy v1.0 config for upgrade apply/rollback output tests.
 * @returns Temporary repository absolute path.
 */
async function createLegacyUpgradeFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-upgrade-'));
  const workspaceRoot = resolve(temporaryRepositoryRoot, '.repo-ai-governor');
  await mkdir(resolve(workspaceRoot, 'context', 'memory'), { recursive: true });
  await writeFile(
    resolve(workspaceRoot, 'governor.yaml'),
    [
      'schemaVersion: "1.0"',
      'workspace:',
      '  mode: repo_local',
      'i18n:',
      '  runtimeEngine: i18next',
      '  defaultLocale: en-US',
      '  fallbackLocale: en-US',
      '  supportedLocales:',
      '    - en-US',
      'memory:',
      '  storeEngine: fs_csv',
      '  storeRoot: context/memory',
      '',
    ].join('\n'),
    'utf8',
  );
  return temporaryRepositoryRoot;
}

/**
 * Creates one empty temporary repository root for first-time `init` bootstrap tests.
 * @returns Temporary repository absolute path.
 */
async function createFirstTimeInitFixtureRepo(): Promise<string> {
  return mkdtemp(resolve(tmpdir(), 'cli-output-first-init-'));
}

describe('CLI output contract integration', () => {
  it('renders stable JSON schema in --output json mode', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'init'],
      io,
    );

    const payload = JSON.parse(stdoutBuffer.join(''));

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(payload.schema_version).toBe('cli_output_v1');
    expect(payload.status).toBe('success');
    expect(payload.output_mode).toBe('json');
    expect(payload.verbosity).toBe('normal');
    expect(payload.command).toBe('init');
    expect(payload.runtime.is_tty).toBe(false);
    expect(payload.runtime.downgraded_from).toBeNull();
    expect(payload.message).toContain('Initialized workspace at');
    expect(payload.command_result.operation).toBe('workspace_init');
  });

  it('writes canonical user-local defaults through config set in JSON mode', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-config-home-'));
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const userConfigPath = resolve(temporaryHomeRoot, '.repo-ai-governor', 'user-config.yaml');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'config',
          'set',
          'ui.react.theme',
          'calm',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));
      const userConfigContent = await readFile(userConfigPath, 'utf8');

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('config');
      expect(payload.command_result.operation).toBe('user_config_set');
      expect(payload.command_result.details.key_path).toBe('ui.react.theme');
      expect(payload.command_result.details.value).toBe('calm');
      expect(userConfigContent).toContain('theme: calm');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('reads legacy cli-preferences theme through config get before canonical migration writes occur', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await createGlobalThemePreferenceHome('catppuccin');
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'config',
          'get',
          'ui.react.theme',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command_result.operation).toBe('user_config_get');
      expect(payload.command_result.details.value).toBe('catppuccin');
      expect(payload.command_result.details.legacy_preference_exists).toBe(true);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('keeps a cleared global theme unset even when a legacy preference file still exists', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await createGlobalThemePreferenceHome('catppuccin');
    const firstRun = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const secondRun = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const userConfigPath = resolve(temporaryHomeRoot, '.repo-ai-governor', 'user-config.yaml');

    try {
      const unsetExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'config',
          'unset',
          'ui.react.theme',
        ],
        firstRun.io,
      );
      const unsetPayload = JSON.parse(firstRun.stdoutBuffer.join(''));

      expect(unsetExitCode).toBe(0);
      expect(firstRun.stderrBuffer.join('')).toBe('');
      expect(unsetPayload.command_result.operation).toBe('user_config_unset');
      expect(await readFile(userConfigPath, 'utf8')).toContain('theme: null');

      const getExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'config',
          'get',
          'ui.react.theme',
        ],
        secondRun.io,
      );
      const getPayload = JSON.parse(secondRun.stdoutBuffer.join(''));

      expect(getExitCode).toBe(0);
      expect(secondRun.stderrBuffer.join('')).toBe('');
      expect(getPayload.command_result.details.value).toBeNull();
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('does not persist the legacy theme when another canonical config key is updated', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await createGlobalThemePreferenceHome('catppuccin');
    const firstRun = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const secondRun = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const userConfigPath = resolve(temporaryHomeRoot, '.repo-ai-governor', 'user-config.yaml');

    try {
      const setExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'config',
          'set',
          'workspace.mode_preference',
          'tool_managed',
        ],
        firstRun.io,
      );
      const setPayload = JSON.parse(firstRun.stdoutBuffer.join(''));

      expect(setExitCode).toBe(0);
      expect(firstRun.stderrBuffer.join('')).toBe('');
      expect(setPayload.command_result.operation).toBe('user_config_set');
      expect(await readFile(userConfigPath, 'utf8')).not.toContain('theme:');

      const getExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'config',
          'get',
          'ui.react.theme',
        ],
        secondRun.io,
      );
      const getPayload = JSON.parse(secondRun.stdoutBuffer.join(''));

      expect(getExitCode).toBe(0);
      expect(secondRun.stderrBuffer.join('')).toBe('');
      expect(getPayload.command_result.details.value).toBe('catppuccin');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('does not auto-bootstrap a workspace for user-local config and secret status commands', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-user-local-home-'));
    const configRun = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const secretRun = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const workspaceBootstrapRoot = resolve(temporaryHomeRoot, '.repo-ai-governor', 'workspaces');

    try {
      const configExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'config', 'status'],
        configRun.io,
      );
      const configPayload = JSON.parse(configRun.stdoutBuffer.join(''));

      expect(configExitCode).toBe(0);
      expect(configRun.stderrBuffer.join('')).toBe('');
      expect(configPayload.command_result.operation).toBe('user_config_status');
      expect(existsSync(workspaceBootstrapRoot)).toBe(false);

      const secretExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'secret', 'status'],
        secretRun.io,
      );
      const secretPayload = JSON.parse(secretRun.stdoutBuffer.join(''));

      expect(secretExitCode).toBe(0);
      expect(secretRun.stderrBuffer.join('')).toBe('');
      expect(secretPayload.command_result.operation).toBe('secret_status');
      expect(existsSync(workspaceBootstrapRoot)).toBe(false);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('imports secrets through the unsafe fallback backend and lists managed records in JSON mode', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-secret-home-'));
    const environmentOverrides = {
      HOME: temporaryHomeRoot,
      OPENAI_API_KEY: '  sk-test-unsafe-local-file  ',
    };
    const firstRun = createBufferedIo(false, temporaryRepositoryRoot, environmentOverrides);
    const secondRun = createBufferedIo(false, temporaryRepositoryRoot, environmentOverrides);
    const secretFilePath = resolve(temporaryHomeRoot, '.repo-ai-governor', 'secrets.json');
    const secretIndexPath = resolve(temporaryHomeRoot, '.repo-ai-governor', 'secret-index.json');

    try {
      const importExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'secret',
          'import',
          'openai/api-key',
          '--backend',
          'unsafe-local-file',
          '--from-env',
          'OPENAI_API_KEY',
        ],
        firstRun.io,
      );
      const importPayload = JSON.parse(firstRun.stdoutBuffer.join(''));
      const secretFileContent = await readFile(secretFilePath, 'utf8');
      const secretIndexContent = await readFile(secretIndexPath, 'utf8');
      const parsedSecretFileContent = JSON.parse(secretFileContent) as {
        secrets: Record<string, string>;
      };

      expect(importExitCode).toBe(0);
      expect(firstRun.stderrBuffer.join('')).toBe('');
      expect(importPayload.command).toBe('secret');
      expect(importPayload.command_result.operation).toBe('secret_import');
      expect(importPayload.command_result.details.backend).toBe('unsafe-local-file');
      expect(parsedSecretFileContent.secrets['openai/api-key']).toBe(
        '  sk-test-unsafe-local-file  ',
      );
      expect(secretIndexContent).toContain('openai/api-key');

      const listExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'secret', 'list'],
        secondRun.io,
      );
      const listPayload = JSON.parse(secondRun.stdoutBuffer.join(''));

      expect(listExitCode).toBe(0);
      expect(secondRun.stderrBuffer.join('')).toBe('');
      expect(listPayload.command_result.operation).toBe('secret_list');
      expect(listPayload.command_result.details.records).toContain(
        'openai/api-key@unsafe-local-file:present',
      );
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('localizes config validation errors and guidance in zh-CN JSON mode', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-config-error-home-'));
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'zh-CN',
          '--output',
          'json',
          'config',
          'set',
          'workspace.mode_preference',
          'invalid-mode',
        ],
        io,
      );
      const payload = JSON.parse(stderrBuffer.join(''));

      expect(exitCode).toBe(1);
      expect(stdoutBuffer.join('')).toBe('');
      expect(payload.error_code).toBe('USER_CONFIG_VALUE_INVALID');
      expect(payload.message).toContain('workspace.mode_preference 必须是');
      expect(payload.hint).toContain('用户本地配置或 secret 输入无效');
      expect(payload.next_action).toBe('check_command_usage');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('localizes secret input errors and guidance in zh-CN JSON mode', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-secret-error-home-'));
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'zh-CN',
          '--output',
          'json',
          'secret',
          'set',
          'openai/api-key',
        ],
        io,
      );
      const payload = JSON.parse(stderrBuffer.join(''));

      expect(exitCode).toBe(1);
      expect(stdoutBuffer.join('')).toBe('');
      expect(payload.error_code).toBe('SECRET_INPUT_INVALID');
      expect(payload.message).toContain('secret set 在非交互模式下必须使用 --stdin');
      expect(payload.hint).toContain('用户本地配置或 secret 输入无效');
      expect(payload.next_action).toBe('check_command_usage');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('surfaces configured codex exec fixture mode in JSON diagnostics', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, process.cwd(), {
      [CliCodexExecFixtureEnvironmentKey.ENABLE_FIXTURES]: '1',
      [CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]: CliCodexExecFixtureMode.SUCCESS,
    });

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'init'],
      io,
    );
    const payload = JSON.parse(stdoutBuffer.join(''));

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(payload.diagnostics.codexExecFixture).toBe(CliCodexExecFixtureMode.SUCCESS);
  });

  it('surfaces configured github copilot exec fixture mode in JSON diagnostics', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, process.cwd(), {
      [CliGithubCopilotExecFixtureEnvironmentKey.ENABLE_FIXTURES]: '1',
      [CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]:
        CliGithubCopilotExecFixtureMode.SUCCESS,
    });

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'init'],
      io,
    );
    const payload = JSON.parse(stdoutBuffer.join(''));

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(payload.diagnostics.githubCopilotExecFixture).toBe(
      CliGithubCopilotExecFixtureMode.SUCCESS,
    );
  });

  it('downgrades pretty to plain in non-TTY environment', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'pretty', 'init'],
      io,
    );

    const stdout = stdoutBuffer.join('');

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdout).toContain('outputMode=plain');
    expect(stdout).not.toContain('\u001b[');
  });

  it('honors --no-color in pretty mode when stdout is TTY', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'pretty', '--no-color', 'init'],
      io,
    );

    const stdout = stdoutBuffer.join('');

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdout).toContain('repo-ai-governor: command succeeded');
    expect(stdout).not.toContain('\u001b[');
  });

  it('skips interactive bootstrap with --no-interactive in TTY pretty first-time init', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--workspace-mode',
          'repo_local',
          '--no-interactive',
          'init',
        ],
        io,
      );

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(stdoutBuffer.join('')).toContain('repo-ai-governor: command succeeded');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('accepts --ui react while preserving no-interactive fallback semantics', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--ui',
          'react',
          '--no-interactive',
          'init',
        ],
        io,
      );

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(stdoutBuffer.join('')).toContain('repo-ai-governor: command succeeded');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('routes a no-subcommand TTY pretty entry into the default session shell', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true);
    const progressSink = {
      publish: vi.fn(),
    };
    const abortController = new AbortController();
    const sessionShellRunner = {
      run: vi.fn(async () => createStubSessionShellResult()),
    };

    const exitCode = await runCli(['node', 'repo-ai-governor', '--locale', 'en-US'], io, {
      sessionShellRunner: sessionShellRunner as never,
      nestedCommandExecutionOptions: {
        progressSink,
        abortSignal: abortController.signal,
      },
    });

    expect(exitCode).toBe(0);
    expect(sessionShellRunner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        currentWorkingDirectory: process.cwd(),
        outputMode: 'pretty',
        commandExecutionOptions: {
          progressSink,
          abortSignal: abortController.signal,
        },
      }),
    );
    expect(stdoutBuffer.join('')).toBe('');
    expect(stderrBuffer.join('')).toBe('');
  });

  it('forwards nested command execution options into the interactive resume entrypoint', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true);
    const progressSink = {
      publish: vi.fn(),
    };
    const abortController = new AbortController();
    const sessionShellRunner = {
      run: vi.fn(async () => createStubSessionShellResult()),
    };

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', 'resume', 'session-123'],
      io,
      {
        sessionShellRunner: sessionShellRunner as never,
        nestedCommandExecutionOptions: {
          progressSink,
          abortSignal: abortController.signal,
        },
      },
    );

    expect(exitCode).toBe(0);
    expect(sessionShellRunner.run).toHaveBeenCalledWith(
      expect.objectContaining({
        resumeOnStartup: true,
        requestedSessionId: 'session-123',
        commandExecutionOptions: {
          progressSink,
          abortSignal: abortController.signal,
        },
      }),
    );
    expect(stdoutBuffer.join('')).toBe('');
    expect(stderrBuffer.join('')).toBe('');
  });

  it('keeps no-subcommand help fallback when interactive entry is disabled', async () => {
    const { stdoutBuffer, io } = createBufferedIo(true);
    const sessionShellRunner = {
      run: vi.fn(async () => createStubSessionShellResult()),
    };

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--no-interactive'],
      io,
      {
        sessionShellRunner: sessionShellRunner as never,
      },
    );

    expect(exitCode).toBe(0);
    expect(sessionShellRunner.run).not.toHaveBeenCalled();
    expect(stdoutBuffer.join('')).toContain('set-ui-theme');
    expect(stdoutBuffer.join('')).toContain('workflow');
  });

  it('falls back to help output when the default session shell fails before startup', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true);
    const sessionShellRunner = {
      run: vi.fn(async () => {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          'session shell failed in a preflight test fixture',
        );
      }),
    };

    const exitCode = await runCli(['node', 'repo-ai-governor', '--locale', 'en-US'], io, {
      sessionShellRunner: sessionShellRunner as never,
    });

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toContain('fell back to help output');
    expect(stdoutBuffer.join('')).toContain('workspace');
    expect(stdoutBuffer.join('')).toContain('workflow');
  });

  it('forwards nested command progress relays even when the re-entered CLI runs in json no-interactive mode', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const progressEvents: CliCommandProgressEvent[] = [];

    try {
      const exitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'connect'],
        io,
        {
          nestedCommandExecutionOptions: {
            progressSink: {
              publish: (event) => {
                progressEvents.push(event);
              },
            },
            suppressLiveProgressPresenter: true,
          },
        },
      );
      const payload = JSON.parse(stdoutBuffer.join(''));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('connect');
      expect(progressEvents[0]).toEqual(
        expect.objectContaining({
          commandName: 'connect',
          runState: 'running',
        }),
      );
      expect(progressEvents.some((event) => event.row?.id === 'candidate-config')).toBe(true);
      expect(progressEvents.at(-1)).toEqual(
        expect.objectContaining({
          commandName: 'connect',
          runState: 'success',
        }),
      );
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('emits doctor nested progress relays in json no-interactive mode', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const progressEvents: CliCommandProgressEvent[] = [];

    try {
      const exitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'doctor'],
        io,
        {
          nestedCommandExecutionOptions: {
            progressSink: {
              publish: (event) => {
                progressEvents.push(event);
              },
            },
            suppressLiveProgressPresenter: true,
          },
        },
      );
      const payload = JSON.parse(stdoutBuffer.join(''));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('doctor');
      expect(progressEvents[0]).toEqual(
        expect.objectContaining({
          commandName: 'doctor',
          runState: 'running',
        }),
      );
      expect(progressEvents.some((event) => event.row?.id === 'workspace-baseline')).toBe(true);
      expect(progressEvents.at(-1)).toEqual(
        expect.objectContaining({
          commandName: 'doctor',
          runState: 'success',
        }),
      );
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('returns a structured migration error when the removed verify command is invoked in json mode', async () => {
    const fixtureRepositoryRoot = await createProfileOnlyAdaptersFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, fixtureRepositoryRoot, {
      PATH: '',
      Path: '',
    });
    const progressEvents: CliCommandProgressEvent[] = [];

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          '--profile',
          'tool-only',
          'verify',
          '--adapters',
        ],
        io,
        {
          nestedCommandExecutionOptions: {
            progressSink: {
              publish: (event) => {
                progressEvents.push(event);
              },
            },
            suppressLiveProgressPresenter: true,
          },
        },
      );
      const payload = JSON.parse(stderrBuffer.join(''));

      expect(exitCode).toBe(1);
      expect(stdoutBuffer.join('')).toBe('');
      expect(payload.command).toBe('verify');
      expect(payload.status).toBe('error');
      expect(payload.output_mode).toBe('json');
      expect(payload.error_code).toBe('ENTRYPOINT_COMMAND_WRAPPER_INVALID');
      expect(payload.message).toContain('public `verify` command has been removed');
      expect(payload.message).toContain('doctor');
      expect(payload.message).toContain('connect');
      expect(progressEvents).toEqual([]);
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('does not trigger interactive bootstrap when pretty output is downgraded in non-TTY first-time init', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--workspace-mode',
          'repo_local',
          'init',
        ],
        io,
      );

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(stdoutBuffer.join('')).toContain('outputMode=plain');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('renders workspace migration dry-run output in stable JSON shape', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const managedRoot = resolve(temporaryRepositoryRoot, 'managed-root');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          '--workspace-action',
          'dry-run',
          '--workspace-mode',
          'tool_managed',
          '--workspace-root',
          managedRoot,
          'workspace',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('workspace');
      expect(payload.command_result.operation).toBe('workspace_migration_plan');
      expect(payload.command_result.details.action).toBe('dry_run');
      expect(payload.command_result.details.target_workspace_mode).toBe('tool_managed');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('renders plan preview output in stable JSON shape', async () => {
    const temporaryRepositoryRoot = await createPlanFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'plan'],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('plan');
      expect(payload.command_result.operation).toBe('plan_preview');
      expect(payload.command_result.details.commit_readiness).toBe('ready');
      expect(payload.command_result.details.task_package_total).toBe(2);
      expect(payload.command_result.artifacts[0].id).toBe('plan_preview');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('renders actionable plan help with preview and commit guidance', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', 'plan', '--help'],
      io,
    );
    const stdout = stdoutBuffer.join('');

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdout).toContain('Usage: repo-ai-governor plan [options] [action] [artifact]');
    expect(stdout).toContain('--confirm-plan <decision>');
    expect(stdout).toContain('Action guide:');
    expect(stdout).toContain('preview');
    expect(stdout).toContain('commit');
    expect(stdout).toContain('repo-ai-governor plan --output pretty');
    expect(stdout).toContain(
      'repo-ai-governor plan commit ./context/plan/plan-1234567890.preview.json --confirm-plan approve --output pretty',
    );
  });

  it('renders actionable workspace help instead of an empty command shell', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', 'workspace', '--help'],
      io,
    );
    const stdout = stdoutBuffer.join('');

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdout).toContain('Usage: repo-ai-governor workspace [options]');
    expect(stdout).toContain('--workspace-action <action>');
    expect(stdout).toContain('--workspace-mode <mode>');
    expect(stdout).toContain('--workspace-plan <path>');
    expect(stdout).toContain('--theme-scope <scope>');
    expect(stdout).toContain('--ui-theme <theme>');
    expect(stdout).toContain('Action guide:');
    expect(stdout).toContain('Available themes:');
    expect(stdout).toContain('governor');
    expect(stdout).toContain('catppuccin');
    expect(stdout).toContain('calm');
    expect(stdout).toContain('Run set-ui-theme or workspace set-ui-theme without [theme]');
    expect(stdout).toContain('set-ui-theme');
    expect(stdout).toContain('repo-ai-governor workspace clear-config --output pretty');
    expect(stdout).toContain('repo-ai-governor workspace set-ui-theme --output pretty');
    expect(stdout).toContain('repo-ai-governor set-ui-theme --output pretty');
    expect(stdout).toContain('repo-ai-governor set-ui-theme calm --output pretty');
    expect(stdout).toContain(
      'repo-ai-governor set-ui-theme calm --theme-scope workspace --output pretty',
    );
  });

  it('renders connect help with catalog-backed governed capability guidance', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', 'connect', '--help'],
      io,
    );
    const stdout = stdoutBuffer.join('');

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdout).toContain('Usage: repo-ai-governor connect [options] [action] [candidate]');
    expect(stdout).toContain('--remote-api-model <binding>');
    expect(stdout).toContain('--remote-api-credential-env-var <binding>');
    expect(stdout).toContain('--remote-api-endpoint <binding>');
    expect(stdout).toContain('Session.main governed capability: Connect');
    expect(stdout).toContain('Suggested slash command: /connect');
    expect(stdout).toContain('Execution path: direct execute (no extra confirmation)');
    expect(stdout).toContain('Example prompts:');
    expect(stdout).toContain('Help me connect Codex and Claude Code.');
    expect(stdout).toContain(
      'repo-ai-governor connect --tools codex --remote-api-model codex=gpt-5 --output pretty',
    );
    expect(stdout).toContain('Related capabilities:');
    expect(stdout).toContain('/doctor');
    expect(stdout).not.toContain('/verify');
  });

  it('renders top-level set-ui-theme help with direct examples', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', 'set-ui-theme', '--help'],
      io,
    );
    const stdout = stdoutBuffer.join('');

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdout).toContain('Usage: repo-ai-governor set-ui-theme [options] [theme]');
    expect(stdout).toContain('--theme-scope <scope>');
    expect(stdout).toContain('Theme precedence:');
    expect(stdout).toContain('Available themes:');
    expect(stdout).toContain('repo-ai-governor set-ui-theme --output pretty');
    expect(stdout).toContain('repo-ai-governor set-ui-theme calm --output pretty');
    expect(stdout).toContain(
      'repo-ai-governor set-ui-theme calm --theme-scope workspace --output pretty',
    );
  });

  it('renders workspace migration dry-run key details in pretty mode', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot);
    const managedRoot = resolve(temporaryRepositoryRoot, 'managed root');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--no-color',
          '--ui-theme',
          'catppuccin',
          '--workspace-action',
          'dry-run',
          '--workspace-mode',
          'tool_managed',
          '--workspace-root',
          managedRoot,
          'workspace',
        ],
        io,
      );
      const stdout = stdoutBuffer.join('');
      const stderr = stderrBuffer.join('');

      expect(exitCode).toBe(0);
      expect(stderr).toContain('[react-shell:workspace]');
      expect(stderr).toContain('theme=catppuccin');
      expect(stderr).toContain('Plan or execute workspace migration');
      expect(stdout).toContain('Key Details');
      expect(stdout).toContain('Workspace action: dry_run');
      expect(stdout).toContain(`Workspace target: mode tool_managed, root ${managedRoot}`);
      expect(stdout).toContain('Rollback reference:');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('renders plan preview key details in pretty mode', async () => {
    const temporaryRepositoryRoot = await createPlanFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--no-color',
          'plan',
        ],
        io,
      );
      const stdout = stdoutBuffer.join('');

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(stdout).toContain('Plan task package: 2 tasks, 1 create, 1 retain');
      expect(stdout).toContain('Plan commit readiness: readiness ready, 0 missing fields');
      expect(stdout).toContain(
        'Plan ledger projection: plan.md update, checklist.md append, tasks.csv append, TK files create',
      );
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('uses governor.yaml ui.react.theme as the default React shell theme', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo({
      uiTheme: 'calm',
    });
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot);
    const managedRoot = resolve(temporaryRepositoryRoot, 'managed root');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--no-color',
          '--workspace-action',
          'dry-run',
          '--workspace-mode',
          'tool_managed',
          '--workspace-root',
          managedRoot,
          'workspace',
        ],
        io,
      );

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toContain('theme=calm');
      expect(stdoutBuffer.join('')).toContain('Workspace action: dry_run');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('uses the global CLI theme preference when the workspace config does not define a theme', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const temporaryHomeRoot = await createGlobalThemePreferenceHome('catppuccin');
    const { stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const managedRoot = resolve(temporaryRepositoryRoot, 'managed root');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--no-color',
          '--workspace-action',
          'dry-run',
          '--workspace-mode',
          'tool_managed',
          '--workspace-root',
          managedRoot,
          'workspace',
        ],
        io,
      );

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toContain('theme=catppuccin');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('lets the workspace theme override the global CLI theme preference', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo({
      uiTheme: 'calm',
    });
    const temporaryHomeRoot = await createGlobalThemePreferenceHome('catppuccin');
    const { stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const managedRoot = resolve(temporaryRepositoryRoot, 'managed root');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--no-color',
          '--workspace-action',
          'dry-run',
          '--workspace-mode',
          'tool_managed',
          '--workspace-root',
          managedRoot,
          'workspace',
        ],
        io,
      );

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toContain('theme=calm');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('lets --ui-theme override workspace and global theme defaults for one command run', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo({
      uiTheme: 'calm',
    });
    const temporaryHomeRoot = await createGlobalThemePreferenceHome('governor');
    const { stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const managedRoot = resolve(temporaryRepositoryRoot, 'managed root');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--no-color',
          '--ui-theme',
          'catppuccin',
          '--workspace-action',
          'dry-run',
          '--workspace-mode',
          'tool_managed',
          '--workspace-root',
          managedRoot,
          'workspace',
        ],
        io,
      );

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toContain('theme=catppuccin');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('renders workspace clear-config output in stable JSON shape', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const configPath = resolve(temporaryRepositoryRoot, '.repo-ai-governor', 'governor.yaml');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          '--workspace-action',
          'clear-config',
          'workspace',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('workspace');
      expect(payload.command_result.operation).toBe('workspace_config_clear');
      expect(payload.command_result.details.action).toBe('clear_config');
      expect(payload.command_result.details.cleared_path_count).toBe(1);
      expect(payload.command_result.details.cleared_config_paths).toBe(configPath);
      expect(existsSync(configPath)).toBe(false);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('accepts workspace clear-config shorthand without --workspace-action', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const configPath = resolve(temporaryRepositoryRoot, '.repo-ai-governor', 'governor.yaml');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'workspace',
          'clear-config',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command_result.operation).toBe('workspace_config_clear');
      expect(payload.command_result.details.action).toBe('clear_config');
      expect(payload.command_result.details.cleared_config_paths).toBe(configPath);
      expect(existsSync(configPath)).toBe(false);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('persists the requested React shell theme through workspace set-ui-theme in JSON mode', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const configPath = resolve(temporaryRepositoryRoot, '.repo-ai-governor', 'governor.yaml');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          '--workspace-action',
          'set-ui-theme',
          '--ui-theme',
          'calm',
          'workspace',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));
      const configContent = await readFile(configPath, 'utf8');

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('workspace');
      expect(payload.command_result.operation).toBe('workspace_ui_theme_set');
      expect(payload.command_result.details.action).toBe('set_ui_theme');
      expect(payload.command_result.details.ui_theme).toBe('calm');
      expect(payload.command_result.details.persisted_path_count).toBe(1);
      expect(payload.command_result.summary).toContain('workspace config');
      expect(configContent).toContain('ui:');
      expect(configContent).toContain('theme: calm');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('lists available themes when set-ui-theme omits the preset in non-interactive mode', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', 'set-ui-theme'],
        io,
      );
      const renderedOutput = `${stdoutBuffer.join('')}${stderrBuffer.join('')}`;

      expect(exitCode).toBe(1);
      expect(renderedOutput).toContain(
        'governor|copilot|catppuccin|calm|tokyo-night|kanagawa|flexoki',
      );
      expect(renderedOutput).toContain('omit [theme] to open the selector');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('persists the requested React shell theme into the global CLI preference file through top-level set-ui-theme by default', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-theme-default-global-'));
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const configPath = resolve(temporaryRepositoryRoot, '.repo-ai-governor', 'governor.yaml');
    const globalPreferencePath = resolve(
      temporaryHomeRoot,
      '.repo-ai-governor',
      'user-config.yaml',
    );
    const originalConfigContent = await readFile(configPath, 'utf8');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'set-ui-theme',
          'calm',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));
      const globalPreferenceContent = await readFile(globalPreferencePath, 'utf8');
      const updatedConfigContent = await readFile(configPath, 'utf8');

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('set-ui-theme');
      expect(payload.command_result.operation).toBe('workspace_ui_theme_set');
      expect(payload.command_result.details.action).toBe('set_ui_theme');
      expect(payload.command_result.details.ui_theme).toBe('calm');
      expect(payload.command_result.details.theme_scope).toBe('global');
      expect(payload.command_result.summary).toContain('global user-config');
      expect(globalPreferenceContent).toContain('theme: calm');
      expect(updatedConfigContent).toBe(originalConfigContent);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('lets top-level set-ui-theme explicitly target workspace scope in JSON mode', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-theme-global-'));
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const configPath = resolve(temporaryRepositoryRoot, '.repo-ai-governor', 'governor.yaml');
    const globalPreferencePath = resolve(
      temporaryHomeRoot,
      '.repo-ai-governor',
      'user-config.yaml',
    );

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'set-ui-theme',
          'catppuccin',
          '--theme-scope',
          'workspace',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));
      const updatedConfigContent = await readFile(configPath, 'utf8');

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command_result.operation).toBe('workspace_ui_theme_set');
      expect(payload.command_result.details.theme_scope).toBe('workspace');
      expect(payload.command_result.details.persisted_path_count).toBe(1);
      expect(payload.command_result.details.persisted_config_paths).toBe(configPath);
      expect(updatedConfigContent).toContain('theme: catppuccin');
      expect(existsSync(globalPreferencePath)).toBe(false);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('does not auto-create a workspace config when set-ui-theme runs in global scope before init', async () => {
    const temporaryRepositoryRoot = await createFirstTimeInitFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'cli-output-theme-bootstrap-'));
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot, {
      HOME: temporaryHomeRoot,
    });
    const repoLocalConfigPath = resolve(
      temporaryRepositoryRoot,
      '.repo-ai-governor',
      'governor.yaml',
    );
    const globalPreferencePath = resolve(
      temporaryHomeRoot,
      '.repo-ai-governor',
      'user-config.yaml',
    );

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'set-ui-theme',
          'calm',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));
      const globalPreferenceContent = await readFile(globalPreferencePath, 'utf8');

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command_result.details.theme_scope).toBe('global');
      expect(globalPreferenceContent).toContain('theme: calm');
      expect(existsSync(repoLocalConfigPath)).toBe(false);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('accepts workspace set-ui-theme <theme> shorthand without explicit --workspace-action or --ui-theme', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const configPath = resolve(temporaryRepositoryRoot, '.repo-ai-governor', 'governor.yaml');

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'workspace',
          'set-ui-theme',
          'calm',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));
      const configContent = await readFile(configPath, 'utf8');

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command_result.operation).toBe('workspace_ui_theme_set');
      expect(payload.command_result.details.action).toBe('set_ui_theme');
      expect(payload.command_result.details.ui_theme).toBe('calm');
      expect(configContent).toContain('theme: calm');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('accepts workspace rollback <plan-path> shorthand without --workspace-plan', async () => {
    const temporaryRepositoryRoot = await createWorkspaceMigrationFixtureRepo();
    const managedRoot = resolve(temporaryRepositoryRoot, 'managed-root');

    try {
      {
        const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
        const executeExitCode = await runCli(
          [
            'node',
            'repo-ai-governor',
            '--locale',
            'en-US',
            '--output',
            'json',
            'workspace',
            'execute',
            '--workspace-mode',
            'tool_managed',
            '--workspace-root',
            managedRoot,
          ],
          io,
        );
        const executePayload = JSON.parse(stdoutBuffer.join(''));
        const planPath = String(
          executePayload.command_result.artifacts.find(
            (artifact: { id: string }) => artifact.id === 'workspace_migration_plan',
          ).path,
        );
        const targetWorkspaceRoot = String(
          executePayload.command_result.details.target_workspace_root,
        );

        expect(executeExitCode).toBe(0);
        expect(stderrBuffer.join('')).toBe('');

        const rollbackIo = createBufferedIo(false, temporaryRepositoryRoot);
        const rollbackExitCode = await runCli(
          [
            'node',
            'repo-ai-governor',
            '--locale',
            'en-US',
            '--output',
            'json',
            'workspace',
            'rollback',
            planPath,
          ],
          rollbackIo.io,
        );
        const rollbackPayload = JSON.parse(rollbackIo.stdoutBuffer.join(''));

        expect(rollbackExitCode).toBe(0);
        expect(rollbackIo.stderrBuffer.join('')).toBe('');
        expect(rollbackPayload.command_result.operation).toBe('workspace_migration_rollback');
        expect(rollbackPayload.command_result.details.plan_path).toBe(planPath);
        expect(existsSync(targetWorkspaceRoot)).toBe(false);
      }
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('renders workflow preview JSON without stderr noise or preview file writes', async () => {
    const temporaryRepositoryRoot = await createWorkflowPreviewFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const compiledIrDirectory = resolve(
      temporaryRepositoryRoot,
      '.repo-ai-governor',
      'context',
      'compiled-ir',
    );

    try {
      const beforeEntries = await readdir(compiledIrDirectory);
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'workflow',
          'preview',
          '--workflow-template',
          'loop-guarded',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));
      const afterEntries = await readdir(compiledIrDirectory);

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('workflow');
      expect(payload.command_result.operation).toBe('workflow_preview');
      expect(payload.command_result.details.action).toBe('preview');
      expect(payload.command_result.details.template_id).toBe('loop-guarded');
      expect(payload.command_result.details.preview_mode).toBe('read_only');
      expect(payload.command_result.details.compile_error_count).toBe(0);
      expect(payload.command_result.artifacts ?? []).toEqual([]);
      expect(afterEntries).toEqual(beforeEntries);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('renders workflow create JSON and persists workflow definition artifacts', async () => {
    const temporaryRepositoryRoot = await createWorkflowPreviewFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, temporaryRepositoryRoot);
    const compiledIrDirectory = resolve(
      temporaryRepositoryRoot,
      '.repo-ai-governor',
      'context',
      'compiled-ir',
    );
    const workflowDirectory = resolve(
      temporaryRepositoryRoot,
      '.repo-ai-governor',
      'context',
      'workflow',
    );

    try {
      const beforeEntries = await readdir(compiledIrDirectory);
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'workflow',
          'create',
          '--workflow-template',
          'condition-route',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));
      const afterEntries = await readdir(compiledIrDirectory);

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.command).toBe('workflow');
      expect(payload.command_result.operation).toBe('workflow_create_entry');
      expect(payload.command_result.details.action).toBe('create');
      expect(payload.command_result.details.entry_mode).toBe('create_seed');
      expect(payload.command_result.details.template_id).toBe('condition-route');
      expect(payload.command_result.details.preview_mode).toBeUndefined();
      expect(payload.command_result.details.definition_source).toBe('template_seed');
      expect(payload.command_result.details.definition_path).toContain(
        'active-workflow.definition.json',
      );
      expect(payload.command_result.details.compiled_ir_path).toContain('workflow-create-');
      expect(
        payload.command_result.artifacts?.map((artifact: { id: string }) => artifact.id),
      ).toEqual(['workflow_definition', 'workflow_compiled_ir']);
      expect(afterEntries.length).toBe(beforeEntries.length + 1);
      expect(await readdir(workflowDirectory)).toContain('active-workflow.definition.json');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('defaults workflow preview to React shell on stderr in TTY pretty mode', async () => {
    const temporaryRepositoryRoot = await createWorkflowPreviewFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          'workflow',
          'preview',
          '--workflow-template',
          'condition-route',
        ],
        io,
      );
      const stdout = stdoutBuffer.join('');
      const stderr = stderrBuffer.join('');

      expect(exitCode).toBe(0);
      expect(stderr).toContain('[react-shell:workflow]');
      expect(stderr).toContain('Preview workflow templates or seed workflow editor');
      expect(stdout).toContain('repo-ai-governor: command succeeded');
      expect(stdout).not.toContain('[react-shell:workflow]');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('preserves no-interactive fallback semantics for workflow preview even when ui=react is requested', async () => {
    const temporaryRepositoryRoot = await createWorkflowPreviewFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'pretty',
          '--ui',
          'react',
          '--no-interactive',
          'workflow',
          'preview',
          '--workflow-template',
          'parallel-review',
        ],
        io,
      );

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(stdoutBuffer.join('')).toContain('repo-ai-governor: command succeeded');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('defaults upgrade to React shell on stderr in TTY pretty mode', async () => {
    const temporaryRepositoryRoot = await createWorkflowPreviewFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true, temporaryRepositoryRoot);

    try {
      const exitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'pretty', 'upgrade'],
        io,
      );
      const stdout = stdoutBuffer.join('');
      const stderr = stderrBuffer.join('');

      expect(exitCode).toBe(0);
      expect(stderr).toContain('[react-shell:upgrade]');
      expect(stderr).toContain('Review analyzed upgrade artifacts');
      expect(stdout).toContain('repo-ai-governor: command succeeded');
      expect(stdout).not.toContain('[react-shell:upgrade]');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('parses upgrade apply with explicit confirmation and keeps json output machine-readable', async () => {
    const temporaryRepositoryRoot = await createLegacyUpgradeFixtureRepo();
    const previewIo = createBufferedIo(false, temporaryRepositoryRoot);

    try {
      const previewExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'upgrade'],
        previewIo.io,
      );
      const previewPayload = JSON.parse(previewIo.stdoutBuffer.join('')) as {
        command_result?: {
          details?: {
            report_path?: string;
          };
        };
      };
      const reportPath = previewPayload.command_result?.details?.report_path;
      const applyIo = createBufferedIo(false, temporaryRepositoryRoot);
      const applyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'upgrade',
          'apply',
          String(reportPath),
          '--confirm-upgrade',
          'approve',
        ],
        applyIo.io,
      );
      const applyPayload = JSON.parse(applyIo.stdoutBuffer.join(''));

      expect(previewExitCode).toBe(0);
      expect(reportPath).toBeTypeOf('string');
      expect(applyExitCode).toBe(0);
      expect(applyIo.stderrBuffer.join('')).toBe('');
      expect(applyPayload.command_result.operation).toBe('schema_upgrade_apply');
      expect(applyPayload.command_result.details.apply_status).toBe('applied');
      expect(applyPayload.command_result.details.verify_status).toBe('passed');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('parses upgrade rollback from a rollback snapshot path and keeps json output machine-readable', async () => {
    const temporaryRepositoryRoot = await createLegacyUpgradeFixtureRepo();
    const previewIo = createBufferedIo(false, temporaryRepositoryRoot);

    try {
      const previewExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'upgrade'],
        previewIo.io,
      );
      const previewPayload = JSON.parse(previewIo.stdoutBuffer.join('')) as {
        command_result?: {
          details?: {
            report_path?: string;
            rollback_snapshot_path?: string;
          };
        };
      };
      const reportPath = previewPayload.command_result?.details?.report_path;
      const rollbackSnapshotPath = previewPayload.command_result?.details?.rollback_snapshot_path;
      const applyIo = createBufferedIo(false, temporaryRepositoryRoot);
      const applyExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'upgrade',
          'apply',
          String(reportPath),
          '--confirm-upgrade',
          'approve',
        ],
        applyIo.io,
      );
      const rollbackIo = createBufferedIo(false, temporaryRepositoryRoot);
      const rollbackExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'upgrade',
          'rollback',
          String(rollbackSnapshotPath),
        ],
        rollbackIo.io,
      );
      const rollbackPayload = JSON.parse(rollbackIo.stdoutBuffer.join(''));

      expect(previewExitCode).toBe(0);
      expect(reportPath).toBeTypeOf('string');
      expect(rollbackSnapshotPath).toBeTypeOf('string');
      expect(applyExitCode).toBe(0);
      expect(rollbackExitCode).toBe(0);
      expect(rollbackIo.stderrBuffer.join('')).toBe('');
      expect(rollbackPayload.command_result.operation).toBe('schema_upgrade_rollback');
      expect(rollbackPayload.command_result.details.rollback_source_type).toBe('rollback_snapshot');
      expect(rollbackPayload.command_result.details.rollback_snapshot_path).toBe(
        rollbackSnapshotPath,
      );
      expect(rollbackPayload.command_result.details.verify_status).toBe('passed');
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('parses plan commit with explicit confirmation and keeps json output machine-readable', async () => {
    const temporaryRepositoryRoot = await createPlanFixtureRepo();
    const previewIo = createBufferedIo(false, temporaryRepositoryRoot);

    try {
      const previewExitCode = await runCli(
        ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'plan'],
        previewIo.io,
      );
      const previewPayload = JSON.parse(previewIo.stdoutBuffer.join('')) as {
        command_result?: {
          details?: {
            preview_path?: string;
          };
        };
      };
      const previewPath = previewPayload.command_result?.details?.preview_path;
      const commitIo = createBufferedIo(false, temporaryRepositoryRoot);
      const commitExitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--locale',
          'en-US',
          '--output',
          'json',
          'plan',
          'commit',
          String(previewPath),
          '--confirm-plan',
          'approve',
        ],
        commitIo.io,
      );
      const commitPayload = JSON.parse(commitIo.stdoutBuffer.join(''));

      expect(previewExitCode).toBe(0);
      expect(previewPath).toBeTypeOf('string');
      expect(commitExitCode).toBe(0);
      expect(commitIo.stderrBuffer.join('')).toBe('');
      expect(commitPayload.command_result.operation).toBe('plan_commit');
      expect(commitPayload.command_result.details.commit_status).toBe('committed');
      expect(commitPayload.command_result.details.created_task_count).toBe(1);
      expect(commitPayload.command_result.details.retained_task_count).toBe(1);
    } finally {
      await rm(temporaryRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('collapses pretty output detail blocks when --compact is enabled', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(true);

    const exitCode = await runCli(
      [
        'node',
        'repo-ai-governor',
        '--locale',
        'en-US',
        '--output',
        'pretty',
        '--compact',
        '--no-color',
        'init',
      ],
      io,
    );

    const stdout = stdoutBuffer.join('');

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdout).toContain('Summary');
    expect(stdout).toContain('Artifacts');
    expect(stdout).toContain('artifact(s) generated.');
    expect(stdout).toContain('Primary:');
    expect(stdout).toContain('Context');
    expect(stdout).toContain('Locale=en-US');
    expect(stdout).not.toContain('Output mode:');
  });

  it('outputs structured error fields in JSON mode for invalid command', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'unknown-command'],
      io,
    );

    const payload = JSON.parse(stderrBuffer.join(''));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join('')).toBe('');
    expect(payload.schema_version).toBe('cli_output_v1');
    expect(payload.status).toBe('error');
    expect(payload.output_mode).toBe('json');
    expect(payload.error_code).toBe('ENTRYPOINT_COMMAND_WRAPPER_INVALID');
    expect(payload.hint).toContain('Command name or option values');
    expect(payload.next_action).toBe('check_command_usage');
    expect(payload.command).toBe('unknown-command');
  });

  it('keeps JSON error contract when another global option fails validation', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--output', 'json', '--verbosity', 'invalid', 'init'],
      io,
    );

    const payload = JSON.parse(stderrBuffer.join(''));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join('')).toBe('');
    expect(payload.status).toBe('error');
    expect(payload.output_mode).toBe('json');
    expect(payload.error_code).toBe('ENTRYPOINT_COMMAND_WRAPPER_INVALID');
    expect(payload.command).toBe('init');
  });

  it('keeps JSON error contract when --ui receives an invalid value', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--output', 'json', '--ui', 'invalid-ui', 'init'],
      io,
    );

    const payload = JSON.parse(stderrBuffer.join(''));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join('')).toBe('');
    expect(payload.status).toBe('error');
    expect(payload.output_mode).toBe('json');
    expect(payload.error_code).toBe('ENTRYPOINT_COMMAND_WRAPPER_INVALID');
    expect(payload.command).toBe('init');
  });

  it('keeps JSON error contract when --ui-theme receives an invalid value', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--output', 'json', '--ui-theme', 'invalid-theme', 'init'],
      io,
    );

    const payload = JSON.parse(stderrBuffer.join(''));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join('')).toBe('');
    expect(payload.status).toBe('error');
    expect(payload.output_mode).toBe('json');
    expect(payload.error_code).toBe('ENTRYPOINT_COMMAND_WRAPPER_INVALID');
    expect(payload.command).toBe('init');
  });

  it('keeps JSON error contract when memory provider module is outside plugin allowlist', async () => {
    const repositoryRoot = await createBlockedMemoryProviderFixtureRepo();
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, repositoryRoot);

    try {
      const exitCode = await runCli(['node', 'repo-ai-governor', '--output', 'json', 'init'], io);
      const payload = JSON.parse(stderrBuffer.join(''));

      expect(exitCode).toBe(1);
      expect(stdoutBuffer.join('')).toBe('');
      expect(payload.status).toBe('error');
      expect(payload.output_mode).toBe('json');
      expect(payload.error_code).toBe('MEMORY_STORE_PROVIDER_NOT_FOUND');
      expect(payload.message).toContain('not allowlisted');
      expect(payload.command).toBe('init');
    } finally {
      await rm(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('fails fast when official IDE wrapper env carries invalid surface or source IDs', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, process.cwd(), {
      REPO_AI_GOVERNOR_ENTRY_SURFACE: 'not_a_surface',
      REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID: 'broken-profile',
      REPO_AI_GOVERNOR_STANDARDS_SOURCES: 'totally_invalid',
    });

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'doctor'],
      io,
    );

    const payload = JSON.parse(stderrBuffer.join(''));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join('')).toBe('');
    expect(payload.status).toBe('error');
    expect(payload.error_code).toBe('ENTRYPOINT_COMMAND_WRAPPER_INVALID');
    expect(payload.command).toBe('doctor');
  });

  it('surfaces validated IDE wrapper env in JSON diagnostics', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, process.cwd(), {
      REPO_AI_GOVERNOR_ENTRY_SURFACE: 'vscode',
      REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID: 'stage5-entry-baseline',
      REPO_AI_GOVERNOR_STANDARDS_SOURCES:
        'product_requirements_brief,overall_technical_solution,architecture_and_repo_layering,code_standards,long_term_maintenance_guide,agents_projection',
    });

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--locale', 'en-US', '--output', 'json', 'doctor'],
      io,
    );

    const payload = JSON.parse(stdoutBuffer.join(''));

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(payload.status).toBe('success');
    expect(payload.diagnostics.entrySurface).toBe('vscode');
    expect(payload.diagnostics.standardsProfileId).toBe('stage5-entry-baseline');
    expect(payload.diagnostics.standardsSourceIds).toEqual([
      'product_requirements_brief',
      'overall_technical_solution',
      'architecture_and_repo_layering',
      'code_standards',
      'long_term_maintenance_guide',
      'agents_projection',
    ]);
  });

  it('reduces diagnostics noise in quiet mode', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      [
        'node',
        'repo-ai-governor',
        '--locale',
        'en-US',
        '--output',
        'plain',
        '--verbosity',
        'quiet',
        'init',
      ],
      io,
    );

    const stdout = stdoutBuffer.join('');

    expect(exitCode).toBe(0);
    expect(stderrBuffer.join('')).toBe('');
    expect(stdout).toContain('Initialized workspace at');
    expect(stdout).toContain('outputMode=plain');
    expect(stdout).not.toContain('workspaceRoot=');
    expect(stdout).not.toContain('memoryStoreRoot=');
    expect(stdout).not.toContain('verbosity=');
  });

  it('maps replay-input failures to dedicated next action with structured replay_path', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);
    const missingReplayPath = resolve(process.cwd(), `.tmp-missing-replay-${Date.now()}.json`);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--output', 'json', 'run', '--replay', missingReplayPath],
      io,
    );
    const payload = JSON.parse(stderrBuffer.join(''));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join('')).toBe('');
    expect(payload.error_code).toBe('REPORT_REPLAY_INPUT_INVALID');
    expect(payload.next_action).toBe('check_replay_source');
    expect(payload.error_details.replay_path).toBe(missingReplayPath);
  });

  it('maps policy-gated run failures to policy diagnostics next action', async () => {
    const fixtureRepositoryRoot = await createPolicyGateFixtureRepo();
    try {
      const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, fixtureRepositoryRoot);
      const exitCode = await runCli(['node', 'repo-ai-governor', '--output', 'json', 'run'], io);
      const payload = JSON.parse(stderrBuffer.join(''));

      expect(exitCode).toBe(1);
      expect(stdoutBuffer.join('')).toBe('');
      expect(['POLICY_GATE_HITL_FEEDBACK_INVALID', 'POLICY_GATE_EVALUATION_FAILED']).toContain(
        payload.error_code,
      );
      expect(payload.next_action).toBe('inspect_policy_diagnostics');
      expect(typeof payload.error_details.report_path).toBe('string');
      expect(typeof payload.error_details.replay_path).toBe('string');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('parses HITL decision receipt flags from CLI argv and resumes run', async () => {
    const fixtureRepositoryRoot = await createPolicyGateFixtureRepo();
    try {
      const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, fixtureRepositoryRoot);
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          'run',
          '--hitl-decision',
          'approve',
          '--hitl-decision-reason',
          'Maintainer approved unattended continuation.',
          '--hitl-decided-by',
          'maintainer@example.com',
        ],
        io,
      );
      const payload = JSON.parse(stdoutBuffer.join(''));

      expect(exitCode).toBe(0);
      expect(stderrBuffer.join('')).toBe('');
      expect(payload.status).toBe('success');
      expect(payload.command_result.operation).toBe('governance_run');
      expect(payload.command_result.details.original_policy_outcome).toBe('escalate');
      expect(payload.command_result.details.effective_policy_outcome).toBe('allow');
      expect(payload.command_result.details.hitl_decision).toBe('approve');
      expect(payload.command_result.details.hitl_resume_action).toBe('resume');
      expect(typeof payload.command_result.details.hitl_decision_receipt_path).toBe('string');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('rejects unsupported HITL decision option values', async () => {
    const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false);

    const exitCode = await runCli(
      ['node', 'repo-ai-governor', '--output', 'json', 'run', '--hitl-decision', 'invalid'],
      io,
    );
    const payload = JSON.parse(stderrBuffer.join(''));

    expect(exitCode).toBe(1);
    expect(stdoutBuffer.join('')).toBe('');
    expect(payload.error_code).toBe('ENTRYPOINT_COMMAND_WRAPPER_INVALID');
    expect(payload.command).toBe('run');
  });

  it('keeps default adapter baseline when profile only overrides tools for doctor', async () => {
    const fixtureRepositoryRoot = await createProfileOnlyAdaptersFixtureRepo();
    try {
      const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(false, fixtureRepositoryRoot, {
        PATH: '',
        Path: '',
      });
      const exitCode = await runCli(
        [
          'node',
          'repo-ai-governor',
          '--output',
          'json',
          '--profile',
          'tool-only',
          'doctor',
          '--adapters',
        ],
        io,
      );
      const stdout = stdoutBuffer.join('');
      const stderr = stderrBuffer.join('');

      expect(exitCode).toBe(0);
      expect(stderr).toBe('');
      expect(stdout).not.toBe('');
      const payload = JSON.parse(stdout);
      expect(payload.status).toBe('success');
      expect(payload.command).toBe('doctor');
      expect(payload.command_result.operation).toBe('env_doctor');
      expect(payload.command_result.details.profile).toBe('tool-only');
      expect(payload.command_result.agentView.descriptors.length).toBeGreaterThan(0);
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });
});
