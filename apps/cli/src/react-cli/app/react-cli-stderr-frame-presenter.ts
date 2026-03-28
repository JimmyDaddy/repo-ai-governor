import { stderr } from 'node:process';
import type { ReactCliViewModel } from '../state/react-cli-view-model.interface.js';
import { ReactCliRunner } from './react-cli-runner.js';

/**
 * Owns stderr-only frame output for shared React CLI view models.
 */
export class ReactCliStderrFramePresenter {
  public constructor(
    private readonly writeStderr: (value: string) => void = (value) => {
      stderr.write(value);
    },
    private readonly reactCliRunner: ReactCliRunner = new ReactCliRunner(),
  ) {}

  /**
   * Writes one rendered React CLI frame to stderr without touching stdout.
   * @param viewModel Shared shell view model to render.
   * @returns Nothing.
   */
  public write(viewModel: ReactCliViewModel): void {
    const output = this.reactCliRunner.renderFrame(viewModel, {
      columns: 80,
    });

    this.writeStderr(`\n${output}\n`);
  }
}
