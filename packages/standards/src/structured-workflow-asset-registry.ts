import { resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  HOST_APPLY_REPORT_SCHEMA_VERSION,
  HOST_DISTRIBUTION_DISCOVERY_STATE_VALUES,
  HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES,
  HOST_DISTRIBUTION_HOST_VALUES,
  HOST_DISTRIBUTION_MODE_VALUES,
  HOST_DISTRIBUTION_TARGET_VALUES,
  HOST_EXPORT_MANIFEST_SCHEMA_VERSION,
  HOST_PACK_REPORT_SCHEMA_VERSION,
  HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION,
  HostDistributionDiscoveryState,
  HostDistributionHandoffBridge,
  HostDistributionHost,
  HostDistributionMode,
  HostDistributionTarget,
  HostVerificationStatus,
} from './constants/index.js';
import type {
  HostApplyReport,
  HostExportManifest,
  HostExportProjectedFile,
  HostPackReport,
  HostRendererRenderInput,
  HostRendererRenderResult,
  HostTargetCapabilities,
  HostVerificationCheck,
  HostVerificationSummary,
  StructuredWorkflowAssetRecord,
  StructuredWorkflowAssetRegistryOptions,
} from './types/index.js';
import { readRequiredString } from './utils/index.js';

/**
 * Owns deterministic workflow-asset truth and renders host-distribution contracts from it.
 *
 * Why this exists:
 * host-native export/apply/pack flows should consume one structured registry instead of each
 * host adapter re-deriving workflow state from canonical source files.
 */
export class StructuredWorkflowAssetRegistry {
  private readonly recordsByWorkflowId = new Map<string, StructuredWorkflowAssetRecord>();

  public constructor(options: StructuredWorkflowAssetRegistryOptions = {}) {
    for (const record of options.records ?? []) {
      this.register(record);
    }
  }

  /**
   * Registers or replaces one workflow asset record.
   * @param record Structured workflow asset record.
   * @returns Normalized record retained by the registry.
   */
  public register(record: StructuredWorkflowAssetRecord): StructuredWorkflowAssetRecord {
    const normalizedRecord = this.normalizeRecord(record);
    this.recordsByWorkflowId.set(normalizedRecord.workflowId, normalizedRecord);

    return normalizedRecord;
  }

  /**
   * Replaces the entire registry payload.
   * @param records Structured workflow asset records to retain.
   */
  public replace(records: readonly StructuredWorkflowAssetRecord[]): void {
    this.recordsByWorkflowId.clear();
    for (const record of records) {
      this.register(record);
    }
  }

  /**
   * Lists registered workflow assets in deterministic workflow id order.
   * @returns Registered workflow asset records.
   */
  public list(): StructuredWorkflowAssetRecord[] {
    return [...this.recordsByWorkflowId.values()].sort((left, right) =>
      left.workflowId.localeCompare(right.workflowId),
    );
  }

  /**
   * Describes the canonical capability envelope for one host target.
   * @param target Host target whose capability contract should be returned.
   * @returns Deterministic capability metadata for the target.
   */
  public describeTargetCapabilities(target: HostDistributionTarget): HostTargetCapabilities {
    return this.resolveTargetCapabilities(target);
  }

  /**
   * Renders host-distribution export artifacts from one host/mode/target input.
   * @param input Host renderer input.
   * @returns Structured renderer result with manifest, projected files, and verification summary.
   */
  public render(input: HostRendererRenderInput): HostRendererRenderResult {
    const normalizedInput = this.normalizeRenderInput(input);
    const renderedAt = new Date().toISOString();
    const matchedRecords = this.resolveRenderableRecords(normalizedInput);
    const projectedFiles = matchedRecords.map((record) =>
      this.projectRecord(record, normalizedInput),
    );
    const verificationSummary = this.buildVerificationSummary(
      normalizedInput,
      projectedFiles,
      renderedAt,
    );
    const exportManifest = this.buildExportManifest(
      normalizedInput,
      projectedFiles,
      verificationSummary,
      renderedAt,
    );

    return {
      renderedAt,
      exportManifest,
      projectedFiles,
      verificationSummary,
      ...(normalizedInput.applyRoot && normalizedInput.applyReportPath
        ? {
            applyReport: this.buildApplyReport(
              normalizedInput,
              projectedFiles,
              verificationSummary,
              renderedAt,
            ),
          }
        : {}),
      ...(normalizedInput.bundleRoot && normalizedInput.packReportPath
        ? {
            packReport: this.buildPackReport(
              normalizedInput,
              projectedFiles,
              verificationSummary,
              renderedAt,
            ),
          }
        : {}),
    };
  }

