import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import { CliSessionShellEntrypointRuntime } from '../../src/runtime/interactive-shell/session-shell-entrypoint-runtime.js';

describe('CliSessionShellEntrypointRuntime', () => {
  it('treats free-form positional input as one startup query and skips top-level commands', () => {
    const runtime = createRuntime();

    expect(runtime.resolveSessionStartupQuery(['summarize', 'the', 'plan'])).toBe(
      'summarize the plan',
    );
    expect(runtime.resolveSessionStartupQuery(['check'])).toBeNull();
    expect(runtime.resolveSessionStartupQuery(['workspace', 'set-ui-theme', 'calm'])).toBeNull();
  });

  it('only enters the default session shell for interactive react-mode entrypoints', () => {
    const runtime = createRuntime();

    expect(
      runtime.shouldEnterDefaultSessionShell(
        [],
        {
          uiMode: CliInteractiveUiMode.REACT,
          dryRun: false,
          trace: false,
          replayPath: null,
        },
        null,
      ),
    ).toBe(true);
    expect(
      runtime.shouldEnterDefaultSessionShell(
        ['summarize', 'the', 'plan'],
        {
          uiMode: CliInteractiveUiMode.REACT,
          dryRun: false,
          trace: false,
          replayPath: null,
        },
        'summarize the plan',
      ),
    ).toBe(true);
    expect(
      runtime.shouldEnterDefaultSessionShell(
        ['check'],
        {
          uiMode: CliInteractiveUiMode.REACT,
          dryRun: false,
          trace: false,
          replayPath: null,
        },
        null,
      ),
    ).toBe(false);
    expect(
      runtime.shouldEnterDefaultSessionShell(
        [],
        {
          uiMode: CliInteractiveUiMode.NONE,
          dryRun: false,
          trace: false,
          replayPath: null,
        },
        null,
      ),
    ).toBe(false);
    expect(
      runtime.shouldEnterDefaultSessionShell(
        ['--help'],
        {
          uiMode: CliInteractiveUiMode.REACT,
          dryRun: false,
          trace: false,
          replayPath: null,
        },
        null,
      ),
    ).toBe(false);
  });

  it('creates runner options from the shared entrypoint context', () => {
    const translate = vi.fn((key: string) => key);
    const runtime = createRuntime({ translate });
    const runOptions = runtime.createRunOptions({
      resumeOnStartup: true,
      requestedSessionId: 'session-123',
      initialPrompt: 'summarize the plan',
    });

    expect(runOptions).toEqual(
      expect.objectContaining({
        currentWorkingDirectory: '/workspace',
        workspaceSummary: 'workspace summary',
        outputMode: ErrorOutputEnvironment.PRETTY,
        resumeOnStartup: true,
        requestedSessionId: 'session-123',
        initialPrompt: 'summarize the plan',
        translate,
      }),
    );
  });

  it('summarizes nested JSON command payloads into session-shell bridge results', async () => {
    const executeCli = vi.fn(async (_argv, io) => {
      io.stdout(
        JSON.stringify({
          message: 'command succeeded',
          command_result: {
            summary: 'summary line',
            experience: {
              layeredLogs: {
                summary: ['first detail', 'second detail'],
              },
            },
            artifacts: [{ path: '/tmp/report.md' }],
          },
        }),
      );
      return 0;
    });
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli,
    });

    const result = await commandExecutor(['check']);

    expect(executeCli).toHaveBeenCalledWith(
      [
        'node',
        'repo-ai-governor',
        '--locale',
        'en-US',
        '--output',
        'json',
        '--no-interactive',
        'check',
      ],
      expect.objectContaining({
        cwd: expect.any(Function),
        env: expect.any(Function),
      }),
    );
    expect(result).toEqual({
      artifactPaths: ['/tmp/report.md'],
      commandLine: 'check',
      message: 'command succeeded',
      status: 'success',
      summaryLines: ['Summary: summary line', 'Key status: first detail · second detail'],
    });
  });

  it('includes projected agentView highlights in nested command summaries', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(
          JSON.stringify({
            message: 'connect succeeded',
            diagnostics: {
              locale: 'en-US',
            },
            command_result: {
              summary: 'adapter candidate generated',
              agentView: {
                descriptors: [
                  {
                    agentId: 'coder:coder:coder',
                    agentRole: 'coder',
                    roleProfileId: 'coder-default',
                    roleSource: 'default',
                    primarySurface: 'codex',
                    fallbackSurfaces: ['github-copilot'],
                    capabilities: ['tool_calling'],
                    permissionLevel: 'edit',
                    inputSchemaRef: null,
                    outputSchemaRef: null,
                    errorContractRef: null,
                    maxExecutionTimeSeconds: 300,
                    stageTimeoutSeconds: 300,
                    tokenBudget: null,
                    costBudget: null,
                    timeBudgetSeconds: null,
                    retryPolicyRef: null,
                    timeoutPolicyRef: null,
                    budgetPolicyRef: null,
                    workspaceId: 'workspace-1',
                    workspaceMode: 'repo_local',
                    executionId: 'execution-1',
                    sessionId: null,
                    selectedBy: 'fallback',
                    selectedSurface: 'github-copilot',
                    projectionStatus: 'warn',
                    failureReasons: ['primary_surface_unavailable'],
                    unsupportedCapabilities: [],
                    degradedCapabilities: ['tool_calling'],
                  },
                ],
                sessionProjection: null,
              },
              experience: {
                layeredLogs: {
                  summary: ['connect_id=123'],
                },
              },
              artifacts: [],
            },
          }),
        );
        return 0;
      },
    });

    const result = await commandExecutor(['connect']);

    expect(result.summaryLines).toEqual([
      'Summary: adapter candidate generated',
      'Agent routing: agents=1, surfaces=1, fallback=1, degraded=1, blocked=0, gaps=1, session=none',
      expect.stringContaining(
        'Attention: coder: surface=github-copilot selected_by=fallback status=warn gap=degraded:tool_calling',
      ),
      'Key status: connect_id=123',
    ]);
  });

  it('falls back to captured stderr when nested command output is not valid JSON', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stderr('command failed');
        return 1;
      },
    });

    await expect(commandExecutor(['review'])).resolves.toEqual({
      artifactPaths: [],
      commandLine: 'review',
      message: 'command failed',
      status: 'error',
      summaryLines: ['command failed'],
    });
  });
});

