import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

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
import { CliOrchestrationServiceRuntimeMode } from '../apps/cli/src/constants/orchestration-service-runtime.constant.js';
import { CliOrchestrationServiceRuntime } from '../apps/cli/src/runtime/orchestration-service-runtime.js';

describe('desktop entry smoke integration', () => {
  it.each([
    {
      distributionMode: 'default',
      memoryConfig: {
        storeEngine: MemoryStoreEngine.FS_CSV,
        storeRoot: 'context/memory/desktop-default',
      },
      expectedMemoryProvider: {
        memoryStoreProviderId: 'fs-csv',
        memoryStoreDistributionMode: 'default',
        memoryStoreResolutionSource: 'legacy_store_engine',
      },
    },
    {
      distributionMode: 'plugin-enabled',
      memoryConfig: {
        storeEngine: MemoryStoreEngine.SQLITE_FS,
        storeRoot: 'context/memory/desktop-plugin',
        provider: {
          module: '@repo-ai-governor/memory-provider-sqlite-fs',
          exportName: 'createMemoryStoreProvider',
        },
      },
      expectedMemoryProvider: {
        memoryStoreProviderId: '@repo-ai-governor/memory-provider-sqlite-fs',
        memoryStoreProviderModule: '@repo-ai-governor/memory-provider-sqlite-fs',
        memoryStoreDistributionMode: 'optional',
        memoryStoreResolutionSource: 'plugin_module',
      },
    },
  ])(
    'runs desktop execution over the sidecar IPC runtime for $distributionMode distribution',
    async ({ memoryConfig, expectedMemoryProvider }) => {
      const tempRoot = await mkdtemp(resolve(tmpdir(), 'repo-ai-governor-desktop-entry-'));
      const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');

      try {
        const runtime = new CliOrchestrationServiceRuntime(workspaceRoot, {
          runtimeMode: CliOrchestrationServiceRuntimeMode.SIDECAR_IPC,
          memoryConfig,
        });

        const health = await runtime.getHealth();
        const started = await runtime.startExecution(
          {
            workspaceId: 'desktop-workspace',
            workspaceRoot,
            executionKind: OrchestrationExecutionKind.RUN,
            clientSurface: OrchestrationClientSurface.DESKTOP,
          },
          {
            processId: 'desktop-process',
            executionId: 'desktop-execution',
            executionSessionId: 'desktop-session',
          },
        );

        await runtime.publishEvent({
          executionId: started.executionId,
          type: OrchestrationServiceEventType.ARTIFACT_READY,
          status: OrchestrationExecutionStatus.RUNNING,
          artifactId: 'artifact-desktop',
          artifactPath: resolve(workspaceRoot, 'artifact-desktop.json'),
          message: 'desktop artifact ready',
        });
        await runtime.publishEvent({
          executionId: started.executionId,
          type: OrchestrationServiceEventType.EXECUTION_COMPLETED,
          status: OrchestrationExecutionStatus.COMPLETED,
          message: 'desktop execution completed',
        });

        const summary = await runtime.getExecution(started.executionId);
        const listed = await runtime.listExecutions({
          filter: {
            workspaceId: 'desktop-workspace',
          },
        });
        const subscribed = await runtime.subscribeExecution({
          executionId: started.executionId,
        });

        expect(health.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
        expect(health.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
        expect(health.memoryProvider).toEqual(
          expect.objectContaining({
            ...expectedMemoryProvider,
            memoryStoreHostSurface: MemoryProviderHostSurface.LOCAL_ORCHESTRATION_SERVICE,
            memoryStoreRuntimeMode: MemoryProviderRuntimeMode.DAEMON,
          }),
        );
        expect(started.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
        expect(started.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
        expect(started.memoryProvider).toEqual(health.memoryProvider);
        expect(summary?.serviceHostKind).toBe(OrchestrationServiceHostKind.SIDECAR);
        expect(summary?.serviceTransportKind).toBe(OrchestrationServiceTransportKind.IPC);
        expect(summary?.memoryProvider).toEqual(health.memoryProvider);
        expect(listed.executions).toHaveLength(1);
        expect(listed.executions[0]?.memoryProvider).toEqual(health.memoryProvider);
        expect(subscribed.events.map((event) => event.type)).toEqual([
          OrchestrationServiceEventType.EXECUTION_STARTED,
          OrchestrationServiceEventType.ARTIFACT_READY,
          OrchestrationServiceEventType.EXECUTION_COMPLETED,
        ]);

        await runtime.dispose();
      } finally {
        await rm(tempRoot, { recursive: true, force: true });
      }
    },
  );
});
