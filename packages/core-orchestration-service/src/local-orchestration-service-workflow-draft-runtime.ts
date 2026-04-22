import { createHash, randomUUID } from 'node:crypto';
import { existsSync } from 'node:fs';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import {
  COMPILED_IR_ROOT_SEGMENTS,
  ProcessCompiler,
  type ProcessCompilerIssue,
  type ProcessDslDefinition,
  type ProcessDslEdge,
  type ProcessDslNode,
  ProcessNodeType,
} from '@repo-ai-governor/core-process';
import type {
  OrchestrationCommitWorkflowDraftRequest,
  OrchestrationStartWorkflowDraftRequest,
  OrchestrationUpdateWorkflowDraftEdgeRequest,
  OrchestrationUpdateWorkflowDraftNodeRequest,
  OrchestrationUpdateWorkflowDraftPolicyRequest,
  OrchestrationValidateWorkflowDraftRequest,
  OrchestrationWorkflowCompiledIrPreview,
  OrchestrationWorkflowDraftBacklinkArtifact,
  OrchestrationWorkflowDraftConflictState,
  OrchestrationWorkflowDraftEdgeSpec,
  OrchestrationWorkflowDraftMutationResponse,
  OrchestrationWorkflowDraftNodeSpec,
  OrchestrationWorkflowDraftSession,
  OrchestrationWorkflowDraftSessionQueryRequest,
  OrchestrationWorkflowDraftValidationIssue,
} from '@repo-ai-governor/orchestration-service-client';
import {
  OrchestrationWorkflowDraftConflictKind,
  OrchestrationWorkflowDraftEntryMode,
  OrchestrationWorkflowDraftSupportedPatchOp,
  OrchestrationWorkflowDraftValidationIssueSource,
} from '@repo-ai-governor/orchestration-service-client';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import {
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFAULT_TEMPLATE_ID,
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFINITION_FILE_NAME,
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFINITION_SCHEMA_VERSION,
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DIRECTORY_SEGMENTS,
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DRAFT_DIRECTORY_SEGMENTS,
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DRAFT_FILE_NAME,
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DRAFT_SCHEMA_VERSION,
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_EDITOR_ISSUE_CODE,
  LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_MISSING_BASE_DEFINITION_REVISION,
} from './constants/index.js';
import { LocalOrchestrationServiceWorkflowTemplateCatalog } from './local-orchestration-service-workflow-template-catalog.js';

type WorkflowDraftDefinitionSource = 'preview_template' | 'template_seed' | 'workspace_saved';

interface LocalOrchestrationServiceWorkflowDraftRuntimeDependencies {
  workspaceRoot: string;
  nowProvider?: () => Date;
  workflowDraftIdProvider?: () => string;
  processCompiler?: ProcessCompiler;
  templateCatalog?: Pick<
    LocalOrchestrationServiceWorkflowTemplateCatalog,
    'createDraftDefinition' | 'listTemplateIds'
  >;
}

interface PersistedWorkflowDraftSessionPayload {
  schemaVersion: string;
  updatedAt: string;
  definitionSource: WorkflowDraftDefinitionSource;
  session: OrchestrationWorkflowDraftSession;
  definition: ProcessDslDefinition;
}

interface PersistedWorkflowDefinitionPayload {
  schema_version: string;
  generated_at: string;
  action: string;
  template_id: string;
  definition_source: WorkflowDraftDefinitionSource;
  definition: ProcessDslDefinition;
}

interface PersistedWorkflowDefinitionRecord {
  templateId: string;
  definitionRevision: string;
  definition: ProcessDslDefinition;
}

interface FileArtifactBackup {
  filePath: string;
  existed: boolean;
  content?: string;
}

/**
 * Owns the service-native workflow draft-session lifecycle for direct workbench authoring.
 *
 * Why this exists:
 * sprint-002 must move workflow authoring off CLI summary bridges while keeping the local
 * orchestration service as the only draft/session truth owner for VS Code consumers.
 */
export class LocalOrchestrationServiceWorkflowDraftRuntime {
  private readonly nowProvider: () => Date;
  private readonly workflowDraftIdProvider: () => string;
  private readonly processCompiler: ProcessCompiler;
  private readonly templateCatalog: Pick<
    LocalOrchestrationServiceWorkflowTemplateCatalog,
    'createDraftDefinition' | 'listTemplateIds'
  >;

  public constructor(
    private readonly dependencies: LocalOrchestrationServiceWorkflowDraftRuntimeDependencies,
  ) {
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
    this.workflowDraftIdProvider =
      dependencies.workflowDraftIdProvider ??
      (() => `workflow-draft-${randomUUID().replace(/-/gu, '')}`);
    this.processCompiler = dependencies.processCompiler ?? new ProcessCompiler();
    this.templateCatalog =
      dependencies.templateCatalog ?? new LocalOrchestrationServiceWorkflowTemplateCatalog();
  }

  /**
   * Queries the latest persisted draft session.
   * @param request Optional draft selector.
   * @returns Draft-session snapshot when the service currently owns one persisted draft.
   */
  public async queryWorkflowDraftSession(
    request: OrchestrationWorkflowDraftSessionQueryRequest = {},
  ): Promise<OrchestrationWorkflowDraftSession | undefined> {
    const persistedDraftSession = await this.readPersistedDraftSession(
      request.workflowDraftId,
      request.locale,
    );
    return persistedDraftSession?.session;
  }

  /**
   * Starts one new service-owned draft session from either a built-in template or saved workflow.
   * @param request Requested entry mode, template, and locale.
   * @returns Created draft-session payload.
   */
  public async startWorkflowDraft(
    request: OrchestrationStartWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const entryMode = request.entryMode ?? OrchestrationWorkflowDraftEntryMode.READ_ONLY;
    const existingDraftSession = await this.readPersistedDraftSession(undefined, request.locale);
    if (
      existingDraftSession &&
      this.isMutableDraftSession(existingDraftSession.session) &&
      request.replaceExistingDraftSession !== true
    ) {
      return {
        applied: false,
        message: this.localizeText(
          request.locale,
          'A mutable workflow draft session is already active. Confirm replacement before starting a new draft.',
          '当前已有可编辑的工作流草稿会话；请先确认替换，再启动新的草稿。',
        ),
        draftSession: existingDraftSession.session,
      };
    }

    const workflowDraftId = this.workflowDraftIdProvider();
    const persistedDefinition = await this.tryLoadPersistedDefinition(request.locale);
    const requestedTemplateId = this.resolveRequestedTemplateId(request.templateId, request.locale);
    const useSavedDefinition = entryMode === OrchestrationWorkflowDraftEntryMode.EDIT_SEED;
    if (useSavedDefinition && !persistedDefinition) {
      throw new RuntimeError(
        GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
        this.localizeText(
          request.locale,
          'No saved workflow definition is available to edit yet.',
          '当前还没有可供编辑的已保存工作流定义。',
        ),
      );
    }
    const savedDefinition = useSavedDefinition ? persistedDefinition : undefined;
    const templateId = savedDefinition ? savedDefinition.templateId : requestedTemplateId;
    const draftDefinition = this.normalizeDefinition(
      savedDefinition
        ? savedDefinition.definition
        : this.templateCatalog.createDraftDefinition(templateId, workflowDraftId),
      savedDefinition ? savedDefinition.definition.executionId : workflowDraftId,
      templateId,
    );
    const baseDefinitionRevision = persistedDefinition?.definitionRevision
      ? persistedDefinition.definitionRevision
      : LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_MISSING_BASE_DEFINITION_REVISION;
    const session = this.buildDraftSession({
      workflowDraftId,
      definition: draftDefinition,
      templateId,
      entryMode,
      baseDefinitionRevision,
      locale: request.locale,
    });
    const persistedDraftPayload: PersistedWorkflowDraftSessionPayload = {
      schemaVersion: LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DRAFT_SCHEMA_VERSION,
      updatedAt: this.toTimestamp(),
      definitionSource: useSavedDefinition
        ? 'workspace_saved'
        : this.resolveDefinitionSource(entryMode),
      session,
      definition: draftDefinition,
    };

    await this.writePersistedDraftSession(persistedDraftPayload);

    return {
      applied: true,
      message: this.localizeText(
        request.locale,
        `Workflow draft session ${workflowDraftId} is ready.`,
        `工作流草稿会话 ${workflowDraftId} 已就绪。`,
      ),
      draftSession: session,
    };
  }

