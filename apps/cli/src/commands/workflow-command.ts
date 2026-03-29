import {
  type ProcessCompiledIr,
  ProcessCompiler,
  type ProcessCompilerIssue,
  ProcessCompilerSeverity,
} from '@repo-ai-governor/core-process';
import {
  ExecutionInteractionCategory,
  ExecutionProgressStage,
  ExecutionProgressStatus,
  GovernorErrorCode,
  RuntimeError,
} from '@repo-ai-governor/shared';
import {
  CliCommandResultCheckId,
  CliWorkflowCompileStatusDetailField,
  CliWorkflowPreviewModeDetailField,
  CliWorkflowTemplateDetailField,
} from '../constants/cli-command-result-check.constant.js';
import { CliCommandName } from '../constants/cli-command.constant.js';
import {
  CLI_RUNTIME_OPERATION,
  CliGovernanceCheckStatus,
  type CliRuntimeOperation,
} from '../constants/cli-governance-runtime.constant.js';
import { CliInteractiveUiMode } from '../constants/cli-interactive-shell.constant.js';
import { DEFAULT_CLI_REACT_THEME_PRESET } from '../constants/cli-react-theme.constant.js';
import {
  CliWorkflowAction,
  CliWorkflowCompileStatus,
  CliWorkflowDefinitionSource,
  CliWorkflowEditorIssueCode,
  CliWorkflowEditorIssueSeverity,
  CliWorkflowEntryMode,
  CliWorkflowPreviewMode,
  CliWorkflowTemplateId,
} from '../constants/cli-workflow.constant.js';
import {
  ReactCliCommandDescriptorCatalog,
  ReactCliCommandViewModelBuilder,
  type ReactCliViewModel,
} from '../react-cli/index.js';
import { CliWorkflowEditorService } from '../runtime/workflow-editor/cli-workflow-editor-service.js';
import { CliWorkflowPreviewTemplateCatalog } from '../runtime/workflow-preview/workflow-preview-template-catalog.js';
import type {
  CliCommandExecutorContext,
  CliCommandResultArtifact,
  CliCommandResultCheck,
  CliWorkflowEditorSession,
  CliWorkflowEditorValidationIssue,
} from '../types/index.js';
import type { CliCommandExecutor } from './cli-command-executor.interface.js';

interface CliWorkflowCommandDependencies {
  processCompiler?: Pick<ProcessCompiler, 'compile' | 'persistCompiledIrSnapshot'>;
  templateCatalog?: Pick<
    CliWorkflowPreviewTemplateCatalog,
    'listTemplateIds' | 'createPreviewDefinition'
  >;
  descriptorCatalog?: ReactCliCommandDescriptorCatalog;
  viewModelBuilder?: ReactCliCommandViewModelBuilder;
  editorService?: CliWorkflowEditorService;
  now?: () => number;
}

/**
 * Owns the shared `workflow` preview/create/edit command surface for React CLI shells.
 */
export class CliWorkflowCommand implements CliCommandExecutor {
  public readonly commandName = CliCommandName.WORKFLOW;

  private readonly processCompiler: Pick<ProcessCompiler, 'compile' | 'persistCompiledIrSnapshot'>;
  private readonly templateCatalog: Pick<
    CliWorkflowPreviewTemplateCatalog,
    'listTemplateIds' | 'createPreviewDefinition'
  >;
  private readonly descriptorCatalog: ReactCliCommandDescriptorCatalog;
  private readonly viewModelBuilder: ReactCliCommandViewModelBuilder;
  private readonly editorService: CliWorkflowEditorService;
  private readonly now: () => number;

  public constructor(dependencies: CliWorkflowCommandDependencies = {}) {
    this.processCompiler = dependencies.processCompiler ?? new ProcessCompiler();
    this.templateCatalog = dependencies.templateCatalog ?? new CliWorkflowPreviewTemplateCatalog();
    this.descriptorCatalog =
      dependencies.descriptorCatalog ?? new ReactCliCommandDescriptorCatalog();
    this.viewModelBuilder = dependencies.viewModelBuilder ?? new ReactCliCommandViewModelBuilder();
    this.editorService =
      dependencies.editorService ??
      new CliWorkflowEditorService({ templateCatalog: this.templateCatalog });
    this.now = dependencies.now ?? (() => Date.now());
  }

