import { existsSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  HOST_EXPORT_MANIFEST_SCHEMA_VERSION,
  HostDistributionDiscoveryState,
  HostDistributionHandoffBridge,
  HostDistributionHost,
  HostDistributionTarget,
  type HostExportManifest,
  type HostExportProjectedFile,
  type HostRendererRenderInput,
  type HostRendererRenderResult,
  type HostVerificationSummary,
  type StructuredWorkflowAssetRecord,
  StructuredWorkflowAssetRegistry,
} from '@repo-ai-governor/standards';
import {
  GITHUB_COPILOT_DEFAULT_HOST_DISTRIBUTION_HANDOFF_BRIDGE,
  GITHUB_COPILOT_DEFAULT_STAGED_EXPORT_ROOT,
  GITHUB_COPILOT_HOST_DISTRIBUTION_TARGET_VALUES,
} from './constants/index.js';

interface GithubCopilotHostRendererDependencies {
  registry?: StructuredWorkflowAssetRegistry;
  currentWorkingDirectory?: string;
}

/**
 * Renders GitHub Copilot repo-local, CLI plugin, and reserved GitHub.com agent host trees.
 */
export class GithubCopilotHostRenderer {
  private readonly registry: StructuredWorkflowAssetRegistry;
  private readonly currentWorkingDirectory: string;

  public constructor(dependencies: GithubCopilotHostRendererDependencies = {}) {
    this.registry = dependencies.registry ?? new StructuredWorkflowAssetRegistry();
    this.currentWorkingDirectory = dependencies.currentWorkingDirectory ?? process.cwd();
  }

  /**
   * Renders one GitHub Copilot host tree for the requested target.
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
    if (input.host !== HostDistributionHost.GITHUB_COPILOT) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        'GitHub Copilot host renderer only supports the github-copilot host family.',
        {
          host: input.host,
        },
      );
    }

    if (!GITHUB_COPILOT_HOST_DISTRIBUTION_TARGET_VALUES.has(input.target)) {
      throw new RuntimeError(
        GovernorErrorCode.STANDARDS_PACK_INVALID,
        `GitHub Copilot host renderer does not support target "${input.target}".`,
        {
          target: input.target,
        },
      );
    }

    return {
      ...input,
      stagedExportRoot: input.stagedExportRoot.trim() || GITHUB_COPILOT_DEFAULT_STAGED_EXPORT_ROOT,
      handoffBridge: input.handoffBridge ?? GITHUB_COPILOT_DEFAULT_HOST_DISTRIBUTION_HANDOFF_BRIDGE,
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
        'GitHub Copilot host renderer could not resolve any workflow records for the requested target.',
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
    if (input.target === HostDistributionTarget.GITHUB_COPILOT_CLI_PLUGIN) {
      return [
        this.createAggregateJsonFile(
          'plugin.json',
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
          join('hooks', 'hooks.json'),
          this.renderHooksConfiguration(input, records),
          input,
          records,
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
      this.createAggregateMarkdownFile(
        'AGENTS.md',
        this.renderAgentsMarkdown(input, records),
        input,
        records,
      ),
      this.createAggregateMarkdownFile(
        '.github/copilot-instructions.md',
        this.renderCopilotInstructionsMarkdown(input, records),
        input,
        records,
      ),
      ...records.map((record) =>
        this.createFile(
          join('.github', 'instructions', `${record.workflowId}.instructions.md`),
          this.renderInstructionMarkdown(input, record),
          input,
          record,
        ),
      ),
      ...records.map((record) =>
        this.createFile(
          join('.github', 'skills', record.workflowId, 'SKILL.md'),
          this.loadSkillMarkdown(record),
          input,
          record,
        ),
      ),
      ...records.map((record) =>
        this.createFile(
          join('.github', 'agents', `${record.workflowId}.agent.md`),
          this.renderAgentMarkdown(input, record),
          input,
          record,
        ),
      ),
      ...(input.target === HostDistributionTarget.GITHUB_COPILOT_GITHUB_COM_AGENT
        ? [
            this.createAggregateJsonFile(
              join('.github', 'hooks', 'hooks.json'),
              this.renderHooksConfiguration(input, records),
              input,
              records,
            ),
          ]
        : []),
      this.createAggregateJsonFile(
        '.github/mcp.json',
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
      '# GitHub Copilot Host Projection',
      '',
      `- Host: ${input.host}`,
      `- Target: ${input.target}`,
      `- Mode: ${input.mode}`,
      '',
      '## Workflows',
      ...records.flatMap((record) => [
        `### ${record.displayName}`,
        `- Workflow ID: ${record.workflowId}`,
        `- Canonical Source: ${record.canonicalSourceRefs.join(', ')}`,
        `- Handoff: ${record.handoffBridge} -> ${record.handoffTarget}`,
        '',
      ]),
    ]
      .join('\n')
      .trimEnd()}\n`;
  }

  private renderCopilotInstructionsMarkdown(
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): string {
    return `${[
      '# Repo AI Governor Copilot Instructions',
      '',
      `- Host: ${input.host}`,
      `- Target: ${input.target}`,
      `- Mode: ${input.mode}`,
      '',
      ...records.map((record) => `- ${record.displayName}: ${record.description}`),
    ]
      .join('\n')
      .trimEnd()}\n`;
  }

  private renderInstructionMarkdown(
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
      '',
      record.description,
    ]
      .join('\n')
      .trimEnd()}\n`;
  }

  private renderHooksConfiguration(
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): Record<string, unknown> {
    return {
      host: input.host,
      target: input.target,
      mode: input.mode,
      handoffBridge: input.handoffBridge ?? HostDistributionHandoffBridge.CLI_WRAPPER,
      hooks: records.map((record) => ({
        hookName: record.workflowId,
        path: join('hooks', `${record.workflowId}.hook.json`),
      })),
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
        hooks: [join('hooks', 'hooks.json')],
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

  private createAggregateJsonFile(
    relativePath: string,
    payload: Record<string, unknown>,
    input: HostRendererRenderInput,
    records: StructuredWorkflowAssetRecord[],
  ): HostExportProjectedFile {
    const firstRecord = records[0];
    return {
      relativePath,
      content: `${JSON.stringify(payload, null, 2)}\n`,
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
}
