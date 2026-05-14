import { constants as FsConstants, existsSync } from 'node:fs';
import { access, mkdir, readFile, readdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  WorkspaceResolver,
  buildDefaultGovernorConfig,
  renderGovernorConfigContent,
} from '@repo-ai-governor/config';
import {
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  GovernorErrorCode,
  RuntimeError,
  WorkspaceMode,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  type AdoptionPackInstallReceipt,
  type AdoptionPackVerificationCheck,
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS,
  type HostDistributionTarget,
  HostVerificationStatus,
  buildSelfHostGovernorConfigContent,
} from '@repo-ai-governor/standards';
import { CliAdoptAction } from '../constants/cli-adopt.constant.js';
import { CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS } from '../constants/cli-governance-runtime.constant.js';
import type { CliAdoptCommandOptions } from '../types/interfaces/cli-adopt-command.interface.js';
import { type AdoptionOperationResult, CliAdoptionPackRuntime } from './adoption-pack-runtime.js';

type BootstrapSelectorResolution = 'default_built_in' | 'explicit_pack' | 'explicit_profile_alias';
type BootstrapReentryMode =
  | 'fresh_install'
  | 'reuse_existing_installation'
  | 'redirect_to_lifecycle'
  | 'blocked_by_existing_receipts'
  | 'blocked_by_selection';
type BootstrapStageId = 'init' | 'doctor' | 'apply' | 'verify';

interface BootstrapStageResult {
  stageId: BootstrapStageId;
  status: HostVerificationStatus;
  detail: string;
  artifactPath: string | null;
}

interface BootstrapWorkspaceContext {
  workspaceId: string;
  workspaceRoot: string;
  configPath: string;
  workspaceMode: WorkspaceMode;
  memoryStoreRoot: string;
}

interface BootstrapInitStageResult {
  stage: BootstrapStageResult;
  createdDirectoryCount: number;
  configCreated: boolean;
  initManifestPath: string;
}

interface BootstrapDoctorStageResult {
  stage: BootstrapStageResult;
  bootstrapDoctorDiagnosticsPath: string;
  checks: AdoptionPackVerificationCheck[];
}

/**
 * Owns the adopter-facing `adopt bootstrap` convenience orchestration without creating new
 * canonical install truth.
 */
export class CliAdoptionPackBootstrapRuntime {
  private readonly workspaceResolver = new WorkspaceResolver();

  public constructor(
    private readonly currentWorkingDirectory: string,
    private readonly localizeText: (english: string, chinese: string) => string = (english) =>
      english,
    private readonly adoptionPackRuntime: CliAdoptionPackRuntime = new CliAdoptionPackRuntime(
      currentWorkingDirectory,
      localizeText,
    ),
  ) {}

