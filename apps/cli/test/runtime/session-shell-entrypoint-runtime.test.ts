import {
  SESSION_DELIVERY_WORKFLOW_PHASE,
  SESSION_MAIN_CAPABILITY_ID,
} from '@repo-ai-governor/core-orchestration-service';
import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import { CliRuntimeOperation } from '../../src/constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import { CliReviewLifecycleStatus } from '../../src/constants/cli-review.constant.js';
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
    const secureSecretMutator = {
      setSecret: vi.fn(),
    };
    const abortController = new AbortController();
    const runtime = createRuntime({
      translate,
      secureSecretMutator,
      mentionableRoleIds: ['planner', 'reviewer'],
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
        secureSecretMutator,
        mentionableRoleIds: ['planner', 'reviewer'],
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

  it('renders doctor payloads as human-readable recap summaries', async () => {
    const executeCli = vi.fn(async (_argv, io) => {
      io.stdout(
        JSON.stringify({
          command: 'doctor',
          message: 'Doctor completed with attach_mode=read_write.',
          command_result: {
            operation: 'env_doctor',
            summary: 'Doctor completed with attach_mode=read_write.',
            attach_mode: 'read_write',
            check_totals: {
              pass: 5,
              warn: 4,
              fail: 0,
            },
            checks: [
              {
                id: 'baseline_docs',
                status: 'warn',
                detail: 'missing=5/5',
              },
              {
                id: 'artifact_registry_canonical_truth',
                status: 'warn',
                detail: 'state=uninitialized database_present=false',
              },
              {
                id: 'task_ledger_canonical_truth',
                status: 'warn',
                detail: 'state=no_sources source_count=0',
              },
            ],
            details: {
              adapters_enabled: false,
            },
            experience: {
              layeredLogs: {
                summary: ['attach_mode=read_write', 'adapter_probe=false'],
              },
            },
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

    const result = await commandExecutor(['doctor']);

    expect(result).toEqual({
      artifactPaths: [],
      commandLine: 'doctor',
      message: 'Doctor completed with attach_mode=read_write.',
      status: 'success',
      summaryLines: [
        'Summary: Workspace is writable. Baseline doctor checks completed.',
        'Attention: repo-local baseline docs are missing (5/5) · artifact registry is not initialized yet · task ledger is not initialized yet',
        'Key status: adapter checks not run · 5 pass / 4 warn / 0 fail',
      ],
    });
  });

  it('preserves absolute artifact paths in command summaries', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(
          JSON.stringify({
            command: 'check',
            message: 'check completed',
            command_result: {
              summary: 'check completed',
              artifacts: [
                {
                  path: '/absolute/path/to/context/diagnostics/check/check-123.json',
                },
              ],
              experience: {
                roleProgress: [],
                layeredLogs: {
                  summary: [
                    'diagnostics_path=/absolute/path/to/context/diagnostics/check/check-123.json',
                  ],
                  detailed: [],
                },
                interactionPrompts: [],
              },
            },
          }),
        );
        return 0;
      },
    });

    const result = await commandExecutor(['check']);

    expect(result.artifactPaths).toEqual([
      '/absolute/path/to/context/diagnostics/check/check-123.json',
    ]);
    expect(result.summaryLines).toContain(
      'Key status: diagnostics_path=/absolute/path/to/context/diagnostics/check/check-123.json',
    );
  });

  it('projects governed run review-chain state into the deliver workflow overlay', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(
          JSON.stringify({
            command: 'run',
            message: 'Run completed with governed review chain artifacts.',
            command_result: {
              operation: CliRuntimeOperation.GOVERNANCE_RUN,
              summary: 'Run completed with governed review chain artifacts.',
              details: {
                inline_review_request_path: '/tmp/review-request.md',
                inline_review_verify_path: '/tmp/review-verify.md',
                inline_review_ledger_backfill_path: '/tmp/review-ledger-backfill.json',
                inline_review_artifact_path: '/tmp/verified-code-review.md',
                inline_review_artifact_status: CliReviewLifecycleStatus.VERIFIED,
                inline_review_verify_decision: 'accepted',
              },
              artifacts: [
                {
                  id: 'execution_report',
                  path: '/tmp/execution-report.md',
                },
              ],
            },
          }),
        );
        return 0;
      },
    });

    const result = await commandExecutor(['run']);

    expect(result.deliveryWorkflowUpdate).toEqual({
      currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REVIEW_VERIFY_PENDING,
      pendingAction: 'address_accepted_review_findings',
      relatedArtifactPaths: ['/tmp/execution-report.md', '/tmp/verified-code-review.md'],
      resultSummary: 'Run completed with governed review chain artifacts.',
      childWorkflowBacklinks: [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.RUN,
          artifactPath: '/tmp/execution-report.md',
          summary: 'Run completed with governed review chain artifacts.',
        },
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          artifactPath: '/tmp/verified-code-review.md',
          summary: 'Run completed with governed review chain artifacts.',
        },
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
          artifactPath: '/tmp/verified-code-review.md',
          summary: 'Run completed with governed review chain artifacts.',
        },
      ],
    });
    expect(result.deliveryWorkflowUpdate?.selectedTargetStream).toBeUndefined();
  });

  it('covers the remaining governed run status-routing branches', async () => {
    const scenarios = [
      {
        inlineReviewArtifactStatus: undefined,
        inlineReviewVerifyDecision: undefined,
        expectedPhase: SESSION_DELIVERY_WORKFLOW_PHASE.EXECUTION_ACTIVE,
        expectedPendingAction: 'start_governed_review_flow',
        expectedBacklinks: [
          {
            capabilityId: SESSION_MAIN_CAPABILITY_ID.RUN,
            artifactPath: '/tmp/execution-report.md',
            summary: 'Governed run branch exercised.',
          },
          {
            capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
            artifactPath: '/tmp/code-review.md',
            summary: 'Governed run branch exercised.',
          },
        ],
      },
      {
        inlineReviewArtifactStatus: CliReviewLifecycleStatus.REVIEW_PENDING,
        inlineReviewVerifyDecision: undefined,
        expectedPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REVIEW_PENDING,
        expectedPendingAction: 'run_review_verify',
        expectedBacklinks: [
          {
            capabilityId: SESSION_MAIN_CAPABILITY_ID.RUN,
            artifactPath: '/tmp/execution-report.md',
            summary: 'Governed run branch exercised.',
          },
          {
            capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
            artifactPath: '/tmp/code-review.md',
            summary: 'Governed run branch exercised.',
          },
        ],
      },
      {
        inlineReviewArtifactStatus: CliReviewLifecycleStatus.RESOLVED,
        inlineReviewVerifyDecision: 'accepted',
        expectedPhase: SESSION_DELIVERY_WORKFLOW_PHASE.RESOLVED,
        expectedPendingAction: 'run_fresh_clean_recheck',
        expectedBacklinks: [
          {
            capabilityId: SESSION_MAIN_CAPABILITY_ID.RUN,
            artifactPath: '/tmp/execution-report.md',
            summary: 'Governed run branch exercised.',
          },
          {
            capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
            artifactPath: '/tmp/code-review.md',
            summary: 'Governed run branch exercised.',
          },
          {
            capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
            artifactPath: '/tmp/code-review.md',
            summary: 'Governed run branch exercised.',
          },
        ],
      },
    ] as const;

    for (const scenario of scenarios) {
      const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
        locale: 'en-US',
        currentWorkingDirectory: '/workspace',
        environment: {},
        translate: translateSessionShellResponse,
        executeCli: async (_argv, io) => {
          io.stdout(
            JSON.stringify({
              command: 'run',
              message: 'Governed run branch exercised.',
              command_result: {
                operation: CliRuntimeOperation.GOVERNANCE_RUN,
                summary: 'Governed run branch exercised.',
                details: {
                  inline_review_request_path: '/tmp/review-request.md',
                  inline_review_verify_path: '/tmp/review-verify.md',
                  inline_review_ledger_backfill_path: '/tmp/review-ledger-backfill.json',
                  inline_review_artifact_path: '/tmp/code-review.md',
                  inline_review_artifact_status: scenario.inlineReviewArtifactStatus,
                  inline_review_verify_decision: scenario.inlineReviewVerifyDecision,
                },
                artifacts: [
                  {
                    id: 'execution_report',
                    path: '/tmp/execution-report.md',
                  },
                ],
              },
            }),
          );
          return 0;
        },
      });

      const result = await commandExecutor(['run']);

      expect(result.deliveryWorkflowUpdate).toEqual({
        currentPhase: scenario.expectedPhase,
        pendingAction: scenario.expectedPendingAction,
        relatedArtifactPaths: ['/tmp/execution-report.md', '/tmp/code-review.md'],
        resultSummary: 'Governed run branch exercised.',
        childWorkflowBacklinks: scenario.expectedBacklinks,
      });
    }
  });

  it('projects review queue lifecycle status into review-pending deliver workflow state', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(
          JSON.stringify({
            command: 'review',
            message: 'Review queue artifact created.',
            command_result: {
              operation: CliRuntimeOperation.REVIEW_QUEUE,
              summary: 'Review queue artifact created.',
              details: {
                review_status: CliReviewLifecycleStatus.REVIEW_PENDING,
                review_artifact_path: '/tmp/code-review.md',
                request_path: '/tmp/review-request.md',
                review_task_card_path: '/tmp/CR-008.md',
              },
            },
          }),
        );
        return 0;
      },
    });

    const result = await commandExecutor(['review']);

    expect(result.deliveryWorkflowUpdate).toEqual({
      currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REVIEW_PENDING,
      pendingAction: 'run_review_verify',
      relatedArtifactPaths: ['/tmp/code-review.md', '/tmp/CR-008.md'],
      resultSummary: 'Review queue artifact created.',
      childWorkflowBacklinks: [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          artifactPath: '/tmp/code-review.md',
          summary: 'Review queue artifact created.',
        },
      ],
    });
  });

  it('projects resolved review queue state into the deliver overlay without verify follow-up', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(
          JSON.stringify({
            command: 'review',
            message: 'Review queue item is already resolved.',
            command_result: {
              operation: CliRuntimeOperation.REVIEW_QUEUE,
              summary: 'Review queue item is already resolved.',
              details: {
                review_status: CliReviewLifecycleStatus.RESOLVED,
                review_artifact_path: '/tmp/resolved-code-review.md',
                request_path: '/tmp/review-request.md',
                review_task_card_path: '/tmp/CR-008.md',
              },
            },
          }),
        );
        return 0;
      },
    });

    const result = await commandExecutor(['review']);

    expect(result.deliveryWorkflowUpdate).toEqual({
      currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.RESOLVED,
      pendingAction: null,
      relatedArtifactPaths: ['/tmp/resolved-code-review.md', '/tmp/CR-008.md'],
      resultSummary: 'Review queue item is already resolved.',
      childWorkflowBacklinks: [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          artifactPath: '/tmp/resolved-code-review.md',
          summary: 'Review queue item is already resolved.',
        },
      ],
    });
  });

  it('projects review-verify completion into clean-recheck deliver workflow state', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(
          JSON.stringify({
            command: 'review-verify',
            message: 'Review verify resolved all actionable findings.',
            command_result: {
              operation: CliRuntimeOperation.REVIEW_VERIFY,
              summary: 'Review verify resolved all actionable findings.',
              details: {
                review_status: CliReviewLifecycleStatus.RESOLVED,
                review_artifact_path: '/tmp/resolved-code-review.md',
                review_task_card_path: '/tmp/CR-008.md',
                overall_decision: 'accepted',
              },
              artifacts: [
                {
                  id: 'review_verify_result',
                  path: '/tmp/review-verify-result.json',
                },
                {
                  id: 'review_ledger_backfill',
                  path: '/tmp/review-ledger-backfill.json',
                },
              ],
            },
          }),
        );
        return 0;
      },
    });

    const result = await commandExecutor(['review-verify']);

    expect(result.deliveryWorkflowUpdate).toEqual({
      currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.RESOLVED,
      pendingAction: 'run_fresh_clean_recheck',
      relatedArtifactPaths: ['/tmp/resolved-code-review.md', '/tmp/CR-008.md'],
      resultSummary: 'Review verify resolved all actionable findings.',
      childWorkflowBacklinks: [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          artifactPath: '/tmp/resolved-code-review.md',
          summary: 'Review verify resolved all actionable findings.',
        },
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
          artifactPath: '/tmp/resolved-code-review.md',
          summary: 'Review verify resolved all actionable findings.',
        },
      ],
    });
  });

  it('projects verified review-verify state into accepted-findings follow-up', async () => {
    const commandExecutor = CliSessionShellEntrypointRuntime.createNestedCommandExecutor({
      locale: 'en-US',
      currentWorkingDirectory: '/workspace',
      environment: {},
      translate: translateSessionShellResponse,
      executeCli: async (_argv, io) => {
        io.stdout(
          JSON.stringify({
            command: 'review-verify',
            message: 'Review verify accepted follow-up work.',
            command_result: {
              operation: CliRuntimeOperation.REVIEW_VERIFY,
              summary: 'Review verify accepted follow-up work.',
              details: {
                review_status: CliReviewLifecycleStatus.VERIFIED,
                review_artifact_path: '/tmp/verified-code-review.md',
                review_task_card_path: '/tmp/CR-008.md',
                overall_decision: 'accepted',
              },
              artifacts: [
                {
                  id: 'review_verify_result',
                  path: '/tmp/review-verify-result.json',
                },
                {
                  id: 'review_ledger_backfill',
                  path: '/tmp/review-ledger-backfill.json',
                },
              ],
            },
          }),
        );
        return 0;
      },
    });

    const result = await commandExecutor(['review-verify']);

    expect(result.deliveryWorkflowUpdate).toEqual({
      currentPhase: SESSION_DELIVERY_WORKFLOW_PHASE.REVIEW_VERIFY_PENDING,
      pendingAction: 'address_accepted_review_findings',
      relatedArtifactPaths: ['/tmp/verified-code-review.md', '/tmp/CR-008.md'],
      resultSummary: 'Review verify accepted follow-up work.',
      childWorkflowBacklinks: [
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW,
          artifactPath: '/tmp/verified-code-review.md',
          summary: 'Review verify accepted follow-up work.',
        },
        {
          capabilityId: SESSION_MAIN_CAPABILITY_ID.REVIEW_VERIFY,
          artifactPath: '/tmp/verified-code-review.md',
          summary: 'Review verify accepted follow-up work.',
        },
      ],
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
  'cli.sessionShell.responses.commandDoctorSummaryReadWrite':
    'Workspace is writable. Baseline doctor checks completed.',
  'cli.sessionShell.responses.commandDoctorSummaryReadOnly':
    'Workspace is read-only. Doctor completed in inspection-only mode.',
  'cli.sessionShell.responses.commandDoctorSummaryGeneric': 'Doctor checks completed.',
  'cli.sessionShell.responses.commandDoctorAdapterChecksEnabled': 'adapter checks run',
  'cli.sessionShell.responses.commandDoctorAdapterChecksSkipped': 'adapter checks not run',
  'cli.sessionShell.responses.commandDoctorCheckTotals':
    '{{pass}} pass / {{warn}} warn / {{fail}} fail',
  'cli.sessionShell.responses.commandDoctorAttentionBaselineDocs':
    'repo-local baseline docs are missing ({{missing}}/{{total}})',
  'cli.sessionShell.responses.commandDoctorAttentionArtifactRegistryUninitialized':
    'artifact registry is not initialized yet',
  'cli.sessionShell.responses.commandDoctorAttentionTaskLedgerUninitialized':
    'task ledger is not initialized yet',
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