  /**
   * Applies one node upsert/remove mutation onto the service-owned draft session.
   * @param request Draft-session mutation request.
   * @returns Updated draft-session payload or a conflict response.
   */
  public async updateWorkflowDraftNode(
    request: OrchestrationUpdateWorkflowDraftNodeRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    return this.applyDraftMutation(request.workflowDraftId, request.draftRevision, request.locale, {
      definitionMutator: (definition) => {
        const targetNodeId = (request.nodeId ?? request.nodeSpec?.nodeId ?? '').trim();
        if (targetNodeId.length === 0) {
          throw new RuntimeError(
            GovernorErrorCode.AGENT_PROTOCOL_INVALID,
            this.localizeText(
              request.locale,
              'Workflow draft node update requires a nodeId.',
              '工作流草稿节点更新需要提供 nodeId。',
            ),
          );
        }

        if (request.remove === true) {
          const remainingNodes = definition.nodes.filter((node) => node.nodeId !== targetNodeId);
          if (remainingNodes.length === 0) {
            throw new RuntimeError(
              GovernorErrorCode.AGENT_PROTOCOL_INVALID,
              this.localizeText(
                request.locale,
                'Workflow drafts must keep at least one node. Add a replacement node before removing the current final node.',
                '工作流草稿必须至少保留一个节点；请先添加替代节点，再删除当前最后一个节点。',
              ),
            );
          }
          if (definition.entryNodeId === targetNodeId) {
            throw new RuntimeError(
              GovernorErrorCode.AGENT_PROTOCOL_INVALID,
              this.localizeText(
                request.locale,
                'Select a new entry node before removing the current workflow entry node.',
                '删除当前工作流入口节点前，请先选择新的入口节点。',
              ),
            );
          }

          definition.nodes = remainingNodes;
          definition.edges = definition.edges.filter(
            (edge) => edge.fromNodeId !== targetNodeId && edge.toNodeId !== targetNodeId,
          );
          return;
        }

        if (!request.nodeSpec) {
          throw new RuntimeError(
            GovernorErrorCode.AGENT_PROTOCOL_INVALID,
            this.localizeText(
              request.locale,
              'Workflow draft node upsert requires a nodeSpec payload.',
              '工作流草稿节点写入需要提供 nodeSpec。',
            ),
          );
        }

        const normalizedNode = this.toProcessDslNode({
          ...request.nodeSpec,
          nodeId: targetNodeId,
        });
        const existingIndex = definition.nodes.findIndex((node) => node.nodeId === targetNodeId);
        if (existingIndex >= 0) {
          definition.nodes[existingIndex] = normalizedNode;
        } else {
          definition.nodes.push(normalizedNode);
        }
        if (definition.entryNodeId.trim().length === 0) {
          definition.entryNodeId = targetNodeId;
        }
      },
    });
  }

  /**
   * Applies one edge upsert/remove mutation onto the service-owned draft session.
   * @param request Draft-session mutation request.
   * @returns Updated draft-session payload or a conflict response.
   */
  public async updateWorkflowDraftEdge(
    request: OrchestrationUpdateWorkflowDraftEdgeRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    return this.applyDraftMutation(request.workflowDraftId, request.draftRevision, request.locale, {
      definitionMutator: (definition) => {
        const normalizedEdge = this.toProcessDslEdge(request.edgeSpec);
        const previousEdgeSpec = request.previousEdgeSpec
          ? this.toProcessDslEdge(request.previousEdgeSpec)
          : undefined;
        const edgeMatches = (
          edge: ProcessDslEdge,
          expectedEdge: ProcessDslEdge = normalizedEdge,
        ): boolean =>
          edge.fromNodeId === expectedEdge.fromNodeId &&
          edge.toNodeId === expectedEdge.toNodeId &&
          (edge.conditionKey ?? '') === (expectedEdge.conditionKey ?? '');
        const existingIndex = definition.edges.findIndex((edge) =>
          edgeMatches(edge, previousEdgeSpec ?? normalizedEdge),
        );

        if (request.remove === true) {
          if (existingIndex < 0) {
            return;
          }
          definition.edges.splice(existingIndex, 1);
          return;
        }

        if (existingIndex >= 0) {
          definition.edges[existingIndex] = normalizedEdge;
          return;
        }

        if (previousEdgeSpec) {
          throw new RuntimeError(
            GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
            this.localizeText(
              request.locale,
              'The workflow edge selected for editing no longer exists in the draft session.',
              '当前选中的工作流连线已不存在于草稿会话中。',
            ),
          );
        }

        definition.edges.push(normalizedEdge);
      },
    });
  }

  /**
   * Applies one metadata/policy mutation onto the service-owned draft session.
   * @param request Draft-session mutation request.
   * @returns Updated draft-session payload or a conflict response.
   */
  public async updateWorkflowDraftPolicy(
    request: OrchestrationUpdateWorkflowDraftPolicyRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    return this.applyDraftMutation(request.workflowDraftId, request.draftRevision, request.locale, {
      definitionMutator: (definition) => {
        if (typeof request.processId === 'string') {
          definition.processId = request.processId.trim();
        }
        if (typeof request.entryNodeId === 'string') {
          definition.entryNodeId = request.entryNodeId.trim();
        }
        if (!request.nodeId) {
          return;
        }

        const node = definition.nodes.find((entry) => entry.nodeId === request.nodeId);
        if (!node) {
          throw new RuntimeError(
            GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
            this.localizeText(
              request.locale,
              `Workflow draft node "${request.nodeId}" was not found.`,
              `未找到工作流草稿节点 "${request.nodeId}"。`,
            ),
          );
        }

        if (typeof request.inputSchemaRef === 'string') {
          node.inputSchemaRef = request.inputSchemaRef.trim();
        }
        if (typeof request.outputSchemaRef === 'string') {
          node.outputSchemaRef = request.outputSchemaRef.trim();
        }
        if (typeof request.retryPolicyRef === 'string') {
          node.retryPolicyRef = request.retryPolicyRef.trim();
        }
        if (typeof request.timeoutPolicyRef === 'string') {
          node.timeoutPolicyRef = request.timeoutPolicyRef.trim();
        }
        if (typeof request.budgetPolicyRef === 'string') {
          node.budgetPolicyRef = request.budgetPolicyRef.trim();
        }
      },
    });
  }

  /**
   * Revalidates the current draft-session definition without mutating draft content.
   * @param request Draft-session validation request.
   * @returns Revalidated draft-session payload.
   */
  public async validateWorkflowDraft(
    request: OrchestrationValidateWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    return this.applyDraftMutation(request.workflowDraftId, request.draftRevision, request.locale, {
      definitionMutator: () => {},
      requiresMutableDraftSession: false,
      messageEnglish: `Workflow draft ${request.workflowDraftId} revalidated.`,
      messageChinese: `工作流草稿 ${request.workflowDraftId} 已重新校验。`,
    });
  }

