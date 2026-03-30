import { readFile, readdir } from 'node:fs/promises';
import { resolve } from 'node:path';
import { parse } from 'yaml';

import type { AdaptersConfig, GovernorConfig } from '@repo-ai-governor/config';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import { CliConnectWriteMode } from '../constants/cli-connect.constant.js';

interface CliConnectDiffSummary {
  rolesAdded: string[];
  rolesRemoved: string[];
  rolesChanged: string[];
  toolsAdded: string[];
  toolsRemoved: string[];
  toolsChanged: string[];
  routingAdded: string[];
  routingRemoved: string[];
  routingChanged: string[];
  writeMode: CliConnectWriteMode;
  riskNotes: string[];
  applyReady: boolean;
  applyBlockers: string[];
}

interface CliConnectMergeExplainArtifact {
  writeMode: CliConnectWriteMode;
  untouchedTopLevelKeys: string[];
  candidateOwnedTopLevelKeys: string[];
  adapters: {
    roles: {
      added: string[];
      removed: string[];
      changed: string[];
      preserved: string[];
    };
    tools: {
      added: string[];
      removed: string[];
      changed: string[];
      preserved: string[];
    };
    routing: {
      added: string[];
      removed: string[];
      changed: string[];
      preserved: string[];
    };
  };
  riskNotes: string[];
}

interface CliConnectCandidateArtifacts {
  sourceConfigHash: string;
  candidateConfigHash: string;
  diffSummary: CliConnectDiffSummary;
  diffMarkdown: string;
  mergeExplain: CliConnectMergeExplainArtifact;
  applyReady: boolean;
  applyBlockers: string[];
  riskNotes: string[];
  writeMode: CliConnectWriteMode;
}

interface CliConnectResolvedCandidateReference {
  candidatePath: string;
  diagnosticsPath: string;
  candidateConfig: GovernorConfig;
  sourceConfigHash: string;
  diagnosticsCandidateConfigHash: string | null;
  candidateConfigHash: string;
  candidateFingerprintCurrent: boolean;
  writeMode: CliConnectWriteMode;
  applyReady: boolean;
  applyBlockers: string[];
  riskNotes: string[];
}

interface CliConnectCandidateDiagnosticsPayload {
  candidateConfigPath?: unknown;
  candidateFingerprint?: {
    writeMode?: unknown;
    candidateConfigHash?: unknown;
    sourceConfigHash?: unknown;
  } | null;
  onboardingContract?: {
    overwrite?: unknown;
  } | null;
  sourceConfig?: unknown;
}

/**
 * Owns deterministic connect candidate hashing, diff artifacts, and apply-resolution logic.
 *
 * Why this exists:
 * sprint-002 needs one focused runtime that keeps candidate/apply behavior out of the command
 * executor and lets `connect`, `connect diff`, and `connect apply` share one artifact contract.
 */
export class CliConnectWorkflowRuntime {
  /**
   * Builds deterministic candidate metadata and companion artifacts for `connect`.
   * @param options Source/candidate config pair plus verification facts.
   * @returns Candidate hashes, diff summary, markdown, and merge-explain payload.
   */
  public buildCandidateArtifacts(options: {
    sourceConfig: GovernorConfig;
    candidateConfig: GovernorConfig;
    overwrite: boolean;
    candidateValidationError: string | null;
    adapterVerification: {
      overallStatus: string;
      requiredRoleFailedCount: number;
      degradedRoleCount: number;
      fallbackRoleCount: number;
    };
  }): CliConnectCandidateArtifacts {
    const writeMode = options.overwrite ? CliConnectWriteMode.OVERWRITE : CliConnectWriteMode.MERGE;
    const sourceConfigHash = this.hashConfig(options.sourceConfig);
    const candidateConfigHash = this.hashConfig(options.candidateConfig);
    const riskNotes = this.buildRiskNotes({
      candidateValidationError: options.candidateValidationError,
      adapterVerification: options.adapterVerification,
    });
    const applyBlockers = this.buildApplyBlockers({
      candidateValidationError: options.candidateValidationError,
      adapterVerification: options.adapterVerification,
    });
    const diffSummary = this.buildDiffSummary({
      sourceConfig: options.sourceConfig,
      candidateConfig: options.candidateConfig,
      writeMode,
      riskNotes,
      applyBlockers,
    });
    const mergeExplain = this.buildMergeExplain({
      sourceConfig: options.sourceConfig,
      candidateConfig: options.candidateConfig,
      writeMode,
      riskNotes,
    });

    return {
      sourceConfigHash,
      candidateConfigHash,
      diffSummary,
      diffMarkdown: this.renderDiffMarkdown(diffSummary),
      mergeExplain,
      applyReady: applyBlockers.length === 0,
      applyBlockers,
      riskNotes,
      writeMode,
    };
  }

