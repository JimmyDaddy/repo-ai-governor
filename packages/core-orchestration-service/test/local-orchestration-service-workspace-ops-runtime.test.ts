import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it, vi } from 'vitest';

import {
  OrchestrationBootstrapReadinessActionId,
  OrchestrationWorkspaceOperationKind,
} from '@repo-ai-governor/orchestration-service-client';
import { LocalOrchestrationServiceWorkspaceOpsRuntime } from '../src/local-orchestration-service-workspace-ops-runtime.js';

function createWorkspaceOpsRuntime() {
  const cliExecutor = vi.fn().mockResolvedValue({
    message: 'ok',
    command_result: {
      operation: 'upgrade_apply',
      summary: 'ok',
    },
  });
  const workspaceResolver = {
    resolve: vi.fn(() => ({
      repositoryRoot: '/repo',
      workspaceId: 'workspace-1',
      workspaceRoot: '/repo/.repo-ai-governor',
      configPath: '/repo/.repo-ai-governor/governor.yaml',
      mode: 'repo_local',
      modeSource: 'config',
    })),
  };

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
    const cliExecutor = vi.fn(async (request: { args: readonly string[]; locale?: string }) => {
      if (request.args[0] === 'config' && request.args[1] === 'status') {
        return {
          command_result: {
            details: {
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              config_exists: true,
              legacy_preference_path: '/repo/.repo-ai-governor/cli-preferences.yaml',
              legacy_preference_exists: false,
            },
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'list') {
        return {
          command_result: {
            details: {
              entries: 'ui.react.theme=calm',
            },
          },
        };
      }

      if (request.args[0] === 'secret' && request.args[1] === 'status') {
        return {
          command_result: {
            details: {
              selected_backend: 'os-keychain',
              default_backend: 'os-keychain',
              index_path: '/repo/.repo-ai-governor/secret-index.json',
            },
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
            details: {
              records: 'openai/api-key@os-keychain:present',
            },
          },
        };
      }

      if (request.args[0] === 'config' && request.args[1] === 'set') {
        return {
          message: 'config updated',
          command_result: {
            details: {
              config_path: '/repo/.repo-ai-governor/user-config.yaml',
              value: request.args[3],
            },
          },
        };
      }

      return {
        message: 'secret updated',
        command_result: {
          details: {
            selector: 'secret://openai/api-key',
            backend: 'os-keychain',
          },
        },
      };
    });
    const workspaceResolver = {
      resolve: vi.fn(() => ({
        repositoryRoot: '/repo',
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo/.repo-ai-governor',
        configPath: '/repo/.repo-ai-governor/governor.yaml',
        mode: 'repo_local',
        modeSource: 'config',
      })),
    };
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

  it('returns centrally typed bootstrap-readiness actions for both readiness branches', async () => {
    const workspaceResolver = {
      resolve: vi.fn(() => ({
        repositoryRoot: '/repo',
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo/.repo-ai-governor',
        configPath: '/repo/.repo-ai-governor/governor.yaml',
        mode: 'repo_local',
        modeSource: 'config',
      })),
    };
    const configLoader = {
      loadFromFile: vi.fn(() => ({
        workspace: {
          mode: 'repo_local',
        },
      })),
    };
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

  it('routes doctor through the adapter-readiness CLI variant', async () => {
    const { runtime, cliExecutor } = createWorkspaceOpsRuntime();

    await runtime.runWorkspaceOperation({
      operationKind: OrchestrationWorkspaceOperationKind.DOCTOR,
    });

    expect(cliExecutor).toHaveBeenCalledWith({
      args: ['doctor', '--adapters', '--output', 'pretty'],
      currentWorkingDirectory: '/repo',
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
    const workspaceResolver = {
      resolve: vi.fn(() => ({
        repositoryRoot: '/repo',
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo/.repo-ai-governor',
        configPath: '/repo/.repo-ai-governor/governor.yaml',
        mode: 'repo_local',
        modeSource: 'config',
      })),
    };
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
    const workspaceResolver = {
      resolve: vi.fn(() => ({
        repositoryRoot,
        workspaceId: 'workspace-1',
        workspaceRoot,
        configPath: join(workspaceRoot, 'governor.yaml'),
        mode: 'repo_local',
        modeSource: 'config',
      })),
    };
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
    const workspaceResolver = {
      resolve: vi.fn(() => ({
        repositoryRoot: '/repo',
        workspaceId: 'workspace-1',
        workspaceRoot: '/repo/.repo-ai-governor',
        configPath: '/repo/.repo-ai-governor/governor.yaml',
        mode: 'repo_local',
        modeSource: 'config',
      })),
    };
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
