import { WorkspaceMode } from '@repo-ai-governor/config';
import { CliCommandName } from '../../constants/cli-command.constant.js';
import {
  CliWorkflowAction,
  CliWorkflowDefinitionSource,
  CliWorkflowEntryMode,
  CliWorkflowTemplateId,
} from '../../constants/cli-workflow.constant.js';
import { CliWorkspaceAction } from '../../constants/cli-workspace.constant.js';
import {
  type ReactCliCommandDescriptor,
  ReactCliCommandDescriptorRegistry,
  ReactCliFieldKind,
} from './react-cli-command-descriptor-registry.js';

const REACT_CLI_CONNECT_DESCRIPTOR_ID = 'cli.connect.summary.m2';
const REACT_CLI_UPGRADE_DESCRIPTOR_ID = 'cli.upgrade.summary.m3';
const REACT_CLI_WORKSPACE_DESCRIPTOR_ID = 'cli.workspace.migration.m2';
const REACT_CLI_WORKFLOW_DESCRIPTOR_ID = 'cli.workflow.entry.m3';

export interface ReactCliCommandDescriptorCatalogLocalization {
  translate?: (key: string, interpolation?: Record<string, string>) => string;
}

/**
 * Owns localized shared descriptor registration for connect/workspace React CLI surfaces.
 */
export class ReactCliCommandDescriptorCatalog {
  /**
   * Creates one localized descriptor registry for the current command surface.
   * @param localization Runtime translation adapter.
   * @returns Registry populated with shared command descriptors.
   */
  public createRegistry(
    localization: ReactCliCommandDescriptorCatalogLocalization,
  ): ReactCliCommandDescriptorRegistry {
    const registry = new ReactCliCommandDescriptorRegistry();
    registry.register(this.createConnectDescriptor(localization));
    registry.register(this.createUpgradeDescriptor(localization));
    registry.register(this.createWorkspaceDescriptor(localization));
    registry.register(this.createWorkflowDescriptor(localization));
    return registry;
  }

  /**
   * Builds the shared `connect` command descriptor.
   * @param localization Runtime translation adapter.
   * @returns Descriptor metadata for the shared shell.
   */
  private createConnectDescriptor(
    localization: ReactCliCommandDescriptorCatalogLocalization,
  ): ReactCliCommandDescriptor {
    return {
      descriptorId: REACT_CLI_CONNECT_DESCRIPTOR_ID,
      commandName: CliCommandName.CONNECT,
      title: this.translate(localization, 'cli.reactShell.connect.title'),
      fields: [
        {
          fieldId: 'workspaceRoot',
          kind: ReactCliFieldKind.TEXT,
          label: this.translate(localization, 'cli.reactShell.connect.fields.workspaceRoot'),
        },
        {
          fieldId: 'recordLedger',
          kind: ReactCliFieldKind.CONFIRM,
          label: this.translate(localization, 'cli.reactShell.connect.fields.recordLedger'),
        },
        {
          fieldId: 'taskId',
          kind: ReactCliFieldKind.TEXT,
          label: this.translate(localization, 'cli.reactShell.connect.fields.taskId'),
        },
      ],
      helpSectionTitle: this.translate(localization, 'cli.reactShell.shared.help'),
      helpLines: [
        this.translate(localization, 'cli.reactShell.connect.help.stderrBoundary'),
        this.translate(localization, 'cli.reactShell.connect.help.ledgerBackfill'),
      ],
      footerShortcuts: [
        this.translate(localization, 'cli.reactShell.footer.stdoutSummaryFollows'),
        this.translate(localization, 'cli.reactShell.footer.uiNoneDisablesShell'),
      ],
    };
  }

