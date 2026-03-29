import { resolve } from 'node:path';

import {
  type ProcessDslDefinition,
  type ProcessDslEdge,
  type ProcessDslNode,
  ProcessNodeType,
} from '@repo-ai-governor/core-process';
import {
  CLI_WORKFLOW_DEFINITION_FILE_NAME,
  CLI_WORKFLOW_DEFINITION_SCHEMA_VERSION,
  CLI_WORKFLOW_ROOT_SEGMENTS,
  CliWorkflowAction,
  CliWorkflowDefinitionSource,
  CliWorkflowEditorIssueCode,
  CliWorkflowEditorIssueSeverity,
  CliWorkflowTemplateId,
  DEFAULT_CLI_WORKFLOW_TEMPLATE_ID,
} from '../../constants/cli-workflow.constant.js';
import type {
  CliWorkflowEditorConditionBranchSummary,
  CliWorkflowEditorEdgeSummary,
  CliWorkflowEditorNodeSummary,
  CliWorkflowEditorPrepareOptions,
  CliWorkflowEditorSession,
  CliWorkflowEditorValidationIssue,
} from '../../types/index.js';
import { CliWorkflowPreviewTemplateCatalog } from '../workflow-preview/workflow-preview-template-catalog.js';

interface CliWorkflowDefinitionArtifactPayload {
  schema_version: string;
  generated_at: string;
  action: CliWorkflowAction;
  template_id: CliWorkflowTemplateId;
  definition_source: CliWorkflowDefinitionSource;
  definition: ProcessDslDefinition;
}

interface CliWorkflowEditorServiceDependencies {
  templateCatalog?: Pick<CliWorkflowPreviewTemplateCatalog, 'createPreviewDefinition'>;
}

/**
 * Owns workspace workflow definition loading, normalization, and semantic validation.
 */
export class CliWorkflowEditorService {
  private readonly templateCatalog: Pick<
    CliWorkflowPreviewTemplateCatalog,
    'createPreviewDefinition'
  >;

  public constructor(dependencies: CliWorkflowEditorServiceDependencies = {}) {
    this.templateCatalog = dependencies.templateCatalog ?? new CliWorkflowPreviewTemplateCatalog();
  }

  /**
   * Prepares one workflow editor session from either workspace persistence or a built-in seed.
   * @param options Session inputs including action, requested template, and workspace root.
   * @returns Prepared editor session with node/edge summaries and semantic validation issues.
   */
  public async prepareSession(
    options: CliWorkflowEditorPrepareOptions,
  ): Promise<CliWorkflowEditorSession> {
    const definitionPath = this.resolveDefinitionPath(options.workspaceRoot);
    const persistedDefinition =
      options.action === CliWorkflowAction.EDIT && options.requestedTemplateId === null
        ? await this.tryLoadPersistedDefinition(options)
        : null;
    const templateId =
      persistedDefinition?.templateId ??
      options.requestedTemplateId ??
      DEFAULT_CLI_WORKFLOW_TEMPLATE_ID;
    const definition = this.normalizeDefinition(
      persistedDefinition?.definition ??
        this.templateCatalog.createPreviewDefinition(templateId, options.executionId),
      templateId,
      options.executionId,
    );

    return {
      action: options.action,
      templateId,
      definitionSource:
        persistedDefinition?.definitionSource ??
        this.resolveDefaultDefinitionSource(options.action),
      definitionPath,
      definition,
      nodeSummaries: this.createNodeSummaries(definition.nodes),
      edgeSummaries: this.createEdgeSummaries(definition.edges),
      conditionBranchSummaries: this.createConditionBranchSummaries(definition),
      validationIssues: this.validateConditionBranches(definition),
    };
  }

  /**
   * Persists one validated workflow definition into the canonical workspace path.
   * @param session Prepared workflow editor session to persist.
   * @param artifactWriter Artifact writer bound to the current workspace.
   * @param generatedAt RFC3339 timestamp used for artifact metadata.
   * @returns Absolute persisted definition path.
   */
  public async persistDefinition(
    session: CliWorkflowEditorSession,
    artifactWriter: CliWorkflowEditorPrepareOptions['artifactWriter'],
    generatedAt: string,
  ): Promise<string> {
    const payload: CliWorkflowDefinitionArtifactPayload = {
      schema_version: CLI_WORKFLOW_DEFINITION_SCHEMA_VERSION,
      generated_at: generatedAt,
      action: session.action,
      template_id: session.templateId,
      definition_source: session.definitionSource,
      definition: session.definition,
    };
    await artifactWriter.writeJsonArtifact(session.definitionPath, payload);
    return session.definitionPath;
  }