  /**
   * Commits the current draft-session into the canonical workflow definition path when valid.
   * @param request Draft-session commit request.
   * @returns Commit result, or a conflict / validation-blocked response.
   */
  public async commitWorkflowDraft(
    request: OrchestrationCommitWorkflowDraftRequest,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const persistedDraftSession = await this.requirePersistedDraftSession(
      request.workflowDraftId,
      request.locale,
    );
    if (persistedDraftSession.session.entryMode === OrchestrationWorkflowDraftEntryMode.READ_ONLY) {
      return this.createReadOnlyDraftBlockedResponse(
        persistedDraftSession,
        request.locale,
        'Preview drafts are read-only and cannot be committed into the canonical workflow definition.',
        '预览草稿为只读，不能提交到规范工作流定义。',
      );
    }
    const revisionConflictResponse = await this.createDraftRevisionConflictResponse(
      persistedDraftSession,
      request.draftRevision,
      request.locale,
    );
    if (revisionConflictResponse) {
      return revisionConflictResponse;
    }

    const baseDefinitionConflictResponse = await this.createBaseDefinitionConflictResponse(
      persistedDraftSession,
      request.draftRevision,
      request.locale,
    );
    if (baseDefinitionConflictResponse) {
      return baseDefinitionConflictResponse;
    }

    const latestDraftSession = this.buildDraftSession({
      workflowDraftId: persistedDraftSession.session.workflowDraftId,
      definition: persistedDraftSession.definition,
      templateId: persistedDraftSession.session.templateId,
      entryMode: persistedDraftSession.session.entryMode,
      baseDefinitionRevision: persistedDraftSession.session.baseDefinitionRevision,
      locale: request.locale,
    });
    const hasBlockingIssue = latestDraftSession.validationIssues.some(
      (issue: OrchestrationWorkflowDraftValidationIssue) => issue.severity === 'error',
    );
    if (hasBlockingIssue || latestDraftSession.compiledIrPreview.compileErrorCount > 0) {
      const blockedSession: OrchestrationWorkflowDraftSession = {
        ...latestDraftSession,
        conflictState: {
          hasConflict: false,
          conflictKind: OrchestrationWorkflowDraftConflictKind.NONE,
          detectedAt: this.toTimestamp(),
        },
      };
      const blockedPayload: PersistedWorkflowDraftSessionPayload = {
        ...persistedDraftSession,
        updatedAt: this.toTimestamp(),
        session: blockedSession,
      };
      await this.writePersistedDraftSession(blockedPayload);
      return {
        applied: false,
        message: this.localizeText(
          request.locale,
          'Workflow draft commit is blocked until validation errors are resolved.',
          '工作流草稿在校验错误解决前不能提交。',
        ),
        draftSession: blockedSession,
      };
    }

    const committedAt = this.toTimestamp();
    const definitionPath = this.resolveWorkflowDefinitionPath();
    const persistedDefinitionPayload: PersistedWorkflowDefinitionPayload = {
      schema_version: LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFINITION_SCHEMA_VERSION,
      generated_at: committedAt,
      action: this.resolveWorkflowAction(latestDraftSession.entryMode),
      template_id: latestDraftSession.templateId,
      definition_source: persistedDraftSession.definitionSource,
      definition: persistedDraftSession.definition,
    };
    const compiledIr = this.processCompiler.compile(persistedDraftSession.definition);
    const compiledIrPath = this.resolveCompiledIrSnapshotPath(compiledIr.executionId);
    const committedRevision = this.createRevisionToken(persistedDraftSession.definition);
    const committedSession = this.buildDraftSession({
      workflowDraftId: latestDraftSession.workflowDraftId,
      definition: persistedDraftSession.definition,
      templateId: latestDraftSession.templateId,
      entryMode: latestDraftSession.entryMode,
      baseDefinitionRevision: committedRevision,
      locale: request.locale,
      compiledIrSnapshotPath: compiledIrPath,
    });
    const committedPayload: PersistedWorkflowDraftSessionPayload = {
      ...persistedDraftSession,
      updatedAt: committedAt,
      session: committedSession,
    };

    await this.writeCommittedWorkflowArtifacts({
      committedPayload,
      compiledIr,
      compiledIrPath,
      definitionPath,
      locale: request.locale,
      persistedDefinitionPayload,
    });

    return {
      applied: true,
      message: this.localizeText(
        request.locale,
        `Workflow draft ${request.workflowDraftId} committed.`,
        `工作流草稿 ${request.workflowDraftId} 已提交。`,
      ),
      draftSession: committedSession,
      definitionPath,
      compiledIrPath,
      committedAt,
    };
  }

  private async applyDraftMutation(
    workflowDraftId: string,
    draftRevision: string,
    locale: string | undefined,
    options: {
      definitionMutator: (definition: ProcessDslDefinition) => void;
      requiresMutableDraftSession?: boolean;
      messageEnglish?: string;
      messageChinese?: string;
    },
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const persistedDraftSession = await this.requirePersistedDraftSession(workflowDraftId, locale);
    if (
      options.requiresMutableDraftSession !== false &&
      persistedDraftSession.session.entryMode === OrchestrationWorkflowDraftEntryMode.READ_ONLY
    ) {
      return this.createReadOnlyDraftBlockedResponse(
        persistedDraftSession,
        locale,
        'Preview drafts are read-only and cannot be mutated.',
        '预览草稿为只读，不能修改。',
      );
    }
    const revisionConflictResponse = await this.createDraftRevisionConflictResponse(
      persistedDraftSession,
      draftRevision,
      locale,
    );
    if (revisionConflictResponse) {
      return revisionConflictResponse;
    }
    const baseDefinitionConflictResponse = await this.createBaseDefinitionConflictResponse(
      persistedDraftSession,
      draftRevision,
      locale,
    );
    if (baseDefinitionConflictResponse) {
      return baseDefinitionConflictResponse;
    }

    options.definitionMutator(persistedDraftSession.definition);
    const updatedSession = this.buildDraftSession({
      workflowDraftId: persistedDraftSession.session.workflowDraftId,
      definition: persistedDraftSession.definition,
      templateId: persistedDraftSession.session.templateId,
      entryMode: persistedDraftSession.session.entryMode,
      baseDefinitionRevision: persistedDraftSession.session.baseDefinitionRevision,
      locale,
    });
    const nextPayload: PersistedWorkflowDraftSessionPayload = {
      ...persistedDraftSession,
      updatedAt: this.toTimestamp(),
      session: updatedSession,
    };
    await this.writePersistedDraftSession(nextPayload);

    return {
      applied: true,
      message:
        options.messageEnglish && options.messageChinese
          ? this.localizeText(locale, options.messageEnglish, options.messageChinese)
          : this.localizeText(
              locale,
              `Workflow draft ${workflowDraftId} updated.`,
              `工作流草稿 ${workflowDraftId} 已更新。`,
            ),
      draftSession: updatedSession,
    };
  }

  private async createDraftRevisionConflictResponse(
    persistedDraftSession: PersistedWorkflowDraftSessionPayload,
    draftRevision: string,
    locale: string | undefined,
  ): Promise<OrchestrationWorkflowDraftMutationResponse | undefined> {
    if (persistedDraftSession.session.draftRevision === draftRevision) {
      return undefined;
    }

    return this.createTransientConflictResponse(
      persistedDraftSession,
      {
        hasConflict: true,
        conflictKind: OrchestrationWorkflowDraftConflictKind.STALE_DRAFT_REVISION,
        detectedAt: this.toTimestamp(),
        message: this.localizeText(
          locale,
          'The draft session revision is stale. Refresh the workflow draft before mutating it.',
          '当前草稿会话 revision 已过期；请先刷新工作流草稿再继续修改。',
        ),
        expectedDraftRevision: persistedDraftSession.session.draftRevision,
        currentDraftRevision: draftRevision,
        expectedBaseDefinitionRevision: persistedDraftSession.session.baseDefinitionRevision,
        currentBaseDefinitionRevision: persistedDraftSession.session.baseDefinitionRevision,
      },
      locale,
    );
  }

