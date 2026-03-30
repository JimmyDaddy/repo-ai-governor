import { stderr, stdin } from 'node:process';
import { type Interface, type ReadLineOptions, createInterface } from 'node:readline';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import type { CliSessionShellPromptAdapter } from '../../types/index.js';

/**
 * Owns readline-backed prompt collection for the session-first shell baseline.
 */
export class CliSessionShellReadlinePromptAdapter implements CliSessionShellPromptAdapter {
  private static readonly DEFAULT_MULTILINE_TERMINATOR = '.';
  private readonly readline: Interface;

  public constructor(
    input: NodeJS.ReadableStream = stdin,
    output: NodeJS.WritableStream = stderr,
    createReadline: (options: ReadLineOptions) => Interface = (options) => createInterface(options),
  ) {
    this.readline = createReadline({
      input,
      output,
      terminal: true,
      historySize: 100,
      removeHistoryDuplicates: true,
    });
  }

  /**
   * Reads one line from the terminal, returning `null` when EOF closes the shell.
   * @param prompt Prompt label rendered before reading user input.
   * @returns Input line, or `null` when EOF closes the interface.
   */
  public async readLine(prompt: string): Promise<string | null> {
    return await new Promise<string | null>((resolve, reject) => {
      let settled = false;

      const cleanup = (): void => {
        this.readline.off('line', handleLine);
        this.readline.off('close', handleClose);
        this.readline.off('SIGINT', handleSigint);
      };

      const settle = (resolver: () => void): void => {
        if (settled) {
          return;
        }

        settled = true;
        cleanup();
        resolver();
      };

      const handleLine = (line: string): void => {
        settle(() => resolve(line));
      };

      const handleClose = (): void => {
        settle(() => resolve(null));
      };

      const handleSigint = (): void => {
        settle(() =>
          reject(
            new RuntimeError(
              GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
              'session shell prompt closed by SIGINT',
            ),
          ),
        );
      };

      this.readline.on('line', handleLine);
      this.readline.on('close', handleClose);
      this.readline.on('SIGINT', handleSigint);
      this.readline.setPrompt(prompt);
      this.readline.prompt();
    });
  }

  /**
   * Reads one multi-line block until the terminator line is entered.
   * @param prompt Prompt rendered for the first line.
   * @param terminator Line that finalizes the block.
   * @returns Joined block contents, or `null` when EOF closes the interface first.
   */
  public async readMultiline(
    prompt: string,
    terminator: string = CliSessionShellReadlinePromptAdapter.DEFAULT_MULTILINE_TERMINATOR,
  ): Promise<string | null> {
    const lines: string[] = [];

    while (true) {
      const nextLine = await this.readLine(lines.length === 0 ? prompt : '... ');
      if (nextLine === null) {
        return lines.length > 0 ? lines.join('\n') : null;
      }
      if (nextLine.trim() === terminator) {
        return lines.join('\n');
      }
      lines.push(nextLine);
    }
  }

  /**
   * Closes the readline interface and releases terminal listeners.
   * @returns Nothing.
   */
  public close(): void {
    this.readline.close();
  }
}