  /**
   * Builds the shared `upgrade` command descriptor.
   * @param localization Runtime translation adapter.
   * @returns Descriptor metadata for the shared shell.
   */
  private createUpgradeDescriptor(
    localization: ReactCliCommandDescriptorCatalogLocalization,
  ): ReactCliCommandDescriptor {
    return {
      descriptorId: REACT_CLI_UPGRADE_DESCRIPTOR_ID,
      commandName: CliCommandName.UPGRADE,
      title: this.translate(localization, 'cli.reactShell.upgrade.title'),
      fields: [
        {
          fieldId: 'workspaceRoot',
          kind: ReactCliFieldKind.TEXT,
          label: this.translate(localization, 'cli.reactShell.upgrade.fields.workspaceRoot'),
        },
        {
          fieldId: 'sourceVersion',
          kind: ReactCliFieldKind.TEXT,
          label: this.translate(localization, 'cli.reactShell.upgrade.fields.sourceVersion'),
        },
        {
          fieldId: 'targetVersion',
          kind: ReactCliFieldKind.TEXT,
          label: this.translate(localization, 'cli.reactShell.upgrade.fields.targetVersion'),
        },
        {
          fieldId: 'confirmationDecision',
          kind: ReactCliFieldKind.TEXT,
          label: this.translate(localization, 'cli.reactShell.upgrade.fields.confirmationDecision'),
        },
      ],
      helpSectionTitle: this.translate(localization, 'cli.reactShell.shared.help'),
      helpLines: [
        this.translate(localization, 'cli.reactShell.upgrade.help.analyzeOnly'),
        this.translate(localization, 'cli.reactShell.upgrade.help.rollbackReference'),
      ],
      footerShortcuts: [
        this.translate(localization, 'cli.reactShell.footer.stdoutSummaryFollows'),
        this.translate(localization, 'cli.reactShell.footer.uiNoneDisablesShell'),
      ],
    };
  }

  /**
   * Builds the shared `workspace` command descriptor.
   * @param localization Runtime translation adapter.
   * @returns Descriptor metadata for the shared shell.
   */
  private createWorkspaceDescriptor(
    localization: ReactCliCommandDescriptorCatalogLocalization,
  ): ReactCliCommandDescriptor {
    return {
      descriptorId: REACT_CLI_WORKSPACE_DESCRIPTOR_ID,
      commandName: CliCommandName.WORKSPACE,
      title: this.translate(localization, 'cli.reactShell.workspace.title'),
      fields: [
        {
          fieldId: 'action',
          kind: ReactCliFieldKind.SELECT,
          label: this.translate(localization, 'cli.reactShell.workspace.fields.action'),
          options: [
            {
              label: this.translate(localization, 'cli.reactShell.workspace.actions.dryRun'),
              value: CliWorkspaceAction.DRY_RUN,
            },
            {
              label: this.translate(localization, 'cli.reactShell.workspace.actions.execute'),
              value: CliWorkspaceAction.EXECUTE,
            },
            {
              label: this.translate(localization, 'cli.reactShell.workspace.actions.rollback'),
              value: CliWorkspaceAction.ROLLBACK,
            },
            {
              label: this.translate(localization, 'cli.reactShell.workspace.actions.clearConfig'),
              value: CliWorkspaceAction.CLEAR_CONFIG,
            },
          ],
        },
        {
          fieldId: 'targetMode',
          kind: ReactCliFieldKind.SELECT,
          label: this.translate(localization, 'cli.reactShell.workspace.fields.targetMode'),
          options: [
            {
              label: WorkspaceMode.REPO_LOCAL,
              value: WorkspaceMode.REPO_LOCAL,
            },
            {
              label: WorkspaceMode.TOOL_MANAGED,
              value: WorkspaceMode.TOOL_MANAGED,
            },
          ],
        },
        {
          fieldId: 'targetRoot',
          kind: ReactCliFieldKind.TEXT,
          label: this.translate(localization, 'cli.reactShell.workspace.fields.targetRoot'),
        },
        {
          fieldId: 'planPath',
          kind: ReactCliFieldKind.TEXT,
          label: this.translate(localization, 'cli.reactShell.workspace.fields.planPath'),
        },
      ],
      helpSectionTitle: this.translate(localization, 'cli.reactShell.shared.help'),
      helpLines: [
        this.translate(localization, 'cli.reactShell.workspace.help.stableOutputContract'),
        this.translate(localization, 'cli.reactShell.workspace.help.persistPlan'),
      ],
      footerShortcuts: [
        this.translate(localization, 'cli.reactShell.footer.stdoutSummaryFollows'),
        this.translate(localization, 'cli.reactShell.footer.workspaceRollbackRestoresPriorState'),
        this.translate(localization, 'cli.reactShell.footer.uiNoneDisablesShell'),
      ],
    };
  }

