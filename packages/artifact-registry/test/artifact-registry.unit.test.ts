import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { GovernorErrorCode } from '@repo-ai-governor/shared';
import {
  ArtifactDependencyFailureAction,
  ArtifactDependencyResolutionPolicy,
  ArtifactDependencyResolutionStatus,
  ArtifactDependencyResolver,
  ArtifactLifecycleStatus,
  ArtifactRegistry,
  InMemoryArtifactIndexStore,
  SqliteArtifactIndexStore,
} from '../src/index.js';

describe('artifact-registry unit', () => {
  it('registers artifacts and lists versions in descending order', async () => {
    const registry = new ArtifactRegistry(new InMemoryArtifactIndexStore());

    await registry.registerArtifact({
      artifactId: 'DA-057',
      artifactType: 'audit_recorder_event_model_baseline',
      artifactPath: '.repo-ai-governor/context/dev/project-005/tasks/TK-046.md',
      artifactVersion: 'v1',
      artifactStatus: ArtifactLifecycleStatus.ACTIVE,
      producerTaskId: 'TK-046',
      producerExecutionId: 'exec-20260321-143',
      dependentTasks: ['TK-048', 'TK-049', 'TK-048'],
      registeredAt: '2026-03-21T14:00:00Z',
      lastUpdatedAt: '2026-03-21T14:00:00Z',
    });
    await registry.registerArtifact({
      artifactId: 'DA-057',
      artifactType: 'audit_recorder_event_model_baseline',
      artifactPath: '.repo-ai-governor/context/dev/project-005/tasks/TK-046.md',
      artifactVersion: 'v2',
      artifactStatus: ArtifactLifecycleStatus.FROZEN,
      producerTaskId: 'TK-046',
      producerExecutionId: 'exec-20260321-143',
      registeredAt: '2026-03-21T14:00:01Z',
      lastUpdatedAt: '2026-03-21T14:00:01Z',
    });

    const versions = await registry.listArtifactVersions('DA-057');

    expect(versions).toHaveLength(2);
    expect(versions[0]?.artifactVersion).toBe('v2');
    expect(versions[1]?.artifactVersion).toBe('v1');
    expect(versions[1]?.dependentTasks).toEqual(['TK-048', 'TK-049']);
  });

  it('rejects invalid artifact lifecycle status', async () => {
    const registry = new ArtifactRegistry(new InMemoryArtifactIndexStore());

    await expect(
      registry.registerArtifact({
        artifactId: 'DA-059',
        artifactType: 'artifact_runtime',
        artifactPath: '.repo-ai-governor/context/dev/project-005/tasks/TK-048.md',
        artifactVersion: 'v1',
        artifactStatus: 'invalid' as ArtifactLifecycleStatus,
        producerTaskId: 'TK-048',
        producerExecutionId: 'exec-20260321-146',
      }),
    ).rejects.toMatchObject({
      code: GovernorErrorCode.ARTIFACT_REGISTRY_RECORD_INVALID,
    });
  });

  it('resolves dependencies with strict exact match', async () => {
    const registry = new ArtifactRegistry(new InMemoryArtifactIndexStore());
    await registry.registerArtifact({
      artifactId: 'DA-057',
      artifactType: 'audit_recorder_event_model_baseline',
      artifactPath: '.repo-ai-governor/context/dev/project-005/tasks/TK-046.md',
      artifactVersion: 'v1',
      artifactStatus: ArtifactLifecycleStatus.ACTIVE,
      producerTaskId: 'TK-046',
      producerExecutionId: 'exec-20260321-143',
    });

    const resolver = new ArtifactDependencyResolver(registry);
    const result = await resolver.resolve({
      consumerTaskId: 'TK-048',
      dependsOnArtifacts: ['DA-057@v1'],
      resolutionPolicy: ArtifactDependencyResolutionPolicy.STRICT,
    });

    expect(result.requiredAction).toBe(ArtifactDependencyFailureAction.ALLOW);
    expect(result.resolutionStatus).toBe(ArtifactDependencyResolutionStatus.RESOLVED);
    expect(result.resolvedArtifacts).toHaveLength(1);
    expect(result.unresolved).toHaveLength(0);
  });

  it('returns blocked status when dependencies are missing', async () => {
    const resolver = new ArtifactDependencyResolver(
      new ArtifactRegistry(new InMemoryArtifactIndexStore()),
    );

    const result = await resolver.resolve({
      consumerTaskId: 'TK-048',
      dependsOnArtifacts: ['DA-404'],
      resolutionPolicy: ArtifactDependencyResolutionPolicy.COMPATIBLE,
    });

    expect(result.requiredAction).toBe(ArtifactDependencyFailureAction.BLOCK);
    expect(result.resolutionStatus).toBe(ArtifactDependencyResolutionStatus.BLOCKED);
    expect(result.unresolved).toHaveLength(1);
  });

  it('supports compatible policy and warns on version mismatch when configured', async () => {
    const registry = new ArtifactRegistry(new InMemoryArtifactIndexStore());
    await registry.registerArtifact({
      artifactId: 'DA-058',
      artifactType: 'report_builder_replay_explain_baseline',
      artifactPath: '.repo-ai-governor/context/dev/project-005/tasks/TK-047.md',
      artifactVersion: 'v2',
      artifactStatus: ArtifactLifecycleStatus.ACTIVE,
      producerTaskId: 'TK-047',
      producerExecutionId: 'exec-20260321-145',
    });

    const resolver = new ArtifactDependencyResolver(registry);
    const result = await resolver.resolve({
      consumerTaskId: 'TK-049',
      dependsOnArtifacts: ['DA-058@^v1'],
      resolutionPolicy: ArtifactDependencyResolutionPolicy.COMPATIBLE,
      versionMismatchAction: ArtifactDependencyFailureAction.WARN,
    });

    expect(result.requiredAction).toBe(ArtifactDependencyFailureAction.WARN);
    expect(result.resolutionStatus).toBe(ArtifactDependencyResolutionStatus.WARNED);
    expect(result.unresolved).toHaveLength(1);
  });

  it('persists canonical main/archive rows through sqlite-backed artifact store', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-registry-sqlite-unit-'));
    const sqliteStore = new SqliteArtifactIndexStore({
      databaseFilePath: join(temporaryRoot, 'artifact-registry.sqlite'),
    });

    try {
      const registry = new ArtifactRegistry(sqliteStore);
      await registry.registerArtifact({
        artifactId: 'DA-090',
        artifactType: 'runtime_truth',
        artifactPath: '.repo-ai-governor/context/dev/project-036/tasks/TK-477.md',
        artifactVersion: 'v1',
        artifactStatus: ArtifactLifecycleStatus.ACTIVE,
        producerTaskId: 'TK-477',
        producerExecutionId: 'exec-20260402-477a',
        dependentTasks: ['TK-478', 'TK-479'],
        registeredAt: '2026-04-02T10:00:00Z',
        lastUpdatedAt: '2026-04-02T10:00:00Z',
      });
      await registry.registerArtifact({
        artifactId: 'DA-091',
        artifactType: 'runtime_truth_archive',
        artifactPath: '.repo-ai-governor/context/dev/project-036/tasks/TK-477.md',
        artifactVersion: 'v1',
        artifactStatus: ArtifactLifecycleStatus.ARCHIVED,
        producerTaskId: 'TK-477',
        producerExecutionId: 'exec-20260402-477b',
        registeredAt: '2026-04-02T10:00:01Z',
        lastUpdatedAt: '2026-04-02T10:00:01Z',
      });

      const mainRecords = await sqliteStore.listMainRegistry();
      const archiveRecords = await sqliteStore.listArchiveRegistry();
      const allRecords = await sqliteStore.list();

      expect(mainRecords).toHaveLength(1);
      expect(mainRecords[0]?.artifactId).toBe('DA-090');
      expect(mainRecords[0]?.dependentTasks).toEqual(['TK-478', 'TK-479']);
      expect(archiveRecords).toHaveLength(1);
      expect(archiveRecords[0]?.artifactId).toBe('DA-091');
      expect(allRecords.map((record) => record.artifactId)).toEqual(['DA-090', 'DA-091']);
    } finally {
      await sqliteStore.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('moves canonical rows across main/archive scopes when lifecycle status changes', async () => {
    const temporaryRoot = await mkdtemp(join(tmpdir(), 'artifact-registry-sqlite-unit-'));
    const sqliteStore = new SqliteArtifactIndexStore({
      databaseFilePath: join(temporaryRoot, 'artifact-registry.sqlite'),
    });

    try {
      const registry = new ArtifactRegistry(sqliteStore);
      await registry.registerArtifact({
        artifactId: 'DA-092',
        artifactType: 'runtime_truth_migration',
        artifactPath: '.repo-ai-governor/context/dev/project-036/tasks/TK-477.md',
        artifactVersion: 'v1',
        artifactStatus: ArtifactLifecycleStatus.DEPRECATED,
        producerTaskId: 'TK-477',
        producerExecutionId: 'exec-20260402-477c',
        registeredAt: '2026-04-02T10:00:02Z',
        lastUpdatedAt: '2026-04-02T10:00:02Z',
      });
      await registry.registerArtifact({
        artifactId: 'DA-092',
        artifactType: 'runtime_truth_migration',
        artifactPath: '.repo-ai-governor/context/dev/project-036/tasks/TK-477.md',
        artifactVersion: 'v1',
        artifactStatus: ArtifactLifecycleStatus.ARCHIVED,
        producerTaskId: 'TK-477',
        producerExecutionId: 'exec-20260402-477d',
        registeredAt: '2026-04-02T10:00:02Z',
        lastUpdatedAt: '2026-04-02T10:00:03Z',
      });

      const mainRecords = await sqliteStore.listMainRegistry();
      const archiveRecords = await sqliteStore.listArchiveRegistry();

      expect(mainRecords).toHaveLength(0);
      expect(archiveRecords).toHaveLength(1);
      expect(archiveRecords[0]?.artifactId).toBe('DA-092');
      expect(archiveRecords[0]?.artifactStatus).toBe(ArtifactLifecycleStatus.ARCHIVED);
    } finally {
      await sqliteStore.dispose();
      await rm(temporaryRoot, { recursive: true, force: true });
    }
  });
});