  private async createBaseDefinitionConflictResponse(
    persistedDraftSession: PersistedWorkflowDraftSessionPayload,
    draftRevision: string,
    locale: string | undefined,
  ): Promise<OrchestrationWorkflowDraftMutationResponse | undefined> {
    if (persistedDraftSession.session.entryMode === OrchestrationWorkflowDraftEntryMode.READ_ONLY) {
      return undefined;
    }

    const currentBaseDefinitionRevision = await this.readCurrentBaseDefinitionRevision();
    if (currentBaseDefinitionRevision === persistedDraftSession.session.baseDefinitionRevision) {
      return undefined;
    }

    return this.persistConflictResponse(
      persistedDraftSession,
      {
        hasConflict: true,
        conflictKind: OrchestrationWorkflowDraftConflictKind.BASE_DEFINITION_CHANGED,
        detectedAt: this.toTimestamp(),
        message: this.localizeText(
          locale,
          'The saved workflow definition changed after this draft session started.',
          '当前已保存的工作流定义在本草稿会话启动后发生了变化。',
        ),
        expectedDraftRevision: persistedDraftSession.session.draftRevision,
        currentDraftRevision: draftRevision,
        expectedBaseDefinitionRevision: persistedDraftSession.session.baseDefinitionRevision,
        currentBaseDefinitionRevision,
      },
      locale,
    );
  }

  private async persistConflictResponse(
    persistedDraftSession: PersistedWorkflowDraftSessionPayload,
    conflictState: OrchestrationWorkflowDraftConflictState,
    locale: string | undefined,
  ): Promise<OrchestrationWorkflowDraftMutationResponse> {
    const conflictedSession: OrchestrationWorkflowDraftSession = {
      ...persistedDraftSession.session,
      conflictState,
    };
    const conflictedPayload: PersistedWorkflowDraftSessionPayload = {
      ...persistedDraftSession,
      updatedAt: this.toTimestamp(),
      session: conflictedSession,
    };
    await this.writePersistedDraftSession(conflictedPayload);

    return {
      applied: false,
      message:
        conflictState.message ??
        this.localizeText(
          locale,
          'Workflow draft mutation did not apply because the session is conflicted.',
          '工作流草稿变更未应用，因为当前会话处于冲突状态。',
        ),
      draftSession: conflictedSession,
    };
  }

  private createTransientConflictResponse(
    persistedDraftSession: PersistedWorkflowDraftSessionPayload,
    conflictState: OrchestrationWorkflowDraftConflictState,
    locale: string | undefined,
  ): OrchestrationWorkflowDraftMutationResponse {
    const currentSession = persistedDraftSession.session;
    return {
      applied: false,
      message:
        currentSession.conflictState.hasConflict && currentSession.conflictState.message
          ? currentSession.conflictState.message
          : (conflictState.message ??
            this.localizeText(
              locale,
              'Workflow draft mutation did not apply because the session is conflicted.',
              '工作流草稿变更未应用，因为当前会话处于冲突状态。',
            )),
      draftSession: currentSession,
    };
  }

  private createReadOnlyDraftBlockedResponse(
    persistedDraftSession: PersistedWorkflowDraftSessionPayload,
    locale: string | undefined,
    messageEnglish: string,
    messageChinese: string,
  ): OrchestrationWorkflowDraftMutationResponse {
    return {
      applied: false,
      message: this.localizeText(locale, messageEnglish, messageChinese),
      draftSession: persistedDraftSession.session,
    };
  }

  private resolveSupportedPatchOps(
    entryMode: OrchestrationWorkflowDraftEntryMode,
  ): OrchestrationWorkflowDraftSupportedPatchOp[] {
    if (entryMode === OrchestrationWorkflowDraftEntryMode.READ_ONLY) {
      return [OrchestrationWorkflowDraftSupportedPatchOp.VALIDATE];
    }

    return [
      OrchestrationWorkflowDraftSupportedPatchOp.UPSERT_NODE,
      OrchestrationWorkflowDraftSupportedPatchOp.REMOVE_NODE,
      OrchestrationWorkflowDraftSupportedPatchOp.UPSERT_EDGE,
      OrchestrationWorkflowDraftSupportedPatchOp.REMOVE_EDGE,
      OrchestrationWorkflowDraftSupportedPatchOp.UPDATE_NODE_POLICY,
      OrchestrationWorkflowDraftSupportedPatchOp.UPDATE_WORKFLOW_METADATA,
      OrchestrationWorkflowDraftSupportedPatchOp.VALIDATE,
      OrchestrationWorkflowDraftSupportedPatchOp.COMMIT,
    ];
  }

  private isMutableDraftSession(session: OrchestrationWorkflowDraftSession): boolean {
    return session.entryMode !== OrchestrationWorkflowDraftEntryMode.READ_ONLY;
  }

  private buildDraftSession(options: {
    workflowDraftId: string;
    definition: ProcessDslDefinition;
    templateId: string;
    entryMode: OrchestrationWorkflowDraftEntryMode;
    baseDefinitionRevision: string;
    locale?: string;
    compiledIrSnapshotPath?: string;
  }): OrchestrationWorkflowDraftSession {
    const compiledIr = this.processCompiler.compile(options.definition);
    const validationIssues = [
      ...this.toCompilerValidationIssues(compiledIr.compileWarnings),
      ...this.toCompilerValidationIssues(compiledIr.compileErrors),
      ...this.validateConditionBranches(options.definition, options.locale),
    ];
    const draftRevision = this.createRevisionToken(options.definition);
    const draftSessionPath = this.resolveDraftSessionPath();
    const workflowDefinitionPath = this.resolveWorkflowDefinitionPath();

    return {
      workflowDraftId: options.workflowDraftId,
      draftRevision,
      baseDefinitionRevision: options.baseDefinitionRevision,
      templateId: options.templateId,
      entryMode: options.entryMode,
      nodeSpecs: options.definition.nodes.map((node) => this.toNodeSpec(node)),
      edgeSpecs: options.definition.edges.map((edge) => this.toEdgeSpec(edge)),
      supportedPatchOps: this.resolveSupportedPatchOps(options.entryMode),
      validationIssues,
      conflictState: {
        hasConflict: false,
        conflictKind: OrchestrationWorkflowDraftConflictKind.NONE,
        detectedAt: this.toTimestamp(),
      },
      compiledIrPreview: this.toCompiledIrPreview(compiledIr, options.compiledIrSnapshotPath),
      backlinkArtifacts: this.buildBacklinkArtifacts({
        draftSessionPath,
        workflowDefinitionPath,
        compiledIrSnapshotPath: options.compiledIrSnapshotPath,
      }),
    };
  }

  private toCompiledIrPreview(
    compiledIr: ReturnType<ProcessCompiler['compile']>,
    compiledIrSnapshotPath?: string,
  ): OrchestrationWorkflowCompiledIrPreview {
    return {
      processId: compiledIr.processId,
      entryNodeId: compiledIr.entryNodeId,
      compiledAt: compiledIr.compiledAt,
      nodeCount: compiledIr.nodes.length,
      edgeCount: compiledIr.edges.length,
      compileWarningCount: compiledIr.compileWarnings.length,
      compileErrorCount: compiledIr.compileErrors.length,
      compileWarnings: this.toCompilerValidationIssues(compiledIr.compileWarnings),
      compileErrors: this.toCompilerValidationIssues(compiledIr.compileErrors),
      ...(compiledIrSnapshotPath
        ? {
            snapshotPath: compiledIrSnapshotPath,
          }
        : {}),
    };
  }

