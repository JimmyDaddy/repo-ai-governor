import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  HOST_EXPORT_MANIFEST_SCHEMA_VERSION,
  HostDistributionDiscoveryState,
  HostDistributionHandoffBridge,
  HostDistributionHost,
  HostDistributionMode,
  type HostExportManifest,
  type HostExportProjectedFile,
  type HostRendererRenderInput,
  type HostRendererRenderResult,
  type HostVerificationSummary,
  type StructuredWorkflowAssetRecord,
  StructuredWorkflowAssetRegistry,
} from '@repo-ai-governor/standards';
import {
  CODEX_DEFAULT_HOST_DISTRIBUTION_HANDOFF_BRIDGE,
  CODEX_DEFAULT_STAGED_EXPORT_ROOT,
  CODEX_HOST_DISTRIBUTION_TARGET_VALUES,
} from './constants/index.js';

interface CodexHostRendererDependencies {
  registry?: StructuredWorkflowAssetRegistry;
  currentWorkingDirectory?: string;
}

/**
 * Renders Codex project-local assets and plugin bundles from the shared workflow registry.
 */
export class CodexHostRenderer {
  private readonly registry: StructuredWorkflowAssetRegistry;
  private readonly currentWorkingDirectory: string;

  public constructor(dependencies: CodexHostRendererDependencies = {}) {
    this.registry = dependencies.registry ?? new StructuredWorkflowAssetRegistry();
    this.currentWorkingDirectory = dependencies.currentWorkingDirectory ?? process.cwd();
  }

  /**
   * Renders one Codex host tree for the requested target.
   * @param input Shared host-distribution render input.
   * @returns Rendered manifest, projected files, verification summary, and optional apply/pack reports.
   */
  public render(input: HostRendererRenderInput): HostRendererRenderResult {
    const normalizedInput = this.normalizeInput(input);
    const records = this.resolveRecords(normalizedInput);
    const renderedAt = new Date().toISOString();
    const projectedFiles = this.buildProjectedFiles(normalizedInput, records);
    const verificationSummary = this.registry.buildVerificationSummary(
      normalizedInput,
      projectedFiles,
      renderedAt,
    );
    const exportManifest = this.buildExportManifest(
      normalizedInput,
      records,
      projectedFiles,
      verificationSummary,
      renderedAt,
    );
    const applyReport =
      normalizedInput.applyRoot && normalizedInput.applyReportPath
        ? this.registry.buildApplyReport(
            {
              ...normalizedInput,
              discoveryState: HostDistributionDiscoveryState.HOST_DISCOVERABLE,
            },
            projectedFiles,
            undefined,
            renderedAt,
          )
        : undefined;
    const packReport =
      normalizedInput.bundleRoot && normalizedInput.packReportPath
        ? this.registry.buildPackReport(
            {
              ...normalizedInput,
              discoveryState: HostDistributionDiscoveryState.INSTALLED_BUNDLE,
            },
            projectedFiles,
            undefined,
            renderedAt,
          )
        : undefined;

    return {
      renderedAt,
      exportManifest,
      projectedFiles,
      verificationSummary,
      ...(applyReport ? { applyReport } : {}),
      ...(packReport ? { packReport } : {}),
    };
  }

