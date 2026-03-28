import { WorkspaceMode } from '@repo-ai-governor/config';
import { CliCommandName } from '../../constants/cli-command.constant.js';
import { CliWorkspaceAction } from '../../constants/cli-workspace.constant.js';
import {
  type ReactCliCommandDescriptor,
  ReactCliCommandDescriptorRegistry,
  ReactCliFieldKind,
} from './react-cli-command-descriptor-registry.js';

const REACT_CLI_CONNECT_DESCRIPTOR_ID = 'cli.connect.summary.m2';
const REACT_CLI_WORKSPACE_DESCRIPTOR_ID = 'cli.workspace.migration.m2';

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
    registry.register(this.createWorkspaceDescriptor(localization));
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
