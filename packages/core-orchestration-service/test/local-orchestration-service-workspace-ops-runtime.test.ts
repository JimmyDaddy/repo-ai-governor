import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import { type GovernorConfig, WorkspaceMode, WorkspaceModeSource } from '@repo-ai-governor/config';
import {
  OrchestrationBootstrapReadinessActionId,
  OrchestrationWorkflowDraftEntryMode,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import { LocalOrchestrationServiceWorkspaceOpsRuntime } from '../src/local-orchestration-service-workspace-ops-runtime.js';

type WorkspaceOpsDependencies = ConstructorParameters<
  typeof LocalOrchestrationServiceWorkspaceOpsRuntime
>[0];
type WorkspaceOpsCliExecutor = NonNullable<WorkspaceOpsDependencies['cliExecutor']>;
type WorkspaceOpsResolvedWorkspace = ReturnType<
  NonNullable<WorkspaceOpsDependencies['workspaceResolver']>['resolve']
>;

function createCliDetailsRecord(
  details: Record<string, boolean | number | string | null>,
): Record<string, boolean | number | string | null> {
  return details;
}

function createResolvedWorkspace(
  overrides: Partial<WorkspaceOpsResolvedWorkspace> = {},
): WorkspaceOpsResolvedWorkspace {
  return {
    repositoryRoot: '/repo',
    workspaceId: 'workspace-1',
    workspaceRoot: '/repo/.repo-ai-governor',
    configPath: '/repo/.repo-ai-governor/governor.yaml',
    mode: WorkspaceMode.REPO_LOCAL,
    modeSource: WorkspaceModeSource.CONFIG,
    ...overrides,
  };
}

function createWorkspaceResolver(
  overrides: Partial<WorkspaceOpsResolvedWorkspace> = {},
): NonNullable<WorkspaceOpsDependencies['workspaceResolver']> {
  return {
    resolve: vi.fn(() => createResolvedWorkspace(overrides)),
  };
}

function createGovernorConfig(overrides: Partial<GovernorConfig> = {}): GovernorConfig {
  const { workspace, i18n, ...rest } = overrides;
  return {
    schemaVersion: '1',
    workspace: {
      mode: WorkspaceMode.REPO_LOCAL,
      ...workspace,
    },
    i18n: {
      runtimeEngine: 'i18next',
      defaultLocale: 'en-US',
      fallbackLocale: 'en-US',
      supportedLocales: ['en-US', 'zh-CN'],
      ...i18n,
    },
    ...rest,
  };
}

function createConfigLoader(
  overrides: Partial<GovernorConfig> = {},
): NonNullable<WorkspaceOpsDependencies['configLoader']> {
  return {
    loadFromFile: vi.fn(() => createGovernorConfig(overrides)),
  };
}

function createWorkspaceOpsRuntime() {
  const cliExecutor = vi.fn().mockResolvedValue({
    message: 'ok',
    command_result: {
      operation: 'upgrade_apply',
      summary: 'ok',
    },
  });
  const workspaceResolver = createWorkspaceResolver();

  return {
    cliExecutor,
    runtime: new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver,
      pathExists: () => false,
      cliExecutor,
    }),
  };
}

