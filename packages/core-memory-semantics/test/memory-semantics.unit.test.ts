import { MemoryManager, MemoryScope } from '@repo-ai-governor/core-memory';
import {
  MEMORY_RECALL_SELECTION_POLICY,
  MemoryContextAssembler,
  MemoryPromotionService,
  MemoryRecallKind,
  MemoryRecallLayer,
  MemoryRecallService,
} from '@repo-ai-governor/core-memory-semantics';
import {
  MemoryStoreAdapter,
  type MemoryStoreProvider,
} from '@repo-ai-governor/memory-store-adapter';

function createInMemoryStoreProvider(): MemoryStoreProvider {
  const records = new Map<
    string,
    { value: Record<string, unknown>; tags: string[]; updatedAt: string }
  >();

  return {
    async read(namespace, key) {
      const record = records.get(`${namespace}:${key}`);
      if (!record) {
        return undefined;
      }

      return {
        namespace,
        key,
        value: record.value,
        tags: record.tags,
        updatedAt: record.updatedAt,
      };
    },
    async write(record) {
      records.set(`${record.namespace}:${record.key}`, {
        value: record.value,
        tags: record.tags,
        updatedAt: record.updatedAt,
      });
    },
    async query(request) {
      return Array.from(records.entries())
        .map(([compoundKey, record]) => {
          const delimiterIndex = compoundKey.indexOf(':');
          return {
            namespace: compoundKey.slice(0, delimiterIndex),
            key: compoundKey.slice(delimiterIndex + 1),
            value: record.value,
            tags: record.tags,
            updatedAt: record.updatedAt,
          };
        })
        .filter((record) => {
          if (request.namespace && record.namespace !== request.namespace) {
            return false;
          }

          if (request.keyPrefix && !record.key.startsWith(request.keyPrefix)) {
            return false;
          }

          if (request.tag && !record.tags.includes(request.tag)) {
            return false;
          }

          return true;
        });
    },
    async snapshot() {
      return {
        snapshotId: 'snapshot-memory-semantics-unit',
        createdAt: '2026-03-27T00:00:00Z',
        recordCount: records.size,
        snapshotPath: '/tmp/snapshot-memory-semantics-unit.json',
      };
    },
    async archive() {
      return 0;
    },
  };
}