function createRuntime(
  overrides: Partial<ConstructorParameters<typeof CliSessionShellEntrypointRuntime>[0]> = {},
): CliSessionShellEntrypointRuntime {
  return new CliSessionShellEntrypointRuntime({
    sessionClient: {} as never,
    currentWorkingDirectory: '/workspace',
    workspaceSummary: 'workspace summary',
    outputMode: ErrorOutputEnvironment.PRETTY,
    translate: (key: string) => key,
    ...overrides,
  });
}

const SESSION_SHELL_RESPONSE_TRANSLATIONS: Record<string, string> = {
  'cli.sessionShell.responses.commandSummary': 'Summary: {{summary}}',
  'cli.sessionShell.responses.commandStatusSummary': 'Key status: {{summary}}',
  'cli.sessionShell.responses.commandAgentSummary': 'Agent routing: {{summary}}',
  'cli.sessionShell.responses.commandAttentionSummary': 'Attention: {{summary}}',
  'cli.sessionShell.responses.commandErrorHint': 'Hint: {{hint}}',
  'cli.sessionShell.responses.commandErrorNextAction': 'Next step: {{nextAction}}',
};

function translateSessionShellResponse(
  key: string,
  interpolation?: Record<string, string>,
): string {
  return (SESSION_SHELL_RESPONSE_TRANSLATIONS[key] ?? key).replace(
    /\{\{(\w+)\}\}/gu,
    (_match, placeholder: string) => interpolation?.[placeholder] ?? '',
  );
}