  /**
   * Executes the fixed `init -> bootstrap doctor preflight -> adopt apply -> adopt verify`
   * bootstrap order.
   * @param options Normalized adopt command options.
   * @returns Aggregated bootstrap operation result plus additive summary artifacts.
   */
  public async bootstrap(options: CliAdoptCommandOptions): Promise<AdoptionOperationResult> {
    const repoRoot = this.resolveRepoRoot(options.repoPath);
    let selection: Awaited<ReturnType<CliAdoptionPackRuntime['resolveBootstrapSelection']>>;
    let workspaceMode: WorkspaceMode;
    try {
      selection = await this.adoptionPackRuntime.resolveBootstrapSelection(options);
      workspaceMode = this.adoptionPackRuntime.resolveEffectiveWorkspaceMode(
        selection.profile,
        options.workspaceMode,
      );
    } catch (error) {
      const fallbackWorkspace = this.resolveBootstrapWorkspaceContext(
        repoRoot,
        options.workspaceMode ?? WorkspaceMode.TOOL_MANAGED,
      );
      const standardizedError = standardizeError(error);
      const bootstrapSummaryPath = resolve(
        fallbackWorkspace.workspaceRoot,
        'context',
        'diagnostics',
        'adoption-bootstrap',
        `bootstrap-${Date.now()}.json`,
      );
      await this.writeJsonFile(bootstrapSummaryPath, {
        schemaVersion: 'adoption-bootstrap-summary-v1',
        generatedAt: new Date().toISOString(),
        repoRoot,
        workspaceRoot: fallbackWorkspace.workspaceRoot,
        packId: null,
        profileId: options.adoptionProfileId,
        workspaceMode: fallbackWorkspace.workspaceMode,
        stageOrder: ['init', 'doctor', 'apply', 'verify'],
        selectorResolution: null,
        reentryMode: 'blocked_by_selection',
        stages: [
          {
            stageId: 'apply',
            status: HostVerificationStatus.FAIL,
            detail: `code=${standardizedError.code} message=${standardizedError.message}`,
            artifactPath: null,
          },
        ],
        initManifestPath: null,
        bootstrapDoctorDiagnosticsPath: null,
        receiptPath: null,
        verificationSummaryPath: null,
        diffReportPath: null,
        finalStatus: HostVerificationStatus.FAIL,
        broaderGovernanceAuditFollowUp: 'check',
        redirectCommands: [],
      });

      return {
        action: CliAdoptAction.BOOTSTRAP,
        repoRoot,
        packId: null,
        profileId: options.adoptionProfileId,
        workspaceMode: fallbackWorkspace.workspaceMode,
        sourceKind: null,
        sourceRef: null,
        hostTargets: [],
        verificationStatus: HostVerificationStatus.FAIL,
        managedFileCount: 0,
        receiptPath: null,
        verificationSummaryPath: null,
        diffReportPath: null,
        writtenArtifacts: [bootstrapSummaryPath],
        checks: [
          {
            checkId: 'bootstrap-selector-resolution',
            status: HostVerificationStatus.FAIL,
            detail: `code=${standardizedError.code} message=${standardizedError.message}`,
          },
        ],
        bootstrapSummaryPath,
        userFacingMessage: standardizedError.message,
      };
    }

    const workspace = this.resolveBootstrapWorkspaceContext(repoRoot, workspaceMode);
    const initStage = await this.runInitStage(
      workspace,
      selection.profile.profileId === BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE
        ? buildSelfHostGovernorConfigContent()
        : this.buildDefaultGovernorConfigContent(workspace),
    );
    const doctorStage = await this.runDoctorStage(workspace, initStage);
    const stageResults: BootstrapStageResult[] = [initStage.stage, doctorStage.stage];
    const writtenArtifacts = [
      initStage.initManifestPath,
      doctorStage.bootstrapDoctorDiagnosticsPath,
    ];
    let reentryMode: BootstrapReentryMode = 'fresh_install';
    let existingReceipt: AdoptionPackInstallReceipt | null = null;
    let applyResult: AdoptionOperationResult | null = null;
    let verifyResult: AdoptionOperationResult | null = null;
    let diffReportPath: string | null = null;

    try {
      const installedReceipts = await this.readInstalledReceipts(repoRoot);
      if (installedReceipts.length > 1) {
        reentryMode = 'blocked_by_existing_receipts';
        stageResults.push({
          stageId: 'apply',
          status: HostVerificationStatus.FAIL,
          detail: this.localizeText(
            'Bootstrap refused because multiple adoption receipts already exist; use adopt diff/upgrade/remove with an explicit receipt.',
            'bootstrap 已拒绝，因为目标仓库存在多份 adoption receipt；请改用带显式 receipt 的 adopt diff/upgrade/remove。',
          ),
          artifactPath: null,
        });
        stageResults.push({
          stageId: 'verify',
          status: HostVerificationStatus.WARN,
          detail: this.localizeText(
            'Verify was skipped because bootstrap stopped before adopt apply.',
            '由于 bootstrap 在 adopt apply 前停止，verify 已跳过。',
          ),
          artifactPath: null,
        });

        return this.buildBootstrapResult({
          repoRoot,
          selection,
          workspace,
          stageResults,
          reentryMode,
          writtenArtifacts,
          initManifestPath: initStage.initManifestPath,
          bootstrapDoctorDiagnosticsPath: doctorStage.bootstrapDoctorDiagnosticsPath,
          receiptPath: null,
          verificationSummaryPath: null,
          diffReportPath: null,
          managedFileCount: 0,
        });
      }

      existingReceipt = installedReceipts[0] ?? null;
      if (existingReceipt) {
        const receiptMatchesSelection =
          existingReceipt.packId === selection.definition.manifest.packId &&
          existingReceipt.appliedProfileId === selection.profile.profileId;
        if (!receiptMatchesSelection) {
          reentryMode = 'redirect_to_lifecycle';
          stageResults.push({
            stageId: 'apply',
            status: HostVerificationStatus.FAIL,
            detail: this.localizeText(
              `Existing installation targets ${existingReceipt.packId}/${existingReceipt.appliedProfileId}; bootstrap stays fail-closed and redirects to adopt diff/upgrade/remove.`,
              `现有安装目标为 ${existingReceipt.packId}/${existingReceipt.appliedProfileId}；bootstrap 保持 fail-closed，请改用 adopt diff/upgrade/remove。`,
            ),
            artifactPath: existingReceipt.receiptPath,
          });
          stageResults.push({
            stageId: 'verify',
            status: HostVerificationStatus.WARN,
            detail: this.localizeText(
              'Verify was skipped because bootstrap stopped before adopt apply.',
              '由于 bootstrap 在 adopt apply 前停止，verify 已跳过。',
            ),
            artifactPath: null,
          });

          return this.buildBootstrapResult({
            repoRoot,
            selection,
            workspace,
            stageResults,
            reentryMode,
            writtenArtifacts,
            initManifestPath: initStage.initManifestPath,
            bootstrapDoctorDiagnosticsPath: doctorStage.bootstrapDoctorDiagnosticsPath,
            receiptPath: existingReceipt.receiptPath,
            verificationSummaryPath: existingReceipt.verificationSummary.verificationSummaryPath,
            diffReportPath: null,
            managedFileCount: existingReceipt.managedFileRecords.length,
          });
        }

        const diffResult = await this.adoptionPackRuntime.diff({
          ...options,
          action: CliAdoptAction.DIFF,
          repoPath: repoRoot,
          receiptPath: existingReceipt.receiptPath,
          packSelector: selection.definition.manifest.packId,
          adoptionProfileId: selection.profile.profileId,
        });
        diffReportPath = diffResult.diffReportPath;
        if (diffResult.verificationStatus === HostVerificationStatus.FAIL) {
          reentryMode = 'redirect_to_lifecycle';
          stageResults.push({
            stageId: 'apply',
            status: HostVerificationStatus.FAIL,
            detail: this.localizeText(
              'Managed installation drift was detected; bootstrap stays fail-closed and redirects to adopt diff/upgrade/remove.',
              '检测到受管安装漂移；bootstrap 保持 fail-closed，请改用 adopt diff/upgrade/remove。',
            ),
            artifactPath: diffResult.diffReportPath,
          });
          stageResults.push({
            stageId: 'verify',
            status: HostVerificationStatus.WARN,
            detail: this.localizeText(
              'Verify was skipped because bootstrap stopped before adopt apply.',
              '由于 bootstrap 在 adopt apply 前停止，verify 已跳过。',
            ),
            artifactPath: null,
          });

          return this.buildBootstrapResult({
            repoRoot,
            selection,
            workspace,
            stageResults,
            reentryMode,
            writtenArtifacts: [...writtenArtifacts, ...(diffResult.writtenArtifacts ?? [])],
            initManifestPath: initStage.initManifestPath,
            bootstrapDoctorDiagnosticsPath: doctorStage.bootstrapDoctorDiagnosticsPath,
            receiptPath: existingReceipt.receiptPath,
            verificationSummaryPath: existingReceipt.verificationSummary.verificationSummaryPath,
            diffReportPath: diffResult.diffReportPath,
            managedFileCount: existingReceipt.managedFileRecords.length,
          });
        }

        reentryMode = 'reuse_existing_installation';
      }

      applyResult = await this.adoptionPackRuntime.applyResolvedTarget(
        {
          ...options,
          action: CliAdoptAction.APPLY,
          repoPath: repoRoot,
          packSelector: selection.definition.manifest.packId,
          adoptionProfileId: selection.profile.profileId,
          workspaceMode,
        },
        {
          definition: selection.definition,
          profile: selection.profile,
        },
      );
      writtenArtifacts.push(...applyResult.writtenArtifacts);
      stageResults.push({
        stageId: 'apply',
        status: applyResult.verificationStatus,
        detail: `pack=${applyResult.packId} profile=${applyResult.profileId} managed_files=${applyResult.managedFileCount}`,
        artifactPath: applyResult.receiptPath,
      });

      verifyResult = await this.adoptionPackRuntime.verify({
        ...options,
        action: CliAdoptAction.VERIFY,
        repoPath: repoRoot,
        packSelector: selection.definition.manifest.packId,
        adoptionProfileId: selection.profile.profileId,
        workspaceMode,
        receiptPath: applyResult.receiptPath,
      });
      writtenArtifacts.push(...verifyResult.writtenArtifacts);
      stageResults.push({
        stageId: 'verify',
        status: verifyResult.verificationStatus,
        detail: `verification_summary=${verifyResult.verificationSummaryPath ?? 'missing'}`,
        artifactPath: verifyResult.verificationSummaryPath,
      });
    } catch (error) {
      const standardizedError = standardizeError(error);
      stageResults.push({
        stageId: 'apply',
        status: HostVerificationStatus.FAIL,
        detail: `code=${standardizedError.code} message=${standardizedError.message}`,
        artifactPath: null,
      });
      stageResults.push({
        stageId: 'verify',
        status: HostVerificationStatus.WARN,
        detail: this.localizeText(
          'Verify was skipped because bootstrap stopped before adopt apply.',
          '由于 bootstrap 在 adopt apply 前停止，verify 已跳过。',
        ),
        artifactPath: null,
      });
    }

    return this.buildBootstrapResult({
      repoRoot,
      selection,
      workspace,
      stageResults,
      reentryMode,
      writtenArtifacts,
      initManifestPath: initStage.initManifestPath,
      bootstrapDoctorDiagnosticsPath: doctorStage.bootstrapDoctorDiagnosticsPath,
      receiptPath: applyResult?.receiptPath ?? existingReceipt?.receiptPath ?? null,
      verificationSummaryPath:
        verifyResult?.verificationSummaryPath ??
        applyResult?.verificationSummaryPath ??
        existingReceipt?.verificationSummary.verificationSummaryPath ??
        null,
      diffReportPath,
      managedFileCount:
        applyResult?.managedFileCount ?? existingReceipt?.managedFileRecords.length ?? 0,
      applyChecks: applyResult?.checks,
      verifyChecks: verifyResult?.checks,
      selectorResolution: selection.selectorResolution,
      effectiveHostTargets: applyResult?.hostTargets,
    });
  }