  public async execute(context: CliCommandExecutorContext) {
    const action = this.resolveAction(context);
    const requestedTemplateId = this.resolveRequestedTemplateId(context);
    const entryMode = this.resolveEntryMode(action);
    const previewMode =
      action === CliWorkflowAction.PREVIEW ? CliWorkflowPreviewMode.READ_ONLY : undefined;
    const workflowSession = await this.editorService.prepareSession({
      action,
      requestedTemplateId,
      executionId: `workflow-${action}-${this.now()}`,
      workspaceRoot: context.options.workspace.workspaceRoot,
      artifactWriter: context.artifactWriter,
    });
    const compiledIr = this.processCompiler.compile(workflowSession.definition);
    const validationIssueTotals = this.calculateValidationIssueTotals(
      workflowSession.validationIssues,
    );
    const compileTotals = this.calculateIssueTotals(compiledIr, validationIssueTotals);
    const compileStatus = this.resolveCompileStatus(compiledIr, workflowSession.validationIssues);
    let persistedDefinitionPath: string | undefined;
    let compiledIrPath: string | undefined;
    const artifacts: CliCommandResultArtifact[] = [];

    if (
      action !== CliWorkflowAction.PREVIEW &&
      validationIssueTotals.errorCount === 0 &&
      compiledIr.compileErrors.length === 0
    ) {
      persistedDefinitionPath = await this.editorService.persistDefinition(
        workflowSession,
        context.artifactWriter,
        context.toRfc3339SecondsTimestamp(new Date()),
      );
      compiledIrPath = this.processCompiler.persistCompiledIrSnapshot(
        context.options.workspace.workspaceRoot,
        compiledIr,
      );
      artifacts.push(
        {
          id: 'workflow_definition',
          path: persistedDefinitionPath,
        },
        {
          id: 'workflow_compiled_ir',
          path: compiledIrPath,
        },
      );
    }

    const checks = this.createChecks(
      action,
      workflowSession.templateId,
      previewMode,
      compiledIr,
      compileStatus,
      workflowSession.validationIssues,
    );
    const interactionPrompts = this.createInteractionPrompts(
      context,
      action,
      workflowSession,
      compiledIr,
      persistedDefinitionPath,
      compiledIrPath,
    );
    const experience = context.commandExperienceBuilder.buildExperiencePayload({
      roleProgress: [
        {
          roleId: 'compiler',
          stage: ExecutionProgressStage.RUN_COMPILE,
          status: this.resolveCompileProgressStatus(compiledIr, workflowSession.validationIssues),
          category:
            compileTotals.errorCount > 0
              ? ExecutionInteractionCategory.RUNTIME_FAILURE
              : ExecutionInteractionCategory.NONE,
          summary:
            compileTotals.errorCount > 0
              ? this.translate(context, 'cli.reactShell.workflow.progress.compileFallback')
              : this.translate(context, 'cli.reactShell.workflow.progress.compileCompleted'),
          detail: [
            `template_id=${workflowSession.templateId}`,
            `definition_source=${workflowSession.definitionSource}`,
            `compile_errors=${compileTotals.errorCount}`,
            `compile_warnings=${compileTotals.warningCount}`,
          ].join(' '),
          backlink: {
            stageId: ExecutionProgressStage.RUN_COMPILE,
            ...(compiledIrPath ? { artifactPath: compiledIrPath } : {}),
          },
        },
      ],
      layeredLogs: {
        summary: [
          `workflow_action=${action}`,
          `template_id=${workflowSession.templateId}`,
          `entry_mode=${entryMode}`,
          `definition_source=${workflowSession.definitionSource}`,
          ...(previewMode ? [`preview_mode=${previewMode}`] : []),
          `compile_status=${compileStatus}`,
        ],
        detailed: [
          `process_id=${compiledIr.processId}`,
          `entry_node_id=${compiledIr.entryNodeId}`,
          `node_count=${compiledIr.nodes.length}`,
          `edge_count=${compiledIr.edges.length}`,
          `compile_errors=${compileTotals.errorCount}`,
          `compile_warnings=${compileTotals.warningCount}`,
          `validation_errors=${validationIssueTotals.errorCount}`,
          `validation_warnings=${validationIssueTotals.warningCount}`,
          ...(persistedDefinitionPath ? [`definition_path=${persistedDefinitionPath}`] : []),
          ...(compiledIrPath ? [`compiled_ir_path=${compiledIrPath}`] : []),
        ],
      },
      interactionPrompts,
    });
    const templateLabel = this.translateTemplateLabel(context, workflowSession.templateId);
    const message = this.resolveMessage(
      context,
      action,
      templateLabel,
      compileTotals,
      persistedDefinitionPath,
    );

    return {
      message,
      reactCliViewModel: this.buildReactCliViewModel(context, {
        action,
        workflowSession,
        entryMode,
        compiledIr,
        compileStatus,
        checks,
        interactionPrompts,
        message,
        persistedDefinitionPath,
        compiledIrPath,
        compileTotals,
      }),
      commandResult: {
        operation: this.resolveOperation(action),
        summary: message,
        check_totals: context.calculateCheckTotals(checks),
        checks,
        artifacts,
        experience,
        details: {
          action,
          template_id: workflowSession.templateId,
          entry_mode: entryMode,
          definition_source: workflowSession.definitionSource,
          ...(persistedDefinitionPath ? { definition_path: persistedDefinitionPath } : {}),
          ...(compiledIrPath ? { compiled_ir_path: compiledIrPath } : {}),
          ...(previewMode ? { preview_mode: previewMode } : {}),
          compile_status: compileStatus,
          process_id: compiledIr.processId,
          entry_node_id: compiledIr.entryNodeId,
          node_count: compiledIr.nodes.length,
          edge_count: compiledIr.edges.length,
          condition_branch_count: workflowSession.conditionBranchSummaries.length,
          compile_error_count: compileTotals.errorCount,
          compile_warning_count: compileTotals.warningCount,
          validation_error_count: validationIssueTotals.errorCount,
          validation_warning_count: validationIssueTotals.warningCount,
        },
      },
    };
  }

