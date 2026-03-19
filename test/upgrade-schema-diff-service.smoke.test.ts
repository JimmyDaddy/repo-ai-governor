import { describe, expect, it } from "vitest";

import {
  type GovernorConfig,
  GovernorSchemaVersion,
  UpgradeConfirmationDecision,
  UpgradeMigrationSuggestionType,
  UpgradeSchemaDiffService,
  UpgradeSchemaDiffType,
  WorkspaceMode,
} from "../packages/config/src/index.js";
import {
  GovernorErrorCode,
  WorkspaceMigrationPolicy,
  standardizeError,
} from "../packages/shared/src/index.js";

/**
 * Creates a minimal config fixture for schema-upgrade smoke tests.
 * @param schemaVersion Config schema version.
 * @returns Config fixture.
 */
function createConfigFixture(schemaVersion: GovernorSchemaVersion): GovernorConfig {
  return {
    schemaVersion,
    workspace: {
      mode: WorkspaceMode.REPO_LOCAL,
      ...(schemaVersion === GovernorSchemaVersion.V1_1
        ? {
            migrationPolicy: WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
          }
        : {}),
    },
    i18n: {
      runtimeEngine: "i18next",
      defaultLocale: "zh-CN",
      fallbackLocale: "en-US",
      supportedLocales: ["zh-CN", "en-US"],
    },
  };
}

describe("UpgradeSchemaDiffService smoke", () => {
  it("produces schema diff with auto-migration suggestions and confirm decision", () => {
    const service = new UpgradeSchemaDiffService();
    const sourceConfig: GovernorConfig = {
      ...createConfigFixture(GovernorSchemaVersion.V1_0),
      profiles: {
        ci: {
          workspace: {
            mode: WorkspaceMode.TOOL_MANAGED,
          },
        },
      },
    };

    const report = service.analyze({
      sourceConfig,
      targetVersion: GovernorSchemaVersion.V1_1,
    });

    expect(report.confirmationDecision).toBe(UpgradeConfirmationDecision.CONFIRM);
    expect(report.diffs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/schemaVersion",
          diffType: UpgradeSchemaDiffType.CHANGED,
          fromValue: GovernorSchemaVersion.V1_0,
          toValue: GovernorSchemaVersion.V1_1,
        }),
        expect.objectContaining({
          path: "/workspace/migrationPolicy",
          diffType: UpgradeSchemaDiffType.ADDED,
          toValue: WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
        }),
        expect.objectContaining({
          path: "/profiles/ci/workspace/migrationPolicy",
          diffType: UpgradeSchemaDiffType.ADDED,
          toValue: WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
        }),
      ]),
    );
    expect(report.suggestions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: "/schemaVersion",
          suggestionType: UpgradeMigrationSuggestionType.CONFIRM_REQUIRED,
        }),
        expect.objectContaining({
          path: "/workspace/migrationPolicy",
          suggestionType: UpgradeMigrationSuggestionType.AUTO_APPLY,
        }),
        expect.objectContaining({
          path: "/profiles/ci/workspace/migrationPolicy",
          suggestionType: UpgradeMigrationSuggestionType.AUTO_APPLY,
        }),
      ]),
    );
    expect(report.autoMigratedConfig.workspace.migrationPolicy).toBe(
      WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
    );
    expect(report.autoMigratedConfig.profiles?.ci.workspace?.migrationPolicy).toBe(
      WorkspaceMigrationPolicy.COPY_VERIFY_SWITCH_ROLLBACK,
    );
  });

  it("returns allow decision when source config already matches latest schema baseline", () => {
    const service = new UpgradeSchemaDiffService();

    const report = service.analyze({
      sourceConfig: createConfigFixture(GovernorSchemaVersion.V1_1),
    });

    expect(report.targetVersion).toBe(GovernorSchemaVersion.V1_1);
    expect(report.diffs).toHaveLength(0);
    expect(report.suggestions).toHaveLength(0);
    expect(report.confirmationDecision).toBe(UpgradeConfirmationDecision.ALLOW);
  });

  it("throws standardized error when upgrade path is unsupported", () => {
    const service = new UpgradeSchemaDiffService();
    let observedErrorCode = GovernorErrorCode.UNKNOWN;

    try {
      service.analyze({
        sourceConfig: createConfigFixture(GovernorSchemaVersion.V1_1),
        targetVersion: GovernorSchemaVersion.V1_0,
      });
    } catch (error) {
      const standardizedError = standardizeError(error);
      observedErrorCode = standardizedError.code;
    }

    expect(observedErrorCode).toBe(GovernorErrorCode.CONFIG_SCHEMA_UPGRADE_PATH_UNSUPPORTED);
  });
});