  private buildBacklinkArtifacts(options: {
    draftSessionPath: string;
    workflowDefinitionPath: string;
    compiledIrSnapshotPath?: string;
  }): OrchestrationWorkflowDraftBacklinkArtifact[] {
    const backlinkArtifacts: OrchestrationWorkflowDraftBacklinkArtifact[] = [
      {
        artifactId: 'workflow_draft_session',
        artifactKind: 'workflow_draft_session',
        artifactPath: options.draftSessionPath,
      },
    ];

    if (existsSync(options.workflowDefinitionPath)) {
      backlinkArtifacts.push({
        artifactId: 'workflow_definition',
        artifactKind: 'workflow_definition',
        artifactPath: options.workflowDefinitionPath,
      });
    }

    if (options.compiledIrSnapshotPath) {
      backlinkArtifacts.push({
        artifactId: 'compiled_ir_preview',
        artifactKind: 'compiled_ir_preview',
        artifactPath: options.compiledIrSnapshotPath,
      });
    }

    return backlinkArtifacts;
  }

  private toCompilerValidationIssues(
    issues: readonly ProcessCompilerIssue[],
  ): OrchestrationWorkflowDraftValidationIssue[] {
    return issues.map((issue) => ({
      issueCode: issue.errorCode,
      severity: issue.severity,
      message: issue.message,
      location: issue.location,
      suggestion: issue.suggestion,
      issueSource: OrchestrationWorkflowDraftValidationIssueSource.COMPILER,
    }));
  }

  private validateConditionBranches(
    definition: ProcessDslDefinition,
    locale: string | undefined,
  ): OrchestrationWorkflowDraftValidationIssue[] {
    const issues: OrchestrationWorkflowDraftValidationIssue[] = [];
    const outgoingEdges = this.collectIndexedOutgoingEdges(definition.edges);

    for (const node of definition.nodes) {
      if (node.nodeType !== ProcessNodeType.CONDITION) {
        continue;
      }

      const nodeId = node.nodeId ?? '';
      const branches = outgoingEdges.get(nodeId) ?? [];
      if (branches.length === 0) {
        issues.push({
          issueCode:
            LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_EDITOR_ISSUE_CODE.CONDITION_BRANCH_REQUIRED,
          severity: 'error',
          location: `/nodes/${nodeId}/branches`,
          message: this.localizeText(
            locale,
            'Condition nodes must declare one or more branch edges.',
            'Condition 节点必须声明至少一个分支连线。',
          ),
          suggestion: this.localizeText(
            locale,
            'Add at least one outgoing edge with a stable condition key.',
            '请至少补上一条带稳定 condition key 的出边。',
          ),
          issueSource: OrchestrationWorkflowDraftValidationIssueSource.EDITOR,
        });
        continue;
      }

      const branchKeys = new Set<string>();
      for (const branch of branches) {
        const conditionKey = branch.edge.conditionKey?.trim();
        if (!conditionKey) {
          issues.push({
            issueCode:
              LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_EDITOR_ISSUE_CODE.CONDITION_BRANCH_KEY_REQUIRED,
            severity: 'error',
            location: `/edges/${branch.index}/conditionKey`,
            message: this.localizeText(
              locale,
              'Condition branches must declare one condition key.',
              'Condition 分支必须声明 condition key。',
            ),
            suggestion: this.localizeText(
              locale,
              'Fill the conditionKey field for every outgoing condition edge.',
              '请为每一条 condition 出边补全 conditionKey 字段。',
            ),
            issueSource: OrchestrationWorkflowDraftValidationIssueSource.EDITOR,
          });
          continue;
        }

        if (branchKeys.has(conditionKey)) {
          issues.push({
            issueCode:
              LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_EDITOR_ISSUE_CODE.CONDITION_BRANCH_DUPLICATED,
            severity: 'error',
            location: `/edges/${branch.index}/conditionKey`,
            message: this.localizeText(
              locale,
              'Condition branch keys must stay unique per condition node.',
              '同一个 Condition 节点下的分支 key 必须保持唯一。',
            ),
            suggestion: this.localizeText(
              locale,
              'Rename the duplicated conditionKey so every branch stays addressable.',
              '请重命名重复的 conditionKey，保证每个分支都能被唯一寻址。',
            ),
            issueSource: OrchestrationWorkflowDraftValidationIssueSource.EDITOR,
          });
          continue;
        }

        branchKeys.add(conditionKey);
      }
    }

    return issues;
  }

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

  private async requirePersistedDraftSession(
    workflowDraftId: string,
    locale?: string,
  ): Promise<PersistedWorkflowDraftSessionPayload> {
    const persistedDraftSession = await this.readPersistedDraftSession(workflowDraftId, locale);
    if (persistedDraftSession) {
      return persistedDraftSession;
    }

    throw new RuntimeError(
      GovernorErrorCode.WORKSPACE_SOURCE_NOT_FOUND,
      this.localizeText(
        undefined,
        `Workflow draft session "${workflowDraftId}" was not found.`,
        `未找到工作流草稿会话 "${workflowDraftId}"。`,
      ),
    );
  }

  private async readPersistedDraftSession(
    workflowDraftId?: string,
    locale?: string,
  ): Promise<PersistedWorkflowDraftSessionPayload | undefined> {
    const filePath = this.resolveDraftSessionPath();
    const payload = await this.readPersistedJsonArtifact({
      artifactLabelEnglish: 'workflow draft session',
      artifactLabelChinese: '工作流草稿会话',
      filePath,
      locale,
    });
    if (!payload) {
      return undefined;
    }

    if (payload.schemaVersion !== LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DRAFT_SCHEMA_VERSION) {
      throw this.createPersistedArtifactCorruptionError({
        artifactLabelEnglish: 'workflow draft session',
        artifactLabelChinese: '工作流草稿会话',
        filePath,
        locale,
        reason: 'schema_version_mismatch',
        details: {
          actualSchemaVersion: payload.schemaVersion ?? null,
          expectedSchemaVersion: LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DRAFT_SCHEMA_VERSION,
        },
      });
    }

    const definitionSource = this.asWorkflowDraftDefinitionSource(payload.definitionSource);
    const session = this.asWorkflowDraftSession(payload.session);
    const definition = this.asProcessDslDefinition(payload.definition);
    if (!definitionSource || !session || !definition) {
      throw this.createPersistedArtifactCorruptionError({
        artifactLabelEnglish: 'workflow draft session',
        artifactLabelChinese: '工作流草稿会话',
        filePath,
        locale,
        reason: 'payload_shape_invalid',
      });
    }

    if (workflowDraftId && session.workflowDraftId !== workflowDraftId) {
      return undefined;
    }

    const templateId = this.resolvePersistedTemplateId(session.templateId, {
      artifactLabelEnglish: 'workflow draft session',
      artifactLabelChinese: '工作流草稿会话',
      filePath,
      locale,
    });
    const normalizedDefinition = this.normalizeDefinition(
      definition,
      definition.executionId,
      templateId,
    );
    const rehydratedSession = this.buildDraftSession({
      workflowDraftId: session.workflowDraftId,
      definition: normalizedDefinition,
      templateId,
      entryMode: session.entryMode,
      baseDefinitionRevision: session.baseDefinitionRevision,
      compiledIrSnapshotPath: session.compiledIrPreview.snapshotPath,
      locale,
    });
    const normalizedConflictState = await this.resolveRehydratedConflictState(
      session,
      rehydratedSession,
      locale,
    );

    return {
      schemaVersion: payload.schemaVersion,
      updatedAt: typeof payload.updatedAt === 'string' ? payload.updatedAt : this.toTimestamp(),
      definitionSource,
      session: normalizedConflictState.hasConflict
        ? {
            ...rehydratedSession,
            conflictState: normalizedConflictState,
          }
        : rehydratedSession,
      definition: normalizedDefinition,
    };
  }