  /**
   * Resolves the canonical saved workflow definition path for the workspace.
   * @param workspaceRoot Resolved workspace root.
   * @returns Absolute saved workflow definition path.
   */
  public resolveDefinitionPath(workspaceRoot: string): string {
    return resolve(workspaceRoot, ...CLI_WORKFLOW_ROOT_SEGMENTS, CLI_WORKFLOW_DEFINITION_FILE_NAME);
  }

  /**
   * Attempts to load one previously persisted workflow definition payload.
   * @param options Session inputs bound to the current workspace.
   * @returns Persisted definition metadata when a valid saved payload exists.
   */
  private async tryLoadPersistedDefinition(options: CliWorkflowEditorPrepareOptions): Promise<{
    templateId: CliWorkflowTemplateId;
    definitionSource: CliWorkflowDefinitionSource;
    definition: ProcessDslDefinition;
  } | null> {
    const payload = await options.artifactWriter.safeReadJson(
      this.resolveDefinitionPath(options.workspaceRoot),
    );
    if (!payload) {
      return null;
    }

    if (payload.schema_version !== CLI_WORKFLOW_DEFINITION_SCHEMA_VERSION) {
      return null;
    }

    const definitionCandidate = this.asRecord(payload.definition);
    const templateCandidate = payload.template_id;
    if (!definitionCandidate || typeof templateCandidate !== 'string') {
      return null;
    }

    return {
      templateId: this.normalizeTemplateId(templateCandidate),
      definitionSource: CliWorkflowDefinitionSource.WORKSPACE_SAVED,
      definition: this.toDefinition(definitionCandidate),
    };
  }

  /**
   * Normalizes one input DSL definition for editor and persistence reuse.
   * @param definition Raw DSL definition from persisted state or a template seed.
   * @param templateId Active built-in template id associated with this definition.
   * @param executionId Current execution id bound to the session.
   * @returns Normalized definition.
   */
  private normalizeDefinition(
    definition: ProcessDslDefinition,
    templateId: CliWorkflowTemplateId,
    executionId: string,
  ): ProcessDslDefinition {
    return {
      processId: definition.processId.trim(),
      executionId,
      entryNodeId: definition.entryNodeId.trim(),
      nodes: definition.nodes.map((node) => this.normalizeNode(node)),
      edges: definition.edges.map((edge) => this.normalizeEdge(edge)),
      globals: {
        ...(definition.globals ?? {}),
        templateId,
      },
    };
  }

  /**
   * Converts one loosely typed persisted payload into a DSL definition.
   * @param payload Record read from persisted workflow artifact.
   * @returns DSL definition used by the editor session.
   */
  private toDefinition(payload: Record<string, unknown>): ProcessDslDefinition {
    return {
      processId: typeof payload.processId === 'string' ? payload.processId : 'workflow-active',
      executionId: typeof payload.executionId === 'string' ? payload.executionId : 'workflow-edit',
      entryNodeId: typeof payload.entryNodeId === 'string' ? payload.entryNodeId : '',
      nodes: Array.isArray(payload.nodes)
        ? payload.nodes
            .map((node) => this.asRecord(node))
            .filter((node): node is Record<string, unknown> => node !== null)
            .map((node) => this.normalizeNode(node))
        : [],
      edges: Array.isArray(payload.edges)
        ? payload.edges
            .map((edge) => this.asRecord(edge))
            .filter((edge): edge is Record<string, unknown> => edge !== null)
            .map((edge) => this.normalizeEdge(edge))
        : [],
      globals: this.asRecord(payload.globals) ?? {},
    };
  }

