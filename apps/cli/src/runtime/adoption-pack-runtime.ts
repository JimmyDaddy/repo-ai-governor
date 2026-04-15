import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { ClaudeCodeHostRenderer } from '@repo-ai-governor/adapter-claude-code';
import { CodexHostRenderer } from '@repo-ai-governor/adapter-codex';
import { GithubCopilotHostRenderer } from '@repo-ai-governor/adapter-github-copilot';
import { SqliteArtifactIndexStore } from '@repo-ai-governor/artifact-registry';
import {
  GovernorErrorCode,
  RuntimeError,
  WorkspaceMode,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  AdoptionPackApplicabilityScope,
  type AdoptionPackInstallReceipt,
  AdoptionPackManagedAssetGroup,
  type AdoptionPackManagedFileRecord,
  type AdoptionPackProfile,
  AdoptionPackReadinessSink,
  AdoptionPackRegistry,
  type AdoptionPackRuntimeBootstrapRecord,
  type AdoptionPackVerificationCheck,
  type AdoptionPackVerificationSummary,
  AdoptionPackWorkspaceModePolicy,
  BUILT_IN_ADOPTION_PACK_PROFILE_IDS,
  DEFAULT_ADOPTION_METADATA_ROOT_SEGMENTS,
  HostDistributionHost,
  HostDistributionMode,
  HostDistributionTarget,
  type HostExportProjectedFile,
  type HostRendererRenderResult,
  HostVerificationStatus,
  type ResolvedAdoptionPackDefinition,
  StructuredWorkflowAssetRegistry,
} from '@repo-ai-governor/standards';
import { CliAdoptAction } from '../constants/cli-adopt.constant.js';
import type { CliAdoptCommandOptions } from '../types/interfaces/cli-adopt-command.interface.js';

type AdoptionTextLocalizer = (english: string, chinese: string) => string;

interface AdoptionListItem {
  packId: string;
  packVersion: string;
  displayProfileIds: string[];
  resolvedSourceKind: string;
  resolvedSourceRef: string;
  installSupported: boolean;
}

interface AdoptionOperationResult {
  action: CliAdoptAction;
  repoRoot: string;
  packId: string | null;
  profileId: string | null;
  workspaceMode: WorkspaceMode | null;
  sourceKind: string | null;
  sourceRef: string | null;
  hostTargets: HostDistributionTarget[];
  verificationStatus: HostVerificationStatus;
  managedFileCount: number;
  receiptPath: string | null;
  verificationSummaryPath: string | null;
  diffReportPath: string | null;
  writtenArtifacts: string[];
  checks: AdoptionPackVerificationCheck[];
  availablePacks?: AdoptionListItem[];
}

interface ResolvedInstallTarget {
  definition: ResolvedAdoptionPackDefinition;
  profile: AdoptionPackProfile;
}

interface MaterializedHostResult {
  target: HostDistributionTarget;
  verificationStatus: HostVerificationStatus;
  checks: AdoptionPackVerificationCheck[];
  managedFileRecords: AdoptionPackManagedFileRecord[];
  writtenArtifacts: string[];
  exportManifestPath: string;
  verificationSummaryPath: string;
  applyReportPath: string;
}

interface SelfHostReadinessEvaluation {
  doctorChecks: AdoptionPackVerificationCheck[];
  verifyChecks: AdoptionPackVerificationCheck[];
}

const ADOPTION_INSTALL_RECEIPT_FILE_NAME = 'adoption-install.receipt.json';
const ADOPTION_VERIFICATION_SUMMARY_FILE_NAME = 'adoption-verification.summary.json';
const ADOPTION_DIFF_REPORT_FILE_NAME = 'adoption-diff.report.json';
const ADOPTION_RECEIPT_DIAGNOSTICS_CHECK_ID = 'adoption-receipt-diagnostics';
const SELF_HOST_READINESS_CHECK_ID_PREFIX = 'self-host-readiness';
const SELF_HOST_EXECUTION_PREFLIGHT_SIGNAL_CHECK_ID = 'self-host-execution-preflight';
const SELF_HOST_REQUIRED_PLACEHOLDER_MARKER = 'replace_before_execution';
const SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE = `- Placeholder Status: ${SELF_HOST_REQUIRED_PLACEHOLDER_MARKER}`;
const SELF_HOST_STARTER_PLACEHOLDER_MARKERS = [
  SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE,
  'project-template',
  'sprint-template',
  'self-host-template',
  '- Stream: `none`',
] as const;
const ARTIFACT_REGISTRY_HEADERS = [
  'artifact_id',
  'artifact_type',
  'artifact_path',
  'artifact_version',
  'artifact_status',
  'producer_task_id',
  'producer_execution_id',
  'registered_at',
  'last_updated_at',
  'dependent_tasks',
];

/**
 * Orchestrates high-level adoption-pack resolution, materialization, and lifecycle checks.
 */
export class CliAdoptionPackRuntime {
  private readonly adoptionPackRegistry: AdoptionPackRegistry;

  public constructor(
    private readonly currentWorkingDirectory: string,
    private readonly localizeText: AdoptionTextLocalizer = (english) => english,
    adoptionPackRegistry?: AdoptionPackRegistry,
  ) {
    this.adoptionPackRegistry =
      adoptionPackRegistry ??
      new AdoptionPackRegistry({
        currentWorkingDirectory,
      });
  }

  /**
   * Lists available adoption packs after layered precedence has been applied.
   */
  public async list(options: CliAdoptCommandOptions): Promise<AdoptionOperationResult> {
    const repoRoot = this.resolveRepoRoot(options.repoPath);
    const manifests = await this.adoptionPackRegistry.list();

    return {
      action: CliAdoptAction.LIST,
      repoRoot,
      packId: null,
      profileId: null,
      workspaceMode: null,
      sourceKind: null,
      sourceRef: null,
      hostTargets: [],
      verificationStatus: HostVerificationStatus.PASS,
      managedFileCount: 0,
      receiptPath: null,
      verificationSummaryPath: null,
      diffReportPath: null,
      writtenArtifacts: [],
      checks: [
        {
          checkId: 'available-packs',
          status: HostVerificationStatus.PASS,
          detail: `available_packs=${manifests.length}`,
        },
      ],
      availablePacks: manifests.map((manifest) => ({
        packId: manifest.packId,
        packVersion: manifest.packVersion,
        displayProfileIds: manifest.profiles.map((profile) => profile.profileId),
        resolvedSourceKind: manifest.resolvedSourceKind,
        resolvedSourceRef: manifest.resolvedSourceRef,
        installSupported: manifest.installSupported,
      })),
    };
  }