  private async tryLoadPersistedDefinition(
    locale?: string,
  ): Promise<PersistedWorkflowDefinitionRecord | null> {
    const filePath = this.resolveWorkflowDefinitionPath();
    const payload = await this.readPersistedJsonArtifact({
      artifactLabelEnglish: 'workflow definition',
      artifactLabelChinese: '工作流定义',
      filePath,
      locale,
    });
    if (!payload) {
      return null;
    }

    if (payload.schema_version !== LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFINITION_SCHEMA_VERSION) {
      throw this.createPersistedArtifactCorruptionError({
        artifactLabelEnglish: 'workflow definition',
        artifactLabelChinese: '工作流定义',
        filePath,
        locale,
        reason: 'schema_version_mismatch',
        details: {
          actualSchemaVersion: payload.schema_version ?? null,
          expectedSchemaVersion: LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFINITION_SCHEMA_VERSION,
        },
      });
    }

    const definition = this.asProcessDslDefinition(payload.definition);
    if (!definition) {
      throw this.createPersistedArtifactCorruptionError({
        artifactLabelEnglish: 'workflow definition',
        artifactLabelChinese: '工作流定义',
        filePath,
        locale,
        reason: 'payload_shape_invalid',
      });
    }

    const templateId = this.resolvePersistedTemplateId(payload.template_id, {
      artifactLabelEnglish: 'workflow definition',
      artifactLabelChinese: '工作流定义',
      filePath,
      locale,
    });
    const normalizedDefinition = this.normalizeDefinition(
      definition,
      definition.executionId || this.workflowDraftIdProvider(),
      templateId,
    );
    return {
      templateId,
      definitionRevision: this.createRevisionToken(normalizedDefinition),
      definition: normalizedDefinition,
    };
  }

  private normalizePersistedConflictState(
    conflictState: OrchestrationWorkflowDraftConflictState,
  ): OrchestrationWorkflowDraftConflictState {
    if (
      conflictState.hasConflict &&
      conflictState.conflictKind === OrchestrationWorkflowDraftConflictKind.BASE_DEFINITION_CHANGED
    ) {
      return conflictState;
    }

    return {
      hasConflict: false,
      conflictKind: OrchestrationWorkflowDraftConflictKind.NONE,
      detectedAt: conflictState.detectedAt ?? this.toTimestamp(),
    };
  }

  private async resolveRehydratedConflictState(
    persistedSession: OrchestrationWorkflowDraftSession,
    rehydratedSession: OrchestrationWorkflowDraftSession,
    locale?: string,
  ): Promise<OrchestrationWorkflowDraftConflictState> {
    if (persistedSession.entryMode === OrchestrationWorkflowDraftEntryMode.READ_ONLY) {
      return this.normalizePersistedConflictState(persistedSession.conflictState);
    }

    const currentBaseDefinitionRevision = await this.readCurrentBaseDefinitionRevision(locale);
    if (currentBaseDefinitionRevision !== persistedSession.baseDefinitionRevision) {
      return {
        hasConflict: true,
        conflictKind: OrchestrationWorkflowDraftConflictKind.BASE_DEFINITION_CHANGED,
        detectedAt: this.toTimestamp(),
        message: this.localizeText(
          undefined,
          'The saved workflow definition changed after this draft session started.',
          '当前已保存的工作流定义在本草稿会话启动后发生了变化。',
        ),
        expectedDraftRevision: rehydratedSession.draftRevision,
        currentDraftRevision: rehydratedSession.draftRevision,
        expectedBaseDefinitionRevision: persistedSession.baseDefinitionRevision,
        currentBaseDefinitionRevision,
      };
    }

    return this.normalizePersistedConflictState(persistedSession.conflictState);
  }

  private async readCurrentBaseDefinitionRevision(locale?: string): Promise<string> {
    const persistedDefinition = await this.tryLoadPersistedDefinition(locale);
    return (
      persistedDefinition?.definitionRevision ??
      LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_MISSING_BASE_DEFINITION_REVISION
    );
  }

  private async writePersistedDraftSession(
    payload: PersistedWorkflowDraftSessionPayload,
  ): Promise<void> {
    await this.writeJsonArtifact(this.resolveDraftSessionPath(), payload);
  }

  private resolveDraftSessionPath(): string {
    return resolve(
      this.dependencies.workspaceRoot,
      ...LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DRAFT_DIRECTORY_SEGMENTS,
      LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DRAFT_FILE_NAME,
    );
  }

  private resolveWorkflowDefinitionPath(): string {
    return resolve(
      this.dependencies.workspaceRoot,
      ...LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DIRECTORY_SEGMENTS,
      LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFINITION_FILE_NAME,
    );
  }

  private resolveCompiledIrSnapshotPath(executionId: string): string {
    return resolve(
      this.dependencies.workspaceRoot,
      ...COMPILED_IR_ROOT_SEGMENTS,
      `${executionId}.json`,
    );
  }

  private resolveDefinitionSource(
    entryMode: OrchestrationWorkflowDraftEntryMode,
  ): WorkflowDraftDefinitionSource {
    return entryMode === OrchestrationWorkflowDraftEntryMode.READ_ONLY
      ? 'preview_template'
      : 'template_seed';
  }

  private resolveWorkflowAction(entryMode: OrchestrationWorkflowDraftEntryMode): string {
    if (entryMode === OrchestrationWorkflowDraftEntryMode.CREATE_SEED) {
      return 'create';
    }

    if (entryMode === OrchestrationWorkflowDraftEntryMode.EDIT_SEED) {
      return 'edit';
    }

    return 'preview';
  }

  private normalizeTemplateId(templateIdCandidate?: string): string {
    if (!templateIdCandidate) {
      return LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFAULT_TEMPLATE_ID;
    }

    const normalizedTemplateId = templateIdCandidate.trim();
    return this.templateCatalog.listTemplateIds().includes(normalizedTemplateId)
      ? normalizedTemplateId
      : LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFAULT_TEMPLATE_ID;
  }

  private resolveRequestedTemplateId(
    templateIdCandidate: string | undefined,
    locale: string | undefined,
  ): string {
    if (!templateIdCandidate?.trim()) {
      return LOCAL_ORCHESTRATION_SERVICE_WORKFLOW_DEFAULT_TEMPLATE_ID;
    }

    const normalizedTemplateId = templateIdCandidate.trim();
    const supportedTemplateIds = this.templateCatalog.listTemplateIds();
    if (supportedTemplateIds.includes(normalizedTemplateId)) {
      return normalizedTemplateId;
    }

    throw new RuntimeError(
      GovernorErrorCode.AGENT_PROTOCOL_INVALID,
      this.localizeText(
        locale,
        `Unknown workflow template id "${normalizedTemplateId}". Choose one of: ${supportedTemplateIds.join(', ')}.`,
        `未知的工作流模板 ID“${normalizedTemplateId}”。可选值：${supportedTemplateIds.join('、')}。`,
      ),
      {
        templateId: normalizedTemplateId,
        supportedTemplateIds,
      },
    );
  }

  private normalizeDefinition(
    definition: ProcessDslDefinition,
    executionId: string,
    templateId: string,
  ): ProcessDslDefinition {
    return {
      processId: definition.processId.trim(),
      executionId,
      entryNodeId: definition.entryNodeId.trim(),
      nodes: definition.nodes.map((node) => this.toProcessDslNode(this.toNodeSpec(node))),
      edges: definition.edges.map((edge) => this.toProcessDslEdge(edge)),
      globals: {
        ...(definition.globals ?? {}),
        templateId,
      },
    };
  }