  /**
   * Builds the shared React CLI summary view for `workflow preview` when React mode is active.
   * @param context Command execution context.
   * @param options Local preview facts used to populate the shared shell.
   * @returns Shared shell view model or `undefined`.
   */
  private buildReactCliViewModel(
    context: CliCommandExecutorContext,
    options: {
      action: CliWorkflowAction;
      workflowSession: CliWorkflowEditorSession;
      entryMode: CliWorkflowEntryMode;
      compiledIr: ProcessCompiledIr;
      compileStatus: CliWorkflowCompileStatus;
      checks: CliCommandResultCheck[];
      interactionPrompts: ReturnType<CliWorkflowCommand['createInteractionPrompts']>;
      message: string;
      persistedDefinitionPath?: string;
      compiledIrPath?: string;
      compileTotals: {
        warningCount: number;
        errorCount: number;
      };
    },
  ): ReactCliViewModel | undefined {
    const runtimeDebugOptions = context.resolveRuntimeDebugOptions();
    if (runtimeDebugOptions.uiMode !== CliInteractiveUiMode.REACT) {
      return undefined;
    }

    const descriptor = this.descriptorCatalog
      .createRegistry({
        translate: context.translate,
      })
      .resolve(CliCommandName.WORKFLOW);

    if (!descriptor) {
      return undefined;
    }

    const resolvedThemePreset = runtimeDebugOptions.uiTheme ?? DEFAULT_CLI_REACT_THEME_PRESET;
    return this.viewModelBuilder.build({
      commandName: CliCommandName.WORKFLOW,
      descriptor,
      subtitle: `ui=${runtimeDebugOptions.uiMode} theme=${resolvedThemePreset} stdout=${context.options.outputMode} action=${options.action} entry=${options.entryMode}`,
      inputTitle: this.translate(context, 'cli.reactShell.shared.inputs'),
      summaryTitle: this.translate(context, 'cli.reactShell.shared.summary'),
      attentionTitle: this.translate(context, 'cli.reactShell.shared.attention'),
      footerShortcutsTitle: this.translate(context, 'cli.reactShell.shared.shortcuts'),
      themePreset: resolvedThemePreset,
      statusMessage: this.resolveStatusMessage(
        context,
        options.compileStatus,
        options.compiledIr,
        options.workflowSession.validationIssues,
      ),
      statusVariant: this.viewModelBuilder.resolveStatusVariantFromChecks(options.checks),
      fieldValues: {
        action: this.translateActionLabel(context, options.action),
        templateId: this.translateTemplateLabel(context, options.workflowSession.templateId),
        entryMode: this.translateEntryModeLabel(context, options.entryMode),
        definitionSource: this.translateDefinitionSourceLabel(
          context,
          options.workflowSession.definitionSource,
        ),
      },
      summaryLines: this.createSummaryLines(
        context,
        options.workflowSession,
        options.compiledIr,
        options.message,
        options.persistedDefinitionPath,
        options.compiledIrPath,
        options.compileTotals,
      ),
      checks: options.checks,
      interactionPrompts: options.interactionPrompts,
    });
  }

  /**
   * Resolves the supported workflow action from parsed CLI options.
   * @param context Command execution context.
   * @returns Workflow action.
   */
  private resolveAction(context: CliCommandExecutorContext): CliWorkflowAction {
    const rawAction =
      context.options.workflowCommandOptions?.action?.trim() ?? CliWorkflowAction.PREVIEW;
    if (
      rawAction === CliWorkflowAction.CREATE ||
      rawAction === CliWorkflowAction.EDIT ||
      rawAction === CliWorkflowAction.PREVIEW
    ) {
      return rawAction;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translate(context, 'cli.commands.workflow.subcommandRequired'),
      {
        command: CliCommandName.WORKFLOW,
        action: rawAction,
      },
    );
  }