  private async runInitStage(
    workspace: BootstrapWorkspaceContext,
    configContent: string,
  ): Promise<BootstrapInitStageResult> {
    const createdDirectoryPaths: string[] = [];
    for (const segments of CLI_INIT_REQUIRED_DIRECTORY_SEGMENTS) {
      const directoryPath = resolve(workspace.workspaceRoot, ...segments);
      const directoryExisted = existsSync(directoryPath);
      await mkdir(directoryPath, { recursive: true });
      if (!directoryExisted) {
        createdDirectoryPaths.push(directoryPath);
      }
    }

    const configCreated = !existsSync(workspace.configPath);
    if (configCreated) {
      await this.writeTextFile(workspace.configPath, configContent);
    }

    const initManifestPath = resolve(
      workspace.workspaceRoot,
      'context',
      'bootstrap',
      'init-manifest.json',
    );
    await this.writeJsonFile(initManifestPath, {
      schemaVersion: 'adoption-bootstrap-init-manifest-v1',
      initializedAt: new Date().toISOString(),
      workspaceId: workspace.workspaceId,
      workspaceRoot: workspace.workspaceRoot,
      workspaceMode: workspace.workspaceMode,
      configPath: workspace.configPath,
      memoryStoreRoot: workspace.memoryStoreRoot,
    });

    return {
      stage: {
        stageId: 'init',
        status: HostVerificationStatus.PASS,
        detail: `workspace_root=${workspace.workspaceRoot} created_dirs=${createdDirectoryPaths.length} config_created=${configCreated}`,
        artifactPath: initManifestPath,
      },
      createdDirectoryCount: createdDirectoryPaths.length,
      configCreated,
      initManifestPath,
    };
  }

