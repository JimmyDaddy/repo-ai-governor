import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';

/**
 * Owns mutable React CLI session view state before it is committed to Ink rendering.
 */
export class ReactCliSessionController {
  public constructor(private viewModel: ReactCliViewModel) {}

  /**
   * Returns the current immutable snapshot consumed by the Ink app layer.
   * @returns Current React CLI view model.
   */
  public snapshot(): ReactCliViewModel {
    return {
      ...this.viewModel,
      ...(this.viewModel.attentionSection
        ? {
            attentionSection: {
              ...this.viewModel.attentionSection,
              lines: [...this.viewModel.attentionSection.lines],
            },
          }
        : {}),
      ...(this.viewModel.commandProgressPanel
        ? {
            commandProgressPanel: this.cloneCommandProgressPanel(
              this.viewModel.commandProgressPanel,
            ),
          }
        : {}),
      sections: this.viewModel.sections.map((section) => ({
        ...section,
        lines: [...section.lines],
      })),
      ...(this.viewModel.agentProjectionPanel
        ? {
            agentProjectionPanel: this.cloneAgentProjectionPanel(
              this.viewModel.agentProjectionPanel,
            ),
          }
        : {}),
      ...(this.viewModel.helpSection
        ? {
            helpSection: {
              ...this.viewModel.helpSection,
              lines: [...this.viewModel.helpSection.lines],
            },
          }
        : {}),
      footerShortcuts: [...this.viewModel.footerShortcuts],
    };
  }

  /**
   * Applies a shallow session update while preserving section/footer array ownership.
   * @param update Partial view-model update.
   * @returns Updated snapshot.
   */
  public update(update: Partial<ReactCliViewModel>): ReactCliViewModel {
    const sections = this.cloneSections(update.sections ?? this.viewModel.sections);
    const attentionSection =
      'attentionSection' in update
        ? update.attentionSection
          ? this.cloneSection(update.attentionSection)
          : undefined
        : this.viewModel.attentionSection
          ? this.cloneSection(this.viewModel.attentionSection)
          : undefined;
    const commandProgressPanel =
      'commandProgressPanel' in update
        ? update.commandProgressPanel
          ? this.cloneCommandProgressPanel(update.commandProgressPanel)
          : undefined
        : this.viewModel.commandProgressPanel
          ? this.cloneCommandProgressPanel(this.viewModel.commandProgressPanel)
          : undefined;
    const helpSection =
      'helpSection' in update
        ? update.helpSection
          ? this.cloneSection(update.helpSection)
          : undefined
        : this.viewModel.helpSection
          ? this.cloneSection(this.viewModel.helpSection)
          : undefined;
    const agentProjectionPanel =
      'agentProjectionPanel' in update
        ? update.agentProjectionPanel
          ? this.cloneAgentProjectionPanel(update.agentProjectionPanel)
          : undefined
        : this.viewModel.agentProjectionPanel
          ? this.cloneAgentProjectionPanel(this.viewModel.agentProjectionPanel)
          : undefined;
    this.viewModel = {
      ...this.viewModel,
      ...update,
      attentionSection,
      commandProgressPanel,
      sections,
      agentProjectionPanel,
      helpSection,
      footerShortcuts: update.footerShortcuts ?? this.viewModel.footerShortcuts,
    };

    return this.snapshot();
  }

  /**
   * Clones one section object to avoid leaking mutable line arrays into session state.
   * @param section Section snapshot to copy.
   * @returns Defensive shallow clone.
   */
  private cloneSection(section: ReactCliViewModel['sections'][number]) {
    return {
      ...section,
      lines: [...section.lines],
    };
  }

  /**
   * Clones a section list to preserve snapshot ownership across updates.
   * @param sections Section list to copy.
   * @returns Defensive shallow clone list.
   */
  private cloneSections(sections: ReactCliViewModel['sections']) {
    return sections.map((section) => this.cloneSection(section));
  }

  /**
   * Clones the shared agent-projection panel to preserve array ownership in session state.
   * @param panel Shared agent-projection panel view-model.
   * @returns Defensive shallow clone.
   */
  private cloneAgentProjectionPanel(panel: NonNullable<ReactCliViewModel['agentProjectionPanel']>) {
    return {
      ...panel,
      summaryBadges: [...panel.summaryBadges],
      rows: panel.rows.map((row) => ({
        ...row,
        detailLines: [...row.detailLines],
      })),
    };
  }

  /**
   * Clones the running-progress panel to preserve array ownership in session state.
   * @param panel Shared running-progress panel view-model.
   * @returns Defensive shallow clone.
   */
  private cloneCommandProgressPanel(panel: NonNullable<ReactCliViewModel['commandProgressPanel']>) {
    return {
      ...panel,
      rows: panel.rows.map((row) => ({
        ...row,
      })),
      artifacts: panel.artifacts.map((artifact) => ({
        ...artifact,
      })),
      logEntries: panel.logEntries.map((entry) => ({
        ...entry,
      })),
      logLines: [...panel.logLines],
    };
  }
}
