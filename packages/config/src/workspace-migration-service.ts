import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cp, mkdir, readFile, readdir, rename, rm } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";

import type { WorkspaceMode } from "../../shared/src/constants/index.js";
import {
  ConfigError,
  GovernorErrorCode,
  type StandardizedError,
  standardizeError,
} from "../../shared/src/errors/index.js";
import {
  WORKSPACE_MIGRATION_ROOT_SEGMENTS,
  WorkspaceMigrationStep,
  WorkspaceMigrationStepStatus,
} from "./constants/index.js";
import type { WorkspaceMigrationExecutionResult } from "./types/interfaces/workspace-migration-execution-result.interface.js";
import type { WorkspaceMigrationOptions } from "./types/interfaces/workspace-migration-options.interface.js";
import type { WorkspaceMigrationPlan } from "./types/interfaces/workspace-migration-plan.interface.js";
import type { WorkspaceMigrationStepResult } from "./types/interfaces/workspace-migration-step-result.interface.js";
import { WorkspaceResolver } from "./workspace-resolver.js";

/**
 * Implements the workspace migration baseline chain: copy -> verify -> switch -> rollback.
 *
 * Why this exists:
 * TK-010 needs one deterministic migration orchestrator so later upgrade flows can reuse
 * the same failure-recovery semantics instead of re-implementing ad-hoc file operations.
 */
export class WorkspaceMigrationService {
  constructor(private readonly workspaceResolver: WorkspaceResolver = new WorkspaceResolver()) {}

  /**
   * Builds a migration plan from current workspace context and target workspace contract.
   * @param options Migration options including cwd, target workspace, and optional config.
   * @returns Fully-resolved migration plan with source/target/staging/backup paths.
   */
  public plan(options: WorkspaceMigrationOptions): WorkspaceMigrationPlan {
    const sourceWorkspace = this.workspaceResolver.resolve({
      currentWorkingDirectory: options.currentWorkingDirectory,
      config: options.config,
      runtimeOverrides: options.sourceRuntimeOverrides,
    });

    const targetWorkspace = this.workspaceResolver.resolve({
      currentWorkingDirectory: options.currentWorkingDirectory,
      config: options.config,
      runtimeOverrides: options.targetWorkspace,
    });

    if (
      sourceWorkspace.mode === targetWorkspace.mode &&
      sourceWorkspace.workspaceRoot === targetWorkspace.workspaceRoot
    ) {
      throw new ConfigError(
        GovernorErrorCode.WORKSPACE_MIGRATION_NOOP,
        "Workspace migration target is identical to source workspace.",
        {
          mode: sourceWorkspace.mode,
          workspaceRoot: sourceWorkspace.workspaceRoot,
        },
      );
    }

    const migrationId = this.buildMigrationId(sourceWorkspace.mode, targetWorkspace.mode);
    const migrationRoot = resolve(
      sourceWorkspace.repositoryRoot,
      ...WORKSPACE_MIGRATION_ROOT_SEGMENTS,
      migrationId,
    );

    return {
      migrationId,
      sourceWorkspace,
      targetWorkspace,
      stagingWorkspaceRoot: resolve(migrationRoot, "staging"),
      backupWorkspaceRoot: resolve(migrationRoot, "backup"),
      previousTargetBackupRoot: resolve(migrationRoot, "backup", "previous-target"),
    };
  }

  /**
   * Executes migration plan using chain semantics and auto-rollback on switch failure.
   * @param plan Precomputed migration plan.
   * @returns Execution result including step-by-step outcomes and optional standardized error.
   */
  public async execute(plan: WorkspaceMigrationPlan): Promise<WorkspaceMigrationExecutionResult> {
    const steps: WorkspaceMigrationStepResult[] = [];
    let shouldAttemptRollback = false;

    try {
      this.ensureSourceWorkspaceExists(plan);
      await this.runStep(steps, WorkspaceMigrationStep.COPY, () => this.copyToStaging(plan));
      await this.runStep(steps, WorkspaceMigrationStep.VERIFY, () => this.verifyStagingCopy(plan));
      shouldAttemptRollback = true;
      await this.runStep(steps, WorkspaceMigrationStep.SWITCH, () => this.switchWorkspace(plan));

      return {
        success: true,
        plan,
        steps,
      };
    } catch (error) {
      const normalizedError = standardizeError(error);
      let finalError = normalizedError;

      if (shouldAttemptRollback) {
        const rollbackResult = await this.rollback(plan);
        steps.push(rollbackResult);
        if (rollbackResult.status === WorkspaceMigrationStepStatus.FAILED) {
          finalError = {
            code: GovernorErrorCode.WORKSPACE_MIGRATION_ROLLBACK_FAILED,
            message: rollbackResult.message,
          };
        }
      } else {
        steps.push({
          step: WorkspaceMigrationStep.ROLLBACK,
          status: WorkspaceMigrationStepStatus.SKIPPED,
          message: "rollback skipped because switch step was not started",
        });
      }

      return {
        success: false,
        plan,
        steps,
        error: finalError,
      };
    }
  }

