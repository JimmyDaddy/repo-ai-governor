import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import { CliSessionShellEntrypointRuntime } from '../../src/runtime/interactive-shell/session-shell-entrypoint-runtime.js';
import type { CliCommandProgressEvent } from '../../src/types/index.js';

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
    const progressSink = {
      publish: vi.fn(),
    };
    const abortController = new AbortController();
    const runtime = createRuntime({
      translate,
      commandExecutionOptions: {
        progressSink,
        abortSignal: abortController.signal,
      },
    });
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
        commandExecutionOptions: {
          progressSink,
          abortSignal: abortController.signal,
        },
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
      undefined,
    );
    expect(result).toEqual({
      artifactPaths: ['/tmp/report.md'],
      commandLine: 'check',
      message: 'command succeeded',
      status: 'success',
      summaryLines: ['Summary: summary line', 'Key status: first detail · second detail'],
    });
  });

  it('forwards nested progress relay ownership into re-entered runCli execution options', async () => {
    const progressEvents: CliCommandProgressEvent[] = [];
    const executeCli = vi.fn(async (_argv, io, executionOptions) => {
      executionOptions?.progressSink?.publish({
        commandName: 'connect',
        runState: 'running',
      });
      io.stdout(
        JSON.stringify({
          message: 'command succeeded',
          command_result: {
            summary: 'summary line',
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

    await commandExecutor(['connect'], {
      progressSink: {
        publish: (event) => {
          progressEvents.push(event);
        },
      },
    });

    expect(executeCli).toHaveBeenCalledWith(
      expect.any(Array),
      expect.any(Object),
      expect.objectContaining({
        progressSink: expect.objectContaining({
          publish: expect.any(Function),
        }),
        suppressLiveProgressPresenter: true,
      }),
    );
    expect(progressEvents).toEqual([
      expect.objectContaining({
        commandName: 'connect',
        runState: 'running',
      }),
    ]);
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

  it('treats logical run failures as error bridge results and preserves failure guidance', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(
          JSON.stringify({
            command: 'run',
            message: 'Run completed with execution_id=cli-run-1 and policy_outcome=allow.',
            command_result: {
              summary: 'Run completed with execution_id=cli-run-1 and policy_outcome=allow.',
              details: {
                runtime_status: 'failed',
              },
              experience: {
                roleProgress: [
                  {
                    roleId: 'stage-review',
                    stage: 'run_runtime',
                    status: 'failed',
                    category: 'runtime_failure',
                    summary: 'Stage stage-review finished with failed.',
                    detail: 'codex exited with code 1',
                    backlink: {
                      executionId: 'cli-run-1',
                      stageId: 'stage-review',
                    },
                  },
                ],
                layeredLogs: {
                  summary: ['runtime_status=failed', 'root_cause=runtime_failure'],
                  detailed: ['failed_reason=codex exited with code 1'],
                },
                interactionPrompts: [
                  {
                    category: 'runtime_failure',
                    stage: 'run_runtime',
                    title: 'Next action',
                    action:
                      'Inspect stage-level errorContext in diagnostics trace and fix runtime stage failures.',
                    blocking: true,
                  },
                ],
              },
              artifacts: [{ path: '/tmp/run-report.md' }],
            },
          }),
        );
        return 0;
      },
    });

    const result = await commandExecutor(['run']);

    expect(result).toEqual({
      artifactPaths: ['/tmp/run-report.md'],
      commandLine: 'run',
      message: 'Stage stage-review finished with failed. · codex exited with code 1',
      status: 'error',
      summaryLines: [
        'Summary: Run completed with execution_id=cli-run-1 and policy_outcome=allow.',
        'Key status: runtime_status=failed · root_cause=runtime_failure',
        'Failure: Stage stage-review finished with failed. · codex exited with code 1',
        'Next step: Inspect stage-level errorContext in diagnostics trace and fix runtime stage failures.',
      ],
    });
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

  it('parses repeated JSON error payload lines and renders actionable connect recovery guidance', async () => {
    const duplicatedErrorPayload = JSON.stringify({
      schema_version: 'cli_output_v1',
      status: 'error',
      output_mode: 'json',
      verbosity: 'normal',
      command: 'connect',
      message:
        'CLI execution failed [ADAPTER_ROUTE_CONFIG_INVALID]: connect requires adapters baseline in source config.',
      error_code: 'ADAPTER_ROUTE_CONFIG_INVALID',
      hint: 'Adapter routing or capability verification failed.',
      next_action: 'inspect_governor_config',
      runtime: {
        is_tty: false,
        color_enabled: false,
        compact: false,
        downgraded_from: null,
      },
    });
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(`${duplicatedErrorPayload}\n${duplicatedErrorPayload}`);
        return 1;
      },
    });

    await expect(commandExecutor(['connect'])).resolves.toEqual({
      artifactPaths: [],
      commandLine: 'connect',
      message:
        'CLI execution failed [ADAPTER_ROUTE_CONFIG_INVALID]: connect requires adapters baseline in source config.',
      status: 'error',
      summaryLines: [
        'Hint: Adapter routing or capability verification failed.',
        'Next step: Inspect the active governor config.',
        'Recovery: the active governor config is missing the adapters baseline. If this is first-time setup, run /init first. If the config already exists but is broken, run /workspace clear-config, then /init, or repair governor.yaml before retrying /connect.',
      ],
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
  'cli.sessionShell.responses.commandFailureSummary': 'Failure: {{summary}}',
  'cli.sessionShell.responses.commandAgentSummary': 'Agent routing: {{summary}}',
  'cli.sessionShell.responses.commandAttentionSummary': 'Attention: {{summary}}',
  'cli.sessionShell.responses.commandErrorHint': 'Hint: {{hint}}',
  'cli.sessionShell.responses.commandErrorNextAction': 'Next step: {{nextAction}}',
  'cli.sessionShell.responses.commandErrorNextActionCheckCommandUsage':
    'Check the command usage and required flags.',
  'cli.sessionShell.responses.commandErrorNextActionInspectGovernorConfig':
    'Inspect the active governor config.',
  'cli.sessionShell.responses.commandErrorNextActionInspectPolicyDiagnostics':
    'Inspect the policy diagnostics and blocked decision details.',
  'cli.sessionShell.responses.commandErrorNextActionCheckReplaySource':
    'Inspect the replay source and verify the referenced artifact paths.',
  'cli.sessionShell.responses.commandErrorNextActionRetryWithVerbose':
    'Retry the command with verbose diagnostics enabled.',
  'cli.sessionShell.responses.commandErrorNextActionReportIssue':
    'Capture the diagnostics and report the issue with the failing command context.',
  'cli.sessionShell.responses.commandErrorConnectMissingAdaptersBaseline':
    'Recovery: the active governor config is missing the adapters baseline. If this is first-time setup, run /init first. If the config already exists but is broken, run /workspace clear-config, then /init, or repair governor.yaml before retrying /connect.',
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