  private async runDoctorStage(
    workspace: BootstrapWorkspaceContext,
    initStage: BootstrapInitStageResult,
  ): Promise<BootstrapDoctorStageResult> {
    const workspaceWritable = await this.canWritePath(workspace.workspaceRoot);
    const configExists = existsSync(workspace.configPath);
    const checks: AdoptionPackVerificationCheck[] = [
      {
        checkId: 'bootstrap-workspace-root',
        status: existsSync(workspace.workspaceRoot)
          ? HostVerificationStatus.PASS
          : HostVerificationStatus.FAIL,
        detail: `workspace_root=${workspace.workspaceRoot}`,
      },
      {
        checkId: 'bootstrap-workspace-write-access',
        status: workspaceWritable ? HostVerificationStatus.PASS : HostVerificationStatus.FAIL,
        detail: workspaceWritable
          ? 'workspace_write_access=enabled'
          : 'workspace_write_access=blocked',
      },
      {
        checkId: 'bootstrap-workspace-config',
        status: configExists ? HostVerificationStatus.PASS : HostVerificationStatus.FAIL,
        detail: configExists
          ? `config=${workspace.configPath}`
          : `missing_config=${workspace.configPath}`,
      },
      {
        checkId: 'bootstrap-safe-local-fix',
        status: HostVerificationStatus.PASS,
        detail: `created_dirs=${initStage.createdDirectoryCount} config_created=${initStage.configCreated}`,
      },
      {
        checkId: 'bootstrap-broader-audit-follow-up',
        status: HostVerificationStatus.PASS,
        detail: 'broader_governance_audit=explicit_check_follow_up',
      },
    ];
    const doctorStatus =
      workspaceWritable && configExists ? HostVerificationStatus.PASS : HostVerificationStatus.FAIL;
    const bootstrapDoctorId = `bootstrap-doctor-${Date.now()}`;
    const bootstrapDoctorDiagnosticsPath = resolve(
      workspace.workspaceRoot,
      'context',
      'diagnostics',
      'adoption-bootstrap',
      'doctor',
      `${bootstrapDoctorId}.json`,
    );
    await this.writeJsonFile(bootstrapDoctorDiagnosticsPath, {
      schemaVersion: 'adoption-bootstrap-doctor-stage-diagnostics-v1',
      generatedAt: new Date().toISOString(),
      workspace: {
        workspaceId: workspace.workspaceId,
        workspaceRoot: workspace.workspaceRoot,
        workspaceMode: workspace.workspaceMode,
      },
      options: {
        fix: true,
      },
      checks,
    });

    return {
      stage: {
        stageId: 'doctor',
        status: doctorStatus,
        detail: `workspace_write_access=${workspaceWritable} config_exists=${configExists}`,
        artifactPath: bootstrapDoctorDiagnosticsPath,
      },
      bootstrapDoctorDiagnosticsPath,
      checks,
    };
  }