  /**
   * Resolves workflow entry-mode metadata from the selected action.
   * @param action Selected workflow action.
   * @returns Shared shell entry mode.
   */
  private resolveEntryMode(action: CliWorkflowAction): CliWorkflowEntryMode {
    if (action === CliWorkflowAction.CREATE) {
      return CliWorkflowEntryMode.CREATE_SEED;
    }

    if (action === CliWorkflowAction.EDIT) {
      return CliWorkflowEntryMode.EDIT_SEED;
    }

    return CliWorkflowEntryMode.READ_ONLY;
  }

  /**
   * Resolves the requested workflow template identifier when explicitly provided.
   * @param context Command execution context.
   * @returns Validated workflow template id or `null` when CLI args omitted the flag.
   */
  private resolveRequestedTemplateId(
    context: CliCommandExecutorContext,
  ): CliWorkflowTemplateId | null {
    const rawTemplateId = context.options.workflowCommandOptions?.templateId?.trim() ?? null;
    if (!rawTemplateId) {
      return null;
    }

    const supportedTemplateIds = new Set<string>(this.templateCatalog.listTemplateIds());

    if (supportedTemplateIds.has(rawTemplateId)) {
      return rawTemplateId as CliWorkflowTemplateId;
    }

    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      this.translate(context, 'cli.commandMessages.workflow.invalidTemplate', {
        template: rawTemplateId,
        supported: this.templateCatalog.listTemplateIds().join(', '),
      }),
      {
        command: CliCommandName.WORKFLOW,
        templateId: rawTemplateId,
      },
    );
  }

  /**
   * Resolves preview compile status from compiler and editor validation diagnostics.
   * @param compiledIr Compiler output for the selected template.
   * @param validationIssues Editor validation issues for condition-branch semantics.
   * @returns Preview compile status.
   */
  private resolveCompileStatus(
    compiledIr: ProcessCompiledIr,
    validationIssues: CliWorkflowEditorValidationIssue[],
  ): CliWorkflowCompileStatus {
    const validationIssueTotals = this.calculateValidationIssueTotals(validationIssues);

    if (compiledIr.compileErrors.length > 0 || validationIssueTotals.errorCount > 0) {
      return CliWorkflowCompileStatus.CONTRACT_FALLBACK;
    }

    if (compiledIr.compileWarnings.length > 0 || validationIssueTotals.warningCount > 0) {
      return CliWorkflowCompileStatus.WARNING;
    }

    return CliWorkflowCompileStatus.COMPILABLE;
  }

  /**
   * Resolves preview progress status from compiler and editor validation diagnostics.
   * @param compiledIr Compiler output for the selected template.
   * @param validationIssues Editor validation issues for condition-branch semantics.
   * @returns Progress status row value.
   */
  private resolveCompileProgressStatus(
    compiledIr: ProcessCompiledIr,
    validationIssues: CliWorkflowEditorValidationIssue[],
  ): ExecutionProgressStatus {
    const validationIssueTotals = this.calculateValidationIssueTotals(validationIssues);

    if (compiledIr.compileErrors.length > 0 || validationIssueTotals.errorCount > 0) {
      return ExecutionProgressStatus.FAILED;
    }

    if (compiledIr.compileWarnings.length > 0 || validationIssueTotals.warningCount > 0) {
      return ExecutionProgressStatus.WARNING;
    }

    return ExecutionProgressStatus.COMPLETED;
  }

  /**
   * Builds machine-readable checks for the preview output contract.
   * @param templateId Selected template id.
   * @param previewMode Selected preview mode.
   * @param compiledIr Compiler output for the selected template.
   * @param compileStatus Resolved preview compile status.
   * @param validationIssues Editor validation issues for condition-branch semantics.
   * @returns Command checks.
   */
  private createChecks(
    action: CliWorkflowAction,
    templateId: CliWorkflowTemplateId,
    previewMode: CliWorkflowPreviewMode | undefined,
    compiledIr: ProcessCompiledIr,
    compileStatus: CliWorkflowCompileStatus,
    validationIssues: CliWorkflowEditorValidationIssue[],
  ): CliCommandResultCheck[] {
    const validationIssueTotals = this.calculateValidationIssueTotals(validationIssues);
    const compileTotals = this.calculateIssueTotals(compiledIr, validationIssueTotals);
    const checks: CliCommandResultCheck[] = [
      {
        id: CliCommandResultCheckId.WORKFLOW_TEMPLATE,
        status: CliGovernanceCheckStatus.PASS,
        detail: `${CliWorkflowTemplateDetailField.TEMPLATE}=${templateId}`,
      },
      {
        id: CliCommandResultCheckId.WORKFLOW_COMPILE_STATUS,
        status:
          compileTotals.errorCount > 0
            ? CliGovernanceCheckStatus.FAIL
            : compileTotals.warningCount > 0
              ? CliGovernanceCheckStatus.WARN
              : CliGovernanceCheckStatus.PASS,
        detail: [
          `${CliWorkflowCompileStatusDetailField.STATUS}=${compileStatus}`,
          `${CliWorkflowCompileStatusDetailField.WARNINGS}=${compileTotals.warningCount}`,
          `${CliWorkflowCompileStatusDetailField.ERRORS}=${compileTotals.errorCount}`,
        ].join(' '),
      },
    ];

    if (action === CliWorkflowAction.PREVIEW && previewMode) {
      checks.splice(1, 0, {
        id: CliCommandResultCheckId.WORKFLOW_PREVIEW_MODE,
        status: CliGovernanceCheckStatus.PASS,
        detail: `${CliWorkflowPreviewModeDetailField.MODE}=${previewMode}`,
      });
    }

    return checks;
  }

  /**
   * Builds operator-facing prompts for preview follow-up actions.
   * @param context Command execution context.
   * @param workflowSession Prepared editor session.
   * @param compiledIr Compiler output for the selected template.
   * @param persistedDefinitionPath Persisted workflow definition path when save succeeded.
   * @param compiledIrPath Persisted compiled IR snapshot path when save succeeded.
   * @returns Interaction prompts merged into the shared help section.
   */
  private createInteractionPrompts(
    context: CliCommandExecutorContext,
    action: CliWorkflowAction,
    workflowSession: CliWorkflowEditorSession,
    compiledIr: ProcessCompiledIr,
    persistedDefinitionPath?: string,
    compiledIrPath?: string,
  ) {
    const prompts = [
      {
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.RUN_COMPILE,
        title: this.translate(context, 'cli.reactShell.workflow.prompt.compareAnotherTemplate'),
        action: this.translate(context, 'cli.reactShell.workflow.prompt.rerunWithActionTemplate', {
          action,
          template: workflowSession.templateId,
        }),
        blocking: false,
      },
    ];

    if (persistedDefinitionPath) {
      prompts.push({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.RUN_COMPILE,
        title: this.translate(context, 'cli.reactShell.workflow.prompt.inspectSavedDefinition'),
        action: this.translate(
          context,
          'cli.reactShell.workflow.prompt.inspectSavedDefinitionPath',
          {
            path: persistedDefinitionPath,
          },
        ),
        blocking: false,
      });
    }

    if (compiledIrPath) {
      prompts.push({
        category: ExecutionInteractionCategory.NONE,
        stage: ExecutionProgressStage.RUN_COMPILE,
        title: this.translate(context, 'cli.reactShell.workflow.prompt.inspectCompiledIr'),
        action: this.translate(context, 'cli.reactShell.workflow.prompt.inspectCompiledIrPath', {
          path: compiledIrPath,
        }),
        blocking: false,
      });
    }

    if (
      compiledIr.compileErrors.length > 0 ||
      workflowSession.validationIssues.some(
        (issue) => issue.severity === CliWorkflowEditorIssueSeverity.ERROR,
      )
    ) {
      prompts.unshift({
        category: ExecutionInteractionCategory.RUNTIME_FAILURE,
        stage: ExecutionProgressStage.RUN_COMPILE,
        title: this.translate(context, 'cli.reactShell.workflow.prompt.reviewCompileErrors'),
        action: this.translate(context, 'cli.reactShell.workflow.prompt.fixBeforePersist'),
        blocking: false,
      });
    }

    return prompts;
  }

  /**
   * Resolves the status headline shown by the React preview shell.
   * @param context Command execution context.
   * @param compileStatus Resolved preview compile status.
   * @param compiledIr Compiler output for the selected template.
   * @returns Localized status message.
   */
  private resolveStatusMessage(
    context: CliCommandExecutorContext,
    compileStatus: CliWorkflowCompileStatus,
    compiledIr: ProcessCompiledIr,
    validationIssues: CliWorkflowEditorValidationIssue[],
  ): string {
    const validationIssueTotals = this.calculateValidationIssueTotals(validationIssues);
    const compileTotals = this.calculateIssueTotals(compiledIr, validationIssueTotals);

    if (compileStatus === CliWorkflowCompileStatus.CONTRACT_FALLBACK) {
      return this.translate(context, 'cli.reactShell.workflow.status.contractFallback', {
        errorCount: String(compileTotals.errorCount),
      });
    }

    if (compileStatus === CliWorkflowCompileStatus.WARNING) {
      return this.translate(context, 'cli.reactShell.workflow.status.warning', {
        warningCount: String(compileTotals.warningCount),
      });
    }

    return this.translate(context, 'cli.reactShell.workflow.status.compilable', {
      warningCount: String(compileTotals.warningCount),
    });
  }

  /**
   * Creates ordered summary lines for the read-only preview shell.
   * @param context Command execution context.
   * @param workflowSession Prepared editor session.
   * @param compiledIr Compiler output for the selected template.
   * @param message Top-level command summary.
   * @param persistedDefinitionPath Persisted workflow definition path when save succeeded.
   * @param compiledIrPath Persisted compiled IR snapshot path when save succeeded.
   * @param compileTotals Aggregate compile/validation issue totals.
   * @returns Ordered summary lines.
   */
  private createSummaryLines(
    context: CliCommandExecutorContext,
    workflowSession: CliWorkflowEditorSession,
    compiledIr: ProcessCompiledIr,
    message: string,
    persistedDefinitionPath: string | undefined,
    compiledIrPath: string | undefined,
    compileTotals: {
      warningCount: number;
      errorCount: number;
    },
  ): string[] {
    return [
      message,
      this.translate(context, 'cli.reactShell.workflow.summary.definitionSource', {
        source: this.translateDefinitionSourceLabel(context, workflowSession.definitionSource),
      }),
      ...(persistedDefinitionPath
        ? [
            this.translate(context, 'cli.reactShell.workflow.summary.definitionPath', {
              path: persistedDefinitionPath,
            }),
          ]
        : []),
      ...(compiledIrPath
        ? [
            this.translate(context, 'cli.reactShell.workflow.summary.compiledIrPath', {
              path: compiledIrPath,
            }),
          ]
        : []),
      this.translate(context, 'cli.reactShell.workflow.summary.template', {
        template: this.translateTemplateLabel(context, workflowSession.templateId),
      }),
      this.translate(context, 'cli.reactShell.workflow.summary.processId', {
        processId: compiledIr.processId,
      }),
      this.translate(context, 'cli.reactShell.workflow.summary.entryNode', {
        entryNodeId: compiledIr.entryNodeId,
      }),
      this.translate(context, 'cli.reactShell.workflow.summary.graphTotals', {
        nodeCount: String(compiledIr.nodes.length),
        edgeCount: String(compiledIr.edges.length),
        warningCount: String(compileTotals.warningCount),
        errorCount: String(compileTotals.errorCount),
      }),
      ...this.createConditionBranchLines(context, workflowSession.conditionBranchSummaries),
      ...this.createNodePreviewLines(context, workflowSession.nodeSummaries),
      ...this.createEdgePreviewLines(context, workflowSession.edgeSummaries),
      ...this.createEditorIssueLines(context, workflowSession.validationIssues),
      ...this.createCompileIssueLines(context, compiledIr.compileWarnings),
      ...this.createCompileIssueLines(context, compiledIr.compileErrors),
    ];
  }

  /**
   * Creates human-readable compiled-node preview lines.
   * @param context Command execution context.
   * @param nodes Normalized workflow editor nodes.
   * @returns Node preview lines.
   */
  private createNodePreviewLines(
    context: CliCommandExecutorContext,
    nodes: CliWorkflowEditorSession['nodeSummaries'],
  ): string[] {
    const nodeLines: string[] = [];

    for (const node of nodes) {
      nodeLines.push(
        this.translate(context, 'cli.reactShell.workflow.summary.nodeLine', {
          nodeId: node.nodeId,
          nodeType: node.nodeType,
          stageId: node.stageId,
          routeKey: node.routeKey,
          roleProfileId: node.roleProfileId,
        }),
      );

      if (typeof node.maxCycles === 'number' && typeof node.maxWallTimeSeconds === 'number') {
        nodeLines.push(
          this.translate(context, 'cli.reactShell.workflow.summary.loopLimits', {
            nodeId: node.nodeId,
            maxCycles: String(node.maxCycles),
            maxWallTimeSeconds: String(node.maxWallTimeSeconds),
          }),
        );
      }
    }

    return nodeLines;
  }

  /**
   * Creates human-readable compiled-edge preview lines.
   * @param context Command execution context.
   * @param edges Compiled IR edges.
   * @returns Edge preview lines.
   */
  private createEdgePreviewLines(
    context: CliCommandExecutorContext,
    edges: CliWorkflowEditorSession['edgeSummaries'],
  ): string[] {
    return edges.map((edge) =>
      this.translate(context, 'cli.reactShell.workflow.summary.edgeLine', {
        fromNodeId: edge.fromNodeId,
        toNodeId: edge.toNodeId,
        conditionKey:
          edge.conditionKey ??
          this.translate(context, 'cli.reactShell.workflow.summary.defaultRoute'),
      }),
    );
  }

  /**
   * Creates human-readable condition-branch summary lines for condition nodes.
   * @param context Command execution context.
   * @param conditionBranches Condition-node branch summaries.
   * @returns Condition branch summary lines.
   */
  private createConditionBranchLines(
    context: CliCommandExecutorContext,
    conditionBranches: CliWorkflowEditorSession['conditionBranchSummaries'],
  ): string[] {
    return conditionBranches.map((conditionBranch) =>
      this.translate(context, 'cli.reactShell.workflow.summary.conditionBranches', {
        nodeId: conditionBranch.nodeId,
        branches:
          conditionBranch.branchKeys.length > 0
            ? conditionBranch.branchKeys.join(', ')
            : this.translate(context, 'cli.reactShell.workflow.summary.noBranches'),
      }),
    );
  }

  /**
   * Creates human-readable compiler issue lines for fallback preview summaries.
   * @param context Command execution context.
   * @param issues Compiler warning/error list.
   * @returns Compiler issue summary lines.
   */
  private createCompileIssueLines(
    context: CliCommandExecutorContext,
    issues: ProcessCompilerIssue[],
  ): string[] {
    return issues.map((issue) =>
      this.translate(context, 'cli.reactShell.workflow.summary.compileIssue', {
        severity:
          issue.severity === ProcessCompilerSeverity.ERROR
            ? this.translate(context, 'cli.reactShell.workflow.summary.errorSeverity')
            : this.translate(context, 'cli.reactShell.workflow.summary.warningSeverity'),
        errorCode: issue.errorCode,
        location: issue.location,
        message: issue.message,
      }),
    );
  }

  /**
   * Creates human-readable workflow editor validation issue lines.
   * @param context Command execution context.
   * @param issues Workflow editor semantic validation issues.
   * @returns Validation issue summary lines.
   */
  private createEditorIssueLines(
    context: CliCommandExecutorContext,
    issues: CliWorkflowEditorValidationIssue[],
  ): string[] {
    return issues.map((issue) =>
      this.translate(context, 'cli.reactShell.workflow.summary.compileIssue', {
        severity:
          issue.severity === CliWorkflowEditorIssueSeverity.ERROR
            ? this.translate(context, 'cli.reactShell.workflow.summary.errorSeverity')
            : this.translate(context, 'cli.reactShell.workflow.summary.warningSeverity'),
        errorCode: issue.code,
        location: issue.location,
        message: this.resolveEditorIssueMessage(context, issue.code),
      }),
    );
  }

  /**
   * Resolves aggregate workflow editor validation totals by severity.
   * @param issues Workflow editor semantic validation issues.
   * @returns Warning/error counters.
   */
  private calculateValidationIssueTotals(issues: CliWorkflowEditorValidationIssue[]): {
    warningCount: number;
    errorCount: number;
  } {
    return {
      warningCount: issues.filter(
        (issue) => issue.severity === CliWorkflowEditorIssueSeverity.WARNING,
      ).length,
      errorCount: issues.filter((issue) => issue.severity === CliWorkflowEditorIssueSeverity.ERROR)
        .length,
    };
  }

  /**
   * Combines compiler and workflow-editor semantic diagnostics into one total.
   * @param compiledIr Compiler output for the current workflow definition.
   * @param validationIssueTotals Workflow editor semantic validation totals.
   * @returns Aggregate warning/error totals shown in summaries and checks.
   */
  private calculateIssueTotals(
    compiledIr: ProcessCompiledIr,
    validationIssueTotals: {
      warningCount: number;
      errorCount: number;
    },
  ): {
    warningCount: number;
    errorCount: number;
  } {
    return {
      warningCount: compiledIr.compileWarnings.length + validationIssueTotals.warningCount,
      errorCount: compiledIr.compileErrors.length + validationIssueTotals.errorCount,
    };
  }

  /**
   * Resolves one localized workflow definition-source label.
   * @param context Command execution context.
   * @param definitionSource Workflow definition source.
   * @returns Localized definition-source label.
   */
  private translateDefinitionSourceLabel(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    definitionSource: CliWorkflowDefinitionSource,
  ): string {
    if (definitionSource === CliWorkflowDefinitionSource.WORKSPACE_SAVED) {
      return this.translate(context, 'cli.reactShell.workflow.definitionSources.workspaceSaved');
    }

    if (definitionSource === CliWorkflowDefinitionSource.TEMPLATE_SEED) {
      return this.translate(context, 'cli.reactShell.workflow.definitionSources.templateSeed');
    }

    return this.translate(context, 'cli.reactShell.workflow.definitionSources.previewTemplate');
  }

  /**
   * Resolves one localized workflow editor issue message from the stable issue code.
   * @param context Command execution context.
   * @param code Workflow editor issue code.
   * @returns Localized validation issue message.
   */
  private resolveEditorIssueMessage(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    code: CliWorkflowEditorIssueCode,
  ): string {
    if (code === CliWorkflowEditorIssueCode.CONDITION_BRANCH_REQUIRED) {
      return this.translate(
        context,
        'cli.reactShell.workflow.editorIssues.conditionBranchRequired',
      );
    }

    if (code === CliWorkflowEditorIssueCode.CONDITION_BRANCH_KEY_REQUIRED) {
      return this.translate(
        context,
        'cli.reactShell.workflow.editorIssues.conditionBranchKeyRequired',
      );
    }

    return this.translate(
      context,
      'cli.reactShell.workflow.editorIssues.conditionBranchDuplicated',
    );
  }

  /**
   * Resolves one localized template label.
   * @param context Command execution context.
   * @param templateId Built-in template id.
   * @returns Localized template label.
   */
  private translateTemplateLabel(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    templateId: CliWorkflowTemplateId,
  ): string {
    if (templateId === CliWorkflowTemplateId.LOOP_GUARDED) {
      return this.translate(context, 'cli.reactShell.workflow.templates.loopGuarded');
    }

    if (templateId === CliWorkflowTemplateId.CONDITION_ROUTE) {
      return this.translate(context, 'cli.reactShell.workflow.templates.conditionRoute');
    }

    return this.translate(context, 'cli.reactShell.workflow.templates.parallelReview');
  }

  /**
   * Resolves one localized workflow-action label.
   * @param context Command execution context.
   * @param action Selected workflow action.
   * @returns Localized action label.
   */
  private translateActionLabel(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    action: CliWorkflowAction,
  ): string {
    if (action === CliWorkflowAction.CREATE) {
      return this.translate(context, 'cli.reactShell.workflow.actions.create');
    }

    if (action === CliWorkflowAction.EDIT) {
      return this.translate(context, 'cli.reactShell.workflow.actions.edit');
    }

    return this.translate(context, 'cli.reactShell.workflow.actions.preview');
  }

  /**
   * Resolves one localized workflow entry-mode label.
   * @param context Command execution context.
   * @param entryMode Shared shell entry mode.
   * @returns Localized entry-mode label.
   */
  private translateEntryModeLabel(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    entryMode: CliWorkflowEntryMode,
  ): string {
    if (entryMode === CliWorkflowEntryMode.CREATE_SEED) {
      return this.translate(context, 'cli.reactShell.workflow.entryModes.createSeed');
    }

    if (entryMode === CliWorkflowEntryMode.EDIT_SEED) {
      return this.translate(context, 'cli.reactShell.workflow.entryModes.editSeed');
    }

    return this.translate(context, 'cli.reactShell.workflow.entryModes.readOnly');
  }

  /**
   * Resolves one localized top-level workflow message for the selected action.
   * @param context Command execution context.
   * @param action Selected workflow action.
   * @param templateLabel Localized workflow template label.
   * @param compileTotals Aggregate compile/validation issue totals.
   * @param persistedDefinitionPath Persisted workflow definition path when save succeeded.
   * @returns Localized command summary.
   */
  private resolveMessage(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    action: CliWorkflowAction,
    templateLabel: string,
    compileTotals: {
      warningCount: number;
      errorCount: number;
    },
    persistedDefinitionPath?: string,
  ): string {
    const interpolation = {
      template: templateLabel,
      errorCount: String(compileTotals.errorCount),
      warningCount: String(compileTotals.warningCount),
      ...(persistedDefinitionPath ? { definitionPath: persistedDefinitionPath } : {}),
    };

    if (action === CliWorkflowAction.CREATE) {
      return this.translate(
        context,
        persistedDefinitionPath
          ? 'cli.reactShell.workflow.message.createSaved'
          : 'cli.reactShell.workflow.message.createEntryReady',
        interpolation,
      );
    }

    if (action === CliWorkflowAction.EDIT) {
      return this.translate(
        context,
        persistedDefinitionPath
          ? 'cli.reactShell.workflow.message.editSaved'
          : 'cli.reactShell.workflow.message.editEntryReady',
        interpolation,
      );
    }

    return this.translate(
      context,
      'cli.reactShell.workflow.message.previewCompleted',
      interpolation,
    );
  }

  /**
   * Resolves the machine-readable operation id for the selected workflow action.
   * @param action Selected workflow action.
   * @returns Operation id emitted in the command result.
   */
  private resolveOperation(action: CliWorkflowAction): CliRuntimeOperation {
    if (action === CliWorkflowAction.CREATE) {
      return CLI_RUNTIME_OPERATION.WORKFLOW_CREATE_ENTRY;
    }

    if (action === CliWorkflowAction.EDIT) {
      return CLI_RUNTIME_OPERATION.WORKFLOW_EDIT_ENTRY;
    }

    return CLI_RUNTIME_OPERATION.WORKFLOW_PREVIEW;
  }

  /**
   * Resolves one localized string through i18n runtime.
   * @param context Command execution context.
   * @param key Translation key.
   * @param interpolation Optional translation variables.
   * @returns Localized string or the key when translation runtime is unavailable.
   */
  private translate(
    context: Pick<CliCommandExecutorContext, 'translate'>,
    key: string,
    interpolation?: Record<string, string>,
  ): string {
    return context.translate?.(key, interpolation) ?? key;
  }
}