  /**
   * Resolves one previously generated candidate reference from explicit path or `--latest`.
   * @param options Candidate lookup options plus config validator.
   * @returns Resolved candidate payload backed by diagnostics metadata.
   */
  public async resolveCandidateReference(options: {
    currentWorkingDirectory: string;
    workspaceRoot: string;
    candidatePath: string | null;
    latest: boolean;
    validateGovernorConfig: (candidate: unknown) => GovernorConfig;
    fallbackAdaptersConfig: AdaptersConfig;
    resolveAdapterVerificationForConfig: (adaptersConfig: AdaptersConfig) => Promise<{
      overallStatus: string;
      requiredRoleFailedCount: number;
      degradedRoleCount: number;
      fallbackRoleCount: number;
    }>;
  }): Promise<CliConnectResolvedCandidateReference> {
    const diagnosticsPath = await this.resolveDiagnosticsPath(options);
    const diagnosticsPayload =
      await this.readJsonFile<CliConnectCandidateDiagnosticsPayload>(diagnosticsPath);
    const candidatePath = this.readRequiredString(
      diagnosticsPayload.candidateConfigPath,
      'candidateConfigPath',
      diagnosticsPath,
    );
    const candidateConfigContent = await this.readUtf8(candidatePath);
    const candidateConfig = options.validateGovernorConfig(parse(candidateConfigContent));
    const writeModeRaw = this.readOptionalString(
      diagnosticsPayload.candidateFingerprint?.writeMode,
    );
    const fallbackWriteMode =
      diagnosticsPayload.onboardingContract?.overwrite === true
        ? CliConnectWriteMode.OVERWRITE
        : CliConnectWriteMode.MERGE;
    const writeMode =
      writeModeRaw === CliConnectWriteMode.OVERWRITE
        ? CliConnectWriteMode.OVERWRITE
        : fallbackWriteMode;
    const diagnosticsCandidateConfigHash = this.readOptionalString(
      diagnosticsPayload.candidateFingerprint?.candidateConfigHash,
    );
    const candidateAdaptersConfig = candidateConfig.adapters ?? options.fallbackAdaptersConfig;
    const adapterVerification =
      await options.resolveAdapterVerificationForConfig(candidateAdaptersConfig);
    const candidateArtifacts = this.buildCandidateArtifacts({
      sourceConfig: options.validateGovernorConfig(
        diagnosticsPayload.sourceConfig ?? candidateConfig,
      ),
      candidateConfig,
      overwrite: writeMode === CliConnectWriteMode.OVERWRITE,
      candidateValidationError: null,
      adapterVerification: {
        overallStatus: adapterVerification.overallStatus,
        requiredRoleFailedCount: adapterVerification.requiredRoleFailedCount,
        degradedRoleCount: adapterVerification.degradedRoleCount,
        fallbackRoleCount: adapterVerification.fallbackRoleCount,
      },
    });
    const sourceConfigHash =
      this.readOptionalString(diagnosticsPayload.candidateFingerprint?.sourceConfigHash) ??
      this.hashConfig(diagnosticsPayload.sourceConfig ?? candidateConfig);
    const candidateFingerprintCurrent =
      diagnosticsCandidateConfigHash === null ||
      diagnosticsCandidateConfigHash === candidateArtifacts.candidateConfigHash;
    const riskNotes = candidateFingerprintCurrent
      ? [...candidateArtifacts.riskNotes]
      : ['candidate_fingerprint_drifted', ...candidateArtifacts.riskNotes];

    return {
      candidatePath,
      diagnosticsPath,
      candidateConfig,
      sourceConfigHash,
      diagnosticsCandidateConfigHash,
      candidateConfigHash: candidateArtifacts.candidateConfigHash,
      candidateFingerprintCurrent,
      writeMode,
      applyReady: candidateArtifacts.applyReady,
      applyBlockers: [...candidateArtifacts.applyBlockers],
      riskNotes,
    };
  }