  private async buildBootstrapResult(options: {
    repoRoot: string;
    selection: Awaited<ReturnType<CliAdoptionPackRuntime['resolveBootstrapSelection']>>;
    workspace: BootstrapWorkspaceContext;
    stageResults: BootstrapStageResult[];
    reentryMode: BootstrapReentryMode;
    writtenArtifacts: string[];
    initManifestPath: string | null;
    bootstrapDoctorDiagnosticsPath: string | null;
    receiptPath: string | null;
    verificationSummaryPath: string | null;
    diffReportPath: string | null;
    managedFileCount: number;
    applyChecks?: AdoptionPackVerificationCheck[];
    verifyChecks?: AdoptionPackVerificationCheck[];
    selectorResolution?: BootstrapSelectorResolution;
    effectiveHostTargets?: HostDistributionTarget[];
  }): Promise<AdoptionOperationResult> {
    const finalStatus = this.combineStatuses(options.stageResults.map((stage) => stage.status));
    const bootstrapSummaryPath = resolve(
      options.workspace.workspaceRoot,
      'context',
      'diagnostics',
      'adoption-bootstrap',
      `bootstrap-${Date.now()}.json`,
    );
    const checks: AdoptionPackVerificationCheck[] = [
      {
        checkId: 'bootstrap-selector-resolution',
        status: HostVerificationStatus.PASS,
        detail: `selector_resolution=${options.selectorResolution ?? options.selection.selectorResolution}`,
      },
      {
        checkId: 'bootstrap-reentry-mode',
        status:
          options.reentryMode === 'redirect_to_lifecycle' ||
          options.reentryMode === 'blocked_by_existing_receipts' ||
          options.reentryMode === 'blocked_by_selection'
            ? HostVerificationStatus.FAIL
            : HostVerificationStatus.PASS,
        detail: `reentry_mode=${options.reentryMode}`,
      },
      ...options.stageResults.map((stage) => ({
        checkId: `bootstrap-stage:${stage.stageId}`,
        status: stage.status,
        detail: stage.detail,
        inspectedPath: stage.artifactPath ?? undefined,
      })),
      ...(options.applyChecks ?? []),
      ...(options.verifyChecks ?? []),
      {
        checkId: 'bootstrap-check-follow-up',
        status: HostVerificationStatus.PASS,
        detail: 'run_check_for_broader_governance_audit=explicit',
      },
    ];
    await this.writeJsonFile(bootstrapSummaryPath, {
      schemaVersion: 'adoption-bootstrap-summary-v1',
      generatedAt: new Date().toISOString(),
      repoRoot: options.repoRoot,
      workspaceRoot: options.workspace.workspaceRoot,
      packId: options.selection.definition.manifest.packId,
      profileId: options.selection.profile.profileId,
      workspaceMode: options.workspace.workspaceMode,
      stageOrder: ['init', 'doctor', 'apply', 'verify'],
      selectorResolution: options.selectorResolution ?? options.selection.selectorResolution,
      reentryMode: options.reentryMode,
      stages: options.stageResults,
      initManifestPath: options.initManifestPath,
      bootstrapDoctorDiagnosticsPath: options.bootstrapDoctorDiagnosticsPath,
      receiptPath: options.receiptPath,
      verificationSummaryPath: options.verificationSummaryPath,
      diffReportPath: options.diffReportPath,
      finalStatus,
      broaderGovernanceAuditFollowUp: 'check',
      redirectCommands:
        options.reentryMode === 'redirect_to_lifecycle' ||
        options.reentryMode === 'blocked_by_existing_receipts'
          ? ['adopt diff', 'adopt upgrade', 'adopt remove']
          : [],
    });

    return {
      action: CliAdoptAction.BOOTSTRAP,
      repoRoot: options.repoRoot,
      packId: options.selection.definition.manifest.packId,
      profileId: options.selection.profile.profileId,
      workspaceMode: options.workspace.workspaceMode,
      sourceKind: options.selection.definition.manifest.resolvedSourceKind,
      sourceRef: options.selection.definition.manifest.resolvedSourceRef,
      hostTargets: [...(options.effectiveHostTargets ?? options.selection.profile.hostTargets)],
      verificationStatus: finalStatus,
      managedFileCount: options.managedFileCount,
      receiptPath: options.receiptPath,
      verificationSummaryPath: options.verificationSummaryPath,
      diffReportPath: options.diffReportPath,
      writtenArtifacts: [...options.writtenArtifacts, bootstrapSummaryPath],
      checks,
      initManifestPath: options.initManifestPath,
      bootstrapDoctorDiagnosticsPath: options.bootstrapDoctorDiagnosticsPath,
      bootstrapSummaryPath,
      selectorResolution: options.selectorResolution ?? options.selection.selectorResolution,
      reentryMode: options.reentryMode,
    };
  }