  /**
   * Builds a repository apply report from one rendered export payload.
   * @param input Host renderer input.
   * @param projectedFiles Rendered projected files.
   * @param verificationSummary Optional verification summary override.
   * @param appliedAt Optional timestamp override.
   * @returns Apply report aligned to the rendered manifest.
   */
  public buildApplyReport(
    input: HostRendererRenderInput,
    projectedFiles: HostExportProjectedFile[],
    verificationSummary?: HostVerificationSummary,
    appliedAt = new Date().toISOString(),
  ): HostApplyReport {
    const normalizedInput = this.normalizeRenderInput(input);
    const discoveryState = this.readDiscoveryStateValue(
      normalizedInput.discoveryState ?? HostDistributionDiscoveryState.STAGED_EXPORT,
      'input.discoveryState',
    );
    if (normalizedInput.mode !== HostDistributionMode.PROJECT_LOCAL) {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        'Host apply report can only be built for project-local mode.',
        {
          host: normalizedInput.host,
          mode: normalizedInput.mode,
          target: normalizedInput.target,
        },
      );
    }

    const applyRoot = readRequiredString(
      normalizedInput.applyRoot,
      'input.applyRoot',
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    const applyReportPath = readRequiredString(
      normalizedInput.applyReportPath,
      'input.applyReportPath',
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    const summary =
      verificationSummary ??
      this.buildVerificationSummary(normalizedInput, projectedFiles, appliedAt, applyReportPath);
    const appliedFiles = projectedFiles.map((projectedFile) => ({
      ...projectedFile,
      hostPath: resolve(applyRoot, projectedFile.relativePath),
    }));

    return {
      schemaVersion: HOST_APPLY_REPORT_SCHEMA_VERSION,
      appliedAt,
      host: normalizedInput.host,
      mode: normalizedInput.mode,
      target: normalizedInput.target,
      stagedExportRoot: normalizedInput.stagedExportRoot,
      applyRoot,
      discoveryState,
      applyReportPath,
      exportManifestPath: normalizedInput.exportManifestPath,
      appliedFiles,
      skippedFiles: [],
      status: summary.status,
      verificationSummary: summary,
    };
  }

  /**
   * Builds a bundle report from one rendered export payload.
   * @param input Host renderer input.
   * @param projectedFiles Rendered projected files.
   * @param verificationSummary Optional verification summary override.
   * @param packedAt Optional timestamp override.
   * @returns Pack report aligned to the rendered manifest.
   */
  public buildPackReport(
    input: HostRendererRenderInput,
    projectedFiles: HostExportProjectedFile[],
    verificationSummary?: HostVerificationSummary,
    packedAt = new Date().toISOString(),
  ): HostPackReport {
    const normalizedInput = this.normalizeRenderInput(input);
    const discoveryState = this.readDiscoveryStateValue(
      normalizedInput.discoveryState ?? HostDistributionDiscoveryState.STAGED_EXPORT,
      'input.discoveryState',
    );
    if (normalizedInput.mode !== HostDistributionMode.PLUGIN_BUNDLE) {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        'Host pack report can only be built for plugin-bundle mode.',
        {
          host: normalizedInput.host,
          mode: normalizedInput.mode,
          target: normalizedInput.target,
        },
      );
    }

    const bundleRoot = readRequiredString(
      normalizedInput.bundleRoot,
      'input.bundleRoot',
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    const packReportPath = readRequiredString(
      normalizedInput.packReportPath,
      'input.packReportPath',
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    const summary =
      verificationSummary ??
      this.buildVerificationSummary(normalizedInput, projectedFiles, packedAt, packReportPath);
    const packedFiles = projectedFiles.map((projectedFile) => ({
      ...projectedFile,
      bundlePath: resolve(bundleRoot, projectedFile.relativePath),
    }));

    return {
      schemaVersion: HOST_PACK_REPORT_SCHEMA_VERSION,
      packedAt,
      host: normalizedInput.host,
      mode: normalizedInput.mode,
      target: normalizedInput.target,
      stagedExportRoot: normalizedInput.stagedExportRoot,
      bundleRoot,
      discoveryState,
      packReportPath,
      exportManifestPath: normalizedInput.exportManifestPath,
      packedFiles,
      status: summary.status,
      verificationSummary: summary,
    };
  }

  /**
   * Builds a host verification summary from one rendered export payload.
   * @param input Host renderer input.
   * @param projectedFiles Rendered projected files.
   * @param verifiedAt Optional timestamp override.
   * @param verificationSummaryPathOverride Optional summary-path override.
   * @returns Structured verification summary.
   */
  public buildVerificationSummary(
    input: HostRendererRenderInput,
    projectedFiles: HostExportProjectedFile[],
    verifiedAt = new Date().toISOString(),
    verificationSummaryPathOverride?: string,
  ): HostVerificationSummary {
    const normalizedInput = this.normalizeRenderInput(input);
    const handoffBridge = this.readHandoffBridgeValue(
      normalizedInput.handoffBridge ?? HostDistributionHandoffBridge.CLI_WRAPPER,
      'input.handoffBridge',
    );
    const discoveryState = this.readDiscoveryStateValue(
      normalizedInput.discoveryState ?? HostDistributionDiscoveryState.STAGED_EXPORT,
      'input.discoveryState',
    );
    const targetCapabilities = this.resolveTargetCapabilities(normalizedInput.target);
    const checks: HostVerificationCheck[] = [];
    const inspectedPaths = projectedFiles.map((projectedFile) => projectedFile.relativePath);
    const hasRenderableFiles = projectedFiles.length > 0;
    const canonicalSourceRefs = this.mergeStringLists(
      normalizedInput.canonicalSourceRefs ?? [],
      ...projectedFiles.map((projectedFile) => projectedFile.canonicalSourceRefs),
    );
    const sourcePackRefs = this.mergeStringLists(
      normalizedInput.sourcePackRefs ?? [],
      ...projectedFiles.map((projectedFile) => projectedFile.sourcePackRefs),
    );

    checks.push(
      this.createCheck(
        'canonical-source-refs',
        canonicalSourceRefs.length > 0,
        'Canonical source refs were captured for the export.',
        normalizedInput.exportManifestPath,
        'at least one canonical source ref',
        canonicalSourceRefs.join(', '),
      ),
    );
    checks.push(
      this.createCheck(
        'source-pack-refs',
        sourcePackRefs.length > 0,
        'Source pack refs were captured for the export.',
        normalizedInput.exportManifestPath,
        'at least one source pack ref',
        sourcePackRefs.join(', '),
      ),
    );
    checks.push(
      this.createCheck(
        'host-target-alignment',
        targetCapabilities.host === normalizedInput.host,
        `Target ${normalizedInput.target} belongs to host ${targetCapabilities.host}.`,
        normalizedInput.exportManifestPath,
        targetCapabilities.host,
        normalizedInput.host,
      ),
    );
    checks.push(
      this.createCheck(
        'mode-support',
        targetCapabilities.supportedModes.includes(normalizedInput.mode),
        targetCapabilities.supportedModes.length > 0
          ? `Mode ${normalizedInput.mode} is supported for target ${normalizedInput.target}.`
          : `Target ${normalizedInput.target} is reserved and does not yet advertise supported modes.`,
        normalizedInput.exportManifestPath,
        targetCapabilities.supportedModes.length > 0
          ? targetCapabilities.supportedModes.join(', ')
          : 'reserved target',
        normalizedInput.mode,
        targetCapabilities.supportedModes.length > 0
          ? HostVerificationStatus.FAIL
          : HostVerificationStatus.WARN,
      ),
    );
    checks.push(
      this.createCheck(
        'target-capability',
        targetCapabilities.isMvpTarget,
        targetCapabilities.isMvpTarget
          ? 'Target belongs to the MVP-support matrix.'
          : 'Target is reserved for follow-up and remains schema-safe only.',
        normalizedInput.exportManifestPath,
        'MVP target',
        targetCapabilities.target,
      ),
    );
    checks.push(
      this.createCheck(
        'rendered-files',
        hasRenderableFiles,
        hasRenderableFiles
          ? 'Rendered files were produced for the requested target.'
          : 'No rendered files were produced for the requested target.',
        inspectedPaths[0] ?? normalizedInput.stagedExportRoot,
        'at least one projected file',
        String(projectedFiles.length),
        hasRenderableFiles && targetCapabilities.isMvpTarget
          ? HostVerificationStatus.PASS
          : HostVerificationStatus.WARN,
      ),
    );
    checks.push(
      this.createCheck(
        'handoff-bridge',
        targetCapabilities.supportedHandoffBridges.includes(handoffBridge),
        `Handoff bridge is ${handoffBridge}.`,
        normalizedInput.exportManifestPath,
        targetCapabilities.supportedHandoffBridges.join(', '),
        handoffBridge,
      ),
    );
    checks.push(
      this.createCheck(
        'discovery-state',
        targetCapabilities.supportedDiscoveryStates.includes(discoveryState),
        `Discovery state is ${discoveryState}.`,
        normalizedInput.exportManifestPath,
        targetCapabilities.supportedDiscoveryStates.join(', '),
        discoveryState,
      ),
    );

    const verificationSummaryPath =
      verificationSummaryPathOverride ?? normalizedInput.verificationSummaryPath;

    return {
      schemaVersion: HOST_VERIFICATION_SUMMARY_SCHEMA_VERSION,
      status: this.reduceVerificationStatus(checks),
      verifiedAt,
      verificationSummaryPath,
      exportManifestPath: normalizedInput.exportManifestPath,
      checks,
      inspectedPaths,
      driftDetected: checks.some((check) => check.status === HostVerificationStatus.FAIL),
    };
  }

  private normalizeRenderInput(input: HostRendererRenderInput): HostRendererRenderInput {
    if (!input || typeof input !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        'Host renderer input must be an object.',
      );
    }

    return {
      host: this.readHostValue(input.host, 'input.host'),
      mode: this.readModeValue(input.mode, 'input.mode'),
      target: this.readTargetValue(input.target, 'input.target'),
      stagedExportRoot: readRequiredString(
        input.stagedExportRoot,
        'input.stagedExportRoot',
        GovernorErrorCode.RULE_RENDER_INVALID,
      ),
      exportManifestPath: readRequiredString(
        input.exportManifestPath,
        'input.exportManifestPath',
        GovernorErrorCode.RULE_RENDER_INVALID,
      ),
      verificationSummaryPath: readRequiredString(
        input.verificationSummaryPath,
        'input.verificationSummaryPath',
        GovernorErrorCode.RULE_RENDER_INVALID,
      ),
      canonicalSourceRefs: this.normalizeStringList(input.canonicalSourceRefs),
      sourcePackRefs: this.normalizeStringList(input.sourcePackRefs),
      workflowIds: this.normalizeStringList(input.workflowIds),
      discoveryState: this.readDiscoveryStateValue(
        input.discoveryState ?? HostDistributionDiscoveryState.STAGED_EXPORT,
        'input.discoveryState',
      ),
      handoffBridge: this.readHandoffBridgeValue(
        input.handoffBridge ?? HostDistributionHandoffBridge.CLI_WRAPPER,
        'input.handoffBridge',
      ),
      applyRoot:
        input.applyRoot === undefined || input.applyRoot === null
          ? undefined
          : readRequiredString(
              input.applyRoot,
              'input.applyRoot',
              GovernorErrorCode.RULE_RENDER_INVALID,
            ),
      applyReportPath:
        input.applyReportPath === undefined || input.applyReportPath === null
          ? undefined
          : readRequiredString(
              input.applyReportPath,
              'input.applyReportPath',
              GovernorErrorCode.RULE_RENDER_INVALID,
            ),
      bundleRoot:
        input.bundleRoot === undefined || input.bundleRoot === null
          ? undefined
          : readRequiredString(
              input.bundleRoot,
              'input.bundleRoot',
              GovernorErrorCode.RULE_RENDER_INVALID,
            ),
      packReportPath:
        input.packReportPath === undefined || input.packReportPath === null
          ? undefined
          : readRequiredString(
              input.packReportPath,
              'input.packReportPath',
              GovernorErrorCode.RULE_RENDER_INVALID,
            ),
    };
  }

  private normalizeRecord(record: StructuredWorkflowAssetRecord): StructuredWorkflowAssetRecord {
    if (!record || typeof record !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        'Structured workflow asset record must be an object.',
      );
    }

    return {
      workflowId: readRequiredString(
        record.workflowId,
        'record.workflowId',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      workflowVersion: readRequiredString(
        record.workflowVersion,
        'record.workflowVersion',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      workflowStatus: readRequiredString(
        record.workflowStatus,
        'record.workflowStatus',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      semanticOwnerModule: readRequiredString(
        record.semanticOwnerModule,
        'record.semanticOwnerModule',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      displayName: readRequiredString(
        record.displayName,
        'record.displayName',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      description: readRequiredString(
        record.description,
        'record.description',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      canonicalSourceRefs: this.normalizeRequiredStringList(
        record.canonicalSourceRefs,
        'record.canonicalSourceRefs',
      ),
      sourcePackRefs: this.normalizeRequiredStringList(
        record.sourcePackRefs,
        'record.sourcePackRefs',
      ),
      ...(record.projectedSkillMarkdown !== undefined
        ? {
            projectedSkillMarkdown: readRequiredString(
              record.projectedSkillMarkdown,
              'record.projectedSkillMarkdown',
              GovernorErrorCode.STANDARDS_PACK_INVALID,
            ),
          }
        : {}),
      hostTargetMatrix: this.normalizeTargetList(
        record.hostTargetMatrix,
        'record.hostTargetMatrix',
      ),
      triggerHints: this.normalizeStringList(record.triggerHints),
      inputs: this.normalizeStringList(record.inputs),
      artifacts: this.normalizeStringList(record.artifacts),
      riskTier: readRequiredString(
        record.riskTier,
        'record.riskTier',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      handoffBridge: this.readHandoffBridgeValue(
        record.handoffBridge,
        'record.handoffBridge',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      handoffTarget: readRequiredString(
        record.handoffTarget,
        'record.handoffTarget',
        GovernorErrorCode.STANDARDS_PACK_INVALID,
      ),
      verificationProfileRefs: this.normalizeStringList(record.verificationProfileRefs),
      driftChecks: this.normalizeStringList(record.driftChecks),
    };
  }

  private resolveRenderableRecords(
    input: HostRendererRenderInput,
  ): StructuredWorkflowAssetRecord[] {
    const selectedWorkflowIds = input.workflowIds ?? [];
    const registeredRecords = this.list();
    const selectedRecords =
      selectedWorkflowIds.length > 0
        ? registeredRecords.filter((record) => selectedWorkflowIds.includes(record.workflowId))
        : registeredRecords;

    return selectedRecords.filter((record) => record.hostTargetMatrix.includes(input.target));
  }

  private projectRecord(
    record: StructuredWorkflowAssetRecord,
    input: HostRendererRenderInput,
  ): HostExportProjectedFile {
    return {
      relativePath: this.buildProjectedRelativePath(input, record.workflowId),
      content: JSON.stringify(
        {
          workflowId: record.workflowId,
          workflowVersion: record.workflowVersion,
          workflowStatus: record.workflowStatus,
          semanticOwnerModule: record.semanticOwnerModule,
          displayName: record.displayName,
          description: record.description,
          canonicalSourceRefs: record.canonicalSourceRefs,
          sourcePackRefs: record.sourcePackRefs,
          ...(record.projectedSkillMarkdown
            ? {
                projectedSkillMarkdown: record.projectedSkillMarkdown,
              }
            : {}),
          hostTargetMatrix: record.hostTargetMatrix,
          triggerHints: record.triggerHints,
          inputs: record.inputs,
          artifacts: record.artifacts,
          riskTier: record.riskTier,
          handoffBridge: record.handoffBridge,
          handoffTarget: record.handoffTarget,
          verificationProfileRefs: record.verificationProfileRefs,
          driftChecks: record.driftChecks,
          target: input.target,
          host: input.host,
          mode: input.mode,
          discoveryState: input.discoveryState,
        },
        null,
        2,
      ),
      workflowId: record.workflowId,
      target: input.target,
      canonicalSourceRefs: record.canonicalSourceRefs,
      sourcePackRefs: record.sourcePackRefs,
    };
  }

  private buildExportManifest(
    input: HostRendererRenderInput,
    projectedFiles: HostExportProjectedFile[],
    verificationSummary: HostVerificationSummary,
    generatedAt: string,
  ): HostExportManifest {
    const matchedRecords = this.resolveRenderableRecords(input);
    const discoveryState = this.readDiscoveryStateValue(
      input.discoveryState ?? HostDistributionDiscoveryState.STAGED_EXPORT,
      'input.discoveryState',
    );
    const handoffBridge = this.readHandoffBridgeValue(
      input.handoffBridge ?? HostDistributionHandoffBridge.CLI_WRAPPER,
      'input.handoffBridge',
    );
    const canonicalSourceRefs = this.mergeStringLists(
      input.canonicalSourceRefs ?? [],
      ...matchedRecords.map((record) => record.canonicalSourceRefs),
    );
    const sourcePackRefs = this.mergeStringLists(
      input.sourcePackRefs ?? [],
      ...matchedRecords.map((record) => record.sourcePackRefs),
    );
    const workflowIds = this.mergeStringLists(
      input.workflowIds ?? [],
      ...matchedRecords.map((record) => [record.workflowId]),
    );

    return {
      schemaVersion: HOST_EXPORT_MANIFEST_SCHEMA_VERSION,
      generatedAt,
      host: input.host,
      mode: input.mode,
      target: input.target,
      stagedExportRoot: input.stagedExportRoot,
      discoveryState,
      semanticOwnerModule: matchedRecords[0]?.semanticOwnerModule ?? 'runtime.governance-clients',
      canonicalSourceRefs,
      sourcePackRefs,
      workflowIds,
      exportManifestPath: input.exportManifestPath,
      ...(input.applyReportPath ? { applyReportPath: input.applyReportPath } : {}),
      ...(input.packReportPath ? { packReportPath: input.packReportPath } : {}),
      handoffBridge,
      targetCapabilities: this.resolveTargetCapabilities(input.target),
      projectedFiles,
      verificationSummary,
    };
  }

  private buildProjectedRelativePath(input: HostRendererRenderInput, workflowId: string): string {
    return resolve('staged-export', input.host, input.mode, input.target, `${workflowId}.json`);
  }

  private mergeStringLists(...valueGroups: readonly (readonly string[] | undefined)[]): string[] {
    const mergedValues: string[] = [];
    for (const values of valueGroups) {
      for (const value of this.normalizeStringList(values)) {
        if (!mergedValues.includes(value)) {
          mergedValues.push(value);
        }
      }
    }

    return mergedValues;
  }

  private resolveTargetCapabilities(target: HostDistributionTarget): HostTargetCapabilities {
    switch (target) {
      case HostDistributionTarget.CODEX_PROJECT_LOCAL:
        return {
          host: HostDistributionHost.CODEX,
          target,
          supportedModes: [HostDistributionMode.PROJECT_LOCAL],
          supportedDiscoveryStates: [
            HostDistributionDiscoveryState.STAGED_EXPORT,
            HostDistributionDiscoveryState.HOST_DISCOVERABLE,
          ],
          supportedHandoffBridges: [
            HostDistributionHandoffBridge.CLI_WRAPPER,
            HostDistributionHandoffBridge.MCP,
          ],
          supportsApplyToRepo: true,
          supportsBundlePackaging: false,
          isMvpTarget: true,
        };
      case HostDistributionTarget.CODEX_PLUGIN:
        return {
          host: HostDistributionHost.CODEX,
          target,
          supportedModes: [HostDistributionMode.PLUGIN_BUNDLE],
          supportedDiscoveryStates: [
            HostDistributionDiscoveryState.STAGED_EXPORT,
            HostDistributionDiscoveryState.INSTALLED_BUNDLE,
          ],
          supportedHandoffBridges: [
            HostDistributionHandoffBridge.CLI_WRAPPER,
            HostDistributionHandoffBridge.MCP,
          ],
          supportsApplyToRepo: false,
          supportsBundlePackaging: true,
          isMvpTarget: true,
        };
      case HostDistributionTarget.CLAUDE_CODE_PROJECT_LOCAL:
        return {
          host: HostDistributionHost.CLAUDE_CODE,
          target,
          supportedModes: [HostDistributionMode.PROJECT_LOCAL],
          supportedDiscoveryStates: [
            HostDistributionDiscoveryState.STAGED_EXPORT,
            HostDistributionDiscoveryState.HOST_DISCOVERABLE,
          ],
          supportedHandoffBridges: [
            HostDistributionHandoffBridge.CLI_WRAPPER,
            HostDistributionHandoffBridge.MCP,
          ],
          supportsApplyToRepo: true,
          supportsBundlePackaging: false,
          isMvpTarget: true,
        };
      case HostDistributionTarget.CLAUDE_CODE_PLUGIN:
        return {
          host: HostDistributionHost.CLAUDE_CODE,
          target,
          supportedModes: [HostDistributionMode.PLUGIN_BUNDLE],
          supportedDiscoveryStates: [
            HostDistributionDiscoveryState.STAGED_EXPORT,
            HostDistributionDiscoveryState.INSTALLED_BUNDLE,
          ],
          supportedHandoffBridges: [
            HostDistributionHandoffBridge.CLI_WRAPPER,
            HostDistributionHandoffBridge.MCP,
          ],
          supportsApplyToRepo: false,
          supportsBundlePackaging: true,
          isMvpTarget: true,
        };
      case HostDistributionTarget.GITHUB_COPILOT_REPO_LOCAL:
        return {
          host: HostDistributionHost.GITHUB_COPILOT,
          target,
          supportedModes: [HostDistributionMode.PROJECT_LOCAL],
          supportedDiscoveryStates: [
            HostDistributionDiscoveryState.STAGED_EXPORT,
            HostDistributionDiscoveryState.HOST_DISCOVERABLE,
          ],
          supportedHandoffBridges: [
            HostDistributionHandoffBridge.CLI_WRAPPER,
            HostDistributionHandoffBridge.MCP,
          ],
          supportsApplyToRepo: true,
          supportsBundlePackaging: false,
          isMvpTarget: true,
        };
      case HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN:
        return {
          host: HostDistributionHost.GITHUB_COPILOT,
          target,
          supportedModes: [HostDistributionMode.PLUGIN_BUNDLE],
          supportedDiscoveryStates: [
            HostDistributionDiscoveryState.STAGED_EXPORT,
            HostDistributionDiscoveryState.INSTALLED_BUNDLE,
          ],
          supportedHandoffBridges: [
            HostDistributionHandoffBridge.CLI_WRAPPER,
            HostDistributionHandoffBridge.MCP,
          ],
          supportsApplyToRepo: false,
          supportsBundlePackaging: true,
          isMvpTarget: true,
        };
      case HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT:
        return {
          host: HostDistributionHost.GITHUB_COPILOT,
          target,
          supportedModes: [],
          supportedDiscoveryStates: [HostDistributionDiscoveryState.STAGED_EXPORT],
          supportedHandoffBridges: [HostDistributionHandoffBridge.CLI_WRAPPER],
          supportsApplyToRepo: false,
          supportsBundlePackaging: false,
          isMvpTarget: false,
        };
      default:
        throw new RuntimeError(
          GovernorErrorCode.RULE_RENDER_INVALID,
          `Unsupported host target "${target}".`,
          {
            target,
          },
        );
    }
  }

  private createCheck(
    checkId: string,
    passes: boolean,
    detail: string,
    inspectedPath: string,
    expectedValue: string,
    actualValue: string,
    failStatus: HostVerificationStatus = HostVerificationStatus.FAIL,
  ): HostVerificationCheck {
    return {
      checkId,
      status: passes ? HostVerificationStatus.PASS : failStatus,
      detail,
      inspectedPath,
      expectedValue,
      actualValue,
    };
  }

  private reduceVerificationStatus(checks: HostVerificationCheck[]): HostVerificationStatus {
    if (checks.some((check) => check.status === HostVerificationStatus.FAIL)) {
      return HostVerificationStatus.FAIL;
    }

    if (checks.some((check) => check.status === HostVerificationStatus.WARN)) {
      return HostVerificationStatus.WARN;
    }

    return HostVerificationStatus.PASS;
  }

  private readHostValue(value: unknown, fieldName: string): HostDistributionHost {
    const normalizedValue = readRequiredString(
      value,
      fieldName,
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    if (!HOST_DISTRIBUTION_HOST_VALUES.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        `Field "${fieldName}" must be one of ${Array.from(HOST_DISTRIBUTION_HOST_VALUES).join(', ')}.`,
      );
    }

    return normalizedValue as HostDistributionHost;
  }

  private readModeValue(value: unknown, fieldName: string): HostDistributionMode {
    const normalizedValue = readRequiredString(
      value,
      fieldName,
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    if (!HOST_DISTRIBUTION_MODE_VALUES.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        `Field "${fieldName}" must be one of ${Array.from(HOST_DISTRIBUTION_MODE_VALUES).join(', ')}.`,
      );
    }

    return normalizedValue as HostDistributionMode;
  }

  private readTargetValue(value: unknown, fieldName: string): HostDistributionTarget {
    const normalizedValue = readRequiredString(
      value,
      fieldName,
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    if (!HOST_DISTRIBUTION_TARGET_VALUES.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        `Field "${fieldName}" must be one of ${Array.from(HOST_DISTRIBUTION_TARGET_VALUES).join(', ')}.`,
      );
    }

    return normalizedValue as HostDistributionTarget;
  }

  private readDiscoveryStateValue(
    value: unknown,
    fieldName: string,
  ): HostDistributionDiscoveryState {
    const normalizedValue = readRequiredString(
      value,
      fieldName,
      GovernorErrorCode.RULE_RENDER_INVALID,
    );
    if (!HOST_DISTRIBUTION_DISCOVERY_STATE_VALUES.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.RULE_RENDER_INVALID,
        `Field "${fieldName}" must be one of ${Array.from(
          HOST_DISTRIBUTION_DISCOVERY_STATE_VALUES,
        ).join(', ')}.`,
      );
    }

    return normalizedValue as HostDistributionDiscoveryState;
  }

  private readHandoffBridgeValue(
    value: unknown,
    fieldName: string,
    errorCode: GovernorErrorCode = GovernorErrorCode.RULE_RENDER_INVALID,
  ): HostDistributionHandoffBridge {
    const normalizedValue = readRequiredString(value, fieldName, errorCode);
    if (!HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES.has(normalizedValue)) {
      throw new RuntimeError(
        errorCode,
        `Field "${fieldName}" must be one of ${Array.from(HOST_DISTRIBUTION_HANDOFF_BRIDGE_VALUES).join(', ')}.`,
      );
    }

    return normalizedValue as HostDistributionHandoffBridge;
  }

  private normalizeStringList(values: readonly unknown[] | undefined): string[] {
    if (!values) {
      return [];
    }

    const normalizedValues: string[] = [];
    for (const value of values) {
      if (typeof value !== 'string') {
        continue;
      }

      const normalizedValue = value.trim();
      if (normalizedValue) {
        normalizedValues.push(normalizedValue);
      }
    }

    return [...new Set(normalizedValues)];
  }

  private normalizeRequiredStringList(values: readonly unknown[], fieldName: string): string[] {
    const normalizedValues = this.normalizeStringList(values);
    if (normalizedValues.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Field "${fieldName}" must contain at least one string.`,
      );
    }

    return normalizedValues;
  }

  private normalizeTargetList(
    values: readonly unknown[],
    fieldName: string,
  ): HostDistributionTarget[] {
    const normalizedValues = this.normalizeRequiredStringList(values, fieldName).map((value) =>
      this.readTargetValue(value, fieldName),
    );

    return [...new Set(normalizedValues)];
  }
}