  private toNodeSpec(node: ProcessDslNode): OrchestrationWorkflowDraftNodeSpec {
    return {
      nodeId: node.nodeId?.trim() ?? '',
      stageId: node.stageId?.trim() ?? '',
      ...(node.nodeType
        ? {
            nodeType: node.nodeType,
          }
        : {}),
      routeKey: node.routeKey?.trim() ?? '',
      roleProfileId: node.roleProfileId?.trim() ?? '',
      ...(node.inputSchemaRef?.trim()
        ? {
            inputSchemaRef: node.inputSchemaRef.trim(),
          }
        : {}),
      ...(node.outputSchemaRef?.trim()
        ? {
            outputSchemaRef: node.outputSchemaRef.trim(),
          }
        : {}),
      ...(node.retryPolicyRef?.trim()
        ? {
            retryPolicyRef: node.retryPolicyRef.trim(),
          }
        : {}),
      ...(node.timeoutPolicyRef?.trim()
        ? {
            timeoutPolicyRef: node.timeoutPolicyRef.trim(),
          }
        : {}),
      ...(node.budgetPolicyRef?.trim()
        ? {
            budgetPolicyRef: node.budgetPolicyRef.trim(),
          }
        : {}),
      ...(typeof node.limits?.maxCycles === 'number'
        ? {
            maxCycles: node.limits.maxCycles,
          }
        : {}),
      ...(typeof node.limits?.maxWallTimeSeconds === 'number'
        ? {
            maxWallTimeSeconds: node.limits.maxWallTimeSeconds,
          }
        : {}),
    };
  }

  private toProcessDslNode(nodeSpec: OrchestrationWorkflowDraftNodeSpec): ProcessDslNode {
    return {
      nodeId: nodeSpec.nodeId.trim(),
      stageId: nodeSpec.stageId.trim(),
      nodeType: nodeSpec.nodeType,
      routeKey: nodeSpec.routeKey.trim(),
      roleProfileId: nodeSpec.roleProfileId.trim(),
      inputSchemaRef: nodeSpec.inputSchemaRef?.trim() ?? '',
      outputSchemaRef: nodeSpec.outputSchemaRef?.trim() ?? '',
      retryPolicyRef: nodeSpec.retryPolicyRef?.trim() ?? '',
      timeoutPolicyRef: nodeSpec.timeoutPolicyRef?.trim() ?? '',
      budgetPolicyRef: nodeSpec.budgetPolicyRef?.trim() ?? '',
      ...(typeof nodeSpec.maxCycles === 'number' || typeof nodeSpec.maxWallTimeSeconds === 'number'
        ? {
            limits: {
              ...(typeof nodeSpec.maxCycles === 'number'
                ? {
                    maxCycles: nodeSpec.maxCycles,
                  }
                : {}),
              ...(typeof nodeSpec.maxWallTimeSeconds === 'number'
                ? {
                    maxWallTimeSeconds: nodeSpec.maxWallTimeSeconds,
                  }
                : {}),
            },
          }
        : {}),
    };
  }

  private toEdgeSpec(edge: ProcessDslEdge): OrchestrationWorkflowDraftEdgeSpec {
    return {
      fromNodeId: edge.fromNodeId.trim(),
      toNodeId: edge.toNodeId.trim(),
      ...(edge.conditionKey?.trim()
        ? {
            conditionKey: edge.conditionKey.trim(),
          }
        : {}),
    };
  }

  private toProcessDslEdge(edgeSpec: OrchestrationWorkflowDraftEdgeSpec): ProcessDslEdge {
    return {
      fromNodeId: edgeSpec.fromNodeId.trim(),
      toNodeId: edgeSpec.toNodeId.trim(),
      ...(edgeSpec.conditionKey?.trim()
        ? {
            conditionKey: edgeSpec.conditionKey.trim(),
          }
        : {}),
    };
  }

  private async writeJsonArtifact(filePath: string, payload: unknown): Promise<void> {
    try {
      await mkdir(dirname(filePath), { recursive: true });
      await writeFile(filePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
        `Failed to persist workflow artifact at "${filePath}".`,
        {
          artifactPath: filePath,
          reason: 'write_failed',
        },
        error,
      );
    }
  }

  private async writeCommittedWorkflowArtifacts(options: {
    committedPayload: PersistedWorkflowDraftSessionPayload;
    compiledIr: ReturnType<ProcessCompiler['compile']>;
    compiledIrPath: string;
    definitionPath: string;
    locale?: string;
    persistedDefinitionPayload: PersistedWorkflowDefinitionPayload;
  }): Promise<void> {
    const artifactBackups = await Promise.all([
      this.captureArtifactBackup(options.definitionPath),
      this.captureArtifactBackup(options.compiledIrPath),
      this.captureArtifactBackup(this.resolveDraftSessionPath()),
    ]);

    try {
      this.processCompiler.persistCompiledIrSnapshot(
        this.dependencies.workspaceRoot,
        options.compiledIr,
      );
      await this.writeJsonArtifact(options.definitionPath, options.persistedDefinitionPayload);
      await this.writePersistedDraftSession(options.committedPayload);
    } catch (error) {
      await this.rollbackCommittedWorkflowArtifacts(artifactBackups, error, options.locale);
    }
  }

  private async captureArtifactBackup(filePath: string): Promise<FileArtifactBackup> {
    try {
      return {
        filePath,
        existed: true,
        content: await readFile(filePath, 'utf8'),
      };
    } catch (error) {
      if (this.isFileMissingError(error)) {
        return {
          filePath,
          existed: false,
        };
      }

      throw new RuntimeError(
        GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
        `Failed to capture workflow artifact backup at "${filePath}".`,
        {
          artifactPath: filePath,
          reason: 'backup_read_failed',
        },
        error,
      );
    }
  }

  private async rollbackCommittedWorkflowArtifacts(
    artifactBackups: FileArtifactBackup[],
    originalError: unknown,
    locale?: string,
  ): Promise<never> {
    try {
      for (const artifactBackup of artifactBackups) {
        await this.restoreArtifactBackup(artifactBackup);
      }
    } catch (rollbackError) {
      const standardizedCommitError = standardizeError(originalError);
      const standardizedRollbackError = standardizeError(rollbackError);
      throw new RuntimeError(
        GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
        this.localizeText(
          locale,
          'Workflow draft commit failed and rollback could not restore the previous durable state.',
          '工作流草稿提交失败，且回滚无法恢复之前的持久化状态。',
        ),
        {
          artifactPaths: artifactBackups.map((artifactBackup) => artifactBackup.filePath),
          commitError: standardizedCommitError.message,
          rollbackError: standardizedRollbackError.message,
        },
        rollbackError,
      );
    }

    throw originalError;
  }

  private async restoreArtifactBackup(artifactBackup: FileArtifactBackup): Promise<void> {
    if (artifactBackup.existed) {
      await mkdir(dirname(artifactBackup.filePath), { recursive: true });
      await writeFile(artifactBackup.filePath, artifactBackup.content ?? '', 'utf8');
      return;
    }

    await rm(artifactBackup.filePath, { force: true });
  }

  private async readPersistedJsonArtifact(options: {
    artifactLabelEnglish: string;
    artifactLabelChinese: string;
    filePath: string;
    locale?: string;
  }): Promise<Record<string, unknown> | undefined> {
    let rawContent: string;
    try {
      rawContent = await readFile(options.filePath, 'utf8');
    } catch (error) {
      if (this.isFileMissingError(error)) {
        return undefined;
      }

      throw this.createPersistedArtifactCorruptionError({
        ...options,
        reason: 'read_failed',
        cause: error,
      });
    }

    try {
      const parsed = JSON.parse(rawContent) as unknown;
      if (this.isPlainRecord(parsed)) {
        return parsed;
      }
    } catch (error) {
      throw this.createPersistedArtifactCorruptionError({
        ...options,
        reason: 'parse_failed',
        cause: error,
      });
    }

    throw this.createPersistedArtifactCorruptionError({
      ...options,
      reason: 'payload_not_object',
    });
  }