  private resolveBootstrapWorkspaceContext(
    repoRoot: string,
    workspaceMode: WorkspaceMode,
  ): BootstrapWorkspaceContext {
    const runtimeOverrides: {
      mode: WorkspaceMode;
      repoLocalRoot?: string;
    } = {
      mode: workspaceMode,
    };

    // Bootstrap can target a clean-room repo nested under the current governor checkout, so
    // repo_local must stay anchored to the explicit target repo instead of walking up to the
    // nearest parent `.git` boundary.
    if (workspaceMode === WorkspaceMode.REPO_LOCAL) {
      runtimeOverrides.repoLocalRoot = resolve(repoRoot, '.repo-ai-governor');
    }

    const workspace = this.workspaceResolver.resolve({
      currentWorkingDirectory: repoRoot,
      repositoryRootOverride: repoRoot,
      runtimeOverrides,
    });

    return {
      workspaceId: workspace.workspaceId,
      workspaceRoot: workspace.workspaceRoot,
      configPath: workspace.configPath,
      workspaceMode: workspace.mode,
      memoryStoreRoot: resolve(workspace.workspaceRoot, 'context', 'memory', 'sqlite'),
    };
  }

  private resolveRepoRoot(repoPath: string | null): string {
    return repoPath
      ? resolve(this.currentWorkingDirectory, repoPath)
      : resolve(this.currentWorkingDirectory);
  }

