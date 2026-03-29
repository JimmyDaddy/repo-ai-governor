import { mkdir, mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';

import { type ProcessDslDefinition, ProcessNodeType } from '@repo-ai-governor/core-process';
import {
  DEFAULT_I18N_RUNTIME_CONFIG,
  ErrorOutputEnvironment,
  GovernorErrorCode,
  I18nRuntime,
  RuntimeError,
  WorkspaceMode,
} from '@repo-ai-governor/shared';
import { CliWorkflowCommand } from '../../src/commands/workflow-command.js';
import { CliInteractiveUiMode } from '../../src/constants/cli-interactive-shell.constant.js';
import {
  CliWorkflowAction,
  CliWorkflowTemplateId,
} from '../../src/constants/cli-workflow.constant.js';
import type { CliCommandExecutorContext } from '../../src/types/index.js';

interface WorkflowCommandFixture {
  tempRoot: string;
  workspaceRoot: string;
  context: CliCommandExecutorContext;
  writeTextArtifact: ReturnType<typeof vi.fn>;
  writeJsonArtifact: ReturnType<typeof vi.fn>;
}

async function createWorkflowCommandFixture(
  workflowCommandOptions: {
    action?: string | null;
    templateId?: string | null;
  } = {},
  options: {
    safeReadJson?: CliCommandExecutorContext['artifactWriter']['safeReadJson'];
  } = {},
): Promise<WorkflowCommandFixture> {
  const tempRoot = await mkdtemp(resolve(tmpdir(), 'workflow-command-'));
  const workspaceRoot = resolve(tempRoot, '.repo-ai-governor');
  await mkdir(resolve(workspaceRoot, 'context', 'compiled-ir'), { recursive: true });
  const i18nRuntime = new I18nRuntime();
  await i18nRuntime.initialize(DEFAULT_I18N_RUNTIME_CONFIG, 'en-US');
  const writeTextArtifact = vi.fn(async () => undefined);
  const writeJsonArtifact = vi.fn(async () => undefined);

  return {
    tempRoot,
    workspaceRoot,
    writeTextArtifact,
    writeJsonArtifact,
    context: {
      options: {
        currentWorkingDirectory: tempRoot,
        workspace: {
          workspaceId: 'test-workspace',
          repositoryRoot: tempRoot,
          workspaceRoot,
          configPath: resolve(workspaceRoot, 'governor.yaml'),
          mode: WorkspaceMode.REPO_LOCAL,
          modeSource: 'runtime',
        },
        locale: 'en-US',
        outputMode: ErrorOutputEnvironment.PRETTY,
        workflowCommandOptions: {
          action:
            workflowCommandOptions.action !== undefined
              ? workflowCommandOptions.action
              : CliWorkflowAction.PREVIEW,
          templateId:
            workflowCommandOptions.templateId !== undefined
              ? workflowCommandOptions.templateId
              : CliWorkflowTemplateId.LOOP_GUARDED,
        },
      },
      artifactWriter: {
        writeTextArtifact,
        writeJsonArtifact,
        safeReadJson: options.safeReadJson ?? (async () => null),
      },
      adapterDiagnosticsRuntime: {} as CliCommandExecutorContext['adapterDiagnosticsRuntime'],
      reviewQueueRuntime: {} as CliCommandExecutorContext['reviewQueueRuntime'],
      orchestrationServiceRuntime: {} as CliCommandExecutorContext['orchestrationServiceRuntime'],
      commandExperienceBuilder: {
        buildExperiencePayload: (payload: unknown) => payload,
      },
      executeRunCommand: async () => {
        throw new RuntimeError(
          GovernorErrorCode.UNKNOWN,
          'executeRunCommand is not used in workflow-command tests.',
        );
      },
      calculateCheckTotals: (checks: Array<{ status: string }>) => ({
        pass: checks.filter((check) => check.status === 'pass').length,
        warn: checks.filter((check) => check.status === 'warn').length,
        fail: checks.filter((check) => check.status === 'fail').length,
      }),
      buildDefaultConfigContent: () => '',
      toRfc3339SecondsTimestamp: (value: Date) => value.toISOString().replace(/\.\d{3}Z$/u, 'Z'),
      formatExecFailureDetail: (error: unknown) => String(error),
      resolveRuntimeDebugOptions: () => ({
        interactive: true,
        requestedUiMode: CliInteractiveUiMode.REACT,
        uiMode: CliInteractiveUiMode.REACT,
        uiFallbackBehavior: null,
        inputTty: true,
        stderrTty: true,
        dryRun: false,
        trace: false,
        replayPath: null,
        adapters: false,
        fix: false,
        recordLedger: false,
        taskId: null,
        restrictedNetwork: false,
        restrictedReason: null,
        allowLocalFallback: true,
        hitlDecision: null,
        hitlDecisionReason: null,
        hitlResumeAction: null,
        hitlDecidedBy: null,
        hitlConstraints: [],
      }),
      resolveExecutionStreamMetadata: async () => ({}),
      resolveAdapterVerification: async () => ({
        overallStatus: 'pass',
      }),
      canWritePath: async () => true,
      translate: (key: string, interpolation?: Record<string, string>) =>
        i18nRuntime.t(key, interpolation),
      localizeText: (english: string) => english,
      runNodeScript: async () => ({
        stdout: '',
        stderr: '',
      }),
    } as unknown as CliCommandExecutorContext,
  };
}

describe('CliWorkflowCommand', () => {
  it('attaches a shared React shell view model for read-only workflow preview', async () => {
    const fixture = await createWorkflowCommandFixture();

    try {
      const command = new CliWorkflowCommand({ now: () => 1234 });
      const result = await command.execute(fixture.context);

      expect(result.commandResult.operation).toBe('workflow_preview');
      expect(result.commandResult.details?.preview_mode).toBe('read_only');
      expect(result.commandResult.details?.template_id).toBe(CliWorkflowTemplateId.LOOP_GUARDED);
      expect(result.commandResult.details?.compile_error_count).toBe(0);
      expect(result.reactCliViewModel?.title).toContain('[react-shell:workflow]');
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain('Workflow action: Preview');
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain(
        'Workflow template: Loop guarded',
      );
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain(
        'Workflow entry mode: read_only',
      );
      expect(
        result.reactCliViewModel?.sections[1]?.lines.some((line) =>
          line.includes('Process ID: workflow-preview-loop-guarded'),
        ),
      ).toBe(true);
      expect(fixture.writeTextArtifact).not.toHaveBeenCalled();
      expect(fixture.writeJsonArtifact).not.toHaveBeenCalled();
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('persists a created workflow definition and compiled IR snapshot', async () => {
    const fixture = await createWorkflowCommandFixture({
      action: CliWorkflowAction.CREATE,
      templateId: CliWorkflowTemplateId.CONDITION_ROUTE,
    });

    try {
      const command = new CliWorkflowCommand({ now: () => 4321 });
      const result = await command.execute(fixture.context);

      expect(result.commandResult.operation).toBe('workflow_create_entry');
      expect(result.commandResult.details?.action).toBe(CliWorkflowAction.CREATE);
      expect(result.commandResult.details?.entry_mode).toBe('create_seed');
      expect(result.commandResult.details?.preview_mode).toBeUndefined();
      expect(result.commandResult.details?.template_id).toBe(CliWorkflowTemplateId.CONDITION_ROUTE);
      expect(result.commandResult.details?.definition_source).toBe('template_seed');
      expect(result.commandResult.details?.definition_path).toContain(
        'active-workflow.definition.json',
      );
      expect(result.commandResult.details?.compiled_ir_path).toContain('workflow-create-4321.json');
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain('Workflow action: Create');
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain(
        'Workflow entry mode: create_seed',
      );
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain(
        'Workflow definition source: template seed',
      );
      expect(
        result.reactCliViewModel?.helpSection?.lines.some((line) =>
          line.includes('Inspect saved workflow definition'),
        ),
      ).toBe(true);
      expect(fixture.writeJsonArtifact).toHaveBeenCalledWith(
        expect.stringContaining('active-workflow.definition.json'),
        expect.objectContaining({
          template_id: CliWorkflowTemplateId.CONDITION_ROUTE,
        }),
      );
      expect(result.commandResult.artifacts?.map((artifact) => artifact.id)).toEqual([
        'workflow_definition',
        'workflow_compiled_ir',
      ]);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('loads the saved workflow definition for edit when no template override is provided', async () => {
    const fixture = await createWorkflowCommandFixture(
      {
        action: CliWorkflowAction.EDIT,
        templateId: null,
      },
      {
        safeReadJson: async () => ({
          schema_version: 'cli_workflow_definition_v1',
          template_id: CliWorkflowTemplateId.CONDITION_ROUTE,
          definition_source: 'workspace_saved',
          definition: {
            processId: 'workflow-active-condition-route',
            executionId: 'workflow-edit-old',
            entryNodeId: 'node-route-policy',
            nodes: [
              {
                nodeId: 'node-route-policy',
                stageId: 'stage-route-policy',
                nodeType: ProcessNodeType.CONDITION,
                routeKey: 'route',
                roleProfileId: 'architect-default',
                inputSchemaRef: 'schemas/route-input.json',
                outputSchemaRef: 'schemas/route-output.json',
                retryPolicyRef: 'policy/retry-default',
                timeoutPolicyRef: 'policy/timeout-default',
                budgetPolicyRef: 'policy/budget-default',
              },
              {
                nodeId: 'node-fast-lane',
                stageId: 'stage-fast-lane',
                nodeType: ProcessNodeType.SEQUENTIAL,
                routeKey: 'fast-lane',
                roleProfileId: 'coder-default',
                inputSchemaRef: 'schemas/fast-input.json',
                outputSchemaRef: 'schemas/fast-output.json',
                retryPolicyRef: 'policy/retry-default',
                timeoutPolicyRef: 'policy/timeout-default',
                budgetPolicyRef: 'policy/budget-default',
              },
            ],
            edges: [
              {
                fromNodeId: 'node-route-policy',
                toNodeId: 'node-fast-lane',
                conditionKey: 'allow',
              },
            ],
            globals: {
              templateId: CliWorkflowTemplateId.CONDITION_ROUTE,
            },
          },
        }),
      },
    );

    try {
      const command = new CliWorkflowCommand({ now: () => 4567 });
      const result = await command.execute(fixture.context);

      expect(result.commandResult.operation).toBe('workflow_edit_entry');
      expect(result.commandResult.details?.definition_source).toBe('workspace_saved');
      expect(result.commandResult.details?.template_id).toBe(CliWorkflowTemplateId.CONDITION_ROUTE);
      expect(result.commandResult.details?.definition_path).toContain(
        'active-workflow.definition.json',
      );
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain(
        'Workflow definition source: saved workspace definition',
      );
      expect(fixture.writeJsonArtifact).toHaveBeenCalledTimes(1);
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('falls back to the template seed when the saved workflow schema version is unsupported', async () => {
    const fixture = await createWorkflowCommandFixture(
      {
        action: CliWorkflowAction.EDIT,
        templateId: null,
      },
      {
        safeReadJson: async () => ({
          schema_version: 'cli_workflow_definition_v2',
          template_id: CliWorkflowTemplateId.CONDITION_ROUTE,
          definition_source: 'workspace_saved',
          definition: {
            processId: 'workflow-active-condition-route',
            executionId: 'workflow-edit-old',
            entryNodeId: 'node-route-policy',
            nodes: [],
            edges: [],
            globals: {
              templateId: CliWorkflowTemplateId.CONDITION_ROUTE,
            },
          },
        }),
      },
    );

    try {
      const command = new CliWorkflowCommand({ now: () => 5678 });
      const result = await command.execute(fixture.context);

      expect(result.commandResult.operation).toBe('workflow_edit_entry');
      expect(result.commandResult.details?.definition_source).toBe('template_seed');
      expect(result.commandResult.details?.template_id).toBe(CliWorkflowTemplateId.PARALLEL_REVIEW);
      expect(result.reactCliViewModel?.sections[0]?.lines).toContain(
        'Workflow definition source: template seed',
      );
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('blocks workflow persistence when condition branches are missing semantic keys', async () => {
    const fixture = await createWorkflowCommandFixture({
      action: CliWorkflowAction.CREATE,
      templateId: CliWorkflowTemplateId.CONDITION_ROUTE,
    });
    const invalidTemplateCatalog = {
      listTemplateIds: () => [CliWorkflowTemplateId.CONDITION_ROUTE],
      createPreviewDefinition: (): ProcessDslDefinition => ({
        processId: 'workflow-preview-condition-invalid',
        executionId: 'workflow-preview-invalid',
        entryNodeId: 'node-route',
        nodes: [
          {
            nodeId: 'node-route',
            stageId: 'stage-route',
            nodeType: ProcessNodeType.CONDITION,
            routeKey: 'route',
            roleProfileId: 'architect-default',
            inputSchemaRef: 'schemas/route-input.json',
            outputSchemaRef: 'schemas/route-output.json',
            retryPolicyRef: 'policy/retry-default',
            timeoutPolicyRef: 'policy/timeout-default',
            budgetPolicyRef: 'policy/budget-default',
          },
          {
            nodeId: 'node-done',
            stageId: 'stage-done',
            nodeType: ProcessNodeType.SEQUENTIAL,
            routeKey: 'done',
            roleProfileId: 'verifier-default',
            inputSchemaRef: 'schemas/done-input.json',
            outputSchemaRef: 'schemas/done-output.json',
            retryPolicyRef: 'policy/retry-default',
            timeoutPolicyRef: 'policy/timeout-default',
            budgetPolicyRef: 'policy/budget-default',
          },
        ],
        edges: [
          {
            fromNodeId: 'node-route',
            toNodeId: 'node-done',
          },
        ],
      }),
    };

    try {
      const command = new CliWorkflowCommand({
        templateCatalog: invalidTemplateCatalog,
      });
      const result = await command.execute(fixture.context);

      expect(result.commandResult.details?.compile_status).toBe('contract_fallback');
      expect(result.commandResult.details?.validation_error_count).toBeGreaterThan(0);
      expect(result.commandResult.details?.definition_path).toBeUndefined();
      expect(result.commandResult.artifacts ?? []).toEqual([]);
      expect(result.reactCliViewModel?.statusMessage).toContain('contract errors');
      expect(
        result.reactCliViewModel?.sections[1]?.lines.some((line) =>
          line.includes('CONDITION_BRANCH_KEY_REQUIRED'),
        ),
      ).toBe(true);
      expect(fixture.writeJsonArtifact).not.toHaveBeenCalled();
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });

  it('keeps a read-only fallback summary when compiled IR contains contract errors', async () => {
    const fixture = await createWorkflowCommandFixture({
      templateId: CliWorkflowTemplateId.PARALLEL_REVIEW,
    });
    const invalidTemplateCatalog = {
      listTemplateIds: () => [CliWorkflowTemplateId.PARALLEL_REVIEW],
      createPreviewDefinition: (): ProcessDslDefinition => ({
        processId: 'workflow-preview-broken-loop',
        executionId: 'workflow-preview-999',
        entryNodeId: 'node-loop',
        nodes: [
          {
            nodeId: 'node-loop',
            stageId: 'stage-loop',
            nodeType: ProcessNodeType.LOOP,
            routeKey: 'loop',
            roleProfileId: 'reviewer-default',
            inputSchemaRef: 'schemas/loop-input.json',
            outputSchemaRef: 'schemas/loop-output.json',
            retryPolicyRef: 'policy/retry-default',
            timeoutPolicyRef: 'policy/timeout-default',
            budgetPolicyRef: 'policy/budget-default',
            limits: {
              maxCycles: 2,
            },
          },
        ],
        edges: [
          {
            fromNodeId: 'node-loop',
            toNodeId: 'node-loop',
          },
        ],
      }),
    };

    try {
      const command = new CliWorkflowCommand({
        templateCatalog: invalidTemplateCatalog,
      });
      const result = await command.execute(fixture.context);

      expect(result.commandResult.details?.compile_status).toBe('contract_fallback');
      expect(result.commandResult.details?.compile_error_count).toBeGreaterThan(0);
      expect(result.commandResult.check_totals?.fail).toBeGreaterThan(0);
      expect(result.reactCliViewModel?.statusMessage).toContain(
        'Compiled IR preview hit contract errors',
      );
      expect(
        result.reactCliViewModel?.helpSection?.lines.some((line) =>
          line.includes('Review compile errors'),
        ),
      ).toBe(true);
      expect(fixture.writeTextArtifact).not.toHaveBeenCalled();
      expect(fixture.writeJsonArtifact).not.toHaveBeenCalled();
    } finally {
      await rm(fixture.tempRoot, { recursive: true, force: true });
    }
  });
});
