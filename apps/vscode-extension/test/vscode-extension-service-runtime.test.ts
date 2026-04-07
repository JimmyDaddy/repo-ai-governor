import { vi } from 'vitest';

import {
  MemoryProviderDistributionMode,
  MemoryProviderHostSurface,
  MemoryProviderResolutionSource,
  MemoryProviderRuntimeMode,
} from '@repo-ai-governor/memory-provider-registry';
import {
  OrchestrationServiceHostKind,
  OrchestrationServiceLifecycleStatus,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, MemoryStoreEngine, RuntimeError } from '@repo-ai-governor/shared';

const serviceClientMock = vi.hoisted(() => ({
  getHealth: vi.fn(),
  dispose: vi.fn(),
}));

const vscodeMock = vi.hoisted(() => ({
  state: {
    trusted: true,
    workspaceFolders: [
      {
        name: 'ai-governor',
        uri: {
          fsPath: '/repo',
        },
      },
    ],
    activeTextEditor: undefined,
  },
}));

vi.mock(
  'vscode',
  () => ({
    workspace: {
      get isTrusted() {
        return vscodeMock.state.trusted;
      },
      get workspaceFolders() {
        return vscodeMock.state.workspaceFolders;
      },
    },
    window: {
      get activeTextEditor() {
        return vscodeMock.state.activeTextEditor;
      },
    },
  }),
  { virtual: true },
);

vi.mock('@repo-ai-governor/core-orchestration-service', () => ({
  LocalOrchestrationServiceSidecarClient: class LocalOrchestrationServiceSidecarClient {
    public readonly getHealth = serviceClientMock.getHealth;

    public readonly dispose = serviceClientMock.dispose;
  },
}));

import { VsCodeExtensionServiceRuntime } from '../src/runtime/vscode-extension-service-runtime.js';

describe('VsCodeExtensionServiceRuntime', () => {
  beforeEach(() => {
    serviceClientMock.getHealth.mockReset();
    serviceClientMock.dispose.mockReset();
    vscodeMock.state.trusted = true;
    vscodeMock.state.workspaceFolders = [
      {
        name: 'ai-governor',
        uri: {
          fsPath: '/repo',
        },
      },
    ];
    vscodeMock.state.activeTextEditor = undefined;
  });

  it('keeps editor-local workspace facts available when the health probe fails', async () => {
    serviceClientMock.getHealth.mockRejectedValueOnce(
      new RuntimeError(GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND, 'health probe failed', {
        surface: 'vscode_extension_test',
      }),
    );

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.resolveWorkspaceContextSnapshot()).resolves.toEqual({
      workspaceLabel: 'ai-governor',
      workspaceRoot: '/repo',
      workspaceTrusted: true,
    });
  });

  it('adds service diagnostics when the health probe succeeds', async () => {
    serviceClientMock.getHealth.mockResolvedValueOnce({
      serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
      serviceTransportKind: OrchestrationServiceTransportKind.IPC,
      lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
      checkpointCapable: true,
      workspaceRoot: '/repo',
      startedAt: '2026-04-07T03:00:00.000Z',
      protocolVersion: '1',
      pid: 4321,
      memoryProvider: {
        memoryStoreEngine: MemoryStoreEngine.SQLITE_FS,
        memoryStoreRoot: 'context/memory/service',
        memoryStoreProvider: 'sqlite-fs',
        memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
        memoryStoreDistributionMode: MemoryProviderDistributionMode.DEFAULT,
        memoryStoreResolutionSource: MemoryProviderResolutionSource.PLUGIN_MODULE,
        memoryStoreHostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
        memoryStoreRuntimeMode: MemoryProviderRuntimeMode.DAEMON,
      },
    });

    const runtime = new VsCodeExtensionServiceRuntime();

    await expect(runtime.resolveWorkspaceContextSnapshot()).resolves.toEqual({
      workspaceLabel: 'ai-governor',
      workspaceRoot: '/repo',
      workspaceTrusted: true,
      serviceHealth: {
        lifecycleStatus: OrchestrationServiceLifecycleStatus.READY,
        serviceHostKind: OrchestrationServiceHostKind.SIDECAR,
        serviceTransportKind: OrchestrationServiceTransportKind.IPC,
        checkpointCapable: true,
        memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
        pid: 4321,
      },
    });
  });
});