  private async readInstalledReceipts(repoRoot: string): Promise<AdoptionPackInstallReceipt[]> {
    const receiptPaths = await this.scanReceiptPaths(repoRoot);
    const receipts: AdoptionPackInstallReceipt[] = [];
    for (const receiptPath of receiptPaths) {
      try {
        const parsedReceipt = JSON.parse(
          await readFile(receiptPath, 'utf8'),
        ) as AdoptionPackInstallReceipt;
        receipts.push(parsedReceipt);
      } catch (error) {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          this.localizeText(
            'Failed to read existing adoption receipt during bootstrap preflight.',
            '在 bootstrap 预检阶段读取现有 adoption receipt 失败。',
          ),
          {
            receiptPath,
          },
          error,
        );
      }
    }
    return receipts;
  }

  private async scanReceiptPaths(repoRoot: string): Promise<string[]> {
    const installationsRoot = resolve(repoRoot, '.repo-ai-governor', 'adoption', 'installations');
    if (!existsSync(installationsRoot)) {
      return [];
    }

    const entries = await readdir(installationsRoot, { withFileTypes: true });
    const receiptPaths: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const receiptPath = resolve(installationsRoot, entry.name, 'adoption-install.receipt.json');
      if (existsSync(receiptPath)) {
        receiptPaths.push(receiptPath);
      }
    }

    return receiptPaths.sort((left, right) => left.localeCompare(right));
  }

  private async canWritePath(targetPath: string): Promise<boolean> {
    try {
      await access(targetPath, FsConstants.W_OK);
      return true;
    } catch {
      return false;
    }
  }

  private combineStatuses(statuses: HostVerificationStatus[]): HostVerificationStatus {
    if (statuses.includes(HostVerificationStatus.FAIL)) {
      return HostVerificationStatus.FAIL;
    }
    if (statuses.includes(HostVerificationStatus.WARN)) {
      return HostVerificationStatus.WARN;
    }
    return HostVerificationStatus.PASS;
  }

  private buildDefaultGovernorConfigContent(workspace: BootstrapWorkspaceContext): string {
    return renderGovernorConfigContent(
      buildDefaultGovernorConfig(
        {
          mode: workspace.workspaceMode,
        },
        {
          storeEngine: DEFAULT_MEMORY_RUNTIME_CONFIG.storeEngine,
          storeRoot: workspace.memoryStoreRoot,
        },
      ),
    );
  }

  private async writeTextFile(filePath: string, content: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
  }

  private async writeJsonFile(filePath: string, payload: unknown): Promise<void> {
    await this.writeTextFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  }
}
