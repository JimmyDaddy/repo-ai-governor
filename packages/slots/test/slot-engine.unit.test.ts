import { SlotEngine, SlotRequiredAction, SlotScope, SlotSource, SlotTrack } from '../src/index.js';

describe('slots unit', () => {
  it('builds declarative slot execution plan for matched stage context', () => {
    const engine = new SlotEngine({
      slots: [
        {
          slotId: 'slot-style-rule',
          slotVersion: '1.0.0',
          track: SlotTrack.DECLARATIVE,
          source: SlotSource.OFFICIAL,
          scope: SlotScope.STAGE,
          priority: 100,
          enabled: true,
          blockOnFailure: false,
          metadata: {
            title: 'Style Rule',
            description: 'Inject baseline style guidance.',
            tags: ['style'],
          },
          trigger: {
            stageIds: ['stage-review'],
          },
          applicability: {},
          promptInjections: ['follow coding standards'],
          preChecks: ['lint'],
          postChecks: ['unit-test'],
          dependencySlotIds: [],
          declarativeRule: {
            ruleKey: 'style.rule.required',
            parameters: {
              scope: 'review',
            },
          },
        },
      ],
    });

    const plan = engine.buildExecutionPlan({
      executionId: 'exec-slot-unit-001',
      stageId: 'stage-review',
      routeKey: 'review',
      changedPaths: ['packages/slots/src/slot-engine.ts'],
    });

    expect(plan.declarativeSlots).toHaveLength(1);
    expect(plan.scriptSlots).toHaveLength(0);
    expect(plan.requiredAction).toBe(SlotRequiredAction.ALLOW);
    expect(plan.shouldBlock).toBe(false);
  });
});