  /**
   * Normalizes one workflow node into trimmed editor form.
   * @param node Raw or persisted workflow node.
   * @returns Normalized workflow node.
   */
  private normalizeNode(node: ProcessDslNode | Record<string, unknown>): ProcessDslNode {
    const limits = this.asRecord(node.limits);

    return {
      nodeId: typeof node.nodeId === 'string' ? node.nodeId.trim() : '',
      stageId: typeof node.stageId === 'string' ? node.stageId.trim() : '',
      nodeType:
        typeof node.nodeType === 'string'
          ? this.normalizeNodeType(node.nodeType.trim())
          : undefined,
      routeKey: typeof node.routeKey === 'string' ? node.routeKey.trim() : '',
      roleProfileId: typeof node.roleProfileId === 'string' ? node.roleProfileId.trim() : '',
      inputSchemaRef: typeof node.inputSchemaRef === 'string' ? node.inputSchemaRef.trim() : '',
      outputSchemaRef: typeof node.outputSchemaRef === 'string' ? node.outputSchemaRef.trim() : '',
      retryPolicyRef: typeof node.retryPolicyRef === 'string' ? node.retryPolicyRef.trim() : '',
      timeoutPolicyRef:
        typeof node.timeoutPolicyRef === 'string' ? node.timeoutPolicyRef.trim() : '',
      budgetPolicyRef: typeof node.budgetPolicyRef === 'string' ? node.budgetPolicyRef.trim() : '',
      ...(limits
        ? {
            limits: {
              ...(typeof limits.maxCycles === 'number' ? { maxCycles: limits.maxCycles } : {}),
              ...(typeof limits.maxWallTimeSeconds === 'number'
                ? { maxWallTimeSeconds: limits.maxWallTimeSeconds }
                : {}),
            },
          }
        : {}),
    };
  }

  /**
   * Normalizes one workflow edge into trimmed editor form.
   * @param edge Raw or persisted workflow edge.
   * @returns Normalized workflow edge.
   */
  private normalizeEdge(edge: ProcessDslEdge | Record<string, unknown>): ProcessDslEdge {
    return {
      fromNodeId: typeof edge.fromNodeId === 'string' ? edge.fromNodeId.trim() : '',
      toNodeId: typeof edge.toNodeId === 'string' ? edge.toNodeId.trim() : '',
      ...(typeof edge.conditionKey === 'string' && edge.conditionKey.trim().length > 0
        ? {
            conditionKey: edge.conditionKey.trim(),
          }
        : {}),
    };
  }

  /**
   * Creates ordered node summaries for shell preview and save receipts.
   * @param nodes Normalized workflow nodes.
   * @returns Node summary rows.
   */
  private createNodeSummaries(nodes: ProcessDslNode[]): CliWorkflowEditorNodeSummary[] {
    return nodes.map((node) => ({
      nodeId: node.nodeId ?? '',
      stageId: node.stageId ?? '',
      nodeType: node.nodeType ?? 'unknown',
      routeKey: node.routeKey ?? '',
      roleProfileId: node.roleProfileId ?? '',
      ...(typeof node.limits?.maxCycles === 'number' ? { maxCycles: node.limits.maxCycles } : {}),
      ...(typeof node.limits?.maxWallTimeSeconds === 'number'
        ? { maxWallTimeSeconds: node.limits.maxWallTimeSeconds }
        : {}),
    }));
  }

  /**
   * Creates ordered edge summaries for shell preview and save receipts.
   * @param edges Normalized workflow edges.
   * @returns Edge summary rows.
   */
  private createEdgeSummaries(edges: ProcessDslEdge[]): CliWorkflowEditorEdgeSummary[] {
    return edges.map((edge) => ({
      fromNodeId: edge.fromNodeId,
      toNodeId: edge.toNodeId,
      ...(edge.conditionKey ? { conditionKey: edge.conditionKey } : {}),
    }));
  }

  /**
   * Creates condition-branch summaries keyed by condition node id.
   * @param definition Normalized workflow definition.
   * @returns Condition branch summary rows.
   */
  private createConditionBranchSummaries(
    definition: ProcessDslDefinition,
  ): CliWorkflowEditorConditionBranchSummary[] {
    const outgoingEdges = this.collectIndexedOutgoingEdges(definition.edges);

    return definition.nodes
      .filter((node) => node.nodeType === ProcessNodeType.CONDITION)
      .map((node) => ({
        nodeId: node.nodeId ?? '',
        branchKeys: (outgoingEdges.get(node.nodeId ?? '') ?? [])
          .map(({ edge }) => edge.conditionKey)
          .filter((conditionKey): conditionKey is string => typeof conditionKey === 'string'),
      }));
  }