  /**
   * Builds the shared `workflow` command descriptor.
   * @param localization Runtime translation adapter.
   * @returns Descriptor metadata for the shared shell.
   */
  private createWorkflowDescriptor(
    localization: ReactCliCommandDescriptorCatalogLocalization,
  ): ReactCliCommandDescriptor {
    return {
      descriptorId: REACT_CLI_WORKFLOW_DESCRIPTOR_ID,
      commandName: CliCommandName.WORKFLOW,
      title: this.translate(localization, 'cli.reactShell.workflow.title'),
      fields: [
        {
          fieldId: 'action',
          kind: ReactCliFieldKind.SELECT,
          label: this.translate(localization, 'cli.reactShell.workflow.fields.action'),
          options: [
            {
              label: this.translate(localization, 'cli.reactShell.workflow.actions.create'),
              value: CliWorkflowAction.CREATE,
            },
            {
              label: this.translate(localization, 'cli.reactShell.workflow.actions.edit'),
              value: CliWorkflowAction.EDIT,
            },
            {
              label: this.translate(localization, 'cli.reactShell.workflow.actions.preview'),
              value: CliWorkflowAction.PREVIEW,
            },
          ],
        },
        {
          fieldId: 'templateId',
          kind: ReactCliFieldKind.SELECT,
          label: this.translate(localization, 'cli.reactShell.workflow.fields.templateId'),
          options: [
            {
              label: this.translate(
                localization,
                'cli.reactShell.workflow.templates.parallelReview',
              ),
              value: CliWorkflowTemplateId.PARALLEL_REVIEW,
            },
            {
              label: this.translate(localization, 'cli.reactShell.workflow.templates.loopGuarded'),
              value: CliWorkflowTemplateId.LOOP_GUARDED,
            },
            {
              label: this.translate(
                localization,
                'cli.reactShell.workflow.templates.conditionRoute',
              ),
              value: CliWorkflowTemplateId.CONDITION_ROUTE,
            },
          ],
        },
        {
          fieldId: 'entryMode',
          kind: ReactCliFieldKind.SELECT,
          label: this.translate(localization, 'cli.reactShell.workflow.fields.entryMode'),
          options: [
            {
              label: this.translate(localization, 'cli.reactShell.workflow.entryModes.readOnly'),
              value: CliWorkflowEntryMode.READ_ONLY,
            },
            {
              label: this.translate(localization, 'cli.reactShell.workflow.entryModes.createSeed'),
              value: CliWorkflowEntryMode.CREATE_SEED,
            },
            {
              label: this.translate(localization, 'cli.reactShell.workflow.entryModes.editSeed'),
              value: CliWorkflowEntryMode.EDIT_SEED,
            },
          ],
        },
        {
          fieldId: 'definitionSource',
          kind: ReactCliFieldKind.SELECT,
          label: this.translate(localization, 'cli.reactShell.workflow.fields.definitionSource'),
          options: [
            {
              label: this.translate(
                localization,
                'cli.reactShell.workflow.definitionSources.previewTemplate',
              ),
              value: CliWorkflowDefinitionSource.PREVIEW_TEMPLATE,
            },
            {
              label: this.translate(
                localization,
                'cli.reactShell.workflow.definitionSources.templateSeed',
              ),
              value: CliWorkflowDefinitionSource.TEMPLATE_SEED,
            },
            {
              label: this.translate(
                localization,
                'cli.reactShell.workflow.definitionSources.workspaceSaved',
              ),
              value: CliWorkflowDefinitionSource.WORKSPACE_SAVED,
            },
          ],
        },
      ],
      helpSectionTitle: this.translate(localization, 'cli.reactShell.shared.help'),
      helpLines: [
        this.translate(localization, 'cli.reactShell.workflow.help.sharedEntrySurface'),
        this.translate(localization, 'cli.reactShell.workflow.help.editLoadBehavior'),
      ],
      footerShortcuts: [
        this.translate(localization, 'cli.reactShell.footer.stdoutSummaryFollows'),
        this.translate(localization, 'cli.reactShell.footer.uiNoneDisablesShell'),
      ],
    };
  }

  /**
   * Resolves one localized descriptor string from runtime translation keys.
   * @param localization Runtime translation adapters.
   * @param key Translation key.
   * @returns Localized text or the key when translation runtime is unavailable.
   */
  private translate(
    localization: ReactCliCommandDescriptorCatalogLocalization,
    key: string,
  ): string {
    return localization.translate?.(key) ?? key;
  }
}
