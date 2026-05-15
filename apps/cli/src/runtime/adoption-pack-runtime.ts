import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { DatabaseSync } from 'node:sqlite';

import { ClaudeCodeHostRenderer } from '@repo-ai-governor/adapter-claude-code';
import { CodexHostRenderer } from '@repo-ai-governor/adapter-codex';
import { GithubCopilotHostRenderer } from '@repo-ai-governor/adapter-github-copilot';
import { SqliteArtifactIndexStore } from '@repo-ai-governor/artifact-registry';
import { ConfigLoader } from '@repo-ai-governor/config';
import {
  GovernorErrorCode,
  RuntimeError,
  WorkspaceMode,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  type AdoptionPackActivationPhaseRecord,
  AdoptionPackApplicabilityScope,
  type AdoptionPackDiffRecord,
  AdoptionPackDriftPolicy,
  AdoptionPackGitPolicy,
  type AdoptionPackInstallReceipt,
  AdoptionPackManagedAssetGroup,
  type AdoptionPackManagedFileRecord,
  AdoptionPackOwnershipClass,
  AdoptionPackPlaceholderPolicy,
  type AdoptionPackProfile,
  AdoptionPackReadinessGroup,
  AdoptionPackReadinessSink,
  AdoptionPackRegistry,
  type AdoptionPackRuntimeBootstrapRecord,
  type AdoptionPackSourceCatalogRecord,
  type AdoptionPackVerificationCheck,
  type AdoptionPackVerificationSummary,
  AdoptionPackWorkspaceModePolicy,
  BUILT_IN_ADOPTION_PACK_ID,
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
  resolveBuiltInAdoptionPackDefinition,
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

export interface AdoptionOperationResult {
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
  initManifestPath?: string | null;
  bootstrapDoctorDiagnosticsPath?: string | null;
  bootstrapSummaryPath?: string | null;
  selectorResolution?: string | null;
  reentryMode?: string | null;
  userFacingMessage?: string | null;
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
  activationPhase: AdoptionPackReadinessGroup;
  activationPhaseStatus: 'blocked' | 'in_progress' | 'completed';
  activationPhaseRecords: AdoptionPackActivationPhaseRecord[];
  operatorNextActions: string[];
  doctorChecks: AdoptionPackVerificationCheck[];
  verifyChecks: AdoptionPackVerificationCheck[];
  executionPreflightSignal: 'blocked' | 'ready';
  executionPreflightBlockedGroups: string[];
  executionPreflightPlaceholderPaths: string[];
}

export interface SelfHostExecutionPreflightResolution {
  repoRoot: string;
  installationId: string;
  packId: string;
  profileId: string;
  verificationSummaryPath: string;
  activationPhase?: AdoptionPackReadinessGroup;
  activationPhaseStatus?: 'blocked' | 'in_progress' | 'completed';
  executionPreflightSignal: 'blocked' | 'ready';
  blockedGroups: string[];
  placeholderPaths: string[];
  operatorNextActions: string[];
}

interface SelfHostConnectApplyReceiptSnapshot {
  applyId?: string;
  appliedConfigHash?: string;
  candidateFingerprintCurrent?: boolean;
  applyReady?: boolean;
  applyBlockers?: string[];
}

const ADOPTION_INSTALL_RECEIPT_FILE_NAME = 'adoption-install.receipt.json';
const ADOPTION_VERIFICATION_SUMMARY_FILE_NAME = 'adoption-verification.summary.json';
const ADOPTION_DIFF_REPORT_FILE_NAME = 'adoption-diff.report.json';
const ADOPTION_RECEIPT_DIAGNOSTICS_CHECK_ID = 'adoption-receipt-diagnostics';
const SELF_HOST_READINESS_CHECK_ID_PREFIX = 'self-host-readiness';
const SELF_HOST_EXECUTION_PREFLIGHT_SIGNAL_CHECK_ID = 'self-host-execution-preflight';
const SELF_HOST_CONNECT_APPLY_RECEIPTS_DIRECTORY_SEGMENTS = [
  '.repo-ai-governor',
  'context',
  'diagnostics',
  'connect',
  'apply',
] as const;
const SELF_HOST_REQUIRED_PLACEHOLDER_MARKER = 'replace_before_execution';
const SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE = `- Placeholder Status: ${SELF_HOST_REQUIRED_PLACEHOLDER_MARKER}`;
const SELF_HOST_GITIGNORE_RECOMMENDATION_FILE_NAME = 'self-host.gitignore-recommendation.txt';
const SELF_HOST_STARTER_PLACEHOLDER_MARKERS = [
  SELF_HOST_REQUIRED_PLACEHOLDER_STATUS_LINE,
  'project-template',
  'sprint-template',
  'self-host-template',
  '- Stream: `none`',
] as const;
const SELF_HOST_GENERATED_IGNORE_PATHS = [
  '.repo-ai-governor/context/diagnostics/',
  '.repo-ai-governor/context/reports/',
  '.repo-ai-governor/context/replay/',
  '.repo-ai-governor/context/compiled-ir/',
  '*.sqlite-wal',
  '*.sqlite-shm',
  'node_modules/',
] as const;
const SELF_HOST_OPERATOR_ACTION_ANCHOR_LIMIT = 3;
const SELF_HOST_OPERATOR_ACTION_PRIORITY_PATHS = [
  '.repo-ai-governor/context/current-context.md',
  '.repo-ai-governor/context/dev/project-template/plan.md',
  '.repo-ai-governor/context/dev/project-template/sprint-template/plan.md',
  '.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md',
  '.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md',
  '.repo-ai-governor/context/technical-solution-delivery-registry.yaml',
  '.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml',
  '.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml',
] as const;
const SELF_HOST_ACTIVATION_PHASE_ORDER = [
  AdoptionPackReadinessGroup.TEMPLATE_SEEDED,
  AdoptionPackReadinessGroup.AUTHORING_STARTED,
  AdoptionPackReadinessGroup.ADAPTER_CONNECTED,
  AdoptionPackReadinessGroup.EXECUTION_READY,
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
const TASK_LEDGER_TEMPLATE_SOURCE_RELATIVE_PATH =
  '.repo-ai-governor/context/dev/project-template/sprint-template/tasks/tasks.csv';
const TASK_LEDGER_REQUIRED_HEADERS = [
  'execution_id',
  'task_id',
  'title',
  'owner',
  'priority',
  'due_date',
  'status',
  'project',
  'sprint',
  'plan',
  'result',
  'verify',
  'review_delta',
  'recorded_at',
] as const;
type TaskLedgerSeedRow = Record<(typeof TASK_LEDGER_REQUIRED_HEADERS)[number], string> & {
  __rowNumber: number;
};

/**
 * Orchestrates high-level adoption-pack resolution, materialization, and lifecycle checks.
 */
export class CliAdoptionPackRuntime {
  private readonly adoptionPackRegistry: AdoptionPackRegistry;
  private readonly configLoader: ConfigLoader;

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
    this.configLoader = new ConfigLoader();
  }

  /**
   * Resolves one explicit install selection using pack-id first, then unique profile-id fallback.
   * @param options Normalized adopt command options.
   * @returns Resolved definition/profile pair plus selector-resolution metadata.
   */
  public async resolveInstallSelection(options: CliAdoptCommandOptions): Promise<{
    definition: ResolvedAdoptionPackDefinition;
    profile: AdoptionPackProfile;
    selectorResolution: 'explicit_pack' | 'explicit_profile_alias';
  }> {
    return this.resolveExplicitInstallSelection(options);
  }

  /**
   * Resolves bootstrap install selection, defaulting omitted selectors to the official built-in pack.
   * @param options Normalized adopt command options.
   * @returns Resolved definition/profile pair plus selector-resolution metadata.
   */
  public async resolveBootstrapSelection(options: CliAdoptCommandOptions): Promise<{
    definition: ResolvedAdoptionPackDefinition;
    profile: AdoptionPackProfile;
    selectorResolution: 'default_built_in' | 'explicit_pack' | 'explicit_profile_alias';
  }> {
    if (options.packSelector) {
      return this.resolveExplicitInstallSelection(options);
    }

    const builtInDefinition = resolveBuiltInAdoptionPackDefinition(BUILT_IN_ADOPTION_PACK_ID);
    if (!builtInDefinition) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'The official built-in adoption pack is unavailable for bootstrap defaulting.',
          '官方内置 adoption pack 不可用，无法作为 bootstrap 的默认选择。',
        ),
        {
          packId: BUILT_IN_ADOPTION_PACK_ID,
        },
      );
    }

    return {
      definition: builtInDefinition,
      profile: this.resolveProfile(builtInDefinition, options.adoptionProfileId, null),
      selectorResolution: 'default_built_in',
    };
  }

  /**
   * Resolves the effective workspace mode for one selected adoption profile.
   * @param profile Resolved adoption profile.
   * @param requestedWorkspaceMode Optional CLI override.
   * @returns Effective workspace mode after policy enforcement.
   */
  public resolveEffectiveWorkspaceMode(
    profile: AdoptionPackProfile,
    requestedWorkspaceMode: WorkspaceMode | null,
  ): WorkspaceMode {
    return this.resolveWorkspaceMode(profile, requestedWorkspaceMode, true);
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
    const resolvedTarget = await this.resolveInstallTarget(options);
    return this.applyResolvedTarget(options, resolvedTarget);
  }

  /**
   * Applies one pre-resolved adoption target into the target repository.
   * @param options Normalized adopt command options.
   * @param resolvedTarget Definition/profile pair chosen by selector resolution.
   * @returns Canonical adoption operation result.
   */
  public async applyResolvedTarget(
    options: CliAdoptCommandOptions,
    resolvedTarget: ResolvedInstallTarget,
  ): Promise<AdoptionOperationResult> {
    const repoRoot = this.resolveRepoRoot(options.repoPath);
    return this.applyResolvedInstallTarget(options, repoRoot, resolvedTarget);
  }

  private async applyResolvedInstallTarget(
    options: CliAdoptCommandOptions,
    repoRoot: string,
    resolvedTarget: ResolvedInstallTarget,
  ): Promise<AdoptionOperationResult> {
    const existingReceipt = await this.readExistingReceipt(
      repoRoot,
      options.packSelector ?? resolvedTarget.definition.manifest.packId,
    );
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
    const sourceCatalogRecordByRelativePath = this.buildSourceCatalogRecordByRelativePath(
      resolvedTarget.definition,
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
        sourceCatalogRecordByRelativePath,
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
          sourceCatalogRecordByRelativePath.get(templateRecord.relativePath),
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
        sourceCatalogRecordByRelativePath,
      });
      managedFileRecords.push(...bootstrapResult.managedFileRecords);
      checks.push(...bootstrapResult.checks);
      writtenArtifacts.push(...bootstrapResult.writtenArtifacts);
      const gitignoreRecommendationPath =
        await this.writeSelfHostGitignoreRecommendation(installationRoot);
      writtenArtifacts.push(gitignoreRecommendationPath);
      checks.push({
        checkId: 'self-host-generated-artifact-git-policy',
        status: HostVerificationStatus.PASS,
        detail: `gitignore_recommendation=${gitignoreRecommendationPath}`,
        inspectedPath: gitignoreRecommendationPath,
      });
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
      activationPhase:
        resolvedTarget.profile.profileId === BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE
          ? AdoptionPackReadinessGroup.TEMPLATE_SEEDED
          : undefined,
      activationPhaseStatus:
        resolvedTarget.profile.profileId === BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE
          ? 'in_progress'
          : undefined,
      activationPhaseRecords:
        resolvedTarget.profile.profileId === BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE
          ? [
              {
                phaseId: AdoptionPackReadinessGroup.TEMPLATE_SEEDED,
                status: 'in_progress',
                blockingReasons: [],
                placeholderPaths: [],
                nextActions: [
                  'Run `repo-ai-governor adopt verify --repo .` after bootstrap/apply to publish the canonical self-host activation verdict.',
                ],
              },
            ]
          : undefined,
      operatorNextActions:
        resolvedTarget.profile.profileId === BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE
          ? [
              'Run `repo-ai-governor adopt verify --repo .` after bootstrap/apply to publish the canonical self-host activation verdict.',
            ]
          : undefined,
      executionPreflightSignal:
        resolvedTarget.profile.profileId === BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE
          ? 'blocked'
          : undefined,
      executionPreflightBlockedGroups:
        resolvedTarget.profile.profileId === BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE
          ? [AdoptionPackReadinessGroup.TEMPLATE_SEEDED]
          : undefined,
      executionPreflightPlaceholderPaths: [],
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
        ...(record.receiptChecksumSha256 ? { expectedValue: record.receiptChecksumSha256 } : {}),
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
        ...(record.receiptChecksumSha256 ? { expectedValue: record.receiptChecksumSha256 } : {}),
        actualValue: record.currentChecksumSha256 ?? 'missing',
      })),
    );

    const verificationSummary = this.buildVerificationSummary({
      receiptPath: receipt.receiptPath,
      verificationSummaryPath: receipt.verificationSummary.verificationSummaryPath,
      checks,
      activationPhase: selfHostReadiness.activationPhase,
      activationPhaseStatus: selfHostReadiness.activationPhaseStatus,
      activationPhaseRecords: selfHostReadiness.activationPhaseRecords,
      operatorNextActions: selfHostReadiness.operatorNextActions,
      executionPreflightSignal: selfHostReadiness.executionPreflightSignal,
      executionPreflightBlockedGroups: selfHostReadiness.executionPreflightBlockedGroups,
      executionPreflightPlaceholderPaths: selfHostReadiness.executionPreflightPlaceholderPaths,
    });
    const updatedReceipt: AdoptionPackInstallReceipt = {
      ...receipt,
      verificationSummary,
      lastUpdatedAt: new Date().toISOString(),
    };
    await this.writeJsonFile(receipt.receiptPath, updatedReceipt);
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
      const canonicalSummary = await this.readCanonicalVerificationSummary(receipt);
      return this.buildDoctorReadinessChecksFromCanonicalSummary(
        canonicalSummary,
        selfHostReadiness,
      );
    } catch (error) {
      return [this.createDoctorReceiptFailureCheck(error, repoRoot)];
    }
  }

  /**
   * Collects broader-audit readiness checks for `check` while preserving verify as the only
   * canonical activation-phase producer.
   */
  public async collectCheckReadinessChecks(options?: {
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
      const canonicalSummary = await this.readCanonicalVerificationSummary(receipt);
      return this.buildCheckReadinessChecksFromCanonicalSummary(canonicalSummary);
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
    const recoveryRequiredDiffRecords = diffRecords.filter((record) =>
      this.requiresExplicitUpgradeRecovery(record),
    );
    if (recoveryRequiredDiffRecords.length > 0) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          `adopt upgrade refused because canonical runtime files are missing and require explicit recovery: ${recoveryRequiredDiffRecords.map((record) => record.relativePath).join(', ')}.`,
          `adopt upgrade 已拒绝，因为缺失的 canonical runtime 文件需要显式恢复：${recoveryRequiredDiffRecords.map((record) => record.relativePath).join(', ')}。`,
        ),
        {
          receiptPath: receipt.receiptPath,
          diffCount: recoveryRequiredDiffRecords.length,
        },
      );
    }
    const blockingDiffRecords = diffRecords.filter((record) =>
      this.blocksUpgradeWithoutForce(record),
    );
    if (blockingDiffRecords.length > 0 && !options.force) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'adopt upgrade refused because managed files drifted; rerun with --force after review.',
          'adopt upgrade 已拒绝，因为受管文件已经漂移；确认后可使用 --force 重试。',
        ),
        {
          receiptPath: receipt.receiptPath,
          diffCount: blockingDiffRecords.length,
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
    const removableRecords = await this.resolveRemovableManagedFileRecords(receipt);
    const blockingDiffRecords = diffRecords.filter((record) =>
      removableRecords.some(
        (managedFileRecord) => managedFileRecord.relativePath === record.relativePath,
      ),
    );
    if (blockingDiffRecords.length > 0 || !options.force) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          'adopt remove requires --force and fails closed when managed files drift.',
          'adopt remove 需要显式 --force，且在受管文件漂移时默认 fail-closed。',
        ),
        {
          receiptPath: receipt.receiptPath,
          diffCount: blockingDiffRecords.length,
        },
      );
    }

    for (const managedFileRecord of removableRecords) {
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
          detail: `removed_files=${removableRecords.length}`,
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

    const resolvedSelection = await this.resolveExplicitInstallSelection(options);
    return {
      definition: resolvedSelection.definition,
      profile: resolvedSelection.profile,
    };
  }

  private async resolveExplicitInstallSelection(options: CliAdoptCommandOptions): Promise<{
    definition: ResolvedAdoptionPackDefinition;
    profile: AdoptionPackProfile;
    selectorResolution: 'explicit_pack' | 'explicit_profile_alias';
  }> {
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
        selectorResolution: 'explicit_pack',
      };
    } catch (error) {
      const manifests = await this.adoptionPackRegistry.list();
      const matchingManifests = manifests.filter((candidate) =>
        candidate.profiles.some((profile) => profile.profileId === options.packSelector),
      );
      if (matchingManifests.length === 0) {
        throw error;
      }

      if (matchingManifests.length > 1) {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          this.localizeText(
            `Pack selector "${options.packSelector}" is ambiguous across multiple adoption packs; use an explicit pack id.`,
            `pack 选择器 "${options.packSelector}" 同时命中多个 adoption pack；请改用显式 pack id。`,
          ),
          {
            selector: options.packSelector,
            matchingPackIds: matchingManifests.map((manifest) => manifest.packId),
          },
        );
      }

      const manifest = matchingManifests[0] as (typeof matchingManifests)[number];
      const definition = await this.adoptionPackRegistry.resolveDefinition(manifest.packId);
      return {
        definition,
        profile: this.resolveProfile(definition, options.adoptionProfileId, options.packSelector),
        selectorResolution: 'explicit_profile_alias',
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

  private buildSourceCatalogRecordByRelativePath(
    definition: ResolvedAdoptionPackDefinition,
  ): Map<string, AdoptionPackSourceCatalogRecord> {
    const records = definition.sourceCatalogRecords
      .filter((record) => typeof record.relativePath === 'string' && record.relativePath.length > 0)
      .sort((left, right) => left.surfaceId.localeCompare(right.surfaceId));
    return new Map(records.map((record) => [record.relativePath as string, record] as const));
  }

  private async writeSelfHostGitignoreRecommendation(installationRoot: string): Promise<string> {
    const recommendationPath = resolve(
      installationRoot,
      SELF_HOST_GITIGNORE_RECOMMENDATION_FILE_NAME,
    );
    const content = [
      this.localizeText(
        '# Self-host generated artifact ignore recommendation',
        '# 自托管生成产物忽略建议',
      ),
      this.localizeText(
        '# Opt in by copying the paths below into your repository root .gitignore if desired.',
        '# 如有需要，可将以下路径复制到仓库根目录 .gitignore 中按需启用。',
      ),
      ...SELF_HOST_GENERATED_IGNORE_PATHS,
      '',
    ].join('\n');
    await this.writeTextFile(recommendationPath, content);
    return recommendationPath;
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
    sourceCatalogRecordByRelativePath: Map<string, AdoptionPackSourceCatalogRecord>;
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
      options.sourceCatalogRecordByRelativePath,
      options.profile.profileId === BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE,
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
        const persistedContent = await this.writeManagedTextFile({
          absolutePath,
          relativePath: projectedFile.relativePath,
          content: resolvedContent,
          assetGroup: this.inferHostAssetGroup(projectedFile.relativePath),
          existingReceipt,
          force,
        });
        sessionManagedFileContentByPath.set(absolutePath, persistedContent);
      } else if (resolvedContent !== existingSessionContent) {
        await this.writeTextFile(absolutePath, resolvedContent);
        sessionManagedFileContentByPath.set(absolutePath, resolvedContent);
      } else {
        sessionManagedFileContentByPath.set(absolutePath, existingSessionContent);
      }
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
    sourceCatalogRecordByRelativePath: Map<string, AdoptionPackSourceCatalogRecord>,
    treatAgentsAsStarterEditable = false,
  ): AdoptionPackManagedFileRecord[] {
    return [
      ...appliedProjectedFiles.map((projectedFile) =>
        this.createManagedFileRecord(
          projectedFile.relativePath,
          resolve(repoRoot, projectedFile.relativePath),
          this.inferHostAssetGroup(projectedFile.relativePath),
          projectedFile.content,
          this.resolveProjectedFileSourceCatalogRecord(
            projectedFile.relativePath,
            sourceCatalogRecordByRelativePath,
            treatAgentsAsStarterEditable,
          ),
        ),
      ),
      this.createManagedFileRecord(
        this.relativeFromRoot(rendered.exportManifest.exportManifestPath, repoRoot),
        rendered.exportManifest.exportManifestPath,
        AdoptionPackManagedAssetGroup.RUNTIME_HANDOFF_METADATA,
        `${JSON.stringify(rendered.exportManifest, null, 2)}\n`,
        undefined,
      ),
      this.createManagedFileRecord(
        this.relativeFromRoot(rendered.verificationSummary.verificationSummaryPath, repoRoot),
        rendered.verificationSummary.verificationSummaryPath,
        AdoptionPackManagedAssetGroup.RUNTIME_HANDOFF_METADATA,
        `${JSON.stringify(rendered.verificationSummary, null, 2)}\n`,
        undefined,
      ),
      ...(rendered.applyReport
        ? [
            this.createManagedFileRecord(
              this.relativeFromRoot(rendered.applyReport.applyReportPath, repoRoot),
              rendered.applyReport.applyReportPath,
              AdoptionPackManagedAssetGroup.RUNTIME_HANDOFF_METADATA,
              `${JSON.stringify(rendered.applyReport, null, 2)}\n`,
              undefined,
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
    sourceCatalogRecordByRelativePath: Map<string, AdoptionPackSourceCatalogRecord>;
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
          options.sourceCatalogRecordByRelativePath.get(runtimeBootstrapRecord.relativePath),
        ),
      );
      writtenArtifacts.push(absolutePath);
    }

    const taskLedgerPath = resolve(
      options.repoRoot,
      '.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite',
    );
    await this.initializeTaskLedgerSqlite(taskLedgerPath);
    await this.seedTaskLedgerCanonicalTemplateSource({
      repoRoot: options.repoRoot,
      databaseFilePath: taskLedgerPath,
    });
    managedFileRecords.push(
      await this.createManagedFileRecordFromFile(
        '.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite',
        taskLedgerPath,
        AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
        options.sourceCatalogRecordByRelativePath.get(
          '.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite',
        ),
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
        options.sourceCatalogRecordByRelativePath.get(
          '.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite',
        ),
      ),
      this.createManagedFileRecord(
        '.repo-ai-governor/context/artifact-registry/artifacts.csv',
        artifactMainViewPath,
        AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
        `${ARTIFACT_REGISTRY_HEADERS.join(',')}\n`,
        options.sourceCatalogRecordByRelativePath.get(
          '.repo-ai-governor/context/artifact-registry/artifacts.csv',
        ),
      ),
      this.createManagedFileRecord(
        '.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv',
        artifactArchiveViewPath,
        AdoptionPackManagedAssetGroup.SQLITE_REGISTRIES,
        `${ARTIFACT_REGISTRY_HEADERS.join(',')}\n`,
        options.sourceCatalogRecordByRelativePath.get(
          '.repo-ai-governor/context/artifact-registry/archive/artifacts.archive.csv',
        ),
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

  private async seedTaskLedgerCanonicalTemplateSource(options: {
    repoRoot: string;
    databaseFilePath: string;
  }): Promise<void> {
    const taskCsvPath = resolve(options.repoRoot, TASK_LEDGER_TEMPLATE_SOURCE_RELATIVE_PATH);
    if (!existsSync(taskCsvPath)) {
      return;
    }

    const csvContent = await readFile(taskCsvPath, 'utf8');
    const parsedRows = this.parseTaskLedgerCsvRows(csvContent, taskCsvPath);
    const taskCsvStat = await stat(taskCsvPath);
    const databaseConnection = new DatabaseSync(options.databaseFilePath);

    try {
      databaseConnection.exec('PRAGMA busy_timeout = 5000;');
      databaseConnection.exec('BEGIN IMMEDIATE TRANSACTION');
      databaseConnection
        .prepare('DELETE FROM task_ledger_rows WHERE source_path = ?')
        .run(taskCsvPath);
      databaseConnection
        .prepare('DELETE FROM task_ledger_sources WHERE source_path = ?')
        .run(taskCsvPath);
      databaseConnection
        .prepare(
          `
            INSERT INTO task_ledger_sources (
              source_path,
              source_mtime_ms,
              source_size,
              row_count,
              synced_at
            ) VALUES (?, ?, ?, ?, ?)
          `,
        )
        .run(
          taskCsvPath,
          Math.trunc(taskCsvStat.mtimeMs),
          taskCsvStat.size,
          parsedRows.length,
          new Date().toISOString(),
        );

      const insertRowStatement = databaseConnection.prepare(
        `
          INSERT INTO task_ledger_rows (
            source_path,
            source_row_number,
            execution_id,
            task_id,
            title,
            owner,
            priority,
            due_date,
            status,
            project,
            sprint,
            plan,
            result,
            verify,
            review_delta,
            recorded_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `,
      );

      for (const row of parsedRows) {
        insertRowStatement.run(
          taskCsvPath,
          row.__rowNumber,
          row.execution_id,
          row.task_id,
          row.title,
          row.owner,
          row.priority,
          row.due_date,
          row.status,
          row.project,
          row.sprint,
          row.plan,
          row.result,
          row.verify,
          row.review_delta,
          row.recorded_at,
        );
      }

      databaseConnection.exec('COMMIT');
    } catch (error) {
      try {
        databaseConnection.exec('ROLLBACK');
      } catch {
        // Keep original failure visible.
      }
      throw standardizeError(error);
    } finally {
      databaseConnection.close();
    }
  }

  private parseTaskLedgerCsvRows(csvContent: string, csvPath: string): TaskLedgerSeedRow[] {
    const csvLines = csvContent
      .split(/\r?\n/u)
      .map((line) => line.trimEnd())
      .filter((line) => line.trim().length > 0);
    if (csvLines.length === 0) {
      return [];
    }

    const headers = this.parseTaskLedgerCsvLine(csvLines[0]).map((cell) => cell.trim());
    for (const requiredHeader of TASK_LEDGER_REQUIRED_HEADERS) {
      if (!headers.includes(requiredHeader)) {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          this.localizeText(
            `Self-host task-ledger template is missing required column "${requiredHeader}".`,
            `self-host task-ledger 模板缺少必填列 "${requiredHeader}"。`,
          ),
          {
            csvPath,
            requiredHeader,
          },
        );
      }
    }

    return csvLines.slice(1).map((line, index) => {
      const values = this.parseTaskLedgerCsvLine(line);
      if (values.length !== headers.length) {
        throw new RuntimeError(
          GovernorErrorCode.STANDARDS_PACK_INVALID,
          this.localizeText(
            `Self-host task-ledger template row has ${values.length} columns, expected ${headers.length}.`,
            `self-host task-ledger 模板行列数不匹配：当前 ${values.length} 列，预期 ${headers.length} 列。`,
          ),
          {
            csvPath,
            rowNumber: index + 2,
          },
        );
      }

      const row = {
        __rowNumber: index + 2,
      } as TaskLedgerSeedRow;
      for (let headerIndex = 0; headerIndex < headers.length; headerIndex += 1) {
        const header = headers[headerIndex];
        if (this.isTaskLedgerRequiredHeader(header)) {
          row[header] = String(values[headerIndex] ?? '').trim();
        }
      }
      return row;
    });
  }

  private parseTaskLedgerCsvLine(line: string): string[] {
    const values: string[] = [];
    let currentValue = '';
    let inQuotes = false;

    for (let index = 0; index < line.length; index += 1) {
      const character = line[index];

      if (character === '"') {
        const nextCharacter = line[index + 1];
        if (inQuotes && nextCharacter === '"') {
          currentValue += '"';
          index += 1;
          continue;
        }

        inQuotes = !inQuotes;
        continue;
      }

      if (character === ',' && !inQuotes) {
        values.push(currentValue);
        currentValue = '';
        continue;
      }

      currentValue += character;
    }

    values.push(currentValue);
    return values;
  }

  private isTaskLedgerRequiredHeader(
    header: string,
  ): header is (typeof TASK_LEDGER_REQUIRED_HEADERS)[number] {
    return TASK_LEDGER_REQUIRED_HEADERS.includes(
      header as (typeof TASK_LEDGER_REQUIRED_HEADERS)[number],
    );
  }

  private async buildDiffRecords(receipt: AdoptionPackInstallReceipt) {
    const diffRecords: AdoptionPackDiffRecord[] = [];
    for (const managedFileRecord of receipt.managedFileRecords) {
      const baselineChecksum = this.resolveManagedRecordBaselineChecksum(managedFileRecord);

      if (!existsSync(managedFileRecord.absolutePath)) {
        if (!this.shouldReportMissingManagedFile(managedFileRecord)) {
          continue;
        }
        diffRecords.push({
          relativePath: managedFileRecord.relativePath,
          assetGroup: managedFileRecord.assetGroup,
          ownershipClass: managedFileRecord.ownershipClass,
          driftPolicy: managedFileRecord.driftPolicy,
          diffKind: 'missing' as const,
          receiptChecksumSha256: baselineChecksum,
          currentChecksumSha256: null,
        });
        continue;
      }

      if (managedFileRecord.driftPolicy !== AdoptionPackDriftPolicy.ENFORCE_CHECKSUM) {
        continue;
      }

      const currentContent = await readFile(managedFileRecord.absolutePath);
      const currentChecksumSha256 = this.calculateSha256(currentContent);
      if (!baselineChecksum) {
        continue;
      }

      if (currentChecksumSha256 !== baselineChecksum) {
        diffRecords.push({
          relativePath: managedFileRecord.relativePath,
          assetGroup: managedFileRecord.assetGroup,
          ownershipClass: managedFileRecord.ownershipClass,
          driftPolicy: managedFileRecord.driftPolicy,
          diffKind: 'changed' as const,
          receiptChecksumSha256: baselineChecksum,
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
        activationPhase: AdoptionPackReadinessGroup.NONE,
        activationPhaseStatus: 'completed',
        activationPhaseRecords: [],
        operatorNextActions: [],
        doctorChecks: [],
        verifyChecks: [],
        executionPreflightSignal: 'ready',
        executionPreflightBlockedGroups: [],
        executionPreflightPlaceholderPaths: [],
      };
    }

    const definition = await this.adoptionPackRegistry.resolveDefinition(receipt.packId);
    const starterContentByRelativePath = this.buildStarterContentByRelativePath(definition);
    const sourceCatalogRecordBySurfaceId = new Map(
      definition.sourceCatalogRecords.map((record) => [record.surfaceId, record] as const),
    );
    const verifyChecks: AdoptionPackVerificationCheck[] = [];
    const doctorChecks: AdoptionPackVerificationCheck[] = [];
    const activationPhaseRecords: AdoptionPackActivationPhaseRecord[] = [];
    const preflightBlockedGroups: string[] = [];
    const preflightBlockedPaths: string[] = [];
    const connectApplyReceiptStatus = await this.readSelfHostConnectApplyReceiptStatus(
      receipt.targetRepoRoot,
    );
    for (const phaseId of SELF_HOST_ACTIVATION_PHASE_ORDER) {
      const matrixRecord = definition.readinessMatrixRecords.find(
        (record) =>
          record.readinessGroup === phaseId &&
          record.applicabilityScope === AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
      );
      if (!matrixRecord) {
        continue;
      }

      const normalizedGroup = matrixRecord.readinessGroup;
      const unresolvedPlaceholderPaths =
        normalizedGroup === AdoptionPackReadinessGroup.TEMPLATE_SEEDED
          ? await this.resolveMissingSelfHostReadinessPaths({
              receipt,
              sourceCatalogRecordBySurfaceId,
              surfaceIds: matrixRecord.surfaceIds,
            })
          : await this.resolveUnresolvedSelfHostReadinessPaths({
              receipt,
              starterContentByRelativePath,
              sourceCatalogRecordBySurfaceId,
              surfaceIds:
                normalizedGroup === AdoptionPackReadinessGroup.EXECUTION_READY
                  ? matrixRecord.surfaceIds.filter(
                      (surfaceId) =>
                        sourceCatalogRecordBySurfaceId.get(surfaceId)?.relativePath !==
                        '.repo-ai-governor/governor.yaml',
                    )
                  : matrixRecord.surfaceIds,
            });
      const blockingReasons: string[] = [];
      if (unresolvedPlaceholderPaths.length > 0) {
        blockingReasons.push('placeholder_paths_unresolved');
      }
      if (
        normalizedGroup === AdoptionPackReadinessGroup.ADAPTER_CONNECTED &&
        !connectApplyReceiptStatus.isCurrent
      ) {
        blockingReasons.push('connect_apply_not_recorded');
      }
      const phaseStatus = this.resolveSelfHostActivationPhaseStatus({
        phaseId: normalizedGroup,
        unresolvedPlaceholderPaths,
        connectApplyReceiptAvailable: connectApplyReceiptStatus.isCurrent,
        activationPhaseRecords,
      });
      const nextActions = this.buildSelfHostActivationNextActions({
        phaseId: normalizedGroup,
        phaseStatus,
        unresolvedPlaceholderPaths,
        connectApplyReceiptAvailable: connectApplyReceiptStatus.isCurrent,
      });
      activationPhaseRecords.push({
        phaseId: normalizedGroup,
        status: phaseStatus,
        blockingReasons,
        placeholderPaths: unresolvedPlaceholderPaths,
        nextActions,
      });

      if (matrixRecord.sinkIds.includes(AdoptionPackReadinessSink.ADOPT_VERIFY)) {
        verifyChecks.push({
          checkId: `${SELF_HOST_READINESS_CHECK_ID_PREFIX}:${normalizedGroup}`,
          status: this.toReadinessCheckStatus(phaseStatus),
          detail: this.buildSelfHostPhaseCheckDetail({
            phaseId: normalizedGroup,
            phaseStatus,
            blockingReasons,
            placeholderPaths: unresolvedPlaceholderPaths,
            audience: 'verify',
          }),
          inspectedPath: unresolvedPlaceholderPaths[0] ?? undefined,
        });
      }

      if (matrixRecord.sinkIds.includes(AdoptionPackReadinessSink.DOCTOR_DIAGNOSTICS)) {
        doctorChecks.push({
          checkId: `${SELF_HOST_READINESS_CHECK_ID_PREFIX}:${normalizedGroup}`,
          status: this.toReadinessCheckStatus(phaseStatus),
          detail: this.buildSelfHostPhaseCheckDetail({
            phaseId: normalizedGroup,
            phaseStatus,
            blockingReasons,
            placeholderPaths: unresolvedPlaceholderPaths,
            audience: 'doctor',
          }),
          inspectedPath: unresolvedPlaceholderPaths[0] ?? undefined,
        });
      }

      if (
        matrixRecord.sinkIds.includes(AdoptionPackReadinessSink.EXECUTION_PREFLIGHT) &&
        phaseStatus !== 'completed'
      ) {
        preflightBlockedGroups.push(normalizedGroup);
        preflightBlockedPaths.push(...unresolvedPlaceholderPaths);
      }
    }

    const activationPhase = this.resolveCurrentSelfHostActivationPhase(activationPhaseRecords);
    const activationPhaseStatus =
      activationPhaseRecords.find((record) => record.phaseId === activationPhase)?.status ??
      'completed';
    const preflightSignalCheck = {
      checkId: SELF_HOST_EXECUTION_PREFLIGHT_SIGNAL_CHECK_ID,
      status:
        preflightBlockedGroups.length > 0
          ? HostVerificationStatus.WARN
          : HostVerificationStatus.PASS,
      detail: this.buildSelfHostExecutionPreflightDetail({
        blocked: preflightBlockedGroups.length > 0,
        blockedGroups: [...new Set(preflightBlockedGroups)],
        placeholderPaths: [...new Set(preflightBlockedPaths)],
      }),
      inspectedPath: preflightBlockedPaths[0] ?? undefined,
    } satisfies AdoptionPackVerificationCheck;
    verifyChecks.push(preflightSignalCheck);
    doctorChecks.push({
      ...preflightSignalCheck,
      detail: this.buildSelfHostExecutionPreflightDetail({
        blocked: preflightBlockedGroups.length > 0,
        blockedGroups: [...new Set(preflightBlockedGroups)],
        placeholderPaths: [...new Set(preflightBlockedPaths)],
        reflectedFromVerify: true,
        currentPhase: activationPhase,
      }),
    });
    const operatorNextActions =
      this.buildLocalizedSelfHostOperatorNextActionsFromActivationRecords(activationPhaseRecords);
    for (const action of operatorNextActions) {
      doctorChecks.push({
        checkId: 'self-host-next-action',
        status: HostVerificationStatus.WARN,
        detail: action,
      });
    }

    return {
      activationPhase,
      activationPhaseStatus,
      activationPhaseRecords,
      operatorNextActions,
      doctorChecks,
      verifyChecks,
      executionPreflightSignal: preflightBlockedGroups.length > 0 ? 'blocked' : 'ready',
      executionPreflightBlockedGroups: [...new Set(preflightBlockedGroups)],
      executionPreflightPlaceholderPaths: [...new Set(preflightBlockedPaths)],
    };
  }

  /**
   * Reads canonical self-host execution-preflight truth for downstream runtime gates.
   * @param options Optional repo or pack selector used to resolve one installed adoption receipt.
   * @returns Canonical self-host preflight resolution, or null when the target repo is not a self-host install.
   */
  public async resolveSelfHostExecutionPreflight(options?: {
    repoPath?: string | null;
    packSelector?: string | null;
  }): Promise<SelfHostExecutionPreflightResolution | null> {
    const repoRoot = this.resolveRepoRoot(options?.repoPath ?? null);
    const receipt = await this.readExistingReceipt(repoRoot, options?.packSelector ?? null, false);
    if (
      !receipt ||
      receipt.appliedProfileId !== BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE ||
      receipt.workspaceMode !== WorkspaceMode.REPO_LOCAL
    ) {
      return null;
    }

    const canonicalSummary = await this.readCanonicalVerificationSummary(receipt);
    const fallbackReadiness = await this.evaluateSelfHostReadiness(receipt);
    const activationPhaseRecords =
      canonicalSummary.activationPhaseRecords ?? fallbackReadiness.activationPhaseRecords;
    const executionPreflightSignal =
      canonicalSummary.executionPreflightSignal ??
      (canonicalSummary.activationPhaseStatus &&
      canonicalSummary.activationPhaseStatus !== 'completed'
        ? 'blocked'
        : fallbackReadiness.executionPreflightSignal);
    const blockedGroups =
      canonicalSummary.executionPreflightBlockedGroups &&
      canonicalSummary.executionPreflightBlockedGroups.length > 0
        ? [...canonicalSummary.executionPreflightBlockedGroups]
        : executionPreflightSignal === 'blocked'
          ? activationPhaseRecords
              .filter((record) => record.status !== 'completed')
              .map((record) => record.phaseId)
          : fallbackReadiness.executionPreflightBlockedGroups;
    const placeholderPaths =
      canonicalSummary.executionPreflightPlaceholderPaths &&
      canonicalSummary.executionPreflightPlaceholderPaths.length > 0
        ? [...canonicalSummary.executionPreflightPlaceholderPaths]
        : executionPreflightSignal === 'blocked'
          ? activationPhaseRecords.flatMap((record) => record.placeholderPaths)
          : fallbackReadiness.executionPreflightPlaceholderPaths;
    const operatorNextActions =
      activationPhaseRecords.length > 0
        ? this.buildLocalizedSelfHostOperatorNextActionsFromActivationRecords(
            activationPhaseRecords,
          )
        : (canonicalSummary.operatorNextActions ?? fallbackReadiness.operatorNextActions);

    return {
      repoRoot,
      installationId: receipt.installationId,
      packId: receipt.packId,
      profileId: receipt.appliedProfileId,
      verificationSummaryPath: canonicalSummary.verificationSummaryPath,
      activationPhase: canonicalSummary.activationPhase ?? fallbackReadiness.activationPhase,
      activationPhaseStatus:
        canonicalSummary.activationPhaseStatus ?? fallbackReadiness.activationPhaseStatus,
      executionPreflightSignal,
      blockedGroups: [...new Set(blockedGroups)].sort((left, right) => left.localeCompare(right)),
      placeholderPaths: [...new Set(placeholderPaths)].sort((left, right) =>
        left.localeCompare(right),
      ),
      operatorNextActions,
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

  private resolveSelfHostActivationPhaseStatus(options: {
    phaseId: AdoptionPackReadinessGroup;
    unresolvedPlaceholderPaths: string[];
    connectApplyReceiptAvailable: boolean;
    activationPhaseRecords: AdoptionPackActivationPhaseRecord[];
  }): 'blocked' | 'in_progress' | 'completed' {
    if (options.phaseId === AdoptionPackReadinessGroup.ADAPTER_CONNECTED) {
      return options.connectApplyReceiptAvailable ? 'completed' : 'in_progress';
    }

    if (options.phaseId === AdoptionPackReadinessGroup.EXECUTION_READY) {
      const authoringCompleted = options.activationPhaseRecords.some(
        (record) =>
          record.phaseId === AdoptionPackReadinessGroup.AUTHORING_STARTED &&
          record.status === 'completed',
      );
      const adapterConnected = options.activationPhaseRecords.some(
        (record) =>
          record.phaseId === AdoptionPackReadinessGroup.ADAPTER_CONNECTED &&
          record.status === 'completed',
      );
      if (!authoringCompleted || !adapterConnected) {
        return 'blocked';
      }
      return options.unresolvedPlaceholderPaths.length === 0 ? 'completed' : 'in_progress';
    }

    return options.unresolvedPlaceholderPaths.length === 0 ? 'completed' : 'in_progress';
  }

  private buildSelfHostActivationNextActions(options: {
    phaseId: AdoptionPackReadinessGroup;
    phaseStatus: 'blocked' | 'in_progress' | 'completed';
    unresolvedPlaceholderPaths: string[];
    connectApplyReceiptAvailable: boolean;
  }): string[] {
    if (options.phaseStatus === 'completed') {
      return [];
    }

    switch (options.phaseId) {
      case AdoptionPackReadinessGroup.TEMPLATE_SEEDED:
        return [
          this.localizeText(
            'Run `repo-ai-governor adopt bootstrap --adoption-profile self-host-complete --workspace-mode repo_local --repo .` to seed the canonical self-host template surfaces.',
            '运行 `repo-ai-governor adopt bootstrap --adoption-profile self-host-complete --workspace-mode repo_local --repo .`，以播种 canonical self-host 模板面。',
          ),
        ];
      case AdoptionPackReadinessGroup.AUTHORING_STARTED:
        return [this.buildSelfHostPlaceholderAuthoringAction(options.unresolvedPlaceholderPaths)];
      case AdoptionPackReadinessGroup.ADAPTER_CONNECTED:
        return options.connectApplyReceiptAvailable
          ? []
          : [
              this.localizeText(
                'Run `repo-ai-governor connect --preset multi-tool-default --tools codex,claude-code` to write a reviewable adapter candidate, then run `repo-ai-governor connect apply --latest` to activate it.',
                '运行 `repo-ai-governor connect --preset multi-tool-default --tools codex,claude-code` 以写入可审阅的 adapter candidate，然后执行 `repo-ai-governor connect apply --latest` 以正式激活它。',
              ),
            ];
      case AdoptionPackReadinessGroup.EXECUTION_READY: {
        const nextActions: string[] = [];
        if (options.unresolvedPlaceholderPaths.length > 0) {
          nextActions.push(
            this.buildSelfHostPlaceholderAuthoringAction(options.unresolvedPlaceholderPaths),
          );
        }
        if (!options.connectApplyReceiptAvailable) {
          nextActions.push(
            this.localizeText(
              'Apply the latest reviewed connect candidate first so execution-ready can rely on a recorded adapter baseline.',
              '请先 apply 最新一份已审阅的 connect candidate，让 execution-ready 可以依赖已记录的 adapter 基线。',
            ),
          );
        }
        nextActions.push(
          this.localizeText(
            'Re-run `repo-ai-governor adopt verify --repo .` after authoring or connect changes; that summary is the canonical readiness verdict.',
            '在完成 authoring 或 connect 变更后，请重新执行 `repo-ai-governor adopt verify --repo .`；这份摘要才是 canonical readiness verdict。',
          ),
        );
        nextActions.push(
          this.localizeText(
            'While self-host execution preflight is blocked, use `repo-ai-governor doctor --adapters` only for additive diagnostics and keep `repo-ai-governor run --dry-run --trace` as the only allowed diagnostic run.',
            '当 self-host execution preflight 仍处于 blocked 时，只把 `repo-ai-governor doctor --adapters` 作为增量诊断，并把 `repo-ai-governor run --dry-run --trace` 作为唯一允许的诊断运行。',
          ),
        );
        return nextActions;
      }
      default:
        return [];
    }
  }

  private buildSelfHostOperatorNextActionsSummary(operatorNextActions: Set<string>): string[] {
    return [...operatorNextActions];
  }

  private buildSelfHostPlaceholderAuthoringAction(unresolvedPlaceholderPaths: string[]): string {
    const placeholderSummary = this.summarizeSelfHostPlaceholderPathsForOperator(
      unresolvedPlaceholderPaths,
    );
    const anchorPathText = this.formatSelfHostOperatorAnchorPaths(placeholderSummary.anchorPaths);
    const remainingSuffix =
      placeholderSummary.remainingCount > 0
        ? this.localizeText(
            `; ${placeholderSummary.remainingCount} more placeholder files remain in \`activationPhaseRecords[].placeholderPaths\`.`,
            `；另外还有 ${placeholderSummary.remainingCount} 个占位文件保留在 \`activationPhaseRecords[].placeholderPaths\` 中。`,
          )
        : '.';
    return this.localizeText(
      `Finish authoring the repo-local self-host starter surfaces before unattended execution. Start with ${anchorPathText}${remainingSuffix}`,
      `在无人值守执行前，请先完成 repo-local self-host starter surfaces 的编写。建议先处理 ${anchorPathText}${remainingSuffix}`,
    );
  }

  private summarizeSelfHostPlaceholderPathsForOperator(placeholderPaths: string[]): {
    anchorPaths: string[];
    remainingCount: number;
  } {
    const uniquePaths = [...new Set(placeholderPaths)];
    const anchorPaths: string[] = [];

    for (const prioritizedPath of SELF_HOST_OPERATOR_ACTION_PRIORITY_PATHS) {
      if (uniquePaths.includes(prioritizedPath)) {
        anchorPaths.push(prioritizedPath);
      }
      if (anchorPaths.length >= SELF_HOST_OPERATOR_ACTION_ANCHOR_LIMIT) {
        break;
      }
    }

    if (anchorPaths.length < SELF_HOST_OPERATOR_ACTION_ANCHOR_LIMIT) {
      for (const placeholderPath of uniquePaths) {
        if (!anchorPaths.includes(placeholderPath)) {
          anchorPaths.push(placeholderPath);
        }
        if (anchorPaths.length >= SELF_HOST_OPERATOR_ACTION_ANCHOR_LIMIT) {
          break;
        }
      }
    }

    return {
      anchorPaths,
      remainingCount: Math.max(uniquePaths.length - anchorPaths.length, 0),
    };
  }

  private formatSelfHostOperatorAnchorPaths(anchorPaths: string[]): string {
    if (anchorPaths.length === 0) {
      return this.localizeText('the recorded placeholder paths', '记录在案的占位路径');
    }

    return anchorPaths.map((anchorPath) => `\`${anchorPath}\``).join(', ');
  }

  private resolveCurrentSelfHostActivationPhase(
    activationPhaseRecords: AdoptionPackActivationPhaseRecord[],
  ): AdoptionPackReadinessGroup {
    for (const phaseId of SELF_HOST_ACTIVATION_PHASE_ORDER) {
      const record = activationPhaseRecords.find((candidate) => candidate.phaseId === phaseId);
      if (record && record.status !== 'completed') {
        return phaseId;
      }
    }

    return activationPhaseRecords.length > 0
      ? AdoptionPackReadinessGroup.EXECUTION_READY
      : AdoptionPackReadinessGroup.NONE;
  }

  private toReadinessCheckStatus(
    phaseStatus: 'blocked' | 'in_progress' | 'completed',
  ): HostVerificationStatus {
    return phaseStatus === 'completed' ? HostVerificationStatus.PASS : HostVerificationStatus.WARN;
  }

  private async hasSelfHostConnectApplyReceipt(repoRoot: string): Promise<boolean> {
    const status = await this.readSelfHostConnectApplyReceiptStatus(repoRoot);
    return status.isCurrent;
  }

  private async readSelfHostConnectApplyReceiptStatus(repoRoot: string): Promise<{
    isCurrent: boolean;
    latestReceiptPath?: string;
  }> {
    const connectApplyRoot = resolve(
      repoRoot,
      ...SELF_HOST_CONNECT_APPLY_RECEIPTS_DIRECTORY_SEGMENTS,
    );
    if (!existsSync(connectApplyRoot)) {
      return { isCurrent: false };
    }

    const entries = await readdir(connectApplyRoot, { withFileTypes: true }).catch(() => []);
    const receiptNames = entries
      .filter((entry) => entry.isFile() && /^connect-apply-\d+\.json$/u.test(entry.name))
      .map((entry) => entry.name)
      .sort((left, right) => right.localeCompare(left));
    const latestReceiptName = receiptNames[0];
    if (!latestReceiptName) {
      return { isCurrent: false };
    }

    const latestReceiptPath = resolve(connectApplyRoot, latestReceiptName);
    const latestReceipt = await this.readTextIfExists(latestReceiptPath);
    if (latestReceipt === null) {
      return {
        isCurrent: false,
        latestReceiptPath,
      };
    }

    try {
      const receiptSnapshot = JSON.parse(latestReceipt) as SelfHostConnectApplyReceiptSnapshot;
      const currentConfig = this.configLoader.loadFromFile(
        resolve(repoRoot, '.repo-ai-governor', 'governor.yaml'),
      );
      const currentConfigHash = this.hashStructuredConfig(currentConfig);
      const applyBlockers = Array.isArray(receiptSnapshot.applyBlockers)
        ? receiptSnapshot.applyBlockers
        : [];
      return {
        isCurrent:
          receiptSnapshot.applyReady === true &&
          receiptSnapshot.candidateFingerprintCurrent === true &&
          applyBlockers.length === 0 &&
          typeof receiptSnapshot.appliedConfigHash === 'string' &&
          receiptSnapshot.appliedConfigHash === currentConfigHash,
        latestReceiptPath,
      };
    } catch {
      return {
        isCurrent: false,
        latestReceiptPath,
      };
    }
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

  private async resolveMissingSelfHostReadinessPaths(options: {
    receipt: AdoptionPackInstallReceipt;
    sourceCatalogRecordBySurfaceId: Map<
      string,
      ResolvedAdoptionPackDefinition['sourceCatalogRecords'][number]
    >;
    surfaceIds: string[];
  }): Promise<string[]> {
    const missingPaths = new Set<string>();

    for (const surfaceId of options.surfaceIds) {
      const sourceCatalogRecord = options.sourceCatalogRecordBySurfaceId.get(surfaceId);
      const relativePath = sourceCatalogRecord?.relativePath;
      if (!relativePath) {
        continue;
      }

      const absolutePath = resolve(options.receipt.targetRepoRoot, relativePath);
      if (!existsSync(absolutePath)) {
        missingPaths.add(relativePath);
      }
    }

    return [...missingPaths].sort((left, right) => left.localeCompare(right));
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
  }): Promise<string> {
    const existingManagedRecord = options.existingReceipt?.managedFileRecords.find(
      (record) => record.absolutePath === options.absolutePath,
    );
    const currentContent = await this.readTextIfExists(options.absolutePath);
    if (currentContent === null && existingManagedRecord) {
      this.assertMissingManagedFileCanBeRewritten(
        existingManagedRecord,
        options.relativePath,
        options.assetGroup,
        options.force,
      );
    }

    if (currentContent !== null && currentContent !== options.content) {
      const currentChecksumSha256 = this.calculateSha256(currentContent);
      if (
        existingManagedRecord &&
        this.shouldPreserveExistingManagedContent(existingManagedRecord, currentChecksumSha256)
      ) {
        return currentContent;
      }
      if (!options.force) {
        if (
          existingManagedRecord &&
          this.matchesManagedSeedChecksum(existingManagedRecord, currentChecksumSha256)
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
    return options.content;
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

  private async readCanonicalVerificationSummary(
    receipt: AdoptionPackInstallReceipt,
  ): Promise<AdoptionPackVerificationSummary> {
    const summaryPath = receipt.verificationSummary.verificationSummaryPath;
    if (!existsSync(summaryPath)) {
      return receipt.verificationSummary;
    }

    try {
      return this.readJsonFile<AdoptionPackVerificationSummary>(summaryPath);
    } catch {
      return receipt.verificationSummary;
    }
  }

  private buildDoctorReadinessChecksFromCanonicalSummary(
    summary: AdoptionPackVerificationSummary,
    fallbackReadiness: SelfHostReadinessEvaluation,
  ): AdoptionPackVerificationCheck[] {
    const activationPhaseRecords =
      summary.activationPhaseRecords ?? fallbackReadiness.activationPhaseRecords;
    const preflightBlocked =
      summary.executionPreflightSignal === 'blocked' ||
      (summary.executionPreflightSignal === undefined &&
        Boolean(summary.activationPhaseStatus && summary.activationPhaseStatus !== 'completed'));
    const preflightBlockedGroups =
      summary.executionPreflightBlockedGroups && summary.executionPreflightBlockedGroups.length > 0
        ? [...summary.executionPreflightBlockedGroups]
        : preflightBlocked
          ? activationPhaseRecords
              .filter((record) => record.status !== 'completed')
              .map((record) => record.phaseId)
          : [];
    const preflightPlaceholderPaths =
      summary.executionPreflightPlaceholderPaths &&
      summary.executionPreflightPlaceholderPaths.length > 0
        ? [...summary.executionPreflightPlaceholderPaths]
        : preflightBlocked
          ? activationPhaseRecords.flatMap((record) => record.placeholderPaths)
          : [];
    const operatorNextActions =
      activationPhaseRecords.length > 0
        ? this.buildLocalizedSelfHostOperatorNextActionsFromActivationRecords(
            activationPhaseRecords,
          )
        : (summary.operatorNextActions ?? fallbackReadiness.operatorNextActions);
    const checks: AdoptionPackVerificationCheck[] = activationPhaseRecords.map((record) => ({
      checkId: `${SELF_HOST_READINESS_CHECK_ID_PREFIX}:${record.phaseId}`,
      status: this.toReadinessCheckStatus(record.status),
      detail: this.buildSelfHostPhaseCheckDetail({
        phaseId: record.phaseId,
        phaseStatus: record.status,
        blockingReasons: record.blockingReasons,
        placeholderPaths: record.placeholderPaths,
        audience: 'doctor',
      }),
      inspectedPath: record.placeholderPaths[0] ?? undefined,
    }));
    checks.push({
      checkId: SELF_HOST_EXECUTION_PREFLIGHT_SIGNAL_CHECK_ID,
      status: preflightBlocked ? HostVerificationStatus.WARN : HostVerificationStatus.PASS,
      detail: this.buildSelfHostExecutionPreflightDetail({
        blocked: preflightBlocked,
        blockedGroups: [...new Set(preflightBlockedGroups)],
        placeholderPaths: [...new Set(preflightPlaceholderPaths)],
        reflectedFromVerify: true,
        currentPhase: summary.activationPhase,
      }),
    });
    for (const action of operatorNextActions) {
      checks.push({
        checkId: 'self-host-next-action',
        status: HostVerificationStatus.WARN,
        detail: action,
      });
    }
    return checks;
  }

  private buildCheckReadinessChecksFromCanonicalSummary(
    summary: AdoptionPackVerificationSummary,
  ): AdoptionPackVerificationCheck[] {
    const activationPhaseRecords = summary.activationPhaseRecords ?? [];
    const localizedNextActions =
      activationPhaseRecords.length > 0
        ? this.buildLocalizedSelfHostOperatorNextActionsFromActivationRecords(
            activationPhaseRecords,
          )
        : (summary.operatorNextActions ?? []);
    const canonicalFailureChecks = summary.checks.filter(
      (check) => check.status === HostVerificationStatus.FAIL,
    );
    const checks: AdoptionPackVerificationCheck[] = [...canonicalFailureChecks];
    checks.push(
      ...activationPhaseRecords.map((record) => ({
        checkId: `self-host-check:${record.phaseId}`,
        status: this.toReadinessCheckStatus(record.status),
        detail: this.buildSelfHostCheckPhaseDetail(record),
        inspectedPath: record.placeholderPaths[0] ?? undefined,
      })),
    );
    if (summary.activationPhase) {
      checks.push({
        checkId: 'self-host-activation-summary',
        status:
          summary.status === HostVerificationStatus.FAIL
            ? HostVerificationStatus.FAIL
            : summary.activationPhaseStatus === 'completed'
              ? HostVerificationStatus.PASS
              : HostVerificationStatus.WARN,
        detail: this.localizeText(
          `Current self-host activation summary: current_phase=${summary.activationPhase} phase_status=${summary.activationPhaseStatus ?? 'completed'} consumed_from=adopt_verify verification_status=${summary.status}.`,
          `当前 self-host activation 摘要：current_phase=${summary.activationPhase} phase_status=${summary.activationPhaseStatus ?? 'completed'} consumed_from=adopt_verify verification_status=${summary.status}。`,
        ),
      });
    }
    for (const action of localizedNextActions) {
      checks.push({
        checkId: 'self-host-check-next-action',
        status: HostVerificationStatus.WARN,
        detail: action,
      });
    }
    return checks;
  }

  private buildSelfHostPhaseCheckDetail(options: {
    phaseId: AdoptionPackReadinessGroup;
    phaseStatus: 'blocked' | 'in_progress' | 'completed';
    blockingReasons: string[];
    placeholderPaths: string[];
    audience: 'verify' | 'doctor';
  }): string {
    const blockingReasonText = this.formatSelfHostDiagnosticList(options.blockingReasons);
    const placeholderPathText = this.formatSelfHostDiagnosticList(options.placeholderPaths);
    const sourceText = options.audience === 'doctor' ? ' reflected_from=adopt_verify' : '';
    return this.localizeText(
      `Self-host readiness phase ${options.phaseId} is ${options.phaseStatus}; activation_phase=${options.phaseId} phase_status=${options.phaseStatus}${sourceText} blocking_reasons=${blockingReasonText} placeholder_paths=${placeholderPathText}.`,
      `Self-host readiness 阶段 ${options.phaseId} 当前为 ${options.phaseStatus}；activation_phase=${options.phaseId} phase_status=${options.phaseStatus}${sourceText} blocking_reasons=${blockingReasonText} placeholder_paths=${placeholderPathText}。`,
    );
  }

  private buildSelfHostCheckPhaseDetail(record: AdoptionPackActivationPhaseRecord): string {
    const broaderAuditStatus =
      record.status === 'completed' ? 'ready_to_continue' : 'phase_blocked';
    return this.localizeText(
      `Self-host readiness phase ${record.phaseId} is ${record.status}; activation_phase=${record.phaseId} phase_status=${record.status} consumed_from=adopt_verify broader_governance_audit=${broaderAuditStatus}.`,
      `Self-host readiness 阶段 ${record.phaseId} 当前为 ${record.status}；activation_phase=${record.phaseId} phase_status=${record.status} consumed_from=adopt_verify broader_governance_audit=${broaderAuditStatus}。`,
    );
  }

  private buildSelfHostExecutionPreflightDetail(options: {
    blocked: boolean;
    blockedGroups: string[];
    placeholderPaths: string[];
    reflectedFromVerify?: boolean;
    currentPhase?: AdoptionPackReadinessGroup;
  }): string {
    const blockedGroupText = this.formatSelfHostDiagnosticList(options.blockedGroups);
    const placeholderPathText = this.formatSelfHostDiagnosticList(options.placeholderPaths);
    if (options.blocked) {
      return this.localizeText(
        `Execution preflight is blocked; execution_preflight_signal=blocked enforcement=downstream_fail_closed blocked_groups=${blockedGroupText} placeholder_paths=${placeholderPathText}${options.reflectedFromVerify ? ` reflected_from=adopt_verify current_phase=${options.currentPhase ?? AdoptionPackReadinessGroup.NONE}` : ''}.`,
        `执行预检当前被阻塞；execution_preflight_signal=blocked enforcement=downstream_fail_closed blocked_groups=${blockedGroupText} placeholder_paths=${placeholderPathText}${options.reflectedFromVerify ? ` reflected_from=adopt_verify current_phase=${options.currentPhase ?? AdoptionPackReadinessGroup.NONE}` : ''}。`,
      );
    }

    return this.localizeText(
      `Execution preflight is ready; execution_preflight_signal=ready${options.reflectedFromVerify ? ' reflected_from=adopt_verify' : ''}.`,
      `执行预检已就绪；execution_preflight_signal=ready${options.reflectedFromVerify ? ' reflected_from=adopt_verify' : ''}。`,
    );
  }

  private buildLocalizedSelfHostOperatorNextActionsFromActivationRecords(
    activationPhaseRecords: AdoptionPackActivationPhaseRecord[],
  ): string[] {
    const localizedActions = new Set<string>();
    const authoringRecord = activationPhaseRecords.find(
      (record) =>
        record.phaseId === AdoptionPackReadinessGroup.AUTHORING_STARTED &&
        record.status !== 'completed',
    );
    const adapterRecord = activationPhaseRecords.find(
      (record) =>
        record.phaseId === AdoptionPackReadinessGroup.ADAPTER_CONNECTED &&
        record.status !== 'completed',
    );
    const executionRecord = activationPhaseRecords.find(
      (record) =>
        record.phaseId === AdoptionPackReadinessGroup.EXECUTION_READY &&
        record.status !== 'completed',
    );
    const adapterConnected = activationPhaseRecords.some(
      (record) =>
        record.phaseId === AdoptionPackReadinessGroup.ADAPTER_CONNECTED &&
        record.status === 'completed',
    );

    if (authoringRecord) {
      localizedActions.add(
        this.buildSelfHostPlaceholderAuthoringAction(authoringRecord.placeholderPaths),
      );
    } else if (executionRecord && executionRecord.placeholderPaths.length > 0) {
      localizedActions.add(
        this.buildSelfHostPlaceholderAuthoringAction(executionRecord.placeholderPaths),
      );
    }

    if (adapterRecord) {
      for (const action of this.buildSelfHostActivationNextActions({
        phaseId: adapterRecord.phaseId,
        phaseStatus: adapterRecord.status,
        unresolvedPlaceholderPaths: adapterRecord.placeholderPaths,
        connectApplyReceiptAvailable: adapterConnected,
      })) {
        localizedActions.add(action);
      }
    }

    if (authoringRecord || adapterRecord || executionRecord) {
      localizedActions.add(
        this.localizeText(
          'Re-run `repo-ai-governor adopt verify --repo .` after authoring or connect changes; that summary is the canonical readiness verdict.',
          '在完成 authoring 或 connect 变更后，请重新执行 `repo-ai-governor adopt verify --repo .`；这份摘要才是 canonical readiness verdict。',
        ),
      );
    }

    if (executionRecord) {
      localizedActions.add(
        this.localizeText(
          'Use `repo-ai-governor doctor --adapters` only for additive diagnostics. While preflight is blocked, keep `repo-ai-governor run --dry-run --trace` as the only allowed diagnostic run.',
          '只把 `repo-ai-governor doctor --adapters` 用作增量诊断。当 preflight 仍处于 blocked 时，请把 `repo-ai-governor run --dry-run --trace` 作为唯一允许的诊断运行。',
        ),
      );
    }

    return this.buildSelfHostOperatorNextActionsSummary(localizedActions);
  }

  private formatSelfHostDiagnosticList(values: string[]): string {
    return values.length > 0 ? values.join(',') : this.localizeText('none', '无');
  }

  private hashStructuredConfig(config: unknown): string {
    const normalized = JSON.stringify(this.sortHashValue(config));
    let hash = 0;
    for (let index = 0; index < normalized.length; index += 1) {
      hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
    }
    return `cfg-${hash.toString(16).padStart(8, '0')}`;
  }

  private sortHashValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortHashValue(item));
    }
    if (value && typeof value === 'object') {
      return Object.fromEntries(
        Object.entries(value)
          .sort(([left], [right]) => left.localeCompare(right))
          .map(([entryKey, entryValue]) => [entryKey, this.sortHashValue(entryValue)]),
      );
    }
    return value;
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
      managedFileRecords: receipt.managedFileRecords.map((record) =>
        this.normalizeManagedFileRecord(record),
      ),
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
    sourceCatalogRecord?: AdoptionPackSourceCatalogRecord,
  ): AdoptionPackManagedFileRecord {
    const checksumSha256 = this.calculateSha256(content);
    return {
      relativePath: relativePath.replace(/\\/g, '/'),
      absolutePath,
      assetGroup,
      ownershipClass:
        sourceCatalogRecord?.ownershipClass ?? AdoptionPackOwnershipClass.MANAGED_LOCKED,
      driftPolicy: sourceCatalogRecord?.driftPolicy ?? AdoptionPackDriftPolicy.ENFORCE_CHECKSUM,
      gitPolicy: sourceCatalogRecord?.gitPolicy ?? AdoptionPackGitPolicy.KEEP_TRACKED,
      placeholderPolicy:
        sourceCatalogRecord?.placeholderPolicy ?? AdoptionPackPlaceholderPolicy.NONE,
      sourceCatalogId: sourceCatalogRecord?.surfaceId,
      seededAt: new Date().toISOString(),
      seedChecksumSha256: checksumSha256,
      checksumSha256,
      managed: true,
    };
  }

  private async createManagedFileRecordFromFile(
    relativePath: string,
    absolutePath: string,
    assetGroup: AdoptionPackManagedAssetGroup,
    sourceCatalogRecord?: AdoptionPackSourceCatalogRecord,
  ): Promise<AdoptionPackManagedFileRecord> {
    return this.createManagedFileRecord(
      relativePath,
      absolutePath,
      assetGroup,
      await readFile(absolutePath),
      sourceCatalogRecord,
    );
  }

  private normalizeManagedFileRecord(
    record: AdoptionPackManagedFileRecord,
  ): AdoptionPackManagedFileRecord {
    const normalizedChecksum = record.seedChecksumSha256 ?? record.checksumSha256 ?? null;
    const normalizedOwnershipClass =
      record.ownershipClass ??
      this.inferLegacyManagedFileOwnershipClass(record.relativePath, record.assetGroup);
    return {
      ...record,
      ownershipClass: normalizedOwnershipClass,
      driftPolicy:
        record.driftPolicy ?? this.defaultDriftPolicyForOwnershipClass(normalizedOwnershipClass),
      gitPolicy: record.gitPolicy ?? this.defaultGitPolicyForManagedRecord(record),
      placeholderPolicy:
        record.placeholderPolicy ?? this.defaultPlaceholderPolicyForManagedRecord(record),
      seededAt: record.seededAt ?? undefined,
      seedChecksumSha256: normalizedChecksum,
      checksumSha256:
        record.checksumSha256 ??
        (this.defaultDriftPolicyForOwnershipClass(normalizedOwnershipClass) ===
        AdoptionPackDriftPolicy.ENFORCE_CHECKSUM
          ? normalizedChecksum
          : null),
    };
  }

  private inferLegacyManagedFileOwnershipClass(
    relativePath: string,
    assetGroup: AdoptionPackManagedAssetGroup,
  ): AdoptionPackOwnershipClass {
    if (
      relativePath === 'AGENTS.md' ||
      relativePath.endsWith('code_standards.md') ||
      relativePath.endsWith('long-term-maintenance-guide.md') ||
      relativePath.endsWith('product-requirements-brief.md') ||
      relativePath.startsWith('.repo-ai-governor/context/dev/project-template/') ||
      relativePath === '.repo-ai-governor/context/dev/project-template/plan.md' ||
      relativePath === '.repo-ai-governor/context/completed-streams-history.md' ||
      relativePath ===
        '.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml'
    ) {
      return AdoptionPackOwnershipClass.STARTER_EDITABLE;
    }

    if (
      relativePath === '.repo-ai-governor/governor.yaml' ||
      relativePath === '.repo-ai-governor/context/current-context.md' ||
      relativePath.includes('technical-solution-lifecycle-registry.yaml') ||
      relativePath.includes('technical-solution-delivery-registry.yaml') ||
      relativePath.includes('technical-solution-module-registry.yaml') ||
      relativePath.endsWith('task-ledger.sqlite') ||
      relativePath.endsWith('artifact-registry.sqlite') ||
      relativePath.endsWith('/artifacts.csv') ||
      relativePath.endsWith('/artifacts.archive.csv')
    ) {
      return AdoptionPackOwnershipClass.CANONICAL_RUNTIME_WRITABLE;
    }

    if (
      relativePath.includes('/context/diagnostics/') ||
      relativePath.includes('/context/reports/') ||
      relativePath.includes('/context/replay/') ||
      relativePath.includes('/context/compiled-ir/') ||
      relativePath.endsWith('.sqlite-wal') ||
      relativePath.endsWith('.sqlite-shm')
    ) {
      return AdoptionPackOwnershipClass.GENERATED_EPHEMERAL;
    }

    if (assetGroup === AdoptionPackManagedAssetGroup.RUNTIME_HANDOFF_METADATA) {
      return AdoptionPackOwnershipClass.MANAGED_LOCKED;
    }

    return AdoptionPackOwnershipClass.MANAGED_LOCKED;
  }

  private defaultDriftPolicyForOwnershipClass(
    ownershipClass: AdoptionPackOwnershipClass,
  ): AdoptionPackDriftPolicy {
    switch (ownershipClass) {
      case AdoptionPackOwnershipClass.STARTER_EDITABLE:
        return AdoptionPackDriftPolicy.PLACEHOLDER_AWARE;
      case AdoptionPackOwnershipClass.CANONICAL_RUNTIME_WRITABLE:
        return AdoptionPackDriftPolicy.PROVENANCE_ONLY;
      case AdoptionPackOwnershipClass.GENERATED_EPHEMERAL:
        return AdoptionPackDriftPolicy.IGNORE;
      default:
        return AdoptionPackDriftPolicy.ENFORCE_CHECKSUM;
    }
  }

  private defaultGitPolicyForManagedRecord(
    record: Pick<AdoptionPackManagedFileRecord, 'relativePath' | 'ownershipClass'>,
  ): AdoptionPackGitPolicy {
    if (
      record.ownershipClass === AdoptionPackOwnershipClass.GENERATED_EPHEMERAL ||
      record.relativePath.endsWith('.sqlite') ||
      record.relativePath.endsWith('.csv')
    ) {
      return AdoptionPackGitPolicy.OPT_IN_IGNORE_RECOMMENDATION;
    }
    return AdoptionPackGitPolicy.KEEP_TRACKED;
  }

  private defaultPlaceholderPolicyForManagedRecord(
    record: Pick<AdoptionPackManagedFileRecord, 'ownershipClass' | 'relativePath'>,
  ): AdoptionPackPlaceholderPolicy {
    if (record.ownershipClass === AdoptionPackOwnershipClass.STARTER_EDITABLE) {
      return record.relativePath.endsWith('.md')
        ? AdoptionPackPlaceholderPolicy.ADOPTER_OWNED
        : AdoptionPackPlaceholderPolicy.TEMPLATE_SEED;
    }
    if (record.ownershipClass === AdoptionPackOwnershipClass.CANONICAL_RUNTIME_WRITABLE) {
      return AdoptionPackPlaceholderPolicy.TEMPLATE_SEED;
    }
    return AdoptionPackPlaceholderPolicy.NONE;
  }

  private resolveManagedRecordBaselineChecksum(
    record: Pick<AdoptionPackManagedFileRecord, 'seedChecksumSha256' | 'checksumSha256'>,
  ): string | null {
    return record.seedChecksumSha256 ?? record.checksumSha256 ?? null;
  }

  private shouldReportMissingManagedFile(
    record: Pick<AdoptionPackManagedFileRecord, 'ownershipClass' | 'driftPolicy'>,
  ): boolean {
    return (
      record.ownershipClass !== AdoptionPackOwnershipClass.GENERATED_EPHEMERAL &&
      record.driftPolicy !== AdoptionPackDriftPolicy.IGNORE
    );
  }

  private blocksUpgradeWithoutForce(
    record: Pick<AdoptionPackDiffRecord, 'diffKind' | 'ownershipClass' | 'driftPolicy'>,
  ): boolean {
    if (
      record.ownershipClass === AdoptionPackOwnershipClass.MANAGED_LOCKED &&
      record.driftPolicy === AdoptionPackDriftPolicy.ENFORCE_CHECKSUM
    ) {
      return true;
    }

    return (
      record.diffKind === 'missing' &&
      record.ownershipClass === AdoptionPackOwnershipClass.STARTER_EDITABLE
    );
  }

  private requiresExplicitUpgradeRecovery(
    record: Pick<AdoptionPackDiffRecord, 'diffKind' | 'ownershipClass'>,
  ): boolean {
    return (
      record.diffKind === 'missing' &&
      record.ownershipClass === AdoptionPackOwnershipClass.CANONICAL_RUNTIME_WRITABLE
    );
  }

  private matchesManagedSeedChecksum(
    record: Pick<AdoptionPackManagedFileRecord, 'seedChecksumSha256' | 'checksumSha256'>,
    currentChecksumSha256: string,
  ): boolean {
    const seededChecksum = this.resolveManagedRecordBaselineChecksum(record);
    return seededChecksum !== null && currentChecksumSha256 === seededChecksum;
  }

  private shouldPreserveExistingManagedContent(
    record: Pick<
      AdoptionPackManagedFileRecord,
      'ownershipClass' | 'seedChecksumSha256' | 'checksumSha256'
    >,
    currentChecksumSha256: string,
  ): boolean {
    switch (record.ownershipClass) {
      case AdoptionPackOwnershipClass.STARTER_EDITABLE:
        return !this.matchesManagedSeedChecksum(record, currentChecksumSha256);
      case AdoptionPackOwnershipClass.CANONICAL_RUNTIME_WRITABLE:
      case AdoptionPackOwnershipClass.GENERATED_EPHEMERAL:
        return true;
      default:
        return false;
    }
  }

  private assertMissingManagedFileCanBeRewritten(
    record: Pick<AdoptionPackManagedFileRecord, 'ownershipClass'>,
    relativePath: string,
    assetGroup: AdoptionPackManagedAssetGroup,
    force: boolean,
  ): void {
    if (record.ownershipClass === AdoptionPackOwnershipClass.CANONICAL_RUNTIME_WRITABLE) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          `Refusing to recreate missing canonical runtime file ${relativePath}; restore or migrate it explicitly before rerunning apply or upgrade.`,
          `拒绝重建缺失的 canonical runtime 文件 ${relativePath}；请先显式恢复或迁移后再重新执行 apply 或 upgrade。`,
        ),
        {
          relativePath,
          assetGroup,
        },
      );
    }

    if (record.ownershipClass === AdoptionPackOwnershipClass.STARTER_EDITABLE && !force) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          `Starter-editable file ${relativePath} is missing; rerun with --force only if you intentionally want to reseed the starter file.`,
          `starter_editable 文件 ${relativePath} 已缺失；仅当你确实要重新播种该 starter 文件时才使用 --force 重试。`,
        ),
        {
          relativePath,
          assetGroup,
        },
      );
    }

    if (record.ownershipClass === AdoptionPackOwnershipClass.MANAGED_LOCKED && !force) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        this.localizeText(
          `Managed file ${relativePath} is missing; review the drift and rerun with --force only after confirmation.`,
          `受管文件 ${relativePath} 已缺失；请先检查漂移，再在确认后使用 --force 重试。`,
        ),
        {
          relativePath,
          assetGroup,
        },
      );
    }
  }

  private async resolveRemovableManagedFileRecords(
    receipt: AdoptionPackInstallReceipt,
  ): Promise<AdoptionPackManagedFileRecord[]> {
    const removableRecords: AdoptionPackManagedFileRecord[] = [];

    for (const managedFileRecord of receipt.managedFileRecords) {
      switch (managedFileRecord.ownershipClass) {
        case AdoptionPackOwnershipClass.MANAGED_LOCKED:
          removableRecords.push(managedFileRecord);
          break;
        case AdoptionPackOwnershipClass.STARTER_EDITABLE: {
          const currentContent = await this.readTextIfExists(managedFileRecord.absolutePath);
          const currentChecksum =
            currentContent === null ? null : this.calculateSha256(currentContent);
          const seededChecksum =
            managedFileRecord.seedChecksumSha256 ?? managedFileRecord.checksumSha256 ?? null;
          if (currentChecksum === null || (seededChecksum && currentChecksum === seededChecksum)) {
            removableRecords.push(managedFileRecord);
            break;
          }
          throw new RuntimeError(
            GovernorErrorCode.STANDARDS_PACK_INVALID,
            this.localizeText(
              `adopt remove refused because starter-editable file ${managedFileRecord.relativePath} has adopter edits.`,
              `adopt remove 已拒绝，因为 starter_editable 文件 ${managedFileRecord.relativePath} 已被 adopter 修改。`,
            ),
            {
              receiptPath: receipt.receiptPath,
              relativePath: managedFileRecord.relativePath,
            },
          );
        }
        case AdoptionPackOwnershipClass.CANONICAL_RUNTIME_WRITABLE:
          throw new RuntimeError(
            GovernorErrorCode.STANDARDS_PACK_INVALID,
            this.localizeText(
              `adopt remove refused because canonical runtime truth ${managedFileRecord.relativePath} requires explicit migration or archival.`,
              `adopt remove 已拒绝，因为 canonical_runtime_writable 真值 ${managedFileRecord.relativePath} 需要显式 migration 或 archival。`,
            ),
            {
              receiptPath: receipt.receiptPath,
              relativePath: managedFileRecord.relativePath,
            },
          );
        case AdoptionPackOwnershipClass.GENERATED_EPHEMERAL:
          break;
      }
    }

    return removableRecords;
  }

  private resolveProjectedFileSourceCatalogRecord(
    relativePath: string,
    sourceCatalogRecordByRelativePath: Map<string, AdoptionPackSourceCatalogRecord>,
    treatAgentsAsStarterEditable: boolean,
  ): AdoptionPackSourceCatalogRecord | undefined {
    if (treatAgentsAsStarterEditable && relativePath === 'AGENTS.md') {
      return {
        surfaceId: 'host_projection:AGENTS.md:self_host_editable',
        surfaceKind:
          sourceCatalogRecordByRelativePath.values().next().value?.surfaceKind ?? 'template_file',
        description: 'Self-host AGENTS.md starter content remains adopter-editable after seed.',
        profileIds: [BUILT_IN_ADOPTION_PACK_PROFILE_IDS.SELF_HOST_COMPLETE],
        assetGroup: AdoptionPackManagedAssetGroup.INSTRUCTIONS,
        ownershipClass: AdoptionPackOwnershipClass.STARTER_EDITABLE,
        driftPolicy: AdoptionPackDriftPolicy.PLACEHOLDER_AWARE,
        gitPolicy: AdoptionPackGitPolicy.KEEP_TRACKED,
        parityClass:
          sourceCatalogRecordByRelativePath.get(relativePath)?.parityClass ??
          'generated_projection',
        sourceMode:
          sourceCatalogRecordByRelativePath.get(relativePath)?.sourceMode ?? 'generated_projection',
        sourceRef:
          sourceCatalogRecordByRelativePath.get(relativePath)?.sourceRef ??
          'builtin://repo-ai-governor/agents/AGENTS.md',
        compositionPolicy:
          sourceCatalogRecordByRelativePath.get(relativePath)?.compositionPolicy ??
          'catalog_assembled',
        placeholderPolicy: AdoptionPackPlaceholderPolicy.ADOPTER_OWNED,
        applicabilityScope: AdoptionPackApplicabilityScope.SELF_HOST_REPO_LOCAL,
        readinessGroup:
          sourceCatalogRecordByRelativePath.get(relativePath)?.readinessGroup ?? 'none',
        readinessSinkIds:
          sourceCatalogRecordByRelativePath.get(relativePath)?.readinessSinkIds ?? [],
        relativePath,
      } as AdoptionPackSourceCatalogRecord;
    }

    return sourceCatalogRecordByRelativePath.get(relativePath);
  }

  private calculateSha256(content: string | Uint8Array): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private buildVerificationSummary(options: {
    receiptPath: string;
    verificationSummaryPath: string;
    checks: AdoptionPackVerificationCheck[];
    activationPhase?: AdoptionPackReadinessGroup;
    activationPhaseStatus?: 'blocked' | 'in_progress' | 'completed';
    activationPhaseRecords?: AdoptionPackActivationPhaseRecord[];
    operatorNextActions?: string[];
    executionPreflightSignal?: 'blocked' | 'ready';
    executionPreflightBlockedGroups?: string[];
    executionPreflightPlaceholderPaths?: string[];
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
      ...(options.activationPhase ? { activationPhase: options.activationPhase } : {}),
      ...(options.activationPhaseStatus
        ? { activationPhaseStatus: options.activationPhaseStatus }
        : {}),
      ...(options.activationPhaseRecords
        ? { activationPhaseRecords: options.activationPhaseRecords }
        : {}),
      ...(options.operatorNextActions ? { operatorNextActions: options.operatorNextActions } : {}),
      ...(options.executionPreflightSignal
        ? { executionPreflightSignal: options.executionPreflightSignal }
        : {}),
      ...(options.executionPreflightBlockedGroups
        ? { executionPreflightBlockedGroups: options.executionPreflightBlockedGroups }
        : {}),
      ...(options.executionPreflightPlaceholderPaths
        ? { executionPreflightPlaceholderPaths: options.executionPreflightPlaceholderPaths }
        : {}),
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
