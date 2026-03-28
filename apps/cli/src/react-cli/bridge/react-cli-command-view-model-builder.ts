import type { CliCommandName } from '../../constants/cli-command.constant.js';
import { CliGovernanceCheckStatus } from '../../constants/cli-governance-runtime.constant.js';
import type { CliCommandResultCheck, CliInteractionPrompt } from '../../types/interfaces/index.js';
import type {
  ReactCliSectionViewModel,
  ReactCliStatusVariant,
  ReactCliViewModel,
} from '../state/react-cli-view-model.interface.js';
import type { ReactCliCommandDescriptor } from './react-cli-command-descriptor-registry.js';

export interface ReactCliCommandViewModelBuildOptions {
  commandName: CliCommandName;
  descriptor: ReactCliCommandDescriptor;
  subtitle: string;
  inputTitle: string;
  summaryTitle: string;
  attentionTitle: string;
  footerShortcutsTitle?: string;
  summaryLines: string[];
  fieldValues?: Record<string, string>;
  statusMessage?: string;
  statusVariant?: ReactCliStatusVariant;
  checks?: CliCommandResultCheck[];
  interactionPrompts?: CliInteractionPrompt[];
  footerShortcuts?: string[];
}

/**
 * Owns shared view-model shaping for command-level React CLI summary shells.
 */
export class ReactCliCommandViewModelBuilder {
  /**
   * Builds one React CLI view model from descriptor metadata and command execution facts.
   * @param options Localized descriptor, field values, checks, and summary payload.
   * @returns Shared shell view model.
   */
  public build(options: ReactCliCommandViewModelBuildOptions): ReactCliViewModel {
    const sections: ReactCliSectionViewModel[] = [];
    const fieldLines = this.resolveFieldLines(options.descriptor, options.fieldValues);
    if (fieldLines.length > 0) {
      sections.push({
        title: options.inputTitle,
        lines: fieldLines,
      });
    }
    sections.push({
      title: options.summaryTitle,
      lines: options.summaryLines,
    });

    const attentionLines = this.resolveAttentionLines(options.checks);
    const helpLines = this.resolveHelpLines(options.descriptor, options.interactionPrompts);
    return {
      title: `[react-shell:${options.commandName}] ${options.descriptor.title}`,
      subtitle: `${options.subtitle} descriptor=${options.descriptor.descriptorId}`,
      statusMessage: options.statusMessage,
      statusVariant: options.statusVariant,
      attentionSection:
        attentionLines.length > 0
          ? {
              title: options.attentionTitle,
              lines: attentionLines,
            }
          : undefined,
      sections,
      helpSection:
        helpLines.length > 0
          ? {
              title: options.descriptor.helpSectionTitle ?? 'Help',
              lines: helpLines,
            }
          : undefined,
      footerShortcutsTitle: options.footerShortcutsTitle ?? 'Shortcuts',
      footerShortcuts: options.footerShortcuts ?? options.descriptor.footerShortcuts ?? [],
    };
  }

  /**
   * Resolves one shell status variant from the current check aggregate.
   * @param checks Command check rows emitted by the executor.
   * @returns Shared shell status variant.
   */
  public resolveStatusVariantFromChecks(
    checks: CliCommandResultCheck[],
  ): ReactCliStatusVariant | undefined {
    if (checks.some((check) => check.status === CliGovernanceCheckStatus.FAIL)) {
      return 'error';
    }

    if (checks.some((check) => check.status === CliGovernanceCheckStatus.WARN)) {
      return 'warning';
    }

    if (checks.length > 0) {
      return 'success';
    }

    return undefined;
  }

  /**
   * Resolves localized input lines from descriptor order and captured field values.
   * @param descriptor Shared command descriptor.
   * @param fieldValues Runtime values captured for the shell summary.
   * @returns Ordered input lines.
   */
  private resolveFieldLines(
    descriptor: ReactCliCommandDescriptor,
    fieldValues: Record<string, string> | undefined,
  ): string[] {
    if (!fieldValues) {
      return [];
    }

    return descriptor.fields.map(
      (field) => `${field.label}: ${fieldValues[field.fieldId] ?? 'n/a'}`,
    );
  }

  /**
   * Resolves warning/failure lines for the attention section.
   * @param checks Command check rows emitted by the executor.
   * @returns Human-readable attention lines.
   */
  private resolveAttentionLines(checks: CliCommandResultCheck[] | undefined): string[] {
    return (checks ?? [])
      .filter(
        (check) =>
          check.status === CliGovernanceCheckStatus.WARN ||
          check.status === CliGovernanceCheckStatus.FAIL,
      )
      .map((check) => `${this.humanizeCheckId(check.id)}: ${check.detail}`);
  }

  /**
   * Resolves help lines from descriptor hints plus runtime interaction prompts.
   * @param descriptor Shared command descriptor.
   * @param interactionPrompts Runtime prompts emitted by the command experience payload.
   * @returns Ordered help lines.
   */
  private resolveHelpLines(
    descriptor: ReactCliCommandDescriptor,
    interactionPrompts: CliInteractionPrompt[] | undefined,
  ): string[] {
    const promptLines = (interactionPrompts ?? []).map(
      (prompt) => `${prompt.title}: ${prompt.action}`,
    );
    return [...(descriptor.helpLines ?? []), ...promptLines];
  }

  /**
   * Converts one machine-oriented check id into a readable title.
   * @param checkId Stable check identifier.
   * @returns Title-cased label.
   */
  private humanizeCheckId(checkId: string): string {
    return checkId
      .split(/[_-]/u)
      .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
      .join(' ');
  }
}
