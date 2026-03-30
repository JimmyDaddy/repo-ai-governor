import { stderr, stdin } from 'node:process';
import type { Instance, RenderOptions } from 'ink';
import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';
import { ReactCliRunner } from './react-cli-runner.js';

/**
 * Owns one live stderr-only Ink session for long-running command progress updates.
 */
export class ReactCliLiveProgressPresenter {
  private activeInstance: Instance | null = null;

  public constructor(
    private readonly reactCliRunner: ReactCliRunner = new ReactCliRunner(),
    private readonly renderOptions: RenderOptions = {
      stdin,
      stdout: stderr,
      stderr,
      exitOnCtrlC: false,
      patchConsole: false,
    },
  ) {}

  /**
   * Mounts or rerenders the live command-progress shell.
   * @param viewModel Latest shared shell view model.
   * @returns Nothing.
   */
  public render(viewModel: ReactCliViewModel): void {
    if (this.activeInstance) {
      this.reactCliRunner.rerender(this.activeInstance, viewModel);
      return;
    }

    this.activeInstance = this.reactCliRunner.mount(viewModel, this.renderOptions);
  }

  /**
   * Tears down the live command-progress shell before the final static frame is written.
   * @returns Nothing.
   */
  public close(): void {
    if (!this.activeInstance) {
      return;
    }

    this.activeInstance.clear();
    this.activeInstance.unmount();
    this.activeInstance = null;
  }
}