describe('LocalOrchestrationServiceWorkspaceOpsRuntime', () => {
  it('threads locale through secure-authoring diagnostics and secure mutations', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries: 'ui.react.theme=calm',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:missing',
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'set') {
        return {
          message: 'config updated',
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              value: request.args[3],
            }),
          },
        };
      }

      return {
        message: 'secret updated',
        command_result: {
          details: createCliDetailsRecord({
            selector: 'secret://openai/api-key',
            backend: 'os-keychain',
          }),
        },
      };
    });
    const workspaceResolver = createWorkspaceResolver();
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver,
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.querySecureAuthoring({
        locale: 'zh-CN',
      }),
    ).resolves.toMatchObject({
      userConfig: {
        configPath: '/repo/.repo-ai-governor/user-config.yaml',
      },
      secretReadiness: {
        selectedBackendId: 'os-keychain',
      },
    });
    await runtime.setUserConfigValue({
      keyPath: 'workspace.mode_preference',
      value: 'tool_managed',
      locale: 'zh-CN',
    });
    await runtime.setManagedSecret({
      keyName: 'openai/api-key',
      value: 'sk-managed-secret',
      backendId: 'os-keychain',
      locale: 'zh-CN',
    });

    expect(cliExecutor).toHaveBeenNthCalledWith(1, {
      args: ['config', 'status'],
      currentWorkingDirectory: '/repo',
      locale: 'zh-CN',
    });
    expect(cliExecutor).toHaveBeenNthCalledWith(4, {
      args: ['secret', 'list'],
      currentWorkingDirectory: '/repo',
      locale: 'zh-CN',
    });
    expect(cliExecutor).toHaveBeenNthCalledWith(5, {
      args: ['config', 'set', 'workspace.mode_preference', 'tool_managed'],
      currentWorkingDirectory: '/repo',
      locale: 'zh-CN',
    });
    expect(cliExecutor).toHaveBeenNthCalledWith(6, {
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-managed-secret',
      locale: 'zh-CN',
    });
  });

  it('projects provider-onboarding snapshot and apply through the managed secret and config seams', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-5.4 | tools.codex.remoteApi.credentialRef=secret://openai/api-key',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:missing',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'set') {
        return {
          message: 'secret updated',
          command_result: {
            details: createCliDetailsRecord({
              selector: 'secret://openai/api-key',
              backend: 'os-keychain',
            }),
          },
        };
      }

      return {
        message: 'config updated',
        command_result: {
          details: createCliDetailsRecord({
            value: request.args[3],
          }),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.queryProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      transport: 'remote_api',
      credentialRef: 'secret://openai/api-key',
      selectedBackendId: 'os-keychain',
      defaultBackendId: 'os-keychain',
    });
    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      secretBackend: 'os-keychain',
      nextAction: 'repoAiGovernor.runConnect',
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-live',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'set', 'tools.codex.transport', 'remote_api'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.credentialEnvVar'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('clears one stale endpoint during direct provider onboarding when the endpoint override is blank', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-5.4 | tools.codex.remoteApi.credentialRef=secret://openai/api-key | tools.codex.remoteApi.endpoint=https://stale.example/v1',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:missing',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'set') {
        return {
          message: 'secret updated',
          command_result: {
            details: createCliDetailsRecord({
              selector: 'secret://openai/api-key',
              backend: 'os-keychain',
            }),
          },
        };
      }

      return {
        message: 'config updated',
        command_result: {
          details: createCliDetailsRecord({
            value: request.args[3] ?? null,
          }),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
        endpoint: '',
      }),
    ).resolves.toMatchObject({
      configTargets: expect.arrayContaining(['tools.codex.remoteApi.endpoint']),
    });

    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.endpoint'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('falls back to defaultBackendId when the selected backend is no longer writable', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-5.4 | tools.codex.remoteApi.credentialRef=secret://openai/api-key',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'unsafe-local-file',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_unsafe-local-file',
                status: 'fail',
                detail: 'disabled',
              },
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:missing',
            }),
          },
        };
      }

      return {
        message: 'unexpected mutation',
        command_result: {
          details: createCliDetailsRecord({}),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      secretBackend: 'os-keychain',
    });

    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-live',
      locale: undefined,
    });
  });

  it('fails closed when provider onboarding receives an unsupported tool/provider pairing', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries: '',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      return {
        command_result: {
          details: createCliDetailsRecord({
            records: '',
          }),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.queryProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        provider: 'anthropic' as never,
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
      message: 'Provider onboarding only supports provider openai for tool codex.',
    });
    await expect(
      runtime.queryProviderOnboarding({
        tool: 'claude-code' as never,
        entrypointKind: 'quick_pick_form',
        provider: 'openai' as never,
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
      message: 'Provider onboarding only supports provider anthropic for tool claude-code.',
    });
  });

  it('returns centrally typed bootstrap-readiness actions for both readiness branches', async () => {
    const workspaceResolver = createWorkspaceResolver();
    const configLoader = createConfigLoader();
    const missingConfigRuntime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      configLoader,
      workspaceResolver,
      pathExists: () => false,
      cliExecutor: vi.fn(),
    });
    const readyConfigRuntime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      configLoader,
      workspaceResolver,
      pathExists: () => true,
      cliExecutor: vi.fn(),
    });

    await expect(missingConfigRuntime.queryBootstrapReadiness()).resolves.toMatchObject({
      recommendedActions: [OrchestrationBootstrapReadinessActionId.RUN_WORKSPACE_BOOTSTRAP],
    });
    await expect(readyConfigRuntime.queryBootstrapReadiness()).resolves.toMatchObject({
      recommendedActions: [OrchestrationBootstrapReadinessActionId.REFRESH_WORKSPACE_STATE],
    });
  });

  it('honors the constructor workspaceRoot override even when repositoryRoot is present', async () => {
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/tmp/scratch-workspace/.repo-ai-governor',
      repositoryRoot: '/repo',
      pathExists: () => false,
      cliExecutor: vi.fn(),
    });

    await expect(runtime.queryBootstrapReadiness()).resolves.toMatchObject({
      repositoryRoot: '/repo',
      workspaceRoot: '/tmp/scratch-workspace/.repo-ai-governor',
      configPath: '/tmp/scratch-workspace/.repo-ai-governor/governor.yaml',
    });
  });

  it('passes the explicit upgrade confirmation decision through to the CLI layer', async () => {
    const { runtime, cliExecutor } = createWorkspaceOpsRuntime();

    await runtime.runWorkspaceOperation({
      operationKind: OrchestrationWorkspaceOperationKind.UPGRADE_APPLY,
      arguments: {
        reportPath: '/repo/.repo-ai-governor/context/upgrade/upgrade-20260418.report.json',
        confirmUpgrade: 'approve',
      },
    });

    expect(cliExecutor).toHaveBeenCalledWith({
      args: [
        'upgrade',
        'apply',
        '/repo/.repo-ai-governor/context/upgrade/upgrade-20260418.report.json',
        '--confirm-upgrade',
        'approve',
      ],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('routes doctor through the adapter-readiness CLI variant without overriding service-owned json output', async () => {
    const { runtime, cliExecutor } = createWorkspaceOpsRuntime();

    await runtime.runWorkspaceOperation({
      operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
    });

    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['doctor', '--adapters'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('runs connect as generate plus apply so plugin users do not stop at candidate artifacts', async () => {
    const cliExecutor = vi
      .fn()
      .mockResolvedValueOnce({
        message: 'connect plan prepared',
        command_result: {
          operation: 'connect',
          summary: 'connect plan prepared',
          artifacts: [
            {
              id: 'connect_plan',
              path: '/repo/.repo-ai-governor/context/connect/latest.plan.json',
            },
          ],
        },
      })
      .mockResolvedValueOnce({
        message: 'connect applied',
        command_result: {
          operation: 'connect_apply',
          summary: 'connect applied',
          artifacts: [
            {
              id: 'connect_receipt',
              path: '/repo/.repo-ai-governor/context/connect/latest.receipt.json',
            },
          ],
        },
      });
    const workspaceResolver = createWorkspaceResolver();
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver,
      pathExists: () => false,
      cliExecutor,
    });

    const response = await runtime.runWorkspaceOperation({
      operationKind: OrchestrationWorkspaceOperationKind.CONNECT,
      arguments: {
        presetId: 'multi-tool-default',
        tools: ['codex'],
        toolTransportBindings: ['codex=remote_api'],
        remoteApiModelBindings: ['codex=gpt-5.4'],
      },
    });

    expect(cliExecutor).toHaveBeenNthCalledWith(1, {
      args: [
        'connect',
        '--preset',
        'multi-tool-default',
        '--tools',
        'codex',
        '--tool-transport',
        'codex=remote_api',
        '--remote-api-model',
        'codex=gpt-5.4',
      ],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenNthCalledWith(2, {
      args: ['connect', 'apply', '--latest'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
    expect(response).toMatchObject({
      message: 'connect applied',
      result: {
        operation: 'connect_apply',
        summary: 'connect applied',
        artifacts: [
          {
            id: 'connect_plan',
            path: '/repo/.repo-ai-governor/context/connect/latest.plan.json',
          },
          {
            id: 'connect_receipt',
            path: '/repo/.repo-ai-governor/context/connect/latest.receipt.json',
          },
        ],
      },
    });
  });

  it('localizes embedded CLI bootstrap failure copy before injecting it into the child process', () => {
    const { runtime } = createWorkspaceOpsRuntime();

    const zhBootstrapSource = (
      runtime as unknown as {
        renderEmbeddedCliBootstrapSource: (cliModulePath: string, failureMessage: string) => string;
        resolveEmbeddedCliBootstrapFailureMessage: (locale?: string) => string;
      }
    ).renderEmbeddedCliBootstrapSource(
      '/repo/node_modules/@repo-ai-governor/cli/dist/src/index.js',
      (
        runtime as unknown as {
          resolveEmbeddedCliBootstrapFailureMessage: (locale?: string) => string;
        }
      ).resolveEmbeddedCliBootstrapFailureMessage('zh-CN'),
    );

    expect(zhBootstrapSource).toContain('当前内嵌 CLI 模块未导出 runCli()。');
    expect(zhBootstrapSource).not.toContain('Embedded CLI module did not expose runCli().');
  });

  it('rolls back staged onboarding mutations when CONNECT apply fails', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.transport=remote_api | tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.vendorBinding=openai_responses | tools.codex.remoteApi.model=gpt-4o | tools.codex.remoteApi.credentialRef=secret://openai/api-key | tools.codex.remoteApi.endpoint=https://old.example/v1 | tools.codex.remoteApi.credentialEnvVar=OPENAI_API_KEY',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:missing',
            }),
          },
        };
      }

      if (request.args[0] === 'connect' && request.args[1] === 'apply') {
        throw new RuntimeError(
          GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
          'connect apply failed',
        );
      }

      if (request.args[0] === 'connect') {
        return {
          message: 'connect plan prepared',
          command_result: {
            operation: 'connect_generate',
            summary: 'connect plan prepared',
          },
        };
      }

      return {
        message: 'mutation applied',
        command_result: {
          details: createCliDetailsRecord({
            value: request.args[3] ?? null,
          }),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.CONNECT,
        arguments: {
          presetId: 'multi-tool-default',
          tools: ['codex'],
          toolTransportBindings: ['codex=remote_api'],
          providerOnboardingTool: 'codex',
          providerOnboardingEntrypointKind: 'quick_pick_form',
          providerOnboardingProvider: 'openai',
          providerOnboardingModel: 'gpt-5.5',
          providerOnboardingApiKey: 'sk-live',
          providerOnboardingEndpoint: '',
          providerOnboardingBackendId: 'os-keychain',
        },
      }),
    ).rejects.toThrow('connect apply failed');

    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-live',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'set', 'tools.codex.remoteApi.endpoint', 'https://old.example/v1'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'set', 'tools.codex.remoteApi.credentialEnvVar', 'OPENAI_API_KEY'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['secret', 'delete', 'openai/api-key', '--backend', 'os-keychain'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('fails closed before connect when direct onboarding would overwrite an existing managed secret', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.transport=remote_api | tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.vendorBinding=openai_responses | tools.codex.remoteApi.model=gpt-4o | tools.codex.remoteApi.credentialRef=secret://openai/api-key',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:present',
            }),
          },
        };
      }

      return {
        message: 'unexpected mutation',
        command_result: {
          details: createCliDetailsRecord({}),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.CONNECT,
        arguments: {
          presetId: 'multi-tool-default',
          tools: ['codex'],
          toolTransportBindings: ['codex=remote_api'],
          providerOnboardingTool: 'codex',
          providerOnboardingEntrypointKind: 'quick_pick_form',
          providerOnboardingProvider: 'openai',
          providerOnboardingModel: 'gpt-5.5',
          providerOnboardingApiKey: 'sk-live',
          providerOnboardingEndpoint: '',
          providerOnboardingBackendId: 'os-keychain',
        },
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
      message:
        'Connect onboarding will not overwrite existing managed secret secret://openai/api-key. Use the dedicated update/reconnect flow instead.',
    });

    expect(cliExecutor).toHaveBeenCalledTimes(4);
  });

  it('reuses an existing managed secret during connect while still applying cleanup mutations', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.transport=remote_api | tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.vendorBinding=openai_responses | tools.codex.remoteApi.model=gpt-4o | tools.codex.remoteApi.credentialRef=secret://openai/api-key | tools.codex.remoteApi.endpoint=https://stale.example/v1 | tools.codex.remoteApi.credentialEnvVar=OPENAI_API_KEY',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:present',
            }),
          },
        };
      }

      if (request.args[0] === 'connect') {
        return {
          message: request.args[1] === 'apply' ? 'connect applied' : 'connect generated',
          command_result: {
            operation: request.args[1] === 'apply' ? 'connect_apply' : 'connect_generate',
            summary: request.args[1] === 'apply' ? 'connect applied' : 'connect generated',
          },
        };
      }

      return {
        message: 'mutation applied',
        command_result: {
          details: createCliDetailsRecord({
            value: request.args[3] ?? null,
          }),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.CONNECT,
        arguments: {
          presetId: 'multi-tool-default',
          tools: ['codex'],
          toolTransportBindings: ['codex=remote_api'],
          providerOnboardingTool: 'codex',
          providerOnboardingEntrypointKind: 'quick_pick_form',
          providerOnboardingProvider: 'openai',
          providerOnboardingModel: 'gpt-5.5',
          providerOnboardingReuseExistingCredential: true,
          providerOnboardingEndpoint: '',
          providerOnboardingBackendId: 'os-keychain',
        },
      }),
    ).resolves.toMatchObject({
      message: 'connect applied',
    });

    expect(cliExecutor).not.toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: '',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.endpoint'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.credentialEnvVar'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('keeps same-backend reuse stable when duplicate managed-secret keys exist on multiple backends', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.transport=remote_api | tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.vendorBinding=openai_responses | tools.codex.remoteApi.model=gpt-4o | tools.codex.remoteApi.credentialRef=secret://openai/api-key | tools.codex.remoteApi.credentialEnvVar=OPENAI_API_KEY',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'unsafe-local-file',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_unsafe-local-file',
                status: 'pass',
                detail: 'Local plaintext',
              },
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records:
                'openai/api-key@unsafe-local-file:present | openai/api-key@os-keychain:present',
            }),
          },
        };
      }

      if (request.args[0] === 'connect') {
        return {
          message: request.args[1] === 'apply' ? 'connect applied' : 'connect generated',
          command_result: {
            operation: request.args[1] === 'apply' ? 'connect_apply' : 'connect_generate',
            summary: request.args[1] === 'apply' ? 'connect applied' : 'connect generated',
          },
        };
      }

      return {
        message: 'mutation applied',
        command_result: {
          details: createCliDetailsRecord({
            value: request.args[3] ?? null,
          }),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.CONNECT,
        arguments: {
          presetId: 'multi-tool-default',
          tools: ['codex'],
          toolTransportBindings: ['codex=remote_api'],
          providerOnboardingTool: 'codex',
          providerOnboardingEntrypointKind: 'quick_pick_form',
          providerOnboardingProvider: 'openai',
          providerOnboardingModel: 'gpt-5.5',
          providerOnboardingReuseExistingCredential: true,
          providerOnboardingEndpoint: '',
          providerOnboardingBackendId: 'os-keychain',
        },
      }),
    ).resolves.toMatchObject({
      message: 'connect applied',
    });

    expect(cliExecutor).not.toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: '',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.credentialEnvVar'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('prefers defaultBackendId over selectedBackendId when direct provider onboarding omits an explicit backend override', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-4o | tools.codex.remoteApi.credentialRef=secret://openai/api-key',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'unsafe-local-file',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_unsafe-local-file',
                status: 'pass',
                detail: 'Local plaintext',
              },
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:missing',
            }),
          },
        };
      }

      return {
        message: 'mutation applied',
        command_result: {
          details: createCliDetailsRecord({
            value: request.args[3] ?? null,
          }),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      secretBackend: 'os-keychain',
    });

    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-live',
      locale: undefined,
    });
  });

  it('reuses an existing managed secret during direct provider onboarding without rewriting it', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-4o | tools.codex.remoteApi.credentialRef=secret://openai/api-key | tools.codex.remoteApi.credentialEnvVar=OPENAI_API_KEY',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'unsafe-local-file',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_unsafe-local-file',
                status: 'pass',
                detail: 'Local plaintext',
              },
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records:
                'openai/api-key@unsafe-local-file:present | openai/api-key@os-keychain:present',
            }),
          },
        };
      }

      return {
        message: 'mutation applied',
        command_result: {
          details: createCliDetailsRecord({
            value: request.args[3] ?? null,
          }),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: '',
        reuseExistingCredential: true,
      }),
    ).resolves.toMatchObject({
      tool: 'codex',
      provider: 'openai',
      secretBackend: 'os-keychain',
      credentialRef: 'secret://openai/api-key',
    });

    expect(cliExecutor).not.toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: '',
      locale: undefined,
    });
    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['config', 'unset', 'tools.codex.remoteApi.credentialEnvVar'],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('fails closed before direct provider onboarding overwrites an existing managed secret', async () => {
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>(async (request) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            }),
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              entries:
                'tools.codex.remoteApi.provider=openai | tools.codex.remoteApi.model=gpt-4o | tools.codex.remoteApi.credentialRef=secret://openai/api-key',
            }),
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            }),
            checks: [
              {
                id: 'secret_backend_os-keychain',
                status: 'pass',
                detail: 'Ready',
              },
            ],
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'list') {
        return {
          command_result: {
            details: createCliDetailsRecord({
              records: 'openai/api-key@os-keychain:present',
            }),
          },
        };
      }

      return {
        message: 'unexpected mutation',
        command_result: {
          details: createCliDetailsRecord({}),
        },
      };
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.applyProviderOnboarding({
        tool: 'codex' as never,
        entrypointKind: 'quick_pick_form',
        model: 'gpt-5.5',
        apiKey: 'sk-live',
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
      message:
        'Provider onboarding will not overwrite existing managed secret secret://openai/api-key. Use the dedicated update/reconnect flow instead.',
    });

    expect(cliExecutor).not.toHaveBeenCalledWith({
      args: ['secret', 'set', 'openai/api-key', '--backend', 'os-keychain', '--stdin'],
      currentWorkingDirectory: '/repo',
      stdin: 'sk-live',
      locale: undefined,
    });
  });

  it('captures layered logs and the latest service-owned workspace-operation snapshot', async () => {
    const cliExecutor = vi.fn().mockResolvedValue({
      message: 'Doctor completed.',
      command_result: {
        operation: 'env_doctor',
        summary: 'Doctor completed.',
        check_totals: {
          pass: 5,
          warn: 1,
          fail: 0,
        },
        checks: [
          {
            id: 'artifact_registry_state',
            status: 'warn',
            detail: 'artifact registry is not initialized yet',
          },
        ],
        artifacts: [
          {
            id: 'doctor_diagnostics',
            path: '/repo/.repo-ai-governor/context/diagnostics/doctor/doctor-1.json',
          },
        ],
        experience: {
          interactionPrompts: [
            {
              title: 'Workspace is read-only',
              action:
                'Switch to writable attach mode if you need to create/update governance artifacts.',
              blocking: false,
            },
          ],
          layeredLogs: {
            summary: ['attach_mode=read_only'],
            detailed: ['workspace_root=/repo/.repo-ai-governor'],
          },
        },
      },
    });
    const workspaceResolver = createWorkspaceResolver();
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver,
      pathExists: () => false,
      cliExecutor,
      nowProvider: () => new Date('2026-04-18T03:04:05.000Z'),
    });

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
      }),
    ).resolves.toEqual({
      message: 'Doctor completed.',
      result: {
        operation: 'env_doctor',
        summary: 'Doctor completed.',
        checkTotals: {
          pass: 5,
          warn: 1,
          fail: 0,
        },
        checks: [
          {
            id: 'artifact_registry_state',
            status: 'warn',
            detail: 'artifact registry is not initialized yet',
          },
        ],
        artifacts: [
          {
            id: 'doctor_diagnostics',
            path: '/repo/.repo-ai-governor/context/diagnostics/doctor/doctor-1.json',
          },
        ],
        interactionPrompts: [
          {
            title: 'Workspace is read-only',
            action:
              'Switch to writable attach mode if you need to create/update governance artifacts.',
            blocking: false,
          },
        ],
        layeredLogs: {
          summary: ['attach_mode=read_only'],
          detailed: ['workspace_root=/repo/.repo-ai-governor'],
        },
      },
    });
    expect(runtime.getLatestWorkspaceOperationSnapshot()).toEqual({
      operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
      completedAt: '2026-04-18T03:04:05.000Z',
      message: 'Doctor completed.',
      result: {
        operation: 'env_doctor',
        summary: 'Doctor completed.',
        checkTotals: {
          pass: 5,
          warn: 1,
          fail: 0,
        },
        checks: [
          {
            id: 'artifact_registry_state',
            status: 'warn',
            detail: 'artifact registry is not initialized yet',
          },
        ],
        artifacts: [
          {
            id: 'doctor_diagnostics',
            path: '/repo/.repo-ai-governor/context/diagnostics/doctor/doctor-1.json',
          },
        ],
        interactionPrompts: [
          {
            title: 'Workspace is read-only',
            action:
              'Switch to writable attach mode if you need to create/update governance artifacts.',
            blocking: false,
          },
        ],
        layeredLogs: {
          summary: ['attach_mode=read_only'],
          detailed: ['workspace_root=/repo/.repo-ai-governor'],
        },
      },
    });
  });

  it('rehydrates the latest workspace-operation snapshot from the workspace-owned read model', async () => {
    const repositoryRoot = mkdtempSync(join(tmpdir(), 'workspace-ops-repo-'));
    const workspaceRoot = join(repositoryRoot, '.repo-ai-governor');
    mkdirSync(workspaceRoot, { recursive: true });
    const workspaceResolver = createWorkspaceResolver({
      repositoryRoot,
      workspaceRoot,
      configPath: join(workspaceRoot, 'governor.yaml'),
    });
    const cliExecutor = vi.fn().mockResolvedValue({
      message: '医生检查完成。',
      command_result: {
        operation: 'env_doctor',
        summary: '医生检查完成。',
        check_totals: {
          pass: 3,
          warn: 1,
          fail: 0,
        },
        experience: {
          interactionPrompts: [
            {
              title: '当前工作区是只读模式',
              action: '如需写入治理产物，请切换到可写 attach mode。',
              blocking: false,
            },
          ],
          layeredLogs: {
            summary: ['attach_mode=read_only'],
            detailed: ['workspace_root=.repo-ai-governor'],
          },
        },
      },
    });

    try {
      const writerRuntime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
        workspaceRoot,
        repositoryRoot,
        workspaceResolver,
        pathExists: existsSync,
        cliExecutor,
        nowProvider: () => new Date('2026-04-18T09:10:11.000Z'),
      });

      await writerRuntime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
        locale: 'zh-CN',
      });

      const readerRuntime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
        workspaceRoot,
        repositoryRoot,
        workspaceResolver,
        pathExists: existsSync,
        cliExecutor,
      });

      expect(readerRuntime.getLatestWorkspaceOperationSnapshot()).toEqual({
        operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
        completedAt: '2026-04-18T09:10:11.000Z',
        locale: 'zh-CN',
        message: '医生检查完成。',
        result: {
          operation: 'env_doctor',
          summary: '医生检查完成。',
          checkTotals: {
            pass: 3,
            warn: 1,
            fail: 0,
          },
          interactionPrompts: [
            {
              title: '当前工作区是只读模式',
              action: '如需写入治理产物，请切换到可写 attach mode。',
              blocking: false,
            },
          ],
          layeredLogs: {
            summary: ['attach_mode=read_only'],
            detailed: ['workspace_root=.repo-ai-governor'],
          },
        },
      });
    } finally {
      rmSync(repositoryRoot, { recursive: true, force: true });
    }
  });

  it('blocks upgrade apply when the client did not provide an explicit confirmation decision', async () => {
    const { runtime } = createWorkspaceOpsRuntime();

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.UPGRADE_APPLY,
        arguments: {
          reportPath: '/repo/.repo-ai-governor/context/upgrade/upgrade-20260418.report.json',
        },
      }),
    ).rejects.toThrow(
      'Upgrade apply requires an explicit confirmUpgrade decision from the client surface.',
    );
  });

  it('derives the HOST_PACK fallback bundle directory from the selected host', async () => {
    const { runtime, cliExecutor } = createWorkspaceOpsRuntime();

    await runtime.runWorkspaceOperation({
      operationKind: OrchestrationWorkspaceOperationKind.HOST_PACK,
      arguments: {
        host: 'codex',
      },
    });

    expect(cliExecutor).toHaveBeenCalledWith({
      args: [
        'host',
        'pack',
        '--host',
        'codex',
        '--mode',
        'plugin-bundle',
        '--bundle-dir',
        '/repo/.repo-ai-governor/generated/bundles/codex',
      ],
      currentWorkingDirectory: '/repo',
      locale: undefined,
    });
  });

  it('routes workflow preview/create/edit through the service-owned draft runtime', async () => {
    const workflowDraftRuntime = {
      startWorkflowDraft: vi.fn().mockResolvedValue({
        applied: true,
        message: 'Workflow draft is ready.',
        draftSession: {
          workflowDraftId: 'workflow-draft-001',
          draftRevision: 'draft-revision-001',
          baseDefinitionRevision: 'base-revision-001',
          templateId: 'starter-template',
          entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
          nodeSpecs: [],
          edgeSpecs: [],
          supportedPatchOps: [],
          validationIssues: [],
          conflictState: {
            hasConflict: false,
            conflictKind: 'none',
            detectedAt: '2026-04-22T08:00:00.000Z',
          },
          compiledIrPreview: {
            processId: 'process-starter-template',
            entryNodeId: 'entry-node',
            compiledAt: '2026-04-22T08:00:00.000Z',
            nodeCount: 0,
            edgeCount: 0,
            compileWarningCount: 0,
            compileErrorCount: 0,
            compileWarnings: [],
            compileErrors: [],
          },
          backlinkArtifacts: [
            {
              artifactId: 'workflow-draft-session',
              artifactKind: 'workflow_draft_session',
              artifactPath:
                '/repo/.repo-ai-governor/context/workflow/draft-sessions/direct-workbench.active.json',
            },
          ],
        },
      }),
    };
    const cliExecutor = vi.fn<WorkspaceOpsCliExecutor>().mockResolvedValue({
      message: 'cli should not run',
      command_result: {
        operation: 'workflow_create',
        summary: 'cli should not run',
      },
    });
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver: createWorkspaceResolver(),
      pathExists: () => false,
      cliExecutor,
      workflowDraftRuntime,
    });

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.WORKFLOW_CREATE,
        arguments: {
          templateId: 'starter-template',
        },
      }),
    ).resolves.toMatchObject({
      message: 'Workflow draft is ready.',
      result: {
        operation: OrchestrationWorkspaceOperationKind.WORKFLOW_CREATE,
        details: {
          workflowDraftId: 'workflow-draft-001',
          entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
          templateId: 'starter-template',
        },
      },
    });

    expect(workflowDraftRuntime.startWorkflowDraft).toHaveBeenCalledWith({
      entryMode: OrchestrationWorkflowDraftEntryMode.CREATE_SEED,
      templateId: 'starter-template',
      locale: undefined,
    });
    expect(cliExecutor).not.toHaveBeenCalled();
  });

  it('fails closed when the caller sends an unsupported workspace operation kind', async () => {
    const { runtime } = createWorkspaceOpsRuntime();

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: 'unsupported_workspace_operation' as OrchestrationWorkspaceOperationKind,
      }),
    ).rejects.toThrow(
      'Unsupported workspace operation kind received by the local orchestration service workspace ops runtime.',
    );
  });

  it('localizes workspace-operation validation and fallback copy for zh-CN callers', async () => {
    const cliExecutor = vi.fn().mockResolvedValue({
      command_result: {
        operation: 'doctor',
        summary: '',
      },
    });
    const workspaceResolver = createWorkspaceResolver();
    const runtime = new LocalOrchestrationServiceWorkspaceOpsRuntime({
      workspaceRoot: '/repo/.repo-ai-governor',
      repositoryRoot: '/repo',
      workspaceResolver,
      pathExists: () => false,
      cliExecutor,
    });

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
        locale: 'zh-CN',
      }),
    ).resolves.toMatchObject({
      message: '命令已完成。',
      result: {
        summary: '命令已完成。',
      },
    });

    await expect(
      runtime.runWorkspaceOperation({
        operationKind: OrchestrationWorkspaceOperationKind.UPGRADE_APPLY,
        locale: 'zh-CN',
        arguments: {
          reportPath: '/repo/.repo-ai-governor/context/upgrade/upgrade-20260418.report.json',
        },
      }),
    ).rejects.toThrow('升级应用需要客户端显式提供 confirmUpgrade 决策。');
  });
});
