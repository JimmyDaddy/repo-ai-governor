import { GovernorErrorCode, RuntimeError } from "../packages/shared/src/index.js";
import {
  StandardsPackScope,
  StandardsPackSource,
  StandardsUpgradePlanner,
  StandardsUpgradeRequiredAction,
  StandardsUpgradeRollbackStrategy,
  StandardsVersionPinMode,
} from "../packages/standards/src/index.js";
import type { StandardsUpgradePackState } from "../packages/standards/src/index.js";

/**
 * Creates one upgrade pack-state fixture.
 * @param overrides Optional override fields.
 * @returns Pack-state fixture.
 */
function createPackStateFixture(
  overrides: Partial<StandardsUpgradePackState> = {},
): StandardsUpgradePackState {
  return {
    packId: "pack.official.baseline",
    packVersion: "1.2.3",
    packSource: StandardsPackSource.OFFICIAL,
    scope: StandardsPackScope.GLOBAL,
    ...overrides,
  };
}

describe("StandardsUpgradePlanner smoke", () => {
  it("auto-plans minor upgrades under major-locked policy", () => {
    const standardsUpgradePlanner = new StandardsUpgradePlanner();

    const upgradePlan = standardsUpgradePlanner.plan({
      currentPacks: [createPackStateFixture()],
      targetPacks: [
        createPackStateFixture({
          packVersion: "1.3.1",
        }),
      ],
    });

    expect(upgradePlan.requiredAction).toBe(StandardsUpgradeRequiredAction.ALLOW);
    expect(upgradePlan.blockingConflicts).toHaveLength(0);
    expect(upgradePlan.advisoryConflicts).toHaveLength(0);
    expect(upgradePlan.autoFixableConflicts).toHaveLength(1);
    expect(upgradePlan.autoFixSuggestions[0]?.suggestedTargetVersion).toBe("1.3.1");
    expect(upgradePlan.pinDecisions[0]?.pinnedMajor).toBe(1);
  });

  it("blocks major upgrades and produces pin suggestion with rollback plan", () => {
    const standardsUpgradePlanner = new StandardsUpgradePlanner();

    const upgradePlan = standardsUpgradePlanner.plan({
      currentPacks: [createPackStateFixture()],
      targetPacks: [
        createPackStateFixture({
          packVersion: "2.0.0",
        }),
      ],
      rollbackRef: "upgrade-rollback-001",
    });

    expect(upgradePlan.requiredAction).toBe(StandardsUpgradeRequiredAction.BLOCK);
    expect(upgradePlan.blockingConflicts).toHaveLength(1);
    expect(upgradePlan.blockingConflicts[0]?.packId).toBe("pack.official.baseline");
    expect(upgradePlan.autoFixSuggestions[0]?.suggestedTargetVersion).toBe("1.x");
    expect(upgradePlan.rollbackPlan.strategy).toBe(
      StandardsUpgradeRollbackStrategy.RESTORE_PREVIOUS_SNAPSHOT,
    );
    expect(upgradePlan.rollbackPlan.rollbackRef).toBe("upgrade-rollback-001");
  });

  it("requires confirm when pack source changes without major bump", () => {
    const standardsUpgradePlanner = new StandardsUpgradePlanner();

    const upgradePlan = standardsUpgradePlanner.plan({
      currentPacks: [createPackStateFixture()],
      targetPacks: [
        createPackStateFixture({
          packSource: StandardsPackSource.TEAM,
        }),
      ],
    });

    expect(upgradePlan.requiredAction).toBe(StandardsUpgradeRequiredAction.CONFIRM);
    expect(
      upgradePlan.advisoryConflicts.some((conflict) => conflict.conflictId.includes("source")),
    ).toBe(true);
    expect(upgradePlan.blockingConflicts).toHaveLength(0);
  });

  it("requires confirm for all version changes under exact-version pin mode", () => {
    const standardsUpgradePlanner = new StandardsUpgradePlanner();
    const exactPinPolicy = {
      mode: StandardsVersionPinMode.EXACT_VERSION,
      allowMinorAutoUpgrade: true,
      allowPatchAutoUpgrade: true,
    };

    const patchUpgradePlan = standardsUpgradePlanner.plan({
      currentPacks: [createPackStateFixture()],
      targetPacks: [
        createPackStateFixture({
          packVersion: "1.2.4",
        }),
      ],
      pinPolicy: exactPinPolicy,
    });

    expect(patchUpgradePlan.requiredAction).toBe(StandardsUpgradeRequiredAction.CONFIRM);
    expect(patchUpgradePlan.autoFixableConflicts).toHaveLength(0);
    expect(
      patchUpgradePlan.advisoryConflicts.some(
        (conflict) => conflict.conflictId === "pack.official.baseline:exact-version-confirm",
      ),
    ).toBe(true);

    const minorUpgradePlan = standardsUpgradePlanner.plan({
      currentPacks: [createPackStateFixture()],
      targetPacks: [
        createPackStateFixture({
          packVersion: "1.3.0",
        }),
      ],
      pinPolicy: exactPinPolicy,
    });

    expect(minorUpgradePlan.requiredAction).toBe(StandardsUpgradeRequiredAction.CONFIRM);
    expect(minorUpgradePlan.autoFixableConflicts).toHaveLength(0);
    expect(
      minorUpgradePlan.advisoryConflicts.some(
        (conflict) => conflict.conflictId === "pack.official.baseline:exact-version-confirm",
      ),
    ).toBe(true);
  });

  it("throws standardized error when semver format is invalid", () => {
    const standardsUpgradePlanner = new StandardsUpgradePlanner();

    expect(() =>
      standardsUpgradePlanner.plan({
        currentPacks: [
          createPackStateFixture({
            packVersion: "1.2.3",
          }),
        ],
        targetPacks: [
          createPackStateFixture({
            packVersion: "v2",
          }),
        ],
      }),
    ).toThrowError(RuntimeError);

    try {
      standardsUpgradePlanner.plan({
        currentPacks: [
          createPackStateFixture({
            packVersion: "1.2.3",
          }),
        ],
        targetPacks: [
          createPackStateFixture({
            packVersion: "v2",
          }),
        ],
      });
    } catch (error) {
      const runtimeError = error as RuntimeError;
      expect(runtimeError.code).toBe(GovernorErrorCode.STANDARDS_UPGRADE_INVALID);
    }
  });
});
