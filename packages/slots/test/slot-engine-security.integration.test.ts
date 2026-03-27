import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  SlotConflictStrategy,
  SlotEngine,
  SlotPermissionCapability,
  SlotRequiredAction,
  SlotScope,
  SlotSecurityCheckId,
  SlotSource,
  SlotTrack,
} from '../src/index.js';
import type {
  DeclarativeSlotDefinition,
  ScriptSlotDefinition,
  SlotExecutionPlan,
  SlotResolutionContext,
} from '../src/index.js';

/**
 * Creates one declarative slot fixture for slot-engine smoke tests.
 * @param overrides Optional override fields.
 * @returns Declarative slot definition.
 */
function createDeclarativeSlotFixture(
  overrides: Partial<DeclarativeSlotDefinition> = {},
): DeclarativeSlotDefinition {
  const baseFixture: DeclarativeSlotDefinition = {
    slotId: 'slot.declarative.docs.sync',
    slotVersion: '1.0.0',
    track: SlotTrack.DECLARATIVE,
    source: SlotSource.REPOSITORY,
    scope: SlotScope.REPOSITORY,
    priority: 20,
    enabled: true,
    blockOnFailure: true,
    metadata: {
      title: 'Docs sync check',
      description: 'Enforce docs sync before merge.',
      tags: ['docs', 'gate'],
    },
    trigger: {
      stageIds: ['stage-implement'],
      routeKeys: ['slot-security'],
    },
    applicability: {
      pathPrefixes: ['packages/'],
    },
    promptInjections: ['Sync triad docs before continuing.'],
    preChecks: ['docs-triad-sync'],
    postChecks: ['docs-ledger-sync'],
    dependencySlotIds: [],
    conflictKey: 'docs.sync',
    declarativeRule: {
      ruleKey: 'rule.docs.sync.required',
      parameters: {
        strict: true,
      },
    },
  };

  return {
    ...baseFixture,
    ...overrides,
    metadata: overrides.metadata ?? baseFixture.metadata,
    trigger: overrides.trigger ?? baseFixture.trigger,
    applicability: overrides.applicability ?? baseFixture.applicability,
    promptInjections: overrides.promptInjections ?? baseFixture.promptInjections,
    preChecks: overrides.preChecks ?? baseFixture.preChecks,
    postChecks: overrides.postChecks ?? baseFixture.postChecks,
    dependencySlotIds: overrides.dependencySlotIds ?? baseFixture.dependencySlotIds,
    declarativeRule: overrides.declarativeRule ?? baseFixture.declarativeRule,
  };
}

/**
 * Creates one script slot fixture for slot-engine smoke tests.
 * @param overrides Optional override fields.
 * @returns Script slot definition.
 */
function createScriptSlotFixture(
  overrides: Partial<ScriptSlotDefinition> = {},
): ScriptSlotDefinition {
  const baseFixture: ScriptSlotDefinition = {
    slotId: 'slot.script.security.baseline',
    slotVersion: '1.0.0',
    track: SlotTrack.SCRIPT,
    source: SlotSource.TEAM,
    scope: SlotScope.REPOSITORY,
    priority: 80,
    enabled: true,
    blockOnFailure: true,
    metadata: {
      title: 'Script security baseline',
      description: 'Execute guarded script slot with full security contract.',
      tags: ['slot', 'security'],
    },
    trigger: {
      stageIds: ['stage-implement'],
      routeKeys: ['slot-security'],
      changedPathPatterns: ['packages/*'],
    },
    applicability: {
      pathPrefixes: ['packages/'],
    },
    promptInjections: ['Apply script-slot guardrails for this stage.'],
    preChecks: ['slot-sandbox-ready'],
    postChecks: ['slot-audit-recorded'],
    dependencySlotIds: ['slot.declarative.docs.sync'],
    conflictKey: 'slot.security',
    script: {
      slotScriptId: 'slot.script.security.baseline',
      slotScriptVersion: '1.0.0',
      slotScriptHash: 'sha256:slot-security-baseline',
      entryCommand: 'node scripts/slot-security-baseline.js',
    },
    scriptPolicy: {
      requestedPermissions: [SlotPermissionCapability.FILESYSTEM, SlotPermissionCapability.COMMAND],
      sandbox: {
        enabled: true,
        profile: 'restricted',
      },
      resourceLimits: {
        maxCpu: 1,
        maxMemoryMb: 256,
        maxExecutionTimeSeconds: 30,
        maxOutputBytes: 16384,
      },
      ioContract: {
        inputSchema: 'schemas/slot-input.schema.json',
        outputSchema: 'schemas/slot-output.schema.json',
        sideEffectManifest: ['write:context/artifact-registry/artifacts.csv'],
      },
      failureIsolation: {
        isolateOnError: true,
        fallbackAction: SlotRequiredAction.ESCALATE,
      },
    },
  };

  return {
    ...baseFixture,
    ...overrides,
    metadata: overrides.metadata ?? baseFixture.metadata,
    trigger: overrides.trigger ?? baseFixture.trigger,
    applicability: overrides.applicability ?? baseFixture.applicability,
    promptInjections: overrides.promptInjections ?? baseFixture.promptInjections,
    preChecks: overrides.preChecks ?? baseFixture.preChecks,
    postChecks: overrides.postChecks ?? baseFixture.postChecks,
    dependencySlotIds: overrides.dependencySlotIds ?? baseFixture.dependencySlotIds,
    script: overrides.script ?? baseFixture.script,
    scriptPolicy: overrides.scriptPolicy ?? baseFixture.scriptPolicy,
  };
}

/**
 * Creates one runtime context fixture for slot resolution tests.
 * @param overrides Optional override fields.
 * @returns Slot resolution context.
 */