  /**
   * Applies one resolved adoption pack into the target repository.
   */
  public async apply(options: CliAdoptCommandOptions): Promise<AdoptionOperationResult> {
    const repoRoot = this.resolveRepoRoot(options.repoPath);
    const resolvedTarget = await this.resolveInstallTarget(options);
    const existingReceipt = await this.readExistingReceipt(repoRoot, options.packSelector);
    const selectedTargets = this.resolveSelectedHostTargets(resolvedTarget.profile, options.hosts);
    const workspaceMode = this.resolveWorkspaceMode(
      resolvedTarget.profile,
      options.workspaceMode,
      true,
    );
    const installationRoot = this.resolveInstallationRoot(repoRoot, resolvedTarget.definition);
    const receiptPath = resolve(installationRoot, ADOPTION_INSTALL_RECEIPT_FILE_NAME);
    const verificationSummaryPath = resolve(
      installationRoot,
      ADOPTION_VERIFICATION_SUMMARY_FILE_NAME,
    );
    const writtenArtifacts: string[] = [];
    const managedFileRecords: AdoptionPackManagedFileRecord[] = [];
    const checks: AdoptionPackVerificationCheck[] = [];
    const sessionManagedFileContentByPath = new Map<string, string>();

    for (const target of selectedTargets) {
      const hostResult = await this.materializeHostTarget({
        repoRoot,
        installationRoot,
        definition: resolvedTarget.definition,
        profile: resolvedTarget.profile,
        target,
        existingReceipt,
        force: options.force,
        sessionManagedFileContentByPath,
      });
      managedFileRecords.push(...hostResult.managedFileRecords);
      writtenArtifacts.push(...hostResult.writtenArtifacts);
      checks.push(...hostResult.checks);
    }

    const templateRecords = this.resolveTemplateRecords(
      resolvedTarget.definition,
      resolvedTarget.profile,
    );
    for (const templateRecord of templateRecords) {
      const absolutePath = resolve(repoRoot, templateRecord.relativePath);
      await this.writeManagedTextFile({
        absolutePath,
        relativePath: templateRecord.relativePath,
        content: templateRecord.content,
        assetGroup: templateRecord.assetGroup,
        existingReceipt,
        force: options.force,
      });
      managedFileRecords.push(
        this.createManagedFileRecord(
          templateRecord.relativePath,
          absolutePath,
          templateRecord.assetGroup,
          templateRecord.content,
        ),
      );
    }

    if (resolvedTarget.profile.profileId === 'self-host-complete') {
      const bootstrapResult = await this.bootstrapSelfHostSurface({
        repoRoot,
        definition: resolvedTarget.definition,
        profile: resolvedTarget.profile,
        existingReceipt,
        force: options.force,
      });
      managedFileRecords.push(...bootstrapResult.managedFileRecords);
      checks.push(...bootstrapResult.checks);
      writtenArtifacts.push(...bootstrapResult.writtenArtifacts);
    }

    const deduplicatedManagedFileRecords = this.deduplicateManagedFileRecords(managedFileRecords);
    const verificationSummary = this.buildVerificationSummary({
      receiptPath,
      verificationSummaryPath,
      checks: [
        {
          checkId: 'source-resolution',
          status: HostVerificationStatus.PASS,
          detail: `source_kind=${resolvedTarget.definition.manifest.resolvedSourceKind}`,
        },
        {
          checkId: 'selected-profile',
          status: HostVerificationStatus.PASS,
          detail: `profile_id=${resolvedTarget.profile.profileId}`,
        },
        {
          checkId: 'managed-file-count',
          status:
            deduplicatedManagedFileRecords.length > 0
              ? HostVerificationStatus.PASS
              : HostVerificationStatus.FAIL,
          detail: `managed_files=${deduplicatedManagedFileRecords.length}`,
        },
        ...checks,
      ],
    });
    const now = new Date().toISOString();
    const hostManifestPaths = writtenArtifacts.filter((artifactPath) =>
      artifactPath.endsWith('host-export.manifest.json'),
    );
    const hostApplyReportPaths = writtenArtifacts.filter((artifactPath) =>
      artifactPath.endsWith('host-apply.report.json'),
    );
    const receipt: AdoptionPackInstallReceipt = {
      schemaVersion: 'adoption-pack-install-receipt-v1',
      installationId: existingReceipt?.installationId ?? randomUUID(),
      packId: resolvedTarget.definition.manifest.packId,
      packVersion: resolvedTarget.definition.manifest.packVersion,
      appliedProfileId: resolvedTarget.profile.profileId,
      workspaceMode,
      managedFileRecords: deduplicatedManagedFileRecords,
      sourceResolution: {
        sourceKind: resolvedTarget.definition.manifest.resolvedSourceKind,
        sourceRef: resolvedTarget.definition.manifest.resolvedSourceRef,
        canonicalSourceRefs: [...resolvedTarget.definition.manifest.canonicalSourceRefs],
        sourcePackRefs: [...resolvedTarget.definition.manifest.sourcePackRefs],
        resolutionOrder: [...resolvedTarget.definition.manifest.resolutionOrder],
      },
      verificationSummary,
      installedAt: existingReceipt?.installedAt ?? now,
      lastUpdatedAt: now,
      receiptPath,
      targetRepoRoot: repoRoot,
      hostTargets: [...selectedTargets],
      hostTarget: selectedTargets[0] ?? HostDistributionTarget.CODEX_PROJECT_LOCAL,
      hostManifestPaths,
      hostManifestPath: hostManifestPaths[0],
      hostApplyReportPaths,
      hostApplyReportPath: hostApplyReportPaths[0],
    };

    await this.writeJsonFile(receiptPath, receipt);
    await this.writeJsonFile(verificationSummaryPath, verificationSummary);
    writtenArtifacts.push(receiptPath, verificationSummaryPath);

    return {
      action: CliAdoptAction.APPLY,
      repoRoot,
      packId: receipt.packId,
      profileId: receipt.appliedProfileId,
      workspaceMode,
      sourceKind: receipt.sourceResolution.sourceKind,
      sourceRef: receipt.sourceResolution.sourceRef,
      hostTargets: selectedTargets,
      verificationStatus: verificationSummary.status,
      managedFileCount: receipt.managedFileRecords.length,
      receiptPath,
      verificationSummaryPath,
      diffReportPath: null,
      writtenArtifacts,
      checks: verificationSummary.checks,
    };
  }

  /**
   * Diffs current repository materialization against the active install receipt.
   */
  public async diff(options: CliAdoptCommandOptions): Promise<AdoptionOperationResult> {
    const receipt = await this.loadReceiptForOperation(options);
    const diffReportPath = resolve(dirname(receipt.receiptPath), ADOPTION_DIFF_REPORT_FILE_NAME);
    const diffRecords = await this.buildDiffRecords(receipt);
    const verificationSummary = this.buildVerificationSummary({
      receiptPath: receipt.receiptPath,
      verificationSummaryPath: receipt.verificationSummary.verificationSummaryPath,
      checks: diffRecords.map((record) => ({
        checkId: `managed:${record.relativePath}`,
        status: HostVerificationStatus.FAIL,
        detail: `${record.diffKind}:${record.assetGroup}`,
        inspectedPath: record.relativePath,
        expectedValue: record.receiptChecksumSha256,
        actualValue: record.currentChecksumSha256 ?? 'missing',
      })),
    });

    await this.writeJsonFile(diffReportPath, {
      schemaVersion: 'adoption-pack-diff-report-v1',
      installationId: receipt.installationId,
      packId: receipt.packId,
      packVersion: receipt.packVersion,
      diffReportPath,
      generatedAt: new Date().toISOString(),
      status: verificationSummary.status,
      records: diffRecords,
      verificationSummary,
    });

    return {
      action: CliAdoptAction.DIFF,
      repoRoot: receipt.targetRepoRoot,
      packId: receipt.packId,
      profileId: receipt.appliedProfileId,
      workspaceMode: receipt.workspaceMode,
      sourceKind: receipt.sourceResolution.sourceKind,
      sourceRef: receipt.sourceResolution.sourceRef,
      hostTargets: this.resolveReceiptHostTargets(receipt),
      verificationStatus:
        diffRecords.length === 0 ? HostVerificationStatus.PASS : HostVerificationStatus.FAIL,
      managedFileCount: receipt.managedFileRecords.length,
      receiptPath: receipt.receiptPath,
      verificationSummaryPath: receipt.verificationSummary.verificationSummaryPath,
      diffReportPath,
      writtenArtifacts: [diffReportPath],
      checks:
        diffRecords.length === 0
          ? [
              {
                checkId: 'managed-drift',
                status: HostVerificationStatus.PASS,
                detail: 'managed_drift=clean',
              },
            ]
          : verificationSummary.checks,
    };
  }