  /**
   * Restores previous target workspace snapshot when switch step fails.
   * @param plan Migration plan containing rollback paths.
   * @returns Step result describing rollback outcome.
   */
  public async rollback(plan: WorkspaceMigrationPlan): Promise<WorkspaceMigrationStepResult> {
    try {
      if (existsSync(plan.targetWorkspace.workspaceRoot)) {
        await rm(plan.targetWorkspace.workspaceRoot, { recursive: true, force: true });
      }

      if (existsSync(plan.previousTargetBackupRoot)) {
        await this.moveDirectory(plan.previousTargetBackupRoot, plan.targetWorkspace.workspaceRoot);
      }

      if (existsSync(plan.stagingWorkspaceRoot)) {
        await rm(plan.stagingWorkspaceRoot, { recursive: true, force: true });
      }

      return {
        step: WorkspaceMigrationStep.ROLLBACK,
        status: WorkspaceMigrationStepStatus.SUCCEEDED,
        message: "rollback completed",
      };
    } catch (error) {
      const normalizedError = standardizeError(error);
      return {
        step: WorkspaceMigrationStep.ROLLBACK,
        status: WorkspaceMigrationStepStatus.FAILED,
        message: normalizedError.message,
      };
    }
  }

  /**
   * Ensures migration source workspace exists before file operations.
   * @param plan Migration plan.
   * @returns Void.
   */
  private ensureSourceWorkspaceExists(plan: WorkspaceMigrationPlan): void {
    if (!existsSync(plan.sourceWorkspace.workspaceRoot)) {
      throw new ConfigError(
        GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
        `Workspace source does not exist: ${plan.sourceWorkspace.workspaceRoot}`,
        {
          sourceWorkspaceRoot: plan.sourceWorkspace.workspaceRoot,
        },
      );
    }
  }

  /**
   * Copies source workspace content to staging workspace directory.
   * @param plan Migration plan.
   * @returns Void promise.
   */
  private async copyToStaging(plan: WorkspaceMigrationPlan): Promise<void> {
    try {
      await rm(plan.stagingWorkspaceRoot, { recursive: true, force: true });
      await mkdir(dirname(plan.stagingWorkspaceRoot), { recursive: true });
      await cp(plan.sourceWorkspace.workspaceRoot, plan.stagingWorkspaceRoot, { recursive: true });
    } catch (error) {
      throw new ConfigError(
        GovernorErrorCode.WORKSPACE_MIGRATION_COPY_FAILED,
        "Failed during workspace copy step.",
        {
          sourceWorkspaceRoot: plan.sourceWorkspace.workspaceRoot,
          stagingWorkspaceRoot: plan.stagingWorkspaceRoot,
        },
        error,
      );
    }
  }

  /**
   * Verifies copied staging content equals source snapshot.
   * @param plan Migration plan.
   * @returns Void promise.
   */
  private async verifyStagingCopy(plan: WorkspaceMigrationPlan): Promise<void> {
    try {
      const sourceSnapshot = await this.snapshotDirectory(plan.sourceWorkspace.workspaceRoot);
      const stagingSnapshot = await this.snapshotDirectory(plan.stagingWorkspaceRoot);

      if (sourceSnapshot.size !== stagingSnapshot.size) {
        throw new ConfigError(
          GovernorErrorCode.WORKSPACE_MIGRATION_VERIFY_FAILED,
          "Workspace verification failed: file count mismatch between source and staging.",
          {
            sourceFileCount: sourceSnapshot.size,
            stagingFileCount: stagingSnapshot.size,
          },
        );
      }

      for (const [relativePath, sourceHash] of sourceSnapshot.entries()) {
        if (stagingSnapshot.get(relativePath) !== sourceHash) {
          throw new ConfigError(
            GovernorErrorCode.WORKSPACE_MIGRATION_VERIFY_FAILED,
            "Workspace verification failed: file hash mismatch between source and staging.",
            {
              relativePath,
            },
          );
        }
      }
    } catch (error) {
      if (this.isStandardizedError(error)) {
        throw error;
      }

      throw new ConfigError(
        GovernorErrorCode.WORKSPACE_MIGRATION_VERIFY_FAILED,
        "Failed during workspace verification step.",
        {
          sourceWorkspaceRoot: plan.sourceWorkspace.workspaceRoot,
          stagingWorkspaceRoot: plan.stagingWorkspaceRoot,
        },
        error,
      );
    }
  }