  /**
   * Rebuilds diff and merge-explain artifacts against one resolved candidate reference.
   * @param options Active config and candidate reference.
   * @returns Updated diff summary and merge explain payload.
   */
  public buildDiffArtifacts(options: {
    currentConfig: GovernorConfig;
    candidateReference: CliConnectResolvedCandidateReference;
  }): {
    diffSummary: CliConnectDiffSummary;
    diffMarkdown: string;
    mergeExplain: CliConnectMergeExplainArtifact;
  } {
    const diffSummary = this.buildDiffSummary({
      sourceConfig: options.currentConfig,
      candidateConfig: options.candidateReference.candidateConfig,
      writeMode: options.candidateReference.writeMode,
      riskNotes: [...options.candidateReference.riskNotes],
      applyBlockers: [...options.candidateReference.applyBlockers],
    });
    const mergeExplain = this.buildMergeExplain({
      sourceConfig: options.currentConfig,
      candidateConfig: options.candidateReference.candidateConfig,
      writeMode: options.candidateReference.writeMode,
      riskNotes: [...options.candidateReference.riskNotes],
    });

    return {
      diffSummary,
      diffMarkdown: this.renderDiffMarkdown(diffSummary),
      mergeExplain,
    };
  }

  /**
   * Applies one resolved candidate and returns deterministic receipt metadata.
   * @param options Apply contract, including active config hashes and rollback policy.
   * @returns Receipt payload plus pre-write rollback snapshot content.
   */
  public buildApplyReceipt(options: {
    currentConfig: GovernorConfig;
    candidateReference: CliConnectResolvedCandidateReference;
    rollbackArtifactPath: string | null;
    sourceConfigPath: string;
    applyId: string;
    force: boolean;
    rollbackEnabled: boolean;
  }) {
    return {
      applyId: options.applyId,
      sourceConfigPath: options.sourceConfigPath,
      candidatePath: options.candidateReference.candidatePath,
      diagnosticsPath: options.candidateReference.diagnosticsPath,
      rollbackArtifactPath: options.rollbackArtifactPath,
      sourceConfigHash: this.hashConfig(options.currentConfig),
      diagnosticsCandidateConfigHash: options.candidateReference.diagnosticsCandidateConfigHash,
      candidateConfigHash: this.hashConfig(options.candidateReference.candidateConfig),
      candidateFingerprintCurrent: options.candidateReference.candidateFingerprintCurrent,
      writeMode: options.candidateReference.writeMode,
      forceApplied: options.force,
      rollbackEnabled: options.rollbackEnabled,
      applyReady: options.candidateReference.applyReady,
      applyBlockers: [...options.candidateReference.applyBlockers],
      riskNotes: [...options.candidateReference.riskNotes],
    };
  }

  /**
   * Returns whether the active config still matches the candidate source fingerprint.
   * @param currentConfig Active loaded config.
   * @param candidateReference Resolved candidate metadata.
   * @returns True when source fingerprint still matches.
   */
  public isSourceFingerprintCurrent(
    currentConfig: GovernorConfig,
    candidateReference: CliConnectResolvedCandidateReference,
  ): boolean {
    return this.hashConfig(currentConfig) === candidateReference.sourceConfigHash;
  }

  /**
   * Produces one stable hash for config-comparison surfaces.
   * @param config Config object to hash.
   * @returns Deterministic hash string.
   */
  public hashConfig(config: unknown): string {
    const normalized = JSON.stringify(this.sortValue(config));
    let hash = 0;
    for (let index = 0; index < normalized.length; index += 1) {
      hash = (hash * 31 + normalized.charCodeAt(index)) >>> 0;
    }
    return `cfg-${hash.toString(16).padStart(8, '0')}`;
  }

