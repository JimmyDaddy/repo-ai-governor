import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { LocalOrchestrationServiceShell } from '@repo-ai-governor/core-orchestration-service';
import {
  MemoryProviderHostSurface,
  MemoryProviderRuntimeMode,
} from '@repo-ai-governor/memory-provider-registry';
import {
  OrchestrationClientSurface,
  OrchestrationExecutionKind,
  OrchestrationExecutionStatus,
  OrchestrationServiceEventType,
  OrchestrationServiceHostKind,
  OrchestrationServiceTransportKind,
} from '@repo-ai-governor/orchestration-service-client';
import { MemoryStoreEngine } from '@repo-ai-governor/shared';
import { CliOrchestrationServiceRuntimeMode } from '../../src/constants/orchestration-service-runtime.constant.js';
import { CliOrchestrationServiceRuntime } from '../../src/runtime/orchestration-service-runtime.js';

describe('CliOrchestrationServiceRuntime', () => {
  it.each([
    {
      hostKind: OrchestrationServiceHostKind.SIDECAR,
      transportKind: OrchestrationServiceTransportKind.IPC,
    },
    {
      hostKind: OrchestrationServiceHostKind.DAEMON,
      transportKind: OrchestrationServiceTransportKind.HTTP,
    },
  ])(
    'preserves transport-neutral host descriptors for $hostKind/$transportKind providers',
    async ({ hostKind, transportKind }) => {
      const tempRoot = await mkdtemp(resolve(tmpdir(), 'cli-orchestration-runtime-'));
      const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');

      try {
        const runtime = new CliOrchestrationServiceRuntime(workspaceRoot, {
          memoryConfig: {
            storeEngine: MemoryStoreEngine.FS_CSV,
            storeRoot: 'context/memory/runtime-test',
          },
          serviceOwnerProvider: async (root) =>
            new LocalOrchestrationServiceShell({
              workspaceRoot: root,
              memoryConfig: {
                storeEngine: MemoryStoreEngine.FS_CSV,
                storeRoot: 'context/memory/runtime-test',
              },
              serviceHostKind: hostKind,
              serviceTransportKind: transportKind,
            }),
        });

        const health = await runtime.getHealth();
        const started = await runtime.startExecution(
          {
            workspaceId: 'test-workspace',
            workspaceRoot,
            executionKind: OrchestrationExecutionKind.RUN,
            clientSurface: OrchestrationClientSurface.DESKTOP,
          },
          {
            processId: 'process-1',
            executionId: 'execution-1',
            executionSessionId: 'session-1',
          },
        );
        await runtime.publishEvent({
          executionId: started.executionId,
          type: OrchestrationServiceEventType.ARTIFACT_READY,
          status: OrchestrationExecutionStatus.RUNNING,
          artifactId: 'artifact-1',
          artifactPath: resolve(workspaceRoot, 'artifact-1.json'),
          message: 'artifact ready',
        });
        await runtime.publishEvent({
          executionId: started.executionId,
          type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
          status: OrchestrationExecutionStatus.COMPLETED,
          message: 'completed',
        });

        const replayedRuntime = new CliOrchestrationServiceRuntime(workspaceRoot, {
          serviceOwnerProvider: async (root) =>
            new LocalOrchestrationServiceShell({
              workspaceRoot: root,
              serviceHostKind: hostKind,
              serviceTransportKind: transportKind,
            }),
        });
        const summary = await replayedRuntime.getExecution(started.executionId);
        const listed = await replayedRuntime.listExecutions({
          filter: {
            workspaceId: 'test-workspace',
          },
        });
        const subscription = await replayedRuntime.subscribeExecution({
          executionId: started.executionId,
        });

        expect(health.memoryProvider).toEqual(
          expect.objectContaining({
            memoryStoreProviderId: 'fs-csv',
            memoryStoreHostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
            memoryStoreRuntimeMode:
              hostKind === OrchestrationServiceHostKind.EMBEDDED &&
              transportKind === OrchestrationServiceTransportKind.IN_PROCESS
                ? MemoryProviderRuntimeMode.EMBEDDED
                : MemoryProviderRuntimeMode.DAEMON,
          }),
        );
        expect(started.serviceHostKind).toBe(hostKind);
        expect(started.serviceTransportKind).toBe(transportKind);
        expect(started.memoryProvider).toEqual(health.memoryProvider);
        expect(summary?.serviceHostKind).toBe(hostKind);
        expect(summary?.serviceTransportKind).toBe(transportKind);
        expect(summary?.memoryProvider).toEqual(health.memoryProvider);
        expect(listed.executions).toHaveLength(1);
        expect(listed.executions[0]?.serviceHostKind).toBe(hostKind);
        expect(listed.executions[0]?.serviceTransportKind).toBe(transportKind);
        expect(listed.executions[0]?.memoryProvider).toEqual(health.memoryProvider);
        expect(subscription.serviceHostKind).toBe(hostKind);
        expect(subscription.serviceTransportKind).toBe(transportKind);
        expect(subscription.latestEventSequence).toBeGreaterThan(0);
        expect(subscription.events.map((event) => event.type)).toEqual([
          OrchestrationServiceEventType.EXECUTION_STARTED,
          OrchestrationServiceEventType.ARTIFACT_READY,
          OrchestrationServiceEventType.EXECUTION_COMPLETED,
        ]);
      } finally {
        await rm(tempRoot, { recursive: true, force: true });
      }
    },
  );

  it('can resolve the default sidecar IPC owner without a custom provider', async () => {
    const tempRoot = await mkdtemp(resolve(tmpdir(), 'cli-orchestration-runtime-sidecar-'));
    const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');

    try {
      const runtime = new CliOrchestrationServiceRuntime(workspaceRoot, {
        runtimeMode: CliOrchestrationServiceRuntimeMode.SIDECAR_IPC,
        memoryConfig: {
          storeEngine: MemoryStoreEngine.SQLITE_FS,
          storeRoot: 'context/memory/sidecar-runtime',
          provider: {
            module: '@repo-ai-governor/memory-provider-sqlite-fs',
            exportName: 'createMemoryStoreProvider',
          },
        },
      });

      const health = await runtime.getHealth();
      const started = await runtime.startExecution(
        {
          workspaceId: 'workspace-sidecar',
          workspaceRoot,
          executionKind: OrchestrationExecutionKind.RUN,
          clientSurface: OrchestrationClientSurface.CLI,
        },
        {
          processId: 'process-sidecar-runtime',
          executionId: 'execution-sidecar-runtime',
          executionSessionId: 'session-sidecar-runtime',
        },
      );

      expect(health.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
      expect(health.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
      expect(health.memoryProvider).toEqual(
        expect.objectContaining({
          memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
          memoryStoreProviderModule: '@repo-ai-governor/memory-provider-sqlite-fs',
          memoryStoreHostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
          memoryStoreRuntimeMode: MemoryProviderRuntimeMode.DAEMON,
        }),
      );
      expect(started.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
      expect(started.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
      expect(started.memoryProvider).toEqual(health.memoryProvider);

      await runtime.dispose();
    } finally {
      await rm(tempRoot, { recursive: true, force: true });
    }
  });
});