  private createPersistedArtifactCorruptionError(options: {
    artifactLabelEnglish: string;
    artifactLabelChinese: string;
    filePath: string;
    reason: string;
    locale?: string;
    details?: Record<string, unknown>;
    cause?: unknown;
  }): RuntimeError {
    return new RuntimeError(
      GovernorErrorCode.DURABLE_STORAGE_VERIFY_FAILED,
      this.localizeText(
        options.locale,
        `The persisted ${options.artifactLabelEnglish} at "${options.filePath}" is corrupted and cannot be used.`,
        `位于“${options.filePath}”的已持久化${options.artifactLabelChinese}已损坏，当前无法使用。`,
      ),
      {
        artifactKind: options.artifactLabelEnglish,
        artifactPath: options.filePath,
        reason: options.reason,
        ...(options.details ?? {}),
      },
      options.cause,
    );
  }

  private resolvePersistedTemplateId(
    templateIdCandidate: unknown,
    options: {
      artifactLabelEnglish: string;
      artifactLabelChinese: string;
      filePath: string;
      locale?: string;
    },
  ): string {
    if (!this.isNonEmptyString(templateIdCandidate)) {
      throw this.createPersistedArtifactCorruptionError({
        ...options,
        reason: 'template_id_missing',
      });
    }

    const normalizedTemplateId = templateIdCandidate.trim();
    const supportedTemplateIds = this.templateCatalog.listTemplateIds();
    if (supportedTemplateIds.includes(normalizedTemplateId)) {
      return normalizedTemplateId;
    }

    throw this.createPersistedArtifactCorruptionError({
      ...options,
      reason: 'template_id_unsupported',
      details: {
        supportedTemplateIds,
        templateId: normalizedTemplateId,
      },
    });
  }

  private asWorkflowDraftDefinitionSource(value: unknown): WorkflowDraftDefinitionSource | null {
    return value === 'workspace_saved' || value === 'template_seed' || value === 'preview_template'
      ? value
      : null;
  }

  private asWorkflowDraftSession(value: unknown): OrchestrationWorkflowDraftSession | null {
    if (!this.isPlainRecord(value)) {
      return null;
    }

    return this.isNonEmptyString(value.workflowDraftId) &&
      this.isNonEmptyString(value.draftRevision) &&
      this.isNonEmptyString(value.baseDefinitionRevision) &&
      this.isNonEmptyString(value.templateId) &&
      this.isWorkflowDraftEntryMode(value.entryMode) &&
      this.isWorkflowDraftConflictState(value.conflictState) &&
      this.isWorkflowCompiledIrPreview(value.compiledIrPreview)
      ? (value as unknown as OrchestrationWorkflowDraftSession)
      : null;
  }

  private asProcessDslDefinition(value: unknown): ProcessDslDefinition | null {
    if (!this.isPlainRecord(value)) {
      return null;
    }

    return this.isNonEmptyString(value.processId) &&
      this.isNonEmptyString(value.executionId) &&
      this.isNonEmptyString(value.entryNodeId) &&
      Array.isArray(value.nodes) &&
      value.nodes.every((node) => this.isProcessDslNode(node)) &&
      Array.isArray(value.edges) &&
      value.edges.every((edge) => this.isProcessDslEdge(edge))
      ? (value as unknown as ProcessDslDefinition)
      : null;
  }

  private isProcessDslNode(value: unknown): value is ProcessDslNode {
    if (!this.isPlainRecord(value)) {
      return false;
    }

    return (
      this.isNonEmptyString(value.nodeId) &&
      this.isNonEmptyString(value.stageId) &&
      this.isNonEmptyString(value.routeKey) &&
      this.isNonEmptyString(value.roleProfileId) &&
      this.isOptionalProcessNodeType(value.nodeType) &&
      this.isOptionalString(value.inputSchemaRef) &&
      this.isOptionalString(value.outputSchemaRef) &&
      this.isOptionalString(value.retryPolicyRef) &&
      this.isOptionalString(value.timeoutPolicyRef) &&
      this.isOptionalString(value.budgetPolicyRef) &&
      this.isOptionalNodeLimits(value.limits)
    );
  }

  private isProcessDslEdge(value: unknown): value is ProcessDslEdge {
    if (!this.isPlainRecord(value)) {
      return false;
    }

    return (
      this.isNonEmptyString(value.fromNodeId) &&
      this.isNonEmptyString(value.toNodeId) &&
      this.isOptionalString(value.conditionKey)
    );
  }

  private isWorkflowDraftEntryMode(value: unknown): value is OrchestrationWorkflowDraftEntryMode {
    return (
      typeof value === 'string' &&
      Object.values(OrchestrationWorkflowDraftEntryMode).includes(
        value as OrchestrationWorkflowDraftEntryMode,
      )
    );
  }

  private isWorkflowDraftConflictState(
    value: unknown,
  ): value is OrchestrationWorkflowDraftConflictState {
    if (!this.isPlainRecord(value)) {
      return false;
    }

    return (
      typeof value.hasConflict === 'boolean' &&
      typeof value.detectedAt === 'string' &&
      Object.values(OrchestrationWorkflowDraftConflictKind).includes(
        value.conflictKind as OrchestrationWorkflowDraftConflictKind,
      ) &&
      this.isOptionalString(value.message) &&
      this.isOptionalString(value.expectedDraftRevision) &&
      this.isOptionalString(value.currentDraftRevision) &&
      this.isOptionalString(value.expectedBaseDefinitionRevision) &&
      this.isOptionalString(value.currentBaseDefinitionRevision)
    );
  }

  private isWorkflowCompiledIrPreview(
    value: unknown,
  ): value is OrchestrationWorkflowCompiledIrPreview {
    if (!this.isPlainRecord(value)) {
      return false;
    }

    return this.isOptionalString(value.snapshotPath);
  }

  private isOptionalNodeLimits(value: unknown): boolean {
    if (value === undefined) {
      return true;
    }

    if (!this.isPlainRecord(value)) {
      return false;
    }

    return (
      this.isOptionalFiniteNumber(value.maxCycles) &&
      this.isOptionalFiniteNumber(value.maxWallTimeSeconds)
    );
  }

  private isOptionalProcessNodeType(value: unknown): boolean {
    return value === undefined || Object.values(ProcessNodeType).includes(value as ProcessNodeType);
  }

  private isOptionalFiniteNumber(value: unknown): boolean {
    return value === undefined || (typeof value === 'number' && Number.isFinite(value));
  }

  private isOptionalString(value: unknown): value is string | undefined {
    return value === undefined || typeof value === 'string';
  }

  private isNonEmptyString(value: unknown): value is string {
    return typeof value === 'string' && value.trim().length > 0;
  }

  private isPlainRecord(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  private isFileMissingError(error: unknown): error is NodeJS.ErrnoException {
    return (
      !!error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code?: unknown }).code === 'ENOENT'
    );
  }

  private createRevisionToken(value: unknown): string {
    return createHash('sha256').update(JSON.stringify(value)).digest('hex').slice(0, 16);
  }

  private toTimestamp(): string {
    return this.nowProvider().toISOString();
  }

  private localizeText(locale: string | undefined, english: string, chinese: string): string {
    return locale?.trim().toLowerCase().startsWith('zh') ? chinese : english;
  }
}