  /**
   * Verifies receipt, managed files, and lower-level host artifacts.
   */
  public async verify(options: CliAdoptCommandOptions): Promise<AdoptionOperationResult> {
    const receipt = await this.loadReceiptForOperation(options);
    const diffRecords = await this.buildDiffRecords(receipt);
    const hostApplyReportPaths = this.resolveReceiptHostApplyReportPaths(receipt);
    const selfHostReadiness = await this.evaluateSelfHostReadiness(receipt);
    const checks: AdoptionPackVerificationCheck[] = [
      {
        checkId: 'receipt-path',
        status: existsSync(receipt.receiptPath)
          ? HostVerificationStatus.PASS
          : HostVerificationStatus.FAIL,
        detail: `receipt=${receipt.receiptPath}`,
        inspectedPath: receipt.receiptPath,
      },
      {
        checkId: 'host-verification-summary',
        status:
          hostApplyReportPaths.length > 0 &&
          hostApplyReportPaths.every((reportPath) => existsSync(reportPath))
            ? HostVerificationStatus.PASS
            : HostVerificationStatus.WARN,
        detail: `host_apply_reports=${hostApplyReportPaths.length > 0 ? hostApplyReportPaths.join(',') : 'missing'}`,
        inspectedPath: hostApplyReportPaths[0] ?? undefined,
      },
    ];
    checks.push(...selfHostReadiness.verifyChecks);
    checks.push(
      ...diffRecords.map((record) => ({
        checkId: `managed:${record.relativePath}`,
        status: HostVerificationStatus.FAIL,
        detail: `${record.diffKind}:${record.assetGroup}`,
        inspectedPath: record.relativePath,
        expectedValue: record.receiptChecksumSha256,
        actualValue: record.currentChecksumSha256 ?? 'missing',
      })),
    );

    const verificationSummary = this.buildVerificationSummary({
      receiptPath: receipt.receiptPath,
      verificationSummaryPath: receipt.verificationSummary.verificationSummaryPath,
      checks,
    });
    await this.writeJsonFile(
      receipt.verificationSummary.verificationSummaryPath,
      verificationSummary,
    );

    return {
      action: CliAdoptAction.VERIFY,
      repoRoot: receipt.targetRepoRoot,
      packId: receipt.packId,
      profileId: receipt.appliedProfileId,
      workspaceMode: receipt.workspaceMode,
      sourceKind: receipt.sourceResolution.sourceKind,
      sourceRef: receipt.sourceResolution.sourceRef,
      hostTargets: this.resolveReceiptHostTargets(receipt),
      verificationStatus: verificationSummary.status,
      managedFileCount: receipt.managedFileRecords.length,
      receiptPath: receipt.receiptPath,
      verificationSummaryPath: receipt.verificationSummary.verificationSummaryPath,
      diffReportPath: null,
      writtenArtifacts: [receipt.verificationSummary.verificationSummaryPath],
      checks:
        diffRecords.length === 0
          ? [
              ...checks,
              {
                checkId: 'managed-drift',
                status: HostVerificationStatus.PASS,
                detail: 'managed_drift=clean',
              },
            ]
          : verificationSummary.checks,
    };
  }

  /**
   * Collects doctor-facing self-host readiness checks without mutating adoption verification artifacts.
   * @param options Optional repo or pack selector used to resolve one installed adoption receipt.
   * @returns Doctor diagnostics checks for self-host readiness, or an empty list when no matching receipt exists.
   */
  public async collectDoctorReadinessChecks(options?: {
    repoPath?: string | null;
    packSelector?: string | null;
  }): Promise<AdoptionPackVerificationCheck[]> {
    const repoRoot = this.resolveRepoRoot(options?.repoPath ?? null);
    try {
      const receipt = await this.readExistingReceipt(
        repoRoot,
        options?.packSelector ?? null,
        false,
      );
      if (!receipt) {
        return [];
      }

      const selfHostReadiness = await this.evaluateSelfHostReadiness(receipt);
      return selfHostReadiness.doctorChecks;
    } catch (error) {
      return [this.createDoctorReceiptFailureCheck(error, repoRoot)];
    }
  }

