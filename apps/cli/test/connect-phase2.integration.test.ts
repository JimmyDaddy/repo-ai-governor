import { existsSync } from 'node:fs';
import { mkdir, mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import {
  CliClaudeCodeExecFixtureEnvironmentKey,
  CliClaudeCodeExecFixtureMode,
} from '../src/constants/claude-code-exec-fixture.constant.js';
import {
  CliCodexExecFixtureEnvironmentKey,
  CliCodexExecFixtureMode,
} from '../src/constants/codex-exec-fixture.constant.js';
import {
  CliGithubCopilotExecFixtureEnvironmentKey,
  CliGithubCopilotExecFixtureMode,
} from '../src/constants/github-copilot-exec-fixture.constant.js';
import { runCli } from '../src/main.js';

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

function createBufferedIo(
  currentWorkingDirectory: string,
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
      isStdoutTty: () => false,
      isStdinTty: () => false,
      isStderrTty: () => false,
      env: () => environment,
    },
  };
}

async function createConnectFixtureRepo(): Promise<string> {
  const temporaryRepositoryRoot = await mkdtemp(resolve(tmpdir(), 'connect-phase2-'));
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
  return temporaryRepositoryRoot;
}

async function runJsonCli(
  currentWorkingDirectory: string,
  args: string[],
  locale = 'en-US',
  environmentOverrides: NodeJS.ProcessEnv = {},
) {
  const { stdoutBuffer, stderrBuffer, io } = createBufferedIo(
    currentWorkingDirectory,
    environmentOverrides,
  );
  const exitCode = await runCli(
    ['node', 'repo-ai-governor', '--locale', locale, '--output', 'json', ...args],
    io,
  );
  const stdoutText = stdoutBuffer.join('');
  const stderrText = stderrBuffer.join('');
  const payloadText = stdoutText.length > 0 ? stdoutText : stderrText;

  return {
    exitCode,
    stdoutText,
    stderrText,
    payload: JSON.parse(payloadText) as {
      status: string;
      error_code?: string;
      message: string;
      command_result?: {
        operation: string;
        details: Record<string, string | boolean | null>;
        checks?: Array<{
          id: string;
          status: string;
          detail: string;
        }>;
      };
    },
  };
}