  private normalizeInput(input: HostRendererRenderInput): HostRendererRenderInput {
    if (input.host !== HostDistributionHost.CODEX) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        'Codex host renderer only supports the codex host family.',
        {
          host: input.host,
        },
      );
    }

    if (!CODEX_HOST_DISTRIBUTION_TARGET_VALUES.has(input.target)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `Codex host renderer does not support target "${input.target}".`,
        {
          target: input.target,
        },
      );
    }

    return {
      ...input,
      stagedExportRoot: input.stagedExportRoot.trim() || CODEX_DEFAULT_STAGED_EXPORT_ROOT,
      handoffBridge: input.handoffBridge ?? CODEX_DEFAULT_HOST_DISTRIBUTION_HANDOFF_BRIDGE,
      discoveryState: input.discoveryState ?? HostDistributionDiscoveryState.STAGED_EXPORT,
    };
  }

  private resolveRecords(input: HostRendererRenderInput): StructuredWorkflowAssetRecord[] {
    const selectedWorkflowIds = input.workflowIds ?? [];
    const records = this.registry
      .list()
      .filter(
        (record) =>
          record.hostTargetMatrix.includes(input.target) &&
          (selectedWorkflowIds.length === 0 || selectedWorkflowIds.includes(record.workflowId)),
      );

    if (records.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        'Codex host renderer could not resolve any workflow records for the requested target.',
        {
          target: input.target,
          workflowIds: selectedWorkflowIds,
        },
      );
    }

    return records;
  }

  private buildProjectedFiles(
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): HostExportProjectedFile[] {
    if (input.mode === HostDistributionMode.PROJECT_LOCAL) {
      return [
        this.createAggregateMarkdownFile(
          'AGENTS.md',
          this.renderAgentsMarkdown(input, records),
          input,
          records,
        ),
        ...records.map((record) =>
          this.createFile(
            join('.agents', 'skills', record.workflowId, 'SKILL.md'),
            this.loadSkillMarkdown(record),
            input,
            record,
          ),
        ),
        ...records.map((record) =>
          this.createFile(
            join('.agents', 'subagents', `${record.workflowId}.json`),
            this.stringifyJson(this.renderSubagentMetadata(input, record)),
            input,
            record,
          ),
        ),
        this.createAggregateJsonFile(
          '.mcp.json',
          this.renderMcpConfiguration(input, records),
          input,
          records,
        ),
      ];
    }

    return [
      this.createAggregateJsonFile(
        '.codex-plugin/plugin.json',
        this.renderPluginManifest(input, records),
        input,
        records,
      ),
      ...records.map((record) =>
        this.createFile(
          join('skills', record.workflowId, 'SKILL.md'),
          this.loadSkillMarkdown(record),
          input,
          record,
        ),
      ),
      ...records.map((record) =>
        this.createFile(
          join('agents', `${record.workflowId}.agent.md`),
          this.renderAgentMarkdown(input, record),
          input,
          record,
        ),
      ),
      this.createAggregateJsonFile(
        '.mcp.json',
        this.renderMcpConfiguration(input, records),
        input,
        records,
      ),
    ];
  }

  private buildExportManifest(
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
    projectedFiles: HostExportProjectedFile[],
    verificationSummary: HostVerificationSummary,
    generatedAt: string,
  ): HostExportManifest {
    return {
      schemaVersion: HOST_EXPORT_MANIFEST_SCHEMA_VERSION,
      generatedAt,
      host: input.host,
      mode: input.mode,
      target: input.target,
      stagedExportRoot: input.stagedExportRoot,
      discoveryState: input.discoveryState ?? HostDistributionDiscoveryState.STAGED_EXPORT,
      semanticOwnerModule: records[0]?.semanticOwnerModule ?? 'runtime.governance-clients',
      canonicalSourceRefs: this.mergeStringLists(
        input.canonicalSourceRefs ?? [],
        ...records.map((record) => record.canonicalSourceRefs),
      ),
      sourcePackRefs: this.mergeStringLists(
        input.sourcePackRefs ?? [],
        ...records.map((record) => record.sourcePackRefs),
      ),
      workflowIds: records.map((record) => record.workflowId),
      exportManifestPath: input.exportManifestPath,
      ...(input.applyReportPath ? { applyReportPath: input.applyReportPath } : {}),
      ...(input.packReportPath ? { packReportPath: input.packReportPath } : {}),
      handoffBridge: input.handoffBridge ?? HostDistributionHandoffBridge.CLI_WRAPPER,
      targetCapabilities: this.registry.describeTargetCapabilities(input.target),
      projectedFiles,
      verificationSummary,
    };
  }

  private renderAgentsMarkdown(
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): string {
    return `${[
      '# Codex Host Projection',
      '',
      `- Host: ${input.host}`,
      `- Target: ${input.target}`,
      `- Mode: ${input.mode}`,
      `- Handoff Bridge: ${input.handoffBridge ?? HostDistributionHandoffBridge.CLI_WRAPPER}`,
      '',
      '## Workflows',
      ...records.flatMap((record) => [
        `### ${record.displayName}`,
        `- Workflow ID: ${record.workflowId}`,
        `- Owner Module: ${record.semanticOwnerModule}`,
        `- Canonical Source: ${record.canonicalSourceRefs.join(', ')}`,
        `- Source Packs: ${record.sourcePackRefs.join(', ')}`,
        '',
      ]),
    ]
      .join('\n')
      .trimEnd()}\n`;
  }

  private renderAgentMarkdown(
    input: HostRendererRenderInput,
    record: StructuredWorkflowAssetRecord,
  ): string {
    return `${[
      `# ${record.displayName}`,
      '',
      `- Host: ${input.host}`,
      `- Target: ${input.target}`,
      `- Workflow ID: ${record.workflowId}`,
      `- Handoff: ${record.handoffBridge} -> ${record.handoffTarget}`,
      '',
      record.description,
    ]
      .join('\n')
      .trimEnd()}\n`;
  }

  private renderSubagentMetadata(
    input: HostRendererRenderInput,
    record: StructuredWorkflowAssetRecord,
  ): Record<string, unknown> {
    return {
      host: input.host,
      target: input.target,
      mode: input.mode,
      workflowId: record.workflowId,
      displayName: record.displayName,
      semanticOwnerModule: record.semanticOwnerModule,
      canonicalSourceRefs: record.canonicalSourceRefs,
      serviceHostPackageExport: '@cjhdev/repo-ai-governor/service-host',
    };
  }

  private renderPluginManifest(
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): Record<string, unknown> {
    return {
      host: input.host,
      target: input.target,
      mode: input.mode,
      handoffBridge: input.handoffBridge ?? HostDistributionHandoffBridge.CLI_WRAPPER,
      serviceHostPackageExport: '@cjhdev/repo-ai-governor/service-host',
      workflowIds: records.map((record) => record.workflowId),
      canonicalSourceRefs: this.mergeStringLists(
        ...records.map((record) => record.canonicalSourceRefs),
      ),
      sourcePackRefs: this.mergeStringLists(...records.map((record) => record.sourcePackRefs)),
      entrypoints: {
        skills: records.map((record) => join('skills', record.workflowId, 'SKILL.md')),
        agents: records.map((record) => join('agents', `${record.workflowId}.agent.md`)),
      },
    };
  }

  private renderMcpConfiguration(
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): Record<string, unknown> {
    return {
      mcpServers: {
        'repo-ai-governor': {
          packageExport: '@cjhdev/repo-ai-governor/service-host',
          hostClass: 'LocalOrchestrationServiceSidecarHost',
          host: input.host,
          target: input.target,
          mode: input.mode,
          bridge: input.handoffBridge ?? HostDistributionHandoffBridge.CLI_WRAPPER,
          workflowIds: records.map((record) => record.workflowId),
        },
      },
    };
  }

  private loadSkillMarkdown(record: StructuredWorkflowAssetRecord): string {
    const skillPath = record.canonicalSourceRefs.find((sourceRef) =>
      sourceRef.endsWith('SKILL.md'),
    );
    if (skillPath) {
      const absolutePath = resolve(this.currentWorkingDirectory, skillPath);
      if (existsSync(absolutePath)) {
        return `${readFileSync(absolutePath, 'utf8').trimEnd()}\n`;
      }
    }

    return `${[
      `# ${record.displayName}`,
      '',
      `- Workflow ID: ${record.workflowId}`,
      `- Owner Module: ${record.semanticOwnerModule}`,
      '',
      record.description,
    ]
      .join('\n')
      .trimEnd()}\n`;
  }

  private createAggregateMarkdownFile(
    relativePath: string,
    content: string,
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): HostExportProjectedFile {
    return this.createAggregateFile(relativePath, content, input, records);
  }

  private createAggregateJsonFile(
    relativePath: string,
    payload: Record<string, unknown>,
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): HostExportProjectedFile {
    return this.createAggregateFile(relativePath, this.stringifyJson(payload), input, records);
  }

  private createAggregateFile(
    relativePath: string,
    content: string,
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): HostExportProjectedFile {
    const firstRecord = records[0];
    return {
      relativePath,
      content,
      workflowId: firstRecord?.workflowId ?? 'host-distribution',
      target: input.target,
      canonicalSourceRefs: this.mergeStringLists(
        ...records.map((record) => record.canonicalSourceRefs),
      ),
      sourcePackRefs: this.mergeStringLists(...records.map((record) => record.sourcePackRefs)),
    };
  }

  private createFile(
    relativePath: string,
    content: string,
    input: HostRendererRenderInput,
    record: StructuredWorkflowAssetRecord,
  ): HostExportProjectedFile {
    return {
      relativePath,
      content,
      workflowId: record.workflowId,
      target: input.target,
      canonicalSourceRefs: [...record.canonicalSourceRefs],
      sourcePackRefs: [...record.sourcePackRefs],
    };
  }

  private mergeStringLists(...valueGroups: readonly string[][]): string[] {
    return [...new Set(valueGroups.flat())];
  }

  private stringifyJson(payload: Record<string, unknown>): string {
    return `${JSON.stringify(payload, null, 2)}\n`;
  }
}
