import { stderr } from 'node:process';
import { clearScreenDown, cursorTo } from 'node:readline';
import { ReactCliRunner } from '../../react-cli/index.js';
import type { CliSessionShellViewModel } from '../../types/index.js';

/**
 * Owns stderr-only rendering for the session-first shell surface.
 */
export class CliSessionShellStderrRenderer {
  public constructor(
    private readonly writeStderr: (value: string) => void = (value) => {
      stderr.write(value);
    },
    private readonly reactCliRunner: ReactCliRunner = new ReactCliRunner(),
    private readonly resolveColumns: () => number | undefined = () => stderr.columns,
    private readonly isInteractive: () => boolean = () => stderr.isTTY === true,
    private readonly clearViewport: () => void = () => {
      cursorTo(stderr, 0, 0);
      clearScreenDown(stderr);
    },
  ) {}

  /**
   * Writes one session-shell frame to stderr without touching stdout.
   * @param viewModel Session-shell presenter view model.
   * @returns Nothing.
   */
  public render(viewModel: CliSessionShellViewModel): void {
    const output = this.reactCliRunner.renderSessionShellFrame(viewModel, {
      columns: this.resolveColumns() ?? 80,
    });

    if (this.isInteractive()) {
      this.clearViewport();
      this.writeStderr(`${output}\n`);
      return;
    }

    this.writeStderr(`\n${output}\n`);
  }
}