function createResolutionContextFixture(
  overrides: Partial<SlotResolutionContext> = {},
): SlotResolutionContext {
  return {
    executionId: 'exec-slot-001',
    stageId: 'stage-implement',
    routeKey: 'slot-security',
    changedPaths: ['packages/slots/src/slot-engine.ts'],
    approvedPermissions: [SlotPermissionCapability.FILESYSTEM, SlotPermissionCapability.COMMAND],
    ...overrides,
  };
}

describe('SlotEngine smoke', () => {
  it('builds dual-track execution plan with deterministic order', () => {
    const slotEngine = new SlotEngine({
      slots: [createDeclarativeSlotFixture(), createScriptSlotFixture()],
    });

    const plan = slotEngine.buildExecutionPlan(createResolutionContextFixture());

    expect(plan.declarativeSlots).toHaveLength(1);
    expect(plan.scriptSlots).toHaveLength(1);
    expect(plan.scriptSlots[0]?.slot.priority).toBeGreaterThan(
      plan.declarativeSlots[0]?.slot.priority ?? 0,
    );
    expect(plan.requiredAction).toBe(SlotRequiredAction.ALLOW);
    expect(plan.scriptSlots[0]?.security.auditRecord.slotScriptId).toBe(
      'slot.script.security.baseline',
    );
    expect(plan.scriptSlots[0]?.security.auditRecord.grantedPermissions).toEqual([
      SlotPermissionCapability.FILESYSTEM,
      SlotPermissionCapability.COMMAND,
    ]);
  });

  it('returns confirm when script permissions are not approved', () => {
    const slotEngine = new SlotEngine({
      slots: [createScriptSlotFixture()],
    });

    const plan = slotEngine.buildExecutionPlan(
      createResolutionContextFixture({
        approvedPermissions: [SlotPermissionCapability.FILESYSTEM],
      }),
    );

    expect(plan.requiredAction).toBe(SlotRequiredAction.CONFIRM);
    expect(
      plan.scriptSlots[0]?.security.issues.some(
        (issue) => issue.checkId === SlotSecurityCheckId.PERMISSION_APPROVAL_REQUIRED,
      ),
    ).toBe(true);
  });

  it('returns block when sandbox is disabled', () => {
    const slotEngine = new SlotEngine({
      slots: [
        createScriptSlotFixture({
          scriptPolicy: {
            ...createScriptSlotFixture().scriptPolicy,
            sandbox: {
              enabled: false,
              profile: 'none',
            },
          },
        }),
      ],
    });

    const plan = slotEngine.buildExecutionPlan(createResolutionContextFixture());

    expect(plan.requiredAction).toBe(SlotRequiredAction.BLOCK);
    expect(plan.shouldBlock).toBe(true);
    expect(
      plan.scriptSlots[0]?.security.issues.some(
        (issue) => issue.checkId === SlotSecurityCheckId.SANDBOX_REQUIRED,
      ),
    ).toBe(true);
  });

  it('keeps one winner when conflict strategy is highest_priority', () => {
    const lowPriority = createDeclarativeSlotFixture({
      slotId: 'slot.docs.low',
      priority: 5,
      conflictKey: 'docs.sync',
    });
    const highPriority = createDeclarativeSlotFixture({
      slotId: 'slot.docs.high',
      priority: 90,
      conflictKey: 'docs.sync',
    });
    const slotEngine = new SlotEngine({
      conflictStrategy: SlotConflictStrategy.HIGHEST_PRIORITY,
      slots: [lowPriority, highPriority],
    });

    const plan = slotEngine.buildExecutionPlan(createResolutionContextFixture());

    expect(plan.declarativeSlots).toHaveLength(1);
    expect(plan.declarativeSlots[0]?.slot.slotId).toBe('slot.docs.high');
    expect(plan.conflicts).toHaveLength(1);
    expect(plan.conflicts[0]?.winningSlotId).toBe('slot.docs.high');
  });

  it('throws standardized conflict error when strategy is error', () => {
    const slotEngine = new SlotEngine({
      conflictStrategy: SlotConflictStrategy.ERROR,
      slots: [
        createDeclarativeSlotFixture({
          slotId: 'slot.docs.a',
          conflictKey: 'docs.sync',
        }),
        createDeclarativeSlotFixture({
          slotId: 'slot.docs.b',
          conflictKey: 'docs.sync',
          priority: 99,
        }),
      ],
    });

    expect(() => slotEngine.buildExecutionPlan(createResolutionContextFixture())).toThrowError(
      RuntimeError,
    );

    try {
      slotEngine.buildExecutionPlan(createResolutionContextFixture());
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.SLOT_CONFLICT_DETECTED);
    }
  });

  it('throws standardized validation error for malformed slot definitions', () => {
    expect(
      () =>
        new SlotEngine({
          slots: [
            createDeclarativeSlotFixture({
              slotId: '',
            }),
          ],
        }),
    ).toThrowError(RuntimeError);

    try {
      new SlotEngine({
        slots: [
          createDeclarativeSlotFixture({
            slotId: '',
          }),
        ],
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.SLOT_DEFINITION_INVALID);
    }
  });
});

describe('SlotEngine security contracts', () => {
  it('keeps script slot audit fields for replay and governance handoff', () => {
    const slotEngine = new SlotEngine({
      slots: [createScriptSlotFixture()],
    });

    const plan: SlotExecutionPlan = slotEngine.buildExecutionPlan(createResolutionContextFixture());
    const auditRecord = plan.scriptSlots[0]?.security.auditRecord;

    expect(auditRecord?.slotScriptVersion).toBe('1.0.0');
    expect(auditRecord?.slotScriptHash).toContain('sha256:');
    expect(auditRecord?.exitCode).toBeNull();
    expect(auditRecord?.maxExecutionTimeSeconds).toBe(30);
  });
});