  private async resolveDiagnosticsPath(options: {
    currentWorkingDirectory: string;
    workspaceRoot: string;
    candidatePath: string | null;
    latest: boolean;
  }): Promise<string> {
    if (options.candidatePath) {
      const explicitPath = resolve(options.currentWorkingDirectory, options.candidatePath);
      if (explicitPath.endsWith('.json')) {
        return explicitPath;
      }

      if (explicitPath.endsWith('.governor.yaml')) {
        return explicitPath.replace(/\.governor\.yaml$/u, '.json');
      }

      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'connect diff/apply expects one candidate diagnostics JSON or candidate governor.yaml path.',
        {
          candidatePath: explicitPath,
        },
      );
    }

    if (!options.latest) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'connect diff/apply requires one candidate path or --latest.',
      );
    }

    const connectDiagnosticsDirectoryPath = resolve(
      options.workspaceRoot,
      'context',
      'diagnostics',
      'connect',
    );
    const fileNames = await readdir(connectDiagnosticsDirectoryPath).catch(() => []);
    const latestDiagnosticsFileName = fileNames
      .filter((fileName) => /^connect-\d+\.json$/u.test(fileName))
      .sort((left, right) => right.localeCompare(left))[0];
    if (!latestDiagnosticsFileName) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        'No connect diagnostics artifact is available for --latest.',
        {
          diagnosticsDirectoryPath: connectDiagnosticsDirectoryPath,
        },
      );
    }

    return resolve(connectDiagnosticsDirectoryPath, latestDiagnosticsFileName);
  }

  private buildDiffSummary(options: {
    sourceConfig: GovernorConfig;
    candidateConfig: GovernorConfig;
    writeMode: CliConnectWriteMode;
    riskNotes: string[];
    applyBlockers: string[];
  }): CliConnectDiffSummary {
    return {
      ...this.collectAdaptersDiff(
        options.sourceConfig.adapters ?? null,
        options.candidateConfig.adapters ?? null,
      ),
      writeMode: options.writeMode,
      riskNotes: [...options.riskNotes],
      applyReady: options.applyBlockers.length === 0,
      applyBlockers: [...options.applyBlockers],
    };
  }

  private buildMergeExplain(options: {
    sourceConfig: GovernorConfig;
    candidateConfig: GovernorConfig;
    writeMode: CliConnectWriteMode;
    riskNotes: string[];
  }): CliConnectMergeExplainArtifact {
    const sourceTopLevelKeys = Object.keys(options.sourceConfig).sort((left, right) =>
      left.localeCompare(right),
    );
    const candidateTopLevelKeys = Object.keys(options.candidateConfig).sort((left, right) =>
      left.localeCompare(right),
    );
    const adaptersDiff = this.collectAdaptersDiff(
      options.sourceConfig.adapters ?? null,
      options.candidateConfig.adapters ?? null,
    );

    return {
      writeMode: options.writeMode,
      untouchedTopLevelKeys: sourceTopLevelKeys.filter((key) => key !== 'adapters'),
      candidateOwnedTopLevelKeys: candidateTopLevelKeys.filter((key) => key === 'adapters'),
      adapters: {
        roles: {
          added: adaptersDiff.rolesAdded,
          removed: adaptersDiff.rolesRemoved,
          changed: adaptersDiff.rolesChanged,
          preserved: this.collectPreservedKeys(
            options.sourceConfig.adapters?.roles.map((role) => role.roleId) ?? [],
            [
              ...adaptersDiff.rolesAdded,
              ...adaptersDiff.rolesRemoved,
              ...adaptersDiff.rolesChanged,
            ],
          ),
        },
        tools: {
          added: adaptersDiff.toolsAdded,
          removed: adaptersDiff.toolsRemoved,
          changed: adaptersDiff.toolsChanged,
          preserved: this.collectPreservedKeys(
            options.sourceConfig.adapters?.tools?.map((tool) => tool.toolId) ?? [],
            [
              ...adaptersDiff.toolsAdded,
              ...adaptersDiff.toolsRemoved,
              ...adaptersDiff.toolsChanged,
            ],
          ),
        },
        routing: {
          added: adaptersDiff.routingAdded,
          removed: adaptersDiff.routingRemoved,
          changed: adaptersDiff.routingChanged,
          preserved: this.collectPreservedKeys(
            Object.keys(options.sourceConfig.adapters?.routing.roleBindings ?? {}),
            [
              ...adaptersDiff.routingAdded,
              ...adaptersDiff.routingRemoved,
              ...adaptersDiff.routingChanged,
            ],
          ),
        },
      },
      riskNotes: [...options.riskNotes],
    };
  }

  private collectAdaptersDiff(
    sourceAdapters: AdaptersConfig | null,
    candidateAdapters: AdaptersConfig | null,
  ) {
    const sourceRoles = new Map((sourceAdapters?.roles ?? []).map((role) => [role.roleId, role]));
    const candidateRoles = new Map(
      (candidateAdapters?.roles ?? []).map((role) => [role.roleId, role]),
    );
    const sourceTools = new Map((sourceAdapters?.tools ?? []).map((tool) => [tool.toolId, tool]));
    const candidateTools = new Map(
      (candidateAdapters?.tools ?? []).map((tool) => [tool.toolId, tool]),
    );
    const sourceRouting = sourceAdapters?.routing.roleBindings ?? {};
    const candidateRouting = candidateAdapters?.routing.roleBindings ?? {};

    return {
      rolesAdded: this.collectAddedKeys(sourceRoles, candidateRoles),
      rolesRemoved: this.collectRemovedKeys(sourceRoles, candidateRoles),
      rolesChanged: this.collectChangedKeys(sourceRoles, candidateRoles),
      toolsAdded: this.collectAddedKeys(sourceTools, candidateTools),
      toolsRemoved: this.collectRemovedKeys(sourceTools, candidateTools),
      toolsChanged: this.collectChangedKeys(sourceTools, candidateTools),
      routingAdded: this.collectAddedKeys(
        new Map(Object.entries(sourceRouting)),
        new Map(Object.entries(candidateRouting)),
      ),
      routingRemoved: this.collectRemovedKeys(
        new Map(Object.entries(sourceRouting)),
        new Map(Object.entries(candidateRouting)),
      ),
      routingChanged: this.collectChangedKeys(
        new Map(Object.entries(sourceRouting)),
        new Map(Object.entries(candidateRouting)),
      ),
    };
  }

  private collectAddedKeys<T>(source: Map<string, T>, candidate: Map<string, T>): string[] {
    return Array.from(candidate.keys())
      .filter((key) => !source.has(key))
      .sort((left, right) => left.localeCompare(right));
  }

  private collectRemovedKeys<T>(source: Map<string, T>, candidate: Map<string, T>): string[] {
    return Array.from(source.keys())
      .filter((key) => !candidate.has(key))
      .sort((left, right) => left.localeCompare(right));
  }

  private collectChangedKeys<T>(source: Map<string, T>, candidate: Map<string, T>): string[] {
    return Array.from(candidate.keys())
      .filter((key) => {
        if (!source.has(key)) {
          return false;
        }
        return (
          JSON.stringify(this.sortValue(source.get(key))) !==
          JSON.stringify(this.sortValue(candidate.get(key)))
        );
      })
      .sort((left, right) => left.localeCompare(right));
  }

  private collectPreservedKeys(sourceKeys: string[], changedKeys: string[]): string[] {
    const changedKeySet = new Set(changedKeys);
    return [...sourceKeys]
      .filter((key) => !changedKeySet.has(key))
      .sort((left, right) => left.localeCompare(right));
  }

  private buildRiskNotes(options: {
    candidateValidationError: string | null;
    adapterVerification: {
      overallStatus: string;
      requiredRoleFailedCount: number;
      degradedRoleCount: number;
      fallbackRoleCount: number;
    };
  }): string[] {
    const notes: string[] = [];
    if (options.candidateValidationError) {
      notes.push('candidate_validation_failed');
    }
    if (options.adapterVerification.requiredRoleFailedCount > 0) {
      notes.push('required_roles_unavailable');
    }
    if (options.adapterVerification.degradedRoleCount > 0) {
      notes.push('degraded_capability_coverage');
    }
    if (options.adapterVerification.fallbackRoleCount > 0) {
      notes.push('fallback_route_in_use');
    }
    if (
      options.adapterVerification.overallStatus !== 'pass' &&
      !notes.includes('required_roles_unavailable')
    ) {
      notes.push(`verification_status_${options.adapterVerification.overallStatus}`);
    }
    return notes;
  }

  private buildApplyBlockers(options: {
    candidateValidationError: string | null;
    adapterVerification: {
      requiredRoleFailedCount: number;
    };
  }): string[] {
    const blockers: string[] = [];
    if (options.candidateValidationError) {
      blockers.push('candidate_validation_failed');
    }
    if (options.adapterVerification.requiredRoleFailedCount > 0) {
      blockers.push('required_roles_unavailable');
    }
    return blockers;
  }

  private renderDiffMarkdown(diffSummary: CliConnectDiffSummary): string {
    const lines = [
      '# candidate_diff',
      '',
      `write_mode: ${diffSummary.writeMode}`,
      `apply_ready: ${String(diffSummary.applyReady)}`,
      '',
      '## roles_added',
      ...this.renderListSection(diffSummary.rolesAdded),
      '',
      '## roles_removed',
      ...this.renderListSection(diffSummary.rolesRemoved),
      '',
      '## roles_changed',
      ...this.renderListSection(diffSummary.rolesChanged),
      '',
      '## tools_added',
      ...this.renderListSection(diffSummary.toolsAdded),
      '',
      '## tools_removed',
      ...this.renderListSection(diffSummary.toolsRemoved),
      '',
      '## tools_changed',
      ...this.renderListSection(diffSummary.toolsChanged),
      '',
      '## routing_added',
      ...this.renderListSection(diffSummary.routingAdded),
      '',
      '## routing_removed',
      ...this.renderListSection(diffSummary.routingRemoved),
      '',
      '## routing_changed',
      ...this.renderListSection(diffSummary.routingChanged),
      '',
      '## apply_blockers',
      ...this.renderListSection(diffSummary.applyBlockers),
      '',
      '## risk_notes',
      ...this.renderListSection(diffSummary.riskNotes),
      '',
    ];

    return lines.join('\n');
  }

  private renderListSection(values: string[]): string[] {
    if (values.length === 0) {
      return ['- none'];
    }

    return values.map((value) => `- ${value}`);
  }

  private sortValue(value: unknown): unknown {
    if (Array.isArray(value)) {
      return value.map((item) => this.sortValue(item));
    }

    if (!value || typeof value !== 'object') {
      return value;
    }

    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nestedValue]) => [key, this.sortValue(nestedValue)]),
    );
  }

  private async readJsonFile<T extends object>(filePath: string): Promise<T> {
    const content = await this.readUtf8(filePath);
    try {
      return JSON.parse(content) as T;
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
        `Failed to parse JSON artifact at ${filePath}.`,
        {
          filePath,
          detail: standardizedError.message,
        },
      );
    }
  }

  private async readUtf8(filePath: string): Promise<string> {
    try {
      return await readFile(filePath, 'utf8');
    } catch (error) {
      const standardizedError = standardizeError(error);
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_READ_FAILED,
        `Failed to read file at ${filePath}.`,
        {
          filePath,
          detail: standardizedError.message,
        },
      );
    }
  }

  private readRequiredString(value: unknown, fieldName: string, filePath: string): string {
    if (typeof value !== 'string' || value.trim().length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.CONFIG_FILE_PARSE_FAILED,
        `Artifact ${filePath} is missing required string field ${fieldName}.`,
        {
          filePath,
          fieldName,
        },
      );
    }

    return value.trim();
  }

  private readOptionalString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
  }

  private readOptionalStringArray(value: unknown): string[] {
    return Array.isArray(value)
      ? value.filter((entry): entry is string => typeof entry === 'string' && entry.length > 0)
      : [];
  }
}