  /**
   * Validates condition-node branch semantics that the compiler does not enforce yet.
   * @param definition Normalized workflow definition.
   * @returns Semantic validation issues.
   */
  private validateConditionBranches(
    definition: ProcessDslDefinition,
  ): CliWorkflowEditorValidationIssue[] {
    const issues: CliWorkflowEditorValidationIssue[] = [];
    const outgoingEdges = this.collectIndexedOutgoingEdges(definition.edges);

    for (const node of definition.nodes) {
      if (node.nodeType !== ProcessNodeType.CONDITION) {
        continue;
      }

      const nodeId = node.nodeId ?? '';
      const branches = outgoingEdges.get(nodeId) ?? [];
      if (branches.length === 0) {
        issues.push({
          code: CliWorkflowEditorIssueCode.CONDITION_BRANCH_REQUIRED,
          severity: CliWorkflowEditorIssueSeverity.ERROR,
          location: `/nodes/${nodeId}/branches`,
        });
        continue;
      }

      const branchKeys = new Set<string>();
      for (const branch of branches) {
        const conditionKey = branch.edge.conditionKey?.trim();
        if (!conditionKey) {
          issues.push({
            code: CliWorkflowEditorIssueCode.CONDITION_BRANCH_KEY_REQUIRED,
            severity: CliWorkflowEditorIssueSeverity.ERROR,
            location: `/edges/${branch.index}/conditionKey`,
          });
          continue;
        }

        if (branchKeys.has(conditionKey)) {
          issues.push({
            code: CliWorkflowEditorIssueCode.CONDITION_BRANCH_DUPLICATED,
            severity: CliWorkflowEditorIssueSeverity.ERROR,
            location: `/edges/${branch.index}/conditionKey`,
          });
          continue;
        }

        branchKeys.add(conditionKey);
      }
    }

    return issues;
  }

  /**
   * Resolves the default definition source for one workflow action when no persisted state exists.
   * @param action Current workflow action.
   * @returns Default definition source.
   */
  private resolveDefaultDefinitionSource(action: CliWorkflowAction): CliWorkflowDefinitionSource {
    if (action === CliWorkflowAction.PREVIEW) {
      return CliWorkflowDefinitionSource.PREVIEW_TEMPLATE;
    }

    return CliWorkflowDefinitionSource.TEMPLATE_SEED;
  }

  /**
   * Normalizes one saved template id with safe fallback to the repo default.
   * @param templateIdCandidate Saved template id candidate.
   * @returns Valid template id.
   */
  private normalizeTemplateId(templateIdCandidate: string): CliWorkflowTemplateId {
    if (templateIdCandidate === DEFAULT_CLI_WORKFLOW_TEMPLATE_ID) {
      return DEFAULT_CLI_WORKFLOW_TEMPLATE_ID;
    }

    if (templateIdCandidate === CliWorkflowTemplateId.LOOP_GUARDED) {
      return CliWorkflowTemplateId.LOOP_GUARDED;
    }

    if (templateIdCandidate === CliWorkflowTemplateId.CONDITION_ROUTE) {
      return CliWorkflowTemplateId.CONDITION_ROUTE;
    }

    return DEFAULT_CLI_WORKFLOW_TEMPLATE_ID;
  }

  /**
   * Normalizes one saved node-type candidate with safe fallback to `undefined`.
   * @param nodeTypeCandidate Saved node-type candidate.
   * @returns Valid process node type or `undefined`.
   */
  private normalizeNodeType(nodeTypeCandidate: string): ProcessNodeType | undefined {
    if (nodeTypeCandidate === ProcessNodeType.SEQUENTIAL) {
      return ProcessNodeType.SEQUENTIAL;
    }

    if (nodeTypeCandidate === ProcessNodeType.PARALLEL) {
      return ProcessNodeType.PARALLEL;
    }

    if (nodeTypeCandidate === ProcessNodeType.LOOP) {
      return ProcessNodeType.LOOP;
    }

    if (nodeTypeCandidate === ProcessNodeType.CONDITION) {
      return ProcessNodeType.CONDITION;
    }

    return undefined;
  }

  /**
   * Groups outgoing edges by source node id.
   * @param edges Normalized workflow edges.
   * @returns Outgoing edge lookup.
   */
  private collectIndexedOutgoingEdges(
    edges: ProcessDslEdge[],
  ): Map<string, Array<{ edge: ProcessDslEdge; index: number }>> {
    const outgoingEdges = new Map<string, Array<{ edge: ProcessDslEdge; index: number }>>();

    for (const [index, edge] of edges.entries()) {
      const existingEdges = outgoingEdges.get(edge.fromNodeId) ?? [];
      existingEdges.push({ edge, index });
      outgoingEdges.set(edge.fromNodeId, existingEdges);
    }

    return outgoingEdges;
  }

  /**
   * Casts unknown input into a record when structurally possible.
   * @param value Unknown input candidate.
   * @returns Record value or `null`.
   */
  private asRecord(value: unknown): Record<string, unknown> | null {
    return value !== null && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : null;
  }
}