  /**
   * Switches staging workspace into target location with previous-target backup.
   * @param plan Migration plan.
   * @returns Void promise.
   */
  private async switchWorkspace(plan: WorkspaceMigrationPlan): Promise<void> {
    try {
      await mkdir(dirname(plan.targetWorkspace.workspaceRoot), { recursive: true });
      await mkdir(plan.backupWorkspaceRoot, { recursive: true });
      await rm(plan.previousTargetBackupRoot, { recursive: true, force: true });

      if (existsSync(plan.targetWorkspace.workspaceRoot)) {
        await this.moveDirectory(plan.targetWorkspace.workspaceRoot, plan.previousTargetBackupRoot);
      }

      await this.moveDirectory(plan.stagingWorkspaceRoot, plan.targetWorkspace.workspaceRoot);
    } catch (error) {
      throw new ConfigError(
        GovernorErrorCode.WORKSPACE_MIGRATION_SWITCH_FAILED,
        "Failed during workspace switch step.",
        {
          targetWorkspaceRoot: plan.targetWorkspace.workspaceRoot,
          previousTargetBackupRoot: plan.previousTargetBackupRoot,
          stagingWorkspaceRoot: plan.stagingWorkspaceRoot,
        },
        error,
      );
    }
  }

  /**
   * Executes one migration step and appends structured step outcome.
   * @param steps Step result accumulator.
   * @param step Step name.
   * @param action Async step action.
   * @returns Void promise.
   */
  private async runStep(
    steps: WorkspaceMigrationStepResult[],
    step: WorkspaceMigrationStep,
    action: () => Promise<void>,
  ): Promise<void> {
    try {
      await action();
      steps.push({
        step,
        status: WorkspaceMigrationStepStatus.SUCCEEDED,
        message: `${step} completed`,
      });
    } catch (error) {
      const normalizedError = standardizeError(error);
      steps.push({
        step,
        status: WorkspaceMigrationStepStatus.FAILED,
        message: normalizedError.message,
      });
      throw error;
    }
  }

  /**
   * Captures directory snapshot for verify step using relative file path + content hash.
   * @param rootDirectory Absolute root directory path.
   * @returns Map from relative path to sha256 hash.
   */
  private async snapshotDirectory(rootDirectory: string): Promise<Map<string, string>> {
    const filePaths = await this.listFiles(rootDirectory);
    const snapshotEntries = await Promise.all(
      filePaths.map(async (filePath) => {
        const content = await readFile(filePath);
        const fileHash = createHash("sha256").update(content).digest("hex");
        return [relative(rootDirectory, filePath), fileHash] as const;
      }),
    );

    return new Map(snapshotEntries);
  }

  /**
   * Recursively lists all file paths under a root directory.
   * @param rootDirectory Absolute root directory path.
   * @returns Absolute file paths.
   */
  private async listFiles(rootDirectory: string): Promise<string[]> {
    const entries = await readdir(rootDirectory, { withFileTypes: true });
    const nestedResults = await Promise.all(
      entries.map(async (entry) => {
        const absolutePath = join(rootDirectory, entry.name);
        if (entry.isDirectory()) {
          return this.listFiles(absolutePath);
        }
        return [absolutePath];
      }),
    );

    return nestedResults.flat();
  }

  /**
   * Moves directory with cross-device fallback to copy+delete.
   * @param sourceDirectory Source directory path.
   * @param targetDirectory Target directory path.
   * @returns Void promise.
   */
  private async moveDirectory(sourceDirectory: string, targetDirectory: string): Promise<void> {
    try {
      await rename(sourceDirectory, targetDirectory);
    } catch (error) {
      if (!this.isCrossDeviceMoveError(error)) {
        throw error;
      }

      await cp(sourceDirectory, targetDirectory, { recursive: true });
      await rm(sourceDirectory, { recursive: true, force: true });
    }
  }

  /**
   * Detects cross-device rename errors where copy+delete fallback is required.
   * @param error Unknown runtime error.
   * @returns True when error code indicates cross-device rename.
   */
  private isCrossDeviceMoveError(error: unknown): boolean {
    const errorCode = (error as { code?: unknown }).code;
    return errorCode === "EXDEV";
  }

  /**
   * Detects whether unknown value already follows standardized error contract.
   * @param error Unknown runtime error.
   * @returns True when value contains standardized `{code,message}` fields.
   */
  private isStandardizedError(error: unknown): error is StandardizedError {
    const candidate = error as { code?: unknown; message?: unknown };
    return typeof candidate.code === "string" && typeof candidate.message === "string";
  }

  /**
   * Builds stable migration id including source and target workspace modes.
   * @param sourceMode Source workspace mode.
   * @param targetMode Target workspace mode.
   * @returns Migration id string.
   */
  private buildMigrationId(sourceMode: WorkspaceMode, targetMode: WorkspaceMode): string {
    return `${Date.now()}-${sourceMode}-to-${targetMode}`;
  }
}