  /**
   * Reapplies the current or requested pack when managed files are clean.
   */
  public async upgrade(options: CliAdoptCommandOptions): Promise<AdoptionOperationResult> {
    const receipt = await this.loadReceiptForOperation(options);
    const diffRecords = await this.buildDiffRecords(receipt);
    if (diffRecords.length > 0 && !options.force) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'adopt upgrade refused because managed files drifted; rerun with --force after review.',
          'adopt upgrade 已拒绝，因为受管文件已经漂移；确认后可使用 --force 重试。',
        ),
        {
          receiptPath: receipt.receiptPath,
          diffCount: diffRecords.length,
        },
      );
    }

    const applyResult = await this.apply({
      ...options,
      packSelector: options.packSelector ?? receipt.packId,
      repoPath: receipt.targetRepoRoot,
      adoptionProfileId: options.adoptionProfileId ?? receipt.appliedProfileId,
      workspaceMode: options.workspaceMode ?? receipt.workspaceMode,
      receiptPath: receipt.receiptPath,
    });

    return {
      ...applyResult,
      action: CliAdoptAction.UPGRADE,
    };
  }

  /**
   * Removes managed files recorded by the active install receipt.
   */
  public async remove(options: CliAdoptCommandOptions): Promise<AdoptionOperationResult> {
    const receipt = await this.loadReceiptForOperation(options);
    const diffRecords = await this.buildDiffRecords(receipt);
    if (diffRecords.length > 0 || !options.force) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'adopt remove requires --force and fails closed when managed files drift.',
          'adopt remove 需要显式 --force，且在受管文件漂移时默认 fail-closed。',
        ),
        {
          receiptPath: receipt.receiptPath,
          diffCount: diffRecords.length,
        },
      );
    }

    for (const managedFileRecord of receipt.managedFileRecords) {
      if (existsSync(managedFileRecord.absolutePath)) {
        await rm(managedFileRecord.absolutePath, { force: true });
      }
    }

    const installationRoot = dirname(receipt.receiptPath);
    if (existsSync(installationRoot)) {
      await rm(installationRoot, { recursive: true, force: true });
    }

    return {
      action: CliAdoptAction.REMOVE,
      repoRoot: receipt.targetRepoRoot,
      packId: receipt.packId,
      profileId: receipt.appliedProfileId,
      workspaceMode: receipt.workspaceMode,
      sourceKind: receipt.sourceResolution.sourceKind,
      sourceRef: receipt.sourceResolution.sourceRef,
      hostTargets: this.resolveReceiptHostTargets(receipt),
      verificationStatus: HostVerificationStatus.PASS,
      managedFileCount: 0,
      receiptPath: null,
      verificationSummaryPath: null,
      diffReportPath: null,
      writtenArtifacts: [],
      checks: [
        {
          checkId: 'managed-remove',
          status: HostVerificationStatus.PASS,
          detail: `removed_files=${receipt.managedFileRecords.length}`,
        },
      ],
    };
  }

  private async resolveInstallTarget(
    options: CliAdoptCommandOptions,
  ): Promise<ResolvedInstallTarget> {
    if (!options.packSelector) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        this.localizeText(
          'adopt apply/upgrade/remove requires one pack selector.',
          'adopt apply/upgrade/remove 需要提供 pack 选择器。',
        ),
      );
    }

    try {
      const definition = await this.adoptionPackRegistry.resolveDefinition(options.packSelector);
      return {
        definition,
        profile: this.resolveProfile(definition, options.adoptionProfileId, null),
      };
    } catch (error) {
      const manifests = await this.adoptionPackRegistry.list();
      const manifest = manifests.find((candidate) =>
        candidate.profiles.some((profile) => profile.profileId === options.packSelector),
      );
      if (!manifest) {
        throw error;
      }

      const definition = await this.adoptionPackRegistry.resolveDefinition(manifest.packId);
      return {
        definition,
        profile: this.resolveProfile(definition, options.adoptionProfileId, options.packSelector),
      };
    }
  }

  private resolveProfile(
    definition: ResolvedAdoptionPackDefinition,
    requestedProfileId: string | null,
    selectorDerivedProfileId: string | null,
  ): AdoptionPackProfile {
    const targetProfileId =
      requestedProfileId ?? selectorDerivedProfileId ?? definition.manifest.profiles[0]?.profileId;
    const profile = definition.manifest.profiles.find(
      (candidate) => candidate.profileId === targetProfileId,
    );

    if (!profile) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          `Unknown adoption profile "${targetProfileId}".`,
          `未知的 adoption profile "${targetProfileId}"。`,
        ),
        {
          packId: definition.manifest.packId,
          profileId: targetProfileId,
        },
      );
    }

    return profile;
  }

  private resolveRepoRoot(repoPath: string | null): string {
    return repoPath
      ? resolve(this.currentWorkingDirectory, repoPath)
      : resolve(this.currentWorkingDirectory);
  }

  private resolveReceiptHostTargets(receipt: AdoptionPackInstallReceipt): HostDistributionTarget[] {
    if (Array.isArray(receipt.hostTargets) && receipt.hostTargets.length > 0) {
      return [...receipt.hostTargets];
    }

    return receipt.hostTarget ? [receipt.hostTarget] : [HostDistributionTarget.CODEX_PROJECT_LOCAL];
  }

  private resolveReceiptHostApplyReportPaths(receipt: AdoptionPackInstallReceipt): string[] {
    if (receipt.hostApplyReportPaths && receipt.hostApplyReportPaths.length > 0) {
      return [...receipt.hostApplyReportPaths];
    }

    return receipt.hostApplyReportPath ? [receipt.hostApplyReportPath] : [];
  }

  private resolveWorkspaceMode(
    profile: AdoptionPackProfile,
    requestedWorkspaceMode: WorkspaceMode | null,
    enforcePolicy: boolean,
  ): WorkspaceMode {
    if (profile.workspaceModePolicy === AdoptionPackWorkspaceModePolicy.REPO_LOCAL_REQUIRED) {
      if (
        requestedWorkspaceMode !== null &&
        requestedWorkspaceMode !== WorkspaceMode.REPO_LOCAL &&
        enforcePolicy
      ) {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          this.localizeText(
            `Profile "${profile.profileId}" requires workspace.mode=repo_local.`,
            `profile "${profile.profileId}" 要求 workspace.mode=repo_local。`,
          ),
        );
      }

      return WorkspaceMode.REPO_LOCAL;
    }

    if (
      requestedWorkspaceMode === WorkspaceMode.REPO_LOCAL &&
      profile.workspaceModePolicy === AdoptionPackWorkspaceModePolicy.TOOL_MANAGED_DEFAULT
    ) {
      return WorkspaceMode.REPO_LOCAL;
    }

    return requestedWorkspaceMode ?? WorkspaceMode.TOOL_MANAGED;
  }

  private resolveSelectedHostTargets(
    profile: AdoptionPackProfile,
    requestedHosts: HostDistributionHost[],
  ): HostDistributionTarget[] {
    if (requestedHosts.length === 0) {
      return [...profile.hostTargets];
    }

    const requestedTargets = new Set(
      requestedHosts.map((host) => this.resolveProjectLocalTargetForHost(host)),
    );
    return profile.hostTargets.filter((target) => requestedTargets.has(target));
  }

  private resolveProjectLocalTargetForHost(host: HostDistributionHost): HostDistributionTarget {
    switch (host) {
      case HostDistributionHost.CLAUDE_CODE:
        return HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL;
      case HostDistributionHost.GITHUB_COPILOT:
        return HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL;
      default:
        return HostDistributionTarget.CODEX_PROJECT_LOCAL;
    }
  }

  private resolveInstallationRoot(
    repoRoot: string,
    definition: ResolvedAdoptionPackDefinition,
  ): string {
    return resolve(
      repoRoot,
      ...DEFAULT_ADOPTION_METADATA_ROOT_SEGMENTS,
      'installations',
      this.slugify(definition.manifest.packId),
    );
  }

  private resolveTemplateRecords(
    definition: ResolvedAdoptionPackDefinition,
    profile: AdoptionPackProfile,
  ) {
    return this.orderMaterializationRecords(
      definition.templateRecords.filter((record) => record.profileIds.includes(profile.profileId)),
      this.buildSourceCatalogSurfaceOrder(definition),
      'template record',
    );
  }

  private resolveRuntimeBootstrapRecords(
    definition: ResolvedAdoptionPackDefinition,
    profile: AdoptionPackProfile,
  ): AdoptionPackRuntimeBootstrapRecord[] {
    return this.orderMaterializationRecords(
      definition.runtimeBootstrapRecords.filter((record) =>
        record.profileIds.includes(profile.profileId),
      ),
      this.buildSourceCatalogSurfaceOrder(definition),
      'runtime bootstrap record',
    );
  }

  private buildSourceCatalogSurfaceOrder(
    definition: ResolvedAdoptionPackDefinition,
  ): Map<string, number> {
    return new Map(
      definition.sourceCatalogRecords.map((record, index) => [record.surfaceId, index] as const),
    );
  }

  private orderMaterializationRecords<T extends { relativePath: string; sourceCatalogId?: string }>(
    records: T[],
    sourceCatalogSurfaceOrder: Map<string, number>,
    recordKind: string,
  ): T[] {
    return [...records].sort((left, right) => {
      const leftOrder = this.resolveMaterializationOrder(
        left.relativePath,
        left.sourceCatalogId,
        sourceCatalogSurfaceOrder,
        recordKind,
      );
      const rightOrder = this.resolveMaterializationOrder(
        right.relativePath,
        right.sourceCatalogId,
        sourceCatalogSurfaceOrder,
        recordKind,
      );

      return leftOrder - rightOrder;
    });
  }

  private resolveMaterializationOrder(
    relativePath: string,
    sourceCatalogId: string | undefined,
    sourceCatalogSurfaceOrder: Map<string, number>,
    recordKind: string,
  ): number {
    if (!sourceCatalogId) {
      return Number.MAX_SAFE_INTEGER;
    }

    const surfaceOrder = sourceCatalogSurfaceOrder.get(sourceCatalogId);
    if (surfaceOrder !== undefined) {
      return surfaceOrder;
    }

    throw new RuntimeError(
      GovernorErrorCode.STANDARDS_PACK_INVALID,
      this.localizeText(
        `Cannot materialize ${recordKind} "${relativePath}" because source catalog id "${sourceCatalogId}" is missing from the resolved definition.`,
        `无法物化 ${recordKind} "${relativePath}"，因为 source catalog id "${sourceCatalogId}" 不存在于已解析 definition 中。`,
      ),
      {
        relativePath,
        sourceCatalogId,
        recordKind,
      },
    );
  }

  private async materializeHostTarget(options: {
    repoRoot: string;
    installationRoot: string;
    definition: ResolvedAdoptionPackDefinition;
    profile: AdoptionPackProfile;
    target: HostDistributionTarget;
    existingReceipt: AdoptionPackInstallReceipt | null;
    force: boolean;
    sessionManagedFileContentByPath: Map<string, string>;
  }): Promise<MaterializedHostResult> {
    const host = this.resolveHostForTarget(options.target);
    const targetSlug = options.target.replace(/\./g, '-').replace(/_/g, '-');
    const stagedExportRoot = resolve(options.installationRoot, 'hosts', targetSlug);
    const exportManifestPath = resolve(stagedExportRoot, 'host-export.manifest.json');
    const verificationSummaryPath = resolve(stagedExportRoot, 'host-verification.summary.json');
    const applyReportPath = resolve(stagedExportRoot, 'host-apply.report.json');
    const registry = new StructuredWorkflowAssetRegistry({
      records: options.definition.workflowRecords,
    });
    const rendered = this.resolveRenderer(host, registry).render({
      host,
      mode: HostDistributionMode.PROJECT_LOCAL,
      target: options.target,
      stagedExportRoot,
      exportManifestPath,
      verificationSummaryPath,
      applyRoot: options.repoRoot,
      applyReportPath,
      handoffBridge: options.definition.manifest.handoffBridge,
      workflowIds: options.profile.workflowAssetIds,
      canonicalSourceRefs: [...options.definition.manifest.canonicalSourceRefs],
      sourcePackRefs: [...options.definition.manifest.sourcePackRefs],
    });

    const { writtenArtifacts, appliedProjectedFiles } = await this.writeRenderedHostArtifacts(
      options.repoRoot,
      rendered,
      options.existingReceipt,
      options.force,
      options.sessionManagedFileContentByPath,
    );
    const managedFileRecords = this.collectHostManagedFileRecords(
      options.repoRoot,
      rendered,
      appliedProjectedFiles,
    );

    return {
      target: options.target,
      verificationStatus: rendered.verificationSummary.status,
      checks: [
        {
          checkId: `host:${options.target}`,
          status: rendered.verificationSummary.status,
          detail: `projected_files=${rendered.projectedFiles.length}`,
        },
      ],
      managedFileRecords,
      writtenArtifacts,
      exportManifestPath,
      verificationSummaryPath,
      applyReportPath,
    };
  }

  private async writeRenderedHostArtifacts(
    repoRoot: string,
    rendered: HostRendererRenderResult,
    existingReceipt: AdoptionPackInstallReceipt | null,
    force: boolean,
    sessionManagedFileContentByPath: Map<string, string>,
  ): Promise<{
    writtenArtifacts: string[];
    appliedProjectedFiles: HostExportProjectedFile[];
  }> {
    const writtenArtifacts: string[] = [];
    const appliedProjectedFiles: HostExportProjectedFile[] = [];
    for (const projectedFile of rendered.projectedFiles) {
      const absolutePath = resolve(repoRoot, projectedFile.relativePath);
      const existingSessionContent = sessionManagedFileContentByPath.get(absolutePath);
      const resolvedContent =
        existingSessionContent === undefined
          ? projectedFile.content
          : this.resolveProjectedFileConflict(
              projectedFile.relativePath,
              existingSessionContent,
              projectedFile.content,
            );
      if (existingSessionContent === undefined) {
        await this.writeManagedTextFile({
          absolutePath,
          relativePath: projectedFile.relativePath,
          content: resolvedContent,
          assetGroup: this.inferHostAssetGroup(projectedFile.relativePath),
          existingReceipt,
          force,
        });
      } else if (resolvedContent !== existingSessionContent) {
        await this.writeTextFile(absolutePath, resolvedContent);
      }
      sessionManagedFileContentByPath.set(absolutePath, resolvedContent);
      appliedProjectedFiles.push({
        ...projectedFile,
        content: resolvedContent,
      });
      writtenArtifacts.push(absolutePath);
    }

    await this.writeJsonFile(rendered.exportManifest.exportManifestPath, rendered.exportManifest);
    await this.writeJsonFile(
      rendered.verificationSummary.verificationSummaryPath,
      rendered.verificationSummary,
    );
    writtenArtifacts.push(
      rendered.exportManifest.exportManifestPath,
      rendered.verificationSummary.verificationSummaryPath,
    );

    if (rendered.applyReport) {
      await this.writeJsonFile(rendered.applyReport.applyReportPath, rendered.applyReport);
      writtenArtifacts.push(rendered.applyReport.applyReportPath);
    }

    return {
      writtenArtifacts,
      appliedProjectedFiles,
    };
  }

  private collectHostManagedFileRecords(
    repoRoot: string,
    rendered: HostRendererRenderResult,
    appliedProjectedFiles: HostExportProjectedFile[],
  ): AdoptionPackManagedFileRecord[] {
    return [
      ...appliedProjectedFiles.map((projectedFile) =>
        this.createManagedFileRecord(
          projectedFile.relativePath,
          resolve(repoRoot, projectedFile.relativePath),
          this.inferHostAssetGroup(projectedFile.relativePath),
          projectedFile.content,
        ),
      ),
      this.createManagedFileRecord(
        this.relativeFromRoot(rendered.exportManifest.exportManifestPath, repoRoot),
        rendered.exportManifest.exportManifestPath,
        AdoptionPackManagedAssetGroup.RUNTIME_HANDOFF_METADATA,
        `${JSON.stringify(rendered.exportManifest, null, 2)}\n`,
      ),
      this.createManagedFileRecord(
        this.relativeFromRoot(rendered.verificationSummary.verificationSummaryPath, repoRoot),
        rendered.verificationSummary.verificationSummaryPath,
        AdoptionPackManagedAssetGroup.RUNTIME_HANDOFF_METADATA,
        `${JSON.stringify(rendered.verificationSummary, null, 2)}\n`,
      ),
      ...(rendered.applyReport
        ? [
            this.createManagedFileRecord(
              this.relativeFromRoot(rendered.applyReport.applyReportPath, repoRoot),
              rendered.applyReport.applyReportPath,
              AdoptionPackManagedAssetGroup.RUNTIME_HANDOFF_METADATA,
              `${JSON.stringify(rendered.applyReport, null, 2)}\n`,
            ),
          ]
        : []),
    ];
  }

  private resolveProjectedFileConflict(
    relativePath: string,
    currentContent: string,
    nextContent: string,
  ): string {
    if (currentContent === nextContent) {
      return currentContent;
    }

    if (relativePath === 'AGENTS.md') {
      return `${currentContent.trimEnd()}\n\n---\n\n${nextContent.trim()}\n`;
    }

    if (relativePath === '.mcp.json') {
      return this.stringifyMergedMcpConfiguration(currentContent, nextContent);
    }

    throw new RuntimeError(
      GovernorErrorCode.STANDARDS_PACK_INVALID,
      this.localizeText(
        `adopt apply found conflicting multi-host projections for ${relativePath}.`,
        `adopt apply 检测到 ${relativePath} 存在冲突的多宿主投影。`,
      ),
      {
        relativePath,
      },
    );
  }

  private stringifyMergedMcpConfiguration(currentContent: string, nextContent: string): string {
    const currentPayload = JSON.parse(currentContent) as {
      mcpServers?: Record<string, Record<string, unknown>>;
    };
    const nextPayload = JSON.parse(nextContent) as {
      mcpServers?: Record<string, Record<string, unknown>>;
    };
    const mergedServerNames = new Set<string>([
      ...Object.keys(currentPayload.mcpServers ?? {}),
      ...Object.keys(nextPayload.mcpServers ?? {}),
    ]);
    const mergedServers: Record<string, Record<string, unknown>> = {};

    for (const serverName of mergedServerNames) {
      const currentServer = currentPayload.mcpServers?.[serverName] ?? {};
      const nextServer = nextPayload.mcpServers?.[serverName] ?? {};
      const mergedWorkflowIds = this.mergeStringLists(
        ...(Array.isArray(currentServer.workflowIds)
          ? [currentServer.workflowIds as string[]]
          : []),
        ...(Array.isArray(nextServer.workflowIds) ? [nextServer.workflowIds as string[]] : []),
      );
      const mergedHosts = this.mergeStringLists(
        ...(typeof currentServer.host === 'string' ? [[currentServer.host]] : []),
        ...(typeof nextServer.host === 'string' ? [[nextServer.host]] : []),
      );
      const mergedTargets = this.mergeStringLists(
        ...(typeof currentServer.target === 'string' ? [[currentServer.target]] : []),
        ...(typeof nextServer.target === 'string' ? [[nextServer.target]] : []),
      );
      const mergedModes = this.mergeStringLists(
        ...(typeof currentServer.mode === 'string' ? [[currentServer.mode]] : []),
        ...(typeof nextServer.mode === 'string' ? [[nextServer.mode]] : []),
      );

      mergedServers[serverName] = {
        ...currentServer,
        ...nextServer,
        ...(mergedWorkflowIds.length > 0 ? { workflowIds: mergedWorkflowIds } : {}),
        ...(mergedHosts.length > 0 ? { supportedHosts: mergedHosts } : {}),
        ...(mergedTargets.length > 0 ? { supportedTargets: mergedTargets } : {}),
        ...(mergedModes.length > 0 ? { supportedModes: mergedModes } : {}),
      };
    }

    return `${JSON.stringify({ mcpServers: mergedServers }, null, 2)}\n`;
  }

  private mergeStringLists(...lists: readonly string[][]): string[] {
    return [...new Set(lists.flat().filter((value) => value.length > 0))].sort((left, right) =>
      left.localeCompare(right),
    );
  }

  private async bootstrapSelfHostSurface(options: {
    repoRoot: string;
    definition: ResolvedAdoptionPackDefinition;
    profile: AdoptionPackProfile;
    existingReceipt: AdoptionPackInstallReceipt | null;
    force: boolean;
  }): Promise<{
    managedFileRecords: AdoptionPackManagedFileRecord[];
    writtenArtifacts: string[];
    checks: AdoptionPackVerificationCheck[];
  }> {
    const managedFileRecords: AdoptionPackManagedFileRecord[] = [];
    const writtenArtifacts: string[] = [];
    const runtimeBootstrapRecords = this.resolveRuntimeBootstrapRecords(
      options.definition,
      options.profile,
    );

    for (const runtimeBootstrapRecord of runtimeBootstrapRecords) {
      const absolutePath = resolve(options.repoRoot, runtimeBootstrapRecord.relativePath);
      await this.writeManagedTextFile({
        absolutePath,
        relativePath: runtimeBootstrapRecord.relativePath,
        content: runtimeBootstrapRecord.content,
        assetGroup: runtimeBootstrapRecord.assetGroup,
        existingReceipt: options.existingReceipt,
        force: options.force,
      });
      managedFileRecords.push(
        this.createManagedFileRecord(
          runtimeBootstrapRecord.relativePath,
          absolutePath,
          runtimeBootstrapRecord.assetGroup,
          runtimeBootstrapRecord.content,
        ),
      );
      writtenArtifacts.push(absolutePath);
    }

    const taskLedgerPath = resolve(
      options.repoRoot,
      '.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite',
    );
    await this.initializeTaskLedgerSqlite(taskLedgerPath);
    managedFileRecords.push(
      await this.createManagedFileRecordFromFile(
        '.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite',
        taskLedgerPath,
        AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
      ),
    );
    writtenArtifacts.push(taskLedgerPath);

    const artifactSqlitePath = resolve(
      options.repoRoot,
      '.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite',
    );
    await new SqliteArtifactIndexStore({
      databaseFilePath: artifactSqlitePath,
    }).dispose();
    const artifactMainViewPath = resolve(
      options.repoRoot,
      '.repo-ai-governor/context/artifact-registry/artifacts.csv',
    );
    const artifactArchiveViewPath = resolve(
      options.repoRoot,
      '.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv',
    );
    await this.writeTextFile(artifactMainViewPath, `${ARTIFACT_REGISTRY_HEADERS.join(',')}\n`);
    await this.writeTextFile(artifactArchiveViewPath, `${ARTIFACT_REGISTRY_HEADERS.join(',')}\n`);
    managedFileRecords.push(
      await this.createManagedFileRecordFromFile(
        '.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite',
        artifactSqlitePath,
        AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
      ),
      this.createManagedFileRecord(
        '.repo-ai-governor/context/artifact-registry/artifacts.csv',
        artifactMainViewPath,
        AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
        `${ARTIFACT_REGISTRY_HEADERS.join(',')}\n`,
      ),
      this.createManagedFileRecord(
        '.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv',
        artifactArchiveViewPath,
        AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
        `${ARTIFACT_REGISTRY_HEADERS.join(',')}\n`,
      ),
    );
    writtenArtifacts.push(artifactSqlitePath, artifactMainViewPath, artifactArchiveViewPath);

    return {
      managedFileRecords,
      writtenArtifacts,
      checks: [
        {
          checkId: 'self-host-bootstrap',
          status: HostVerificationStatus.PASS,
          detail: `self_host_assets=${managedFileRecords.length}`,
        },
      ],
    };
  }

  private async initializeTaskLedgerSqlite(databaseFilePath: string): Promise<void> {
    await mkdir(dirname(databaseFilePath), { recursive: true });
    const databaseConnection = new DatabaseSync(databaseFilePath);

    try {
      databaseConnection.exec('PRAGMA busy_timeout = 5000;');
      databaseConnection.exec('PRAGMA journal_mode = WAL;');
      databaseConnection.exec(`
        CREATE TABLE IF NOT EXISTS task_ledger_sources (
          source_path TEXT PRIMARY KEY,
          source_mtime_ms INTEGER NOT NULL,
          source_size INTEGER NOT NULL,
          row_count INTEGER NOT NULL,
          synced_at TEXT NOT NULL
        );
      `);
      databaseConnection.exec(`
        CREATE TABLE IF NOT EXISTS task_ledger_rows (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          source_path TEXT NOT NULL,
          source_row_number INTEGER NOT NULL,
          execution_id TEXT NOT NULL,
          task_id TEXT NOT NULL,
          title TEXT NOT NULL,
          owner TEXT NOT NULL,
          priority TEXT NOT NULL,
          due_date TEXT NOT NULL,
          status TEXT NOT NULL,
          project TEXT NOT NULL,
          sprint TEXT NOT NULL,
          plan TEXT NOT NULL,
          result TEXT NOT NULL,
          verify TEXT NOT NULL,
          review_delta TEXT NOT NULL,
          recorded_at TEXT NOT NULL,
          UNIQUE(source_path, source_row_number)
        );
      `);
      databaseConnection.exec(`
        CREATE INDEX IF NOT EXISTS idx_task_ledger_task_id
        ON task_ledger_rows(task_id, source_row_number);
      `);
      databaseConnection.exec(`
        CREATE INDEX IF NOT EXISTS idx_task_ledger_source
        ON task_ledger_rows(source_path, source_row_number);
      `);
      databaseConnection.exec(`
        CREATE INDEX IF NOT EXISTS idx_task_ledger_project_sprint
        ON task_ledger_rows(project, sprint, source_row_number);
      `);
    } finally {
      databaseConnection.close();
    }
  }

  private async buildDiffRecords(receipt: AdoptionPackInstallReceipt) {
    const diffRecords = [];
    for (const managedFileRecord of receipt.managedFileRecords) {
      if (!existsSync(managedFileRecord.absolutePath)) {
        diffRecords.push({
          relativePath: managedFileRecord.relativePath,
          assetGroup: managedFileRecord.assetGroup,
          diffKind: 'missing' as const,
          receiptChecksumSha256: managedFileRecord.checksumSha256,
          currentChecksumSha256: null,
        });
        continue;
      }

      const currentContent = await readFile(managedFileRecord.absolutePath);
      const currentChecksumSha256 = this.calculateSha256(currentContent);
      if (currentChecksumSha256 !== managedFileRecord.checksumSha256) {
        diffRecords.push({
          relativePath: managedFileRecord.relativePath,
          assetGroup: managedFileRecord.assetGroup,
          diffKind: 'changed' as const,
          receiptChecksumSha256: managedFileRecord.checksumSha256,
          currentChecksumSha256,
        });
      }
    }

    return diffRecords;
  }

  private async evaluateSelfHostReadiness(
    receipt: AdoptionPackInstallReceipt,
  ): Promise<SelfHostReadinessEvaluation> {
    if (
      receipt.appliedProfileId !== BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE ||
      receipt.workspaceMode !== WorkspaceMode.REPO_LOCAL
    ) {
      return {
        doctorChecks: [],
        verifyChecks: [],
      };
    }

    const definition = await this.adoptionPackRegistry.resolveDefinition(receipt.packId);
    const starterContentByRelativePath = this.buildStarterContentByRelativePath(definition);
    const sourceCatalogRecordBySurfaceId = new Map(
      definition.sourceCatalogRecords.map((record) => [record.surfaceId, record] as const),
    );
    const verifyChecks: AdoptionPackVerificationCheck[] = [];
    const doctorChecks: AdoptionPackVerificationCheck[] = [];
    const preflightBlockedGroups: string[] = [];
    const preflightBlockedPaths: string[] = [];

    for (const matrixRecord of definition.readinessMatrixRecords) {
      if (
        matrixRecord.applicabilityScope !== AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL ||
        (!matrixRecord.sinkIds.includes(AdoptionPackReadinessSink.ADOPT_VERIFY) &&
          !matrixRecord.sinkIds.includes(AdoptionPackReadinessSink.EXECUTION_PREFLIGHT))
      ) {
        continue;
      }

      const unresolvedPlaceholderPaths = await this.resolveUnresolvedSelfHostReadinessPaths({
        receipt,
        starterContentByRelativePath,
        sourceCatalogRecordBySurfaceId,
        surfaceIds: matrixRecord.surfaceIds,
      });
      const normalizedGroup = matrixRecord.readinessGroup;
      const unresolvedPlaceholderPathList = unresolvedPlaceholderPaths.join(',');

      if (matrixRecord.sinkIds.includes(AdoptionPackReadinessSink.ADOPT_VERIFY)) {
        verifyChecks.push({
          checkId: `${SELF_HOST_READINESS_CHECK_ID_PREFIX}:${normalizedGroup}`,
          status:
            unresolvedPlaceholderPaths.length > 0
              ? HostVerificationStatus.WARN
              : HostVerificationStatus.PASS,
          detail:
            unresolvedPlaceholderPaths.length > 0
              ? `readiness_group=${normalizedGroup} placeholder_paths=${unresolvedPlaceholderPathList}`
              : `readiness_group=${normalizedGroup} ready`,
          inspectedPath: unresolvedPlaceholderPaths[0] ?? undefined,
        });
      }

      if (matrixRecord.sinkIds.includes(AdoptionPackReadinessSink.DOCTOR_DIAGNOSTICS)) {
        doctorChecks.push({
          checkId: `${SELF_HOST_READINESS_CHECK_ID_PREFIX}:${normalizedGroup}`,
          status:
            unresolvedPlaceholderPaths.length > 0
              ? HostVerificationStatus.WARN
              : HostVerificationStatus.PASS,
          detail:
            unresolvedPlaceholderPaths.length > 0
              ? `readiness_group=${normalizedGroup} placeholder_paths=${unresolvedPlaceholderPathList}`
              : `readiness_group=${normalizedGroup} ready`,
          inspectedPath: unresolvedPlaceholderPaths[0] ?? undefined,
        });
      }

      if (
        matrixRecord.sinkIds.includes(AdoptionPackReadinessSink.EXECUTION_PREFLIGHT) &&
        unresolvedPlaceholderPaths.length > 0
      ) {
        preflightBlockedGroups.push(normalizedGroup);
        preflightBlockedPaths.push(...unresolvedPlaceholderPaths);
      }
    }

    const preflightSignalCheck = {
      checkId: SELF_HOST_EXECUTION_PREFLIGHT_SIGNAL_CHECK_ID,
      status:
        preflightBlockedGroups.length > 0
          ? HostVerificationStatus.WARN
          : HostVerificationStatus.PASS,
      detail:
        preflightBlockedGroups.length > 0
          ? `execution_preflight_signal=blocked enforcement=downstream_fail_closed blocked_groups=${[...new Set(preflightBlockedGroups)].join(',')} placeholder_paths=${[...new Set(preflightBlockedPaths)].join(',')}`
          : 'execution_preflight_signal=ready',
      inspectedPath: preflightBlockedPaths[0] ?? undefined,
    } satisfies AdoptionPackVerificationCheck;
    verifyChecks.push(preflightSignalCheck);
    doctorChecks.push({ ...preflightSignalCheck });

    return {
      doctorChecks,
      verifyChecks,
    };
  }

  private buildStarterContentByRelativePath(
    definition: ResolvedAdoptionPackDefinition,
  ): Map<string, string> {
    const starterContentByRelativePath = new Map<string, string>();

    for (const templateRecord of definition.templateRecords) {
      starterContentByRelativePath.set(templateRecord.relativePath, templateRecord.content);
    }

    for (const runtimeBootstrapRecord of definition.runtimeBootstrapRecords) {
      starterContentByRelativePath.set(
        runtimeBootstrapRecord.relativePath,
        runtimeBootstrapRecord.content,
      );
    }

    return starterContentByRelativePath;
  }

  private async resolveUnresolvedSelfHostReadinessPaths(options: {
    receipt: AdoptionPackInstallReceipt;
    starterContentByRelativePath: Map<string, string>;
    sourceCatalogRecordBySurfaceId: Map<
      string,
      ResolvedAdoptionPackDefinition['sourceCatalogRecords'][number]
    >;
    surfaceIds: string[];
  }): Promise<string[]> {
    const unresolvedPaths = new Set<string>();

    for (const surfaceId of options.surfaceIds) {
      const sourceCatalogRecord = options.sourceCatalogRecordBySurfaceId.get(surfaceId);
      const relativePath = sourceCatalogRecord?.relativePath;
      if (!relativePath) {
        continue;
      }

      const starterContent = options.starterContentByRelativePath.get(relativePath);
      if (!starterContent) {
        continue;
      }

      const absolutePath = resolve(options.receipt.targetRepoRoot, relativePath);
      const currentContent = await this.readTextIfExists(absolutePath);
      if (currentContent === null) {
        unresolvedPaths.add(relativePath);
        continue;
      }

      if (this.isSelfHostStarterPlaceholderContent(relativePath, currentContent, starterContent)) {
        unresolvedPaths.add(relativePath);
      }
    }

    return [...unresolvedPaths].sort((left, right) => left.localeCompare(right));
  }

  private isSelfHostStarterPlaceholderContent(
    relativePath: string,
    currentContent: string,
    starterContent: string,
  ): boolean {
    const normalizedCurrentContent = currentContent.trim();
    const normalizedStarterContent = starterContent.trim();
    if (normalizedCurrentContent === normalizedStarterContent) {
      return true;
    }

    const normalizedCurrentStarterSkeleton =
      this.normalizeSelfHostStarterPlaceholderSkeleton(currentContent);
    const normalizedStarterSkeleton =
      this.normalizeSelfHostStarterPlaceholderSkeleton(starterContent);
    if (normalizedCurrentStarterSkeleton === normalizedStarterSkeleton) {
      return true;
    }

    if (
      !relativePath.startsWith('.repo-ai-governor/context/') &&
      !relativePath.startsWith('.repo-ai-governor/normative_knowledge_sources/')
    ) {
      return false;
    }

    return SELF_HOST_STARTER_PLACEHOLDER_MARKERS.some((marker) =>
      normalizedCurrentContent.includes(marker),
    );
  }

  private normalizeSelfHostStarterPlaceholderSkeleton(content: string): string {
    return content
      .split(/\r?\n/u)
      .map((line) => line.trim())
      .filter((line) => line !== SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE)
      .map((line) => {
        if (line.startsWith('- Status: ')) {
          return '- Status: <placeholder>';
        }

        if (line.startsWith('- Date: ')) {
          return '- Date: <placeholder>';
        }

        if (line.startsWith('- Stream: `')) {
          return '- Stream: <placeholder>';
        }

        if (line.startsWith('- Project: `')) {
          return '- Project: <placeholder>';
        }

        if (line.startsWith('- Sprint: `')) {
          return '- Sprint: <placeholder>';
        }

        return line;
      })
      .join('\n')
      .replace(/\n{3,}/gu, '\n\n')
      .trim();
  }

  private async loadReceiptForOperation(
    options: CliAdoptCommandOptions,
  ): Promise<AdoptionPackInstallReceipt> {
    if (options.receiptPath) {
      return this.readInstallReceipt(resolve(this.currentWorkingDirectory, options.receiptPath));
    }

    const repoRoot = this.resolveRepoRoot(options.repoPath);
    const receipt = await this.readExistingReceipt(repoRoot, options.packSelector, true);
    if (!receipt) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'No installed adoption receipt was found for the target repository.',
          '目标仓库未找到已安装的 adoption receipt。',
        ),
        {
          repoRoot,
          packSelector: options.packSelector,
        },
      );
    }
    return receipt;
  }

  private async readExistingReceipt(
    repoRoot: string,
    packSelector: string | null,
    required = false,
  ): Promise<AdoptionPackInstallReceipt | null> {
    const receiptCandidates = await this.scanReceiptPaths(repoRoot);
    if (receiptCandidates.length === 0) {
      if (required) {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          this.localizeText(
            'No installed adoption receipt was found for the target repository.',
            '目标仓库未找到已安装的 adoption receipt。',
          ),
          {
            repoRoot,
          },
        );
      }
      return null;
    }

    if (packSelector) {
      const matchingReceiptPath = receiptCandidates.find((candidate) =>
        candidate.includes(this.slugify(packSelector)),
      );
      if (matchingReceiptPath) {
        return this.readInstallReceipt(matchingReceiptPath);
      }
    }

    if (receiptCandidates.length === 1) {
      return this.readInstallReceipt(receiptCandidates[0] as string);
    }

    if (required) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'Multiple adoption receipts exist; pass --receipt or a pack selector.',
          '存在多份 adoption receipt；请显式传入 --receipt 或 pack 选择器。',
        ),
        {
          repoRoot,
          receiptCandidates,
        },
      );
    }

    return null;
  }

  private async scanReceiptPaths(repoRoot: string): Promise<string[]> {
    const installationsRoot = resolve(
      repoRoot,
      ...DEFAULT_ADOPTION_METADATA_ROOT_SEGMENTS,
      'installations',
    );
    if (!existsSync(installationsRoot)) {
      return [];
    }

    const entries = await readdir(installationsRoot, { withFileTypes: true });
    const receiptPaths: string[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }

      const receiptPath = resolve(
        installationsRoot,
        entry.name,
        ADOPTION_INSTALL_RECEIPT_FILE_NAME,
      );
      if (existsSync(receiptPath)) {
        receiptPaths.push(receiptPath);
      }
    }

    return receiptPaths.sort((left, right) => left.localeCompare(right));
  }

  private resolveRenderer(host: HostDistributionHost, registry: StructuredWorkflowAssetRegistry) {
    switch (host) {
      case HostDistributionHost.CLAUDE_CODE:
        return new ClaudeCodeHostRenderer({
          registry,
          currentWorkingDirectory: this.currentWorkingDirectory,
        });
      case HostDistributionHost.GITHUB_COPILOT:
        return new GithubCopilotHostRenderer({
          registry,
          currentWorkingDirectory: this.currentWorkingDirectory,
        });
      default:
        return new CodexHostRenderer({
          registry,
          currentWorkingDirectory: this.currentWorkingDirectory,
        });
    }
  }

  private resolveHostForTarget(target: HostDistributionTarget): HostDistributionHost {
    if (target.startsWith('claude_code.')) {
      return HostDistributionHost.CLAUDE_CODE;
    }
    if (target.startsWith('github_copilot.')) {
      return HostDistributionHost.GITHUB_COPILOT;
    }
    return HostDistributionHost.CODEX;
  }

  private inferHostAssetGroup(relativePath: string): AdoptionPackManagedAssetGroup {
    if (relativePath.endsWith('.mcp.json') || relativePath.endsWith('mcp.json')) {
      return AdoptionPackManagedAssetGroup.MCP_BRIDGE;
    }
    if (relativePath.includes('/hooks/') || relativePath.endsWith('hooks.json')) {
      return AdoptionPackManagedAssetGroup.HOOKS;
    }
    if (relativePath.includes('/skills/')) {
      return AdoptionPackManagedAssetGroup.SKILLS;
    }
    if (relativePath.includes('/agents/') || relativePath.includes('/subagents/')) {
      return AdoptionPackManagedAssetGroup.AGENTS;
    }
    return AdoptionPackManagedAssetGroup.INSTRUCTIONS;
  }

  private async writeManagedTextFile(options: {
    absolutePath: string;
    relativePath: string;
    content: string;
    assetGroup: AdoptionPackManagedAssetGroup;
    existingReceipt: AdoptionPackInstallReceipt | null;
    force: boolean;
  }): Promise<void> {
    const currentContent = await this.readTextIfExists(options.absolutePath);
    if (currentContent !== null && currentContent !== options.content) {
      const existingManagedRecord = options.existingReceipt?.managedFileRecords.find(
        (record) => record.absolutePath === options.absolutePath,
      );
      const currentChecksumSha256 = this.calculateSha256(currentContent);
      if (!options.force) {
        if (
          existingManagedRecord &&
          currentChecksumSha256 === existingManagedRecord.checksumSha256
        ) {
          // Safe managed overwrite during upgrade/apply.
        } else if (existingManagedRecord) {
          throw new RuntimeError(
            GovernorErrorCode.STANDARDS_PACK_INVALID,
            this.localizeText(
              `Managed file drift detected before writing ${options.relativePath}.`,
              `写入 ${options.relativePath} 前检测到受管文件漂移。`,
            ),
            {
              relativePath: options.relativePath,
              assetGroup: options.assetGroup,
            },
          );
        } else {
          throw new RuntimeError(
            GovernorErrorCode.STANDARDS_PACK_INVALID,
            this.localizeText(
              `Refusing to overwrite existing unmanaged file ${options.relativePath}.`,
              `拒绝覆盖现有的未受管文件 ${options.relativePath}。`,
            ),
            {
              relativePath: options.relativePath,
              assetGroup: options.assetGroup,
            },
          );
        }
      }
    }

    await this.writeTextFile(options.absolutePath, options.content);
  }

  private async writeTextFile(filePath: string, content: string): Promise<void> {
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, content, 'utf8');
  }

  private async writeJsonFile(filePath: string, payload: unknown): Promise<void> {
    await this.writeTextFile(filePath, `${JSON.stringify(payload, null, 2)}\n`);
  }

  private async readTextIfExists(filePath: string): Promise<string | null> {
    if (!existsSync(filePath)) {
      return null;
    }

    return readFile(filePath, 'utf8');
  }

  private async readInstallReceipt(filePath: string): Promise<AdoptionPackInstallReceipt> {
    try {
      return this.normalizeInstallReceipt(
        await this.readJsonFile<AdoptionPackInstallReceipt>(filePath),
      );
    } catch (error) {
      if (error instanceof RuntimeError) {
        throw error;
      }

      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'Failed to read adoption install receipt.',
          '读取 adoption install receipt 失败。',
        ),
        {
          receiptPath: filePath,
        },
        error,
      );
    }
  }

  private async readJsonFile<T>(filePath: string): Promise<T> {
    return JSON.parse(await readFile(filePath, 'utf8')) as T;
  }

  private createDoctorReceiptFailureCheck(
    error: unknown,
    repoRoot: string,
  ): AdoptionPackVerificationCheck {
    const standardizedError = standardizeError(error);
    const receiptPath =
      standardizedError.details && typeof standardizedError.details.receiptPath === 'string'
        ? standardizedError.details.receiptPath
        : undefined;

    return {
      checkId: ADOPTION_RECEIPT_DIAGNOSTICS_CHECK_ID,
      status: HostVerificationStatus.FAIL,
      detail: [
        'receipt_state=invalid',
        `code=${standardizedError.code}`,
        `repo_root=${repoRoot}`,
        ...(receiptPath ? [`receipt=${receiptPath}`] : []),
        `message=${standardizedError.message}`,
      ].join(' '),
      inspectedPath: receiptPath,
    };
  }

  private normalizeInstallReceipt(receipt: AdoptionPackInstallReceipt): AdoptionPackInstallReceipt {
    const hostTargets = this.resolveReceiptHostTargets(receipt);
    const hostManifestPaths =
      receipt.hostManifestPaths && receipt.hostManifestPaths.length > 0
        ? [...receipt.hostManifestPaths]
        : receipt.hostManifestPath
          ? [receipt.hostManifestPath]
          : [];
    const hostApplyReportPaths =
      receipt.hostApplyReportPaths && receipt.hostApplyReportPaths.length > 0
        ? [...receipt.hostApplyReportPaths]
        : receipt.hostApplyReportPath
          ? [receipt.hostApplyReportPath]
          : [];

    return {
      ...receipt,
      hostTargets,
      hostTarget:
        receipt.hostTarget ?? hostTargets[0] ?? HostDistributionTarget.CODEX_PROJECT_LOCAL,
      hostManifestPaths,
      hostManifestPath: hostManifestPaths[0],
      hostApplyReportPaths,
      hostApplyReportPath: hostApplyReportPaths[0],
    };
  }

  private createManagedFileRecord(
    relativePath: string,
    absolutePath: string,
    assetGroup: AdoptionPackManagedAssetGroup,
    content: string | Uint8Array,
  ): AdoptionPackManagedFileRecord {
    return {
      relativePath: relativePath.replace(/\\/g, '/'),
      absolutePath,
      assetGroup,
      checksumSha256: this.calculateSha256(content),
      managed: true,
    };
  }

  private async createManagedFileRecordFromFile(
    relativePath: string,
    absolutePath: string,
    assetGroup: AdoptionPackManagedAssetGroup,
  ): Promise<AdoptionPackManagedFileRecord> {
    return this.createManagedFileRecord(
      relativePath,
      absolutePath,
      assetGroup,
      await readFile(absolutePath),
    );
  }

  private calculateSha256(content: string | Uint8Array): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private buildVerificationSummary(options: {
    receiptPath: string;
    verificationSummaryPath: string;
    checks: AdoptionPackVerificationCheck[];
  }): AdoptionPackVerificationSummary {
    const normalizedChecks = options.checks.length
      ? options.checks
      : [
          {
            checkId: 'verification',
            status: HostVerificationStatus.PASS,
            detail: 'verification=clean',
          },
        ];

    return {
      schemaVersion: 'adoption-pack-verification-summary-v1',
      status: this.reduceVerificationStatus(normalizedChecks),
      verifiedAt: new Date().toISOString(),
      verificationSummaryPath: options.verificationSummaryPath,
      receiptPath: options.receiptPath,
      checks: normalizedChecks,
      driftDetected: normalizedChecks.some((check) => check.status === HostVerificationStatus.FAIL),
    };
  }

  private reduceVerificationStatus(
    checks: readonly AdoptionPackVerificationCheck[],
  ): HostVerificationStatus {
    if (checks.some((check) => check.status === HostVerificationStatus.FAIL)) {
      return HostVerificationStatus.FAIL;
    }
    if (checks.some((check) => check.status === HostVerificationStatus.WARN)) {
      return HostVerificationStatus.WARN;
    }
    return HostVerificationStatus.PASS;
  }

  private deduplicateManagedFileRecords(
    managedFileRecords: AdoptionPackManagedFileRecord[],
  ): AdoptionPackManagedFileRecord[] {
    const byPath = new Map<string, AdoptionPackManagedFileRecord>();
    for (const managedFileRecord of managedFileRecords) {
      byPath.set(managedFileRecord.absolutePath, managedFileRecord);
    }

    return [...byPath.values()].sort((left, right) =>
      left.relativePath.localeCompare(right.relativePath),
    );
  }

  private slugify(value: string): string {
    return value.replace(/[^a-zA-Z0-9._-]+/g, '-');
  }

  private relativeFromRoot(filePath: string, repoRoot: string): string {
    const normalizedRepoRoot = resolve(repoRoot);
    const absolutePath = resolve(filePath);
    if (absolutePath.startsWith(normalizedRepoRoot)) {
      return absolutePath.slice(normalizedRepoRoot.length + 1).replace(/\\/g, '/');
    }
    return absolutePath.replace(/\\/g, '/');
  }
}
