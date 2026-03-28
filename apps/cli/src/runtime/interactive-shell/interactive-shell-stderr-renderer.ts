import { stderr } from 'node:process';
import type { CliInteractiveShellSessionState } from '../../types/index.js';

/**
 * Owns stderr-only rendering for the minimal CLI interactive shell.
 */
export class CliInteractiveShellStderrRenderer {
  public constructor(
    private readonly writeStderr: (value: string) => void = (value) => {
      stderr.write(value);
    },
  ) {}

  /**
   * Renders one shell frame to stderr without touching stdout.
   * @param options Session metadata and body lines for the current shell frame.
   * @returns Nothing.
   */
  public renderFrame(options: {
    session: CliInteractiveShellSessionState;
    title: string;
    lines: string[];
  }): void {
    const headerLines = [
      '',
      `[react-shell:${options.session.commandName}] ${options.title}`,
      `state=${options.session.runState} ui=${options.session.uiMode} stdout=${options.session.stdoutContract} stderr=${options.session.stderrRendering}`,
      `step=${options.session.currentStepTitle} total_steps=${options.session.totalSteps}`,
    ];
    const bodyLines =
      Object.keys(options.session.validationErrors).length > 0
        ? [
            ...options.lines,
            `validation=${Object.values(options.session.validationErrors).join('; ')}`,
          ]
        : options.lines;

    this.writeStderr([...headerLines, ...bodyLines, ''].join('\n'));
  }

  /**
   * Renders the terminal restore boundary after the shell finishes or aborts.
   * @param session Session metadata after cleanup.
   * @returns Nothing.
   */
  public renderUnmount(session: CliInteractiveShellSessionState): void {
    const fallbackBehavior = session.fallbackBehavior ?? 'none';
    this.writeStderr(
      `\n[react-shell:${session.commandName}] unmounted state=${session.runState} fallback=${fallbackBehavior}\n`,
    );
  }
}