describe('connect phase-2 integration', () => {
  it('runs connect generate -> diff -> apply through the CLI entrypoint', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--preset',
        'multi-tool-default',
      ]);

      expect(generateResult.exitCode).toBe(0);
      expect(generateResult.stderrText).toBe('');
      expect(generateResult.payload.status).toBe('success');
      expect(generateResult.payload.command_result?.operation).toBe('adapter_connect');
      expect(generateResult.payload.command_result?.details.candidate_apply_ready).toBe(true);

      const diffResult = await runJsonCli(fixtureRepositoryRoot, ['connect', 'diff', '--latest']);

      expect(diffResult.exitCode).toBe(0);
      expect(diffResult.stderrText).toBe('');
      expect(diffResult.payload.status).toBe('success');
      expect(diffResult.payload.command_result?.operation).toBe('adapter_connect_diff');
      expect(typeof diffResult.payload.command_result?.details.diff_path).toBe('string');
      expect(typeof diffResult.payload.command_result?.details.merge_explain_path).toBe('string');

      const applyResult = await runJsonCli(fixtureRepositoryRoot, ['connect', 'apply', '--latest']);
      const persistedConfigPath = resolve(
        fixtureRepositoryRoot,
        '.repo-ai-governor',
        'governor.yaml',
      );
      const persistedConfigContent = await readFile(persistedConfigPath, 'utf8');

      expect(applyResult.exitCode).toBe(0);
      expect(applyResult.stderrText).toBe('');
      expect(applyResult.payload.status).toBe('success');
      expect(applyResult.payload.command_result?.operation).toBe('adapter_connect_apply');
      expect(typeof applyResult.payload.command_result?.details.apply_receipt_path).toBe('string');
      expect(typeof applyResult.payload.command_result?.details.rollback_artifact_path).toBe(
        'string',
      );
      expect(persistedConfigContent).toContain('adapters:');
      expect(persistedConfigContent).toContain('planner');
      expect(
        existsSync(String(applyResult.payload.command_result?.details.apply_receipt_path)),
      ).toBe(true);
      expect(
        existsSync(String(applyResult.payload.command_result?.details.rollback_artifact_path)),
      ).toBe(true);
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('materializes explicit remote_api transport when connect receives --tool-transport', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();
    const persistedConfigPath = resolve(
      fixtureRepositoryRoot,
      '.repo-ai-governor',
      'governor.yaml',
    );

    await writeFile(
      persistedConfigPath,
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
        '      remoteApi:',
        '        provider: openai',
        '        vendorBinding: openai_responses',
        '        model: gpt-5',
        '        credentialEnvVar: OPENAI_API_KEY',
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

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--tools',
        'codex',
        '--tool-transport',
        'codex=remote_api',
      ]);
      const candidatePath = String(
        generateResult.payload.command_result?.details.candidate_config_path,
      );
      const candidateContent = await readFile(candidatePath, 'utf8');

      expect(generateResult.exitCode).toBe(0);
      expect(generateResult.payload.status).toBe('success');
      expect(candidateContent).toContain('transport: remote_api');
      expect(candidateContent).toContain('provider: openai');
      expect(candidateContent).toContain('credentialEnvVar: OPENAI_API_KEY');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('synthesizes first-time remote_api config when connect receives --remote-api-model', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--tools',
        'codex',
        '--remote-api-model',
        'codex=gpt-5',
      ]);
      const candidatePath = String(
        generateResult.payload.command_result?.details.candidate_config_path,
      );
      const candidateContent = await readFile(candidatePath, 'utf8');

      expect(generateResult.exitCode).toBe(0);
      expect(generateResult.payload.status).toBe('success');
      expect(candidateContent).toContain('toolId: codex');
      expect(candidateContent).toContain('transport: remote_api');
      expect(candidateContent).toContain('provider: openai');
      expect(candidateContent).toContain('vendorBinding: openai_responses');
      expect(candidateContent).toContain('model: gpt-5');
      expect(candidateContent).toContain('credentialEnvVar: OPENAI_API_KEY');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('supports remote_api authoring overrides for custom credential env vars and endpoints', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--tools',
        'claude-code',
        '--remote-api-model',
        'claude-code=claude-test-model',
        '--remote-api-credential-env-var',
        'claude-code=CLAUDE_CODE_API_KEY',
        '--remote-api-endpoint',
        'claude-code=https://example.invalid/v1/messages',
      ]);
      const candidatePath = String(
        generateResult.payload.command_result?.details.candidate_config_path,
      );
      const candidateContent = await readFile(candidatePath, 'utf8');

      expect(generateResult.exitCode).toBe(0);
      expect(generateResult.payload.status).toBe('success');
      expect(candidateContent).toContain('toolId: claude-code');
      expect(candidateContent).toContain('transport: remote_api');
      expect(candidateContent).toContain('provider: anthropic');
      expect(candidateContent).toContain('vendorBinding: anthropic_messages');
      expect(candidateContent).toContain('model: claude-test-model');
      expect(candidateContent).toContain('credentialEnvVar: CLAUDE_CODE_API_KEY');
      expect(candidateContent).toContain('endpoint: https://example.invalid/v1/messages');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('consumes user-config remote_api defaults and still lets explicit CLI overrides win', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();
    const temporaryHomeRoot = await mkdtemp(resolve(tmpdir(), 'connect-user-config-home-'));
    const userConfigRoot = resolve(temporaryHomeRoot, '.repo-ai-governor');
    const userConfigPath = resolve(userConfigRoot, 'user-config.yaml');

    await mkdir(userConfigRoot, { recursive: true });
    await writeFile(
      userConfigPath,
      [
        'tools:',
        '  codex:',
        '    transport: remote_api',
        '    remoteApi:',
        '      model: gpt-5-from-user-config',
        '      credentialRef: secret://openai/api-key',
        '      endpoint: https://example.invalid/v1/responses',
        '',
      ].join('\n'),
      'utf8',
    );

    try {
      const defaultsResult = await runJsonCli(
        fixtureRepositoryRoot,
        ['connect', '--tools', 'codex'],
        'en-US',
        {
          HOME: temporaryHomeRoot,
        },
      );
      const defaultsCandidatePath = String(
        defaultsResult.payload.command_result?.details.candidate_config_path,
      );
      const defaultsCandidateContent = await readFile(defaultsCandidatePath, 'utf8');
      const overrideResult = await runJsonCli(
        fixtureRepositoryRoot,
        ['connect', '--tools', 'codex', '--remote-api-model', 'codex=gpt-5-override'],
        'en-US',
        {
          HOME: temporaryHomeRoot,
        },
      );
      const overrideCandidatePath = String(
        overrideResult.payload.command_result?.details.candidate_config_path,
      );
      const overrideCandidateContent = await readFile(overrideCandidatePath, 'utf8');

      expect(defaultsResult.exitCode).toBe(0);
      expect(defaultsResult.payload.status).toBe('success');
      expect(defaultsCandidateContent).toContain('transport: remote_api');
      expect(defaultsCandidateContent).toContain('model: gpt-5-from-user-config');
      expect(defaultsCandidateContent).toContain('credentialEnvVar: OPENAI_API_KEY');
      expect(defaultsCandidateContent).toContain('credentialRef: secret://openai/api-key');
      expect(defaultsCandidateContent).toContain('endpoint: https://example.invalid/v1/responses');

      expect(overrideResult.exitCode).toBe(0);
      expect(overrideResult.payload.status).toBe('success');
      expect(overrideCandidateContent).toContain('model: gpt-5-override');
      expect(overrideCandidateContent).toContain('credentialEnvVar: OPENAI_API_KEY');
      expect(overrideCandidateContent).toContain('credentialRef: secret://openai/api-key');
      expect(overrideCandidateContent).toContain('endpoint: https://example.invalid/v1/responses');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
      await rm(temporaryHomeRoot, { recursive: true, force: true });
    }
  });

  it('does not shrink the default multi-tool candidate when only one tool gets a transport override', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--tool-transport',
        'codex=cli_exec',
      ]);
      const candidatePath = String(
        generateResult.payload.command_result?.details.candidate_config_path,
      );
      const candidateContent = await readFile(candidatePath, 'utf8');

      expect(generateResult.exitCode).toBe(0);
      expect(generateResult.payload.status).toBe('success');
      expect(candidateContent).toContain('toolId: codex');
      expect(candidateContent).toContain('toolId: claude-code');
      expect(candidateContent).toContain('toolId: github-copilot');
      expect(candidateContent).toContain('reviewer:');
      expect(candidateContent).toContain('primarySurface: claude-code');
      expect(candidateContent).toContain('fallbackSurfaces:');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('applies an explicit cli_exec candidate while preserving configured remote_api truth', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();
    const persistedConfigPath = resolve(
      fixtureRepositoryRoot,
      '.repo-ai-governor',
      'governor.yaml',
    );

    await writeFile(
      persistedConfigPath,
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
        '      remoteApi:',
        '        provider: openai',
        '        vendorBinding: openai_responses',
        '        model: gpt-5',
        '        credentialEnvVar: OPENAI_API_KEY',
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

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--tools',
        'codex',
        '--tool-transport',
        'codex=cli_exec',
      ]);
      const candidatePath = String(
        generateResult.payload.command_result?.details.candidate_config_path,
      );
      const candidateContent = await readFile(candidatePath, 'utf8');
      const applyResult = await runJsonCli(fixtureRepositoryRoot, ['connect', 'apply', '--latest']);
      const persistedConfigContent = await readFile(persistedConfigPath, 'utf8');

      expect(generateResult.exitCode).toBe(0);
      expect(generateResult.payload.status).toBe('success');
      expect(candidateContent).toContain('transport: cli_exec');
      expect(candidateContent).toContain('provider: openai');
      expect(applyResult.exitCode).toBe(0);
      expect(applyResult.payload.status).toBe('success');
      expect(persistedConfigContent).toContain('transport: cli_exec');
      expect(persistedConfigContent).toContain('provider: openai');
      expect(persistedConfigContent).toContain('credentialEnvVar: OPENAI_API_KEY');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('localizes malformed --tool-transport parser errors for zh-CN output', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const result = await runJsonCli(
        fixtureRepositoryRoot,
        ['connect', '--tool-transport', 'codex'],
        'zh-CN',
      );

      expect(result.exitCode).toBe(1);
      expect(result.payload.status).toBe('error');
      expect(result.payload.message).toContain(
        '选项 --tool-transport 必须使用 toolId=transport 语法。',
      );
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('localizes malformed --remote-api-model parser errors for zh-CN output', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const result = await runJsonCli(
        fixtureRepositoryRoot,
        ['connect', '--remote-api-model', 'codex'],
        'zh-CN',
      );

      expect(result.exitCode).toBe(1);
      expect(result.payload.status).toBe('error');
      expect(result.payload.message).toContain(
        '选项 --remote-api-model 必须使用 toolId=value 语法。',
      );
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('localizes unsupported runtime transport override errors for zh-CN output', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const result = await runJsonCli(
        fixtureRepositoryRoot,
        ['connect', '--tools', 'github-copilot', '--tool-transport', 'github-copilot=remote_api'],
        'zh-CN',
      );

      expect(result.exitCode).toBe(1);
      expect(result.payload.status).toBe('error');
      expect(result.payload.message).toContain(
        'connect transport 覆盖不支持 github-copilot=remote_api。',
      );
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('rejects mixing explicit candidate paths with --latest', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--preset',
        'multi-tool-default',
      ]);
      const candidatePath = String(
        generateResult.payload.command_result?.details.candidate_config_path,
      );
      const diffResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        'diff',
        candidatePath,
        '--latest',
      ]);

      expect(diffResult.exitCode).toBe(1);
      expect(diffResult.payload.status).toBe('error');
      expect(diffResult.payload.error_code).toBe('ENTRYPOINT_COMMAND_WRAPPER_INVALID');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('blocks apply when active governor.yaml drifts from the candidate source fingerprint', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--preset',
        'multi-tool-default',
      ]);
      const persistedConfigPath = resolve(
        fixtureRepositoryRoot,
        '.repo-ai-governor',
        'governor.yaml',
      );
      const persistedConfigContent = await readFile(persistedConfigPath, 'utf8');
      await writeFile(
        persistedConfigPath,
        persistedConfigContent.replace('defaultLocale: en-US', 'defaultLocale: zh-CN'),
        'utf8',
      );

      const applyResult = await runJsonCli(fixtureRepositoryRoot, ['connect', 'apply', '--latest']);

      expect(generateResult.exitCode).toBe(0);
      expect(applyResult.exitCode).toBe(1);
      expect(applyResult.payload.status).toBe('error');
      expect(applyResult.payload.error_code).toBe('ADAPTER_ROUTE_CONFIG_INVALID');
      expect(applyResult.payload.message).toContain('diverged from candidate source fingerprint');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('allows force apply after source fingerprint drift and can skip rollback snapshots', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      await runJsonCli(fixtureRepositoryRoot, ['connect', '--preset', 'multi-tool-default']);
      const persistedConfigPath = resolve(
        fixtureRepositoryRoot,
        '.repo-ai-governor',
        'governor.yaml',
      );
      const persistedConfigContent = await readFile(persistedConfigPath, 'utf8');
      await writeFile(
        persistedConfigPath,
        persistedConfigContent.replace('defaultLocale: en-US', 'defaultLocale: zh-CN'),
        'utf8',
      );

      const applyResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        'apply',
        '--latest',
        '--force',
        '--no-rollback',
      ]);

      expect(applyResult.exitCode).toBe(0);
      expect(applyResult.payload.status).toBe('success');
      expect(applyResult.payload.command_result?.details.force).toBe(true);
      expect(applyResult.payload.command_result?.details.rollback_enabled).toBe(false);
      expect(applyResult.payload.command_result?.details.rollback_artifact_path).toBeNull();
      expect(
        existsSync(String(applyResult.payload.command_result?.details.apply_receipt_path)),
      ).toBe(true);
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });

  it('recomputes candidate readiness after hand-editing the candidate file', async () => {
    const fixtureRepositoryRoot = await createConnectFixtureRepo();

    try {
      const generateResult = await runJsonCli(fixtureRepositoryRoot, [
        'connect',
        '--preset',
        'multi-tool-default',
      ]);
      const candidatePath = String(
        generateResult.payload.command_result?.details.candidate_config_path,
      );
      const candidateContent = await readFile(candidatePath, 'utf8');
      await writeFile(
        candidatePath,
        candidateContent.replaceAll('availability: available', 'availability: unavailable'),
        'utf8',
      );

      const diffResult = await runJsonCli(fixtureRepositoryRoot, ['connect', 'diff', '--latest']);
      const applyResult = await runJsonCli(fixtureRepositoryRoot, ['connect', 'apply', '--latest']);
      const applyReadyCheck = diffResult.payload.command_result?.checks?.find(
        (check) => check.id === 'candidate_apply_ready',
      );
      const fingerprintCheck = diffResult.payload.command_result?.checks?.find(
        (check) => check.id === 'candidate_fingerprint',
      );

      expect(diffResult.exitCode).toBe(0);
      expect(diffResult.payload.status).toBe('success');
      expect(diffResult.payload.command_result?.details.candidate_fingerprint_current).toBe(false);
      expect(applyReadyCheck).toEqual(
        expect.objectContaining({
          status: 'warn',
          detail: expect.stringContaining('required_roles_unavailable'),
        }),
      );
      expect(fingerprintCheck).toEqual(
        expect.objectContaining({
          status: 'warn',
        }),
      );
      expect(applyResult.exitCode).toBe(1);
      expect(applyResult.payload.status).toBe('error');
      expect(applyResult.payload.error_code).toBe('ADAPTER_ROUTE_CONFIG_INVALID');
      expect(applyResult.payload.message).toContain('required_roles_unavailable');
    } finally {
      await rm(fixtureRepositoryRoot, { recursive: true, force: true });
    }
  });
});