describe('core-memory-semantics', () => {
  it('recalls metadata-filtered records and assembles truncation-aware context', async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-001:report-fact',
      payload: {
        summary: 'Execution already produced DA-900 for the same task chain.',
        artifactId: 'DA-900',
        sourceRefs: ['.repo-ai-governor/context/dev/project-010/tasks/DA-900.md'],
      },
      tags: ['project:project-010', 'task:TK-900', 'artifact:DA-900', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:03Z',
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.SESSION,
      key: 'session-001',
      payload: {
        summary: 'Session asked for explicit verification before closeout.',
        sourceRefs: ['session:review-note'],
      },
      tags: ['execution:exec-001', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:02Z',
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.NORMATIVE,
      key: 'policy/retry-default',
      payload: {
        summary: 'Retry policy remains the baseline fallback.',
        referencePath:
          '.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md',
      },
      tags: ['policy', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:01Z',
    });

    const recallService = new MemoryRecallService(memoryManager);
    const recallResult = await recallService.recall({
      queryIntent: 'cli_task_driven_execution',
      workspaceId: '/tmp/workspace',
      executionId: 'exec-001',
      sessionId: 'session-001',
      requestedLayers: [
        MemoryRecallLayer.EXECUTION,
        MemoryRecallLayer.SESSION,
        MemoryRecallLayer.WORKSPACE,
        MemoryRecallLayer.USER,
        MemoryRecallLayer.NORMATIVE,
      ],
      requestedMemoryKinds: [
        MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
        MemoryRecallKind.SESSION,
        MemoryRecallKind.WORKSPACE,
        MemoryRecallKind.USER,
        MemoryRecallKind.NORMATIVE_PROJECTION,
      ],
      metadataFilters: {
        includeNormativeBaseline: true,
        normativeKeyPrefixes: [],
        normativeTags: [],
        projectId: 'project-010',
        sprintId: 'sprint-001',
        taskId: 'TK-900',
        artifactIds: ['DA-900'],
        limitPerQuery: 20,
      },
      recallOrder: [
        MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
        MemoryRecallKind.SESSION,
        MemoryRecallKind.WORKSPACE,
        MemoryRecallKind.USER,
        MemoryRecallKind.NORMATIVE_PROJECTION,
      ],
      selectionPolicy: MEMORY_RECALL_SELECTION_POLICY,
    });

    expect(recallResult.resultSummary).toEqual({
      matchedRecordCount: 3,
      selectedRecordCount: 3,
      normativeEntryCount: 1,
      executionEntryCount: 1,
      sessionEntryCount: 1,
      requestedLayerCount: 5,
    });
    expect(recallResult.selectedRecords.map((record) => record.memoryKind)).toEqual([
      MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
      MemoryRecallKind.SESSION,
      MemoryRecallKind.NORMATIVE_PROJECTION,
    ]);

    const assemblyResult = new MemoryContextAssembler().assemble({
      recallResult,
      maxRecordCount: 2,
    });

    expect(assemblyResult.assemblyOutcome).toBe('truncated');
    expect(assemblyResult.truncationReason).toBe('selected_records_truncated_to_2');
    expect(assemblyResult.selectionSummary.selectedRecordCount).toBe(2);
    expect(assemblyResult.contractSafeSummary).toEqual(
      expect.objectContaining({
        executionId: 'exec-001',
        queryIntent: 'cli_task_driven_execution',
        assemblyOutcome: 'truncated',
        selectedRecordCount: 2,
        truncationReason: 'selected_records_truncated_to_2',
        items: [
          expect.objectContaining({
            recordId: 'execution:exec-001:report-fact',
            sourceRefCount: 3,
            explicitSourceRefCount: 2,
          }),
          expect.objectContaining({
            recordId: 'session:session-001',
            sourceRefCount: 2,
            explicitSourceRefCount: 1,
          }),
        ],
      }),
    );
    expect(assemblyResult.policySummary).toEqual(
      expect.objectContaining({
        overallAction: 'allow',
        allowedRecordCount: 2,
        warningRecordCount: 0,
        redactedRecordCount: 0,
        blockedRecordCount: 0,
      }),
    );
    expect(assemblyResult.outputContext.recallItems).toEqual([
      expect.objectContaining({
        layer: MemoryRecallLayer.EXECUTION,
        memoryKind: MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
      }),
      expect.objectContaining({
        layer: MemoryRecallLayer.SESSION,
        memoryKind: MemoryRecallKind.SESSION,
      }),
    ]);
    expect(assemblyResult.sourceRefs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reference: '.repo-ai-governor/context/dev/project-010/tasks/DA-900.md',
        }),
        expect.objectContaining({
          reference: 'session:review-note',
        }),
      ]),
    );
    expect(assemblyResult.provenanceSummary.canonicalSourceNote).toBe(
      'memory_projection_only_canonical_source_stays_external',
    );
  });

  it('builds an explicit promotion pipeline and merges eligible execution summaries into session memory', async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-777:summary-eligible',
      payload: {
        summary: 'Verifier requested follow-up audit on the same dependency edge.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-021/tasks/DA-244.md'],
      },
      tags: ['task:TK-244', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:04Z',
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-777:summary-sensitive',
      payload: {
        summary: 'Contains credential hints and must stay ephemeral.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-021/tasks/TK-244.md'],
      },
      tags: ['task:TK-244', 'sensitivity:secret'],
      updatedAt: '2026-03-27T00:00:03Z',
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.NORMATIVE,
      key: 'policy/runtime-boundary',
      payload: {
        summary: 'Canonical runtime boundary must stay in the normative source.',
        referencePath:
          '.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md',
      },
      tags: ['policy', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:02Z',
    });

    const recallResult = await new MemoryRecallService(memoryManager).recall({
      queryIntent: 'memory_promotion_rehearsal',
      workspaceId: '/tmp/workspace',
      executionId: 'exec-777',
      sessionId: 'session-777',
      requestedLayers: [MemoryRecallLayer.EXECUTION, MemoryRecallLayer.NORMATIVE],
      requestedMemoryKinds: [
        MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
        MemoryRecallKind.NORMATIVE_PROJECTION,
      ],
      metadataFilters: {
        includeNormativeBaseline: true,
        normativeKeyPrefixes: [],
        normativeTags: [],
        projectId: 'project-021',
        sprintId: 'sprint-002',
        taskId: 'TK-248',
        artifactIds: [],
        limitPerQuery: 20,
      },
      recallOrder: [
        MemoryRecallKind.EXECUTION_SHORT_TERM_FACT,
        MemoryRecallKind.NORMATIVE_PROJECTION,
      ],
      selectionPolicy: MEMORY_RECALL_SELECTION_POLICY,
    });
    const assemblyResult = new MemoryContextAssembler().assemble({
      recallResult,
      maxRecordCount: 10,
    });

    const promotionResult = await new MemoryPromotionService(memoryManager).promote({
      contextSummary: assemblyResult.contractSafeSummary,
      sessionId: 'session-777',
      promotedBy: 'memory-semantics-unit-test',
    });

    expect(promotionResult.outcome).toBe('session_summary_merged');
    expect(promotionResult.summary).toEqual(
      expect.objectContaining({
        candidateCount: 3,
        promotableCount: 1,
        plannedMergeCount: 1,
        mergedCount: 1,
        skippedCount: 0,
        rejectedCount: 2,
        targetLayerCounts: {
          session: 1,
        },
      }),
    );
    expect(promotionResult.candidateDecisions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          sourceRecordId: 'execution:exec-777:summary-eligible',
          action: 'merge',
          targetLayer: 'session',
          decisionReason: 'session_summary_projection_merge',
        }),
        expect.objectContaining({
          sourceRecordId: 'execution:exec-777:summary-sensitive',
          action: 'reject',
          decisionReason: 'sensitivity_requires_redaction',
        }),
        expect.objectContaining({
          sourceRecordId: 'normative:policy/runtime-boundary',
          action: 'reject',
          decisionReason: 'canonical_projection_not_promotable',
        }),
      ]),
    );

    const sessionRecord = await memoryManager.readEntry({
      scope: MemoryScope.SESSION,
      key: 'session-777',
    });

    expect(sessionRecord?.value.promotedContextItems).toEqual([
      expect.objectContaining({
        sourceRecordId: 'execution:exec-777:summary-eligible',
        summary: 'Verifier requested follow-up audit on the same dependency edge.',
      }),
    ]);
    expect(sessionRecord?.tags).toEqual(
      expect.arrayContaining(['memory-promotion', 'execution:exec-777']),
    );
  });

  it('blocks persistence when the contract-safe summary is truncated', async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-888:summary-first',
      payload: {
        summary: 'First execution summary is eligible for promotion.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-021/tasks/DA-248.md'],
      },
      tags: ['task:TK-248', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:05Z',
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-888:summary-second',
      payload: {
        summary: 'Second execution summary would be silently dropped by truncation.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-021/tasks/TK-248.md'],
      },
      tags: ['task:TK-248', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:04Z',
    });

    const recallResult = await new MemoryRecallService(memoryManager).recall({
      queryIntent: 'memory_promotion_rehearsal',
      workspaceId: '/tmp/workspace',
      executionId: 'exec-888',
      sessionId: 'session-888',
      requestedLayers: [MemoryRecallLayer.EXECUTION],
      requestedMemoryKinds: [MemoryRecallKind.EXECUTION_SHORT_TERM_FACT],
      metadataFilters: {
        includeNormativeBaseline: false,
        normativeKeyPrefixes: [],
        normativeTags: [],
        projectId: 'project-021',
        sprintId: 'sprint-002',
        taskId: 'TK-248',
        artifactIds: [],
        limitPerQuery: 20,
      },
      recallOrder: [MemoryRecallKind.EXECUTION_SHORT_TERM_FACT],
      selectionPolicy: MEMORY_RECALL_SELECTION_POLICY,
    });
    const assemblyResult = new MemoryContextAssembler().assemble({
      recallResult,
      maxRecordCount: 1,
    });

    const promotionResult = await new MemoryPromotionService(memoryManager).promote({
      contextSummary: assemblyResult.contractSafeSummary,
      sessionId: 'session-888',
      promotedBy: 'memory-semantics-unit-test',
    });

    expect(assemblyResult.contractSafeSummary.assemblyOutcome).toBe('truncated');
    expect(promotionResult.outcome).toBe('plan_only');
    expect(promotionResult.persistedRecord).toBeNull();
    expect(promotionResult.summary).toEqual(
      expect.objectContaining({
        candidateCount: 1,
        promotableCount: 1,
        plannedMergeCount: 1,
        mergedCount: 0,
      }),
    );
    expect(promotionResult.summary.failureReasonCounts).toEqual(
      expect.objectContaining({
        context_summary_truncated: 1,
      }),
    );
    expect(
      promotionResult.phaseResults.find((phaseResult) => phaseResult.phase === 'merge_or_persist'),
    ).toEqual(
      expect.objectContaining({
        status: 'skipped',
        detail: 'promotion_blocked=context_summary_truncated;planned_merge_candidates=1',
      }),
    );

    const sessionRecord = await memoryManager.readEntry({
      scope: MemoryScope.SESSION,
      key: 'session-888',
    });

    expect(sessionRecord).toBeUndefined();
  });

  it('reports plan-only promotion without claiming a completed merge', async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-889:summary-eligible',
      payload: {
        summary: 'Eligible promotion candidate stays plan-only when persist is disabled.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-021/tasks/DA-248.md'],
      },
      tags: ['task:TK-248', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:06Z',
    });

    const recallResult = await new MemoryRecallService(memoryManager).recall({
      queryIntent: 'memory_promotion_rehearsal',
      workspaceId: '/tmp/workspace',
      executionId: 'exec-889',
      sessionId: 'session-889',
      requestedLayers: [MemoryRecallLayer.EXECUTION],
      requestedMemoryKinds: [MemoryRecallKind.EXECUTION_SHORT_TERM_FACT],
      metadataFilters: {
        includeNormativeBaseline: false,
        normativeKeyPrefixes: [],
        normativeTags: [],
        projectId: 'project-021',
        sprintId: 'sprint-002',
        taskId: 'TK-248',
        artifactIds: [],
        limitPerQuery: 20,
      },
      recallOrder: [MemoryRecallKind.EXECUTION_SHORT_TERM_FACT],
      selectionPolicy: MEMORY_RECALL_SELECTION_POLICY,
    });
    const assemblyResult = new MemoryContextAssembler().assemble({
      recallResult,
      maxRecordCount: 10,
    });

    const promotionResult = await new MemoryPromotionService(memoryManager).promote({
      contextSummary: assemblyResult.contractSafeSummary,
      sessionId: 'session-889',
      promotedBy: 'memory-semantics-unit-test',
      persist: false,
    });

    expect(promotionResult.outcome).toBe('plan_only');
    expect(promotionResult.persistedRecord).toBeNull();
    expect(promotionResult.summary).toEqual(
      expect.objectContaining({
        candidateCount: 1,
        promotableCount: 1,
        plannedMergeCount: 1,
        mergedCount: 0,
      }),
    );
    expect(
      promotionResult.phaseResults.find((phaseResult) => phaseResult.phase === 'merge_or_persist'),
    ).toEqual(
      expect.objectContaining({
        status: 'skipped',
        detail: 'plan_only_requested;planned_merge_candidates=1',
      }),
    );

    const sessionRecord = await memoryManager.readEntry({
      scope: MemoryScope.SESSION,
      key: 'session-889',
    });

    expect(sessionRecord).toBeUndefined();
  });

  it('redacts assembly summaries when sensitivity labels are missing or visibility excludes runtime', async () => {
    const memoryManager = new MemoryManager(new MemoryStoreAdapter(createInMemoryStoreProvider()));
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-990:missing-sensitivity',
      payload: {
        summary: 'Missing sensitivity labels should not pass through unchanged.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-022/tasks/TK-257.md'],
      },
      tags: ['task:TK-257'],
      updatedAt: '2026-03-27T00:00:07Z',
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-990:visibility-adopter',
      payload: {
        summary: 'Adopter-only summary should not enter runtime context.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-022/tasks/TK-258.md'],
        visibility: 'adopter',
      },
      tags: ['task:TK-258', 'sensitivity:internal'],
      updatedAt: '2026-03-27T00:00:06Z',
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-990:runtime-visible',
      payload: {
        summary: 'Runtime-visible summary remains available.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-022/tasks/DA-255.md'],
      },
      tags: ['task:TK-255', 'sensitivity:internal', 'visibility:runtime'],
      updatedAt: '2026-03-27T00:00:05Z',
    });
    await memoryManager.writeEntry({
      scope: MemoryScope.EXECUTION,
      key: 'exec-990:secret-blocked',
      payload: {
        summary: 'Secret summary must be blocked from runtime context.',
        sourceRefs: ['.repo-ai-governor/context/dev/project-022/tasks/TK-257.md'],
      },
      tags: ['task:TK-257', 'sensitivity:secret', 'visibility:runtime'],
      updatedAt: '2026-03-27T00:00:04Z',
    });

    const recallResult = await new MemoryRecallService(memoryManager).recall({
      queryIntent: 'memory_safety_rehearsal',
      workspaceId: '/tmp/workspace',
      executionId: 'exec-990',
      requestedLayers: [MemoryRecallLayer.EXECUTION],
      requestedMemoryKinds: [MemoryRecallKind.EXECUTION_SHORT_TERM_FACT],
      metadataFilters: {
        includeNormativeBaseline: false,
        normativeKeyPrefixes: [],
        normativeTags: [],
        projectId: 'project-022',
        sprintId: 'sprint-001',
        taskId: 'TK-257',
        artifactIds: [],
        limitPerQuery: 20,
      },
      recallOrder: [MemoryRecallKind.EXECUTION_SHORT_TERM_FACT],
      selectionPolicy: MEMORY_RECALL_SELECTION_POLICY,
    });

    const assemblyResult = new MemoryContextAssembler().assemble({
      recallResult,
      maxRecordCount: 10,
    });

    expect(assemblyResult.outputContext.recallItems).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordId: 'execution:exec-990:runtime-visible',
          summary: 'Runtime-visible summary remains available.',
        }),
        expect.objectContaining({
          recordId: 'execution:exec-990:visibility-adopter',
          summary: '[redacted: visibility_policy]',
        }),
        expect.objectContaining({
          recordId: 'execution:exec-990:missing-sensitivity',
          summary: '[redacted: sensitivity_labels_required]',
        }),
      ]),
    );
    expect(
      assemblyResult.outputContext.recallItems.some(
        (item) => item.recordId === 'execution:exec-990:secret-blocked',
      ),
    ).toBe(false);
    expect(assemblyResult.contractSafeSummary.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordId: 'execution:exec-990:visibility-adopter',
          summary: '[redacted: visibility_policy]',
          policyAction: 'redact',
          visibility: ['adopter'],
        }),
        expect.objectContaining({
          recordId: 'execution:exec-990:missing-sensitivity',
          summary: '[redacted: sensitivity_labels_required]',
          policyAction: 'redact',
          visibility: [],
        }),
        expect.objectContaining({
          recordId: 'execution:exec-990:secret-blocked',
          summary: '[blocked: sensitivity_policy]',
          policyAction: 'block',
        }),
      ]),
    );
    expect(assemblyResult.selectedRecords).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          recordId: 'execution:exec-990:secret-blocked',
          payload: expect.objectContaining({
            summary: '[blocked: sensitivity_policy]',
            policyAction: 'block',
          }),
        }),
      ]),
    );
    expect(assemblyResult.policySummary).toEqual(
      expect.objectContaining({
        overallAction: 'block',
        allowedRecordCount: 1,
        redactedRecordCount: 2,
        blockedRecordCount: 1,
      }),
    );
    expect(assemblyResult.safetyNotes).toEqual(
      expect.arrayContaining([
        'some_records_redacted_due_to_missing_sensitivity_labels',
        'some_records_blocked_due_to_sensitivity_policy',
        'some_records_redacted_due_to_visibility_policy',
      ]),
    );
  });
});
