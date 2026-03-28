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
      sections: this.viewModel.sections.map((section) => ({
        ...section,
        lines: [...section.lines],
      })),
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
    const attentionSection = update.attentionSection
      ? this.cloneSection(update.attentionSection)
      : this.viewModel.attentionSection
        ? this.cloneSection(this.viewModel.attentionSection)
        : undefined;
    const helpSection = update.helpSection
      ? this.cloneSection(update.helpSection)
      : this.viewModel.helpSection
        ? this.cloneSection(this.viewModel.helpSection)
        : undefined;
    this.viewModel = {
      ...this.viewModel,
      ...update,
      attentionSection,
      sections,
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
}
