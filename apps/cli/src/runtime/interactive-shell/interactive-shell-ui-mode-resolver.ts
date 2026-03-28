import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveUiMode,
  DEFAULT_CLI_INTERACTIVE_UI_MODE,
} from '../../constants/cli-interactive-shell.constant.js';
import type { CliInteractiveShellModeResolution } from '../../types/index.js';

/**
 * Resolves the effective CLI interactive-shell UI mode without breaking non-interactive output contracts.
 */
export class CliInteractiveShellUiModeResolver {
  /**
   * Resolves one effective UI mode and downgrade reason from terminal/output constraints.
   * @param options Requested UI mode and execution-safety context.
   * @returns Effective UI mode plus fallback metadata.
   */
  public resolve(options: {
    interactiveRequested: boolean;
    requestedUiMode: CliInteractiveUiMode | null;
    outputMode: ErrorOutputEnvironment;
    isOutputTty: boolean;
    isInputTty: boolean;
    isStderrTty: boolean;
  }): CliInteractiveShellModeResolution {
    const requestedUiMode = options.requestedUiMode ?? DEFAULT_CLI_INTERACTIVE_UI_MODE;

    if (requestedUiMode === CliInteractiveUiMode.NONE) {
      return {
        requestedUiMode: options.requestedUiMode,
        uiMode: CliInteractiveUiMode.NONE,
        fallbackBehavior: null,
      };
    }

    if (!options.interactiveRequested) {
      return {
        requestedUiMode: options.requestedUiMode,
        uiMode: CliInteractiveUiMode.NONE,
        fallbackBehavior: CliInteractiveShellFallbackBehavior.NO_INTERACTIVE,
      };
    }

    if (options.outputMode !== ErrorOutputEnvironment.PRETTY) {
      return {
        requestedUiMode: options.requestedUiMode,
        uiMode: CliInteractiveUiMode.NONE,
        fallbackBehavior: CliInteractiveShellFallbackBehavior.OUTPUT_MODE_BLOCKED,
      };
    }

    if (!options.isOutputTty || !options.isInputTty || !options.isStderrTty) {
      return {
        requestedUiMode: options.requestedUiMode,
        uiMode: CliInteractiveUiMode.NONE,
        fallbackBehavior: CliInteractiveShellFallbackBehavior.NON_TTY,
      };
    }

    if (requestedUiMode === CliInteractiveUiMode.TUI) {
      return {
        requestedUiMode: options.requestedUiMode,
        uiMode: CliInteractiveUiMode.CLASSIC,
        fallbackBehavior: CliInteractiveShellFallbackBehavior.TUI_NOT_IMPLEMENTED,
      };
    }

    return {
      requestedUiMode: options.requestedUiMode,
      uiMode: requestedUiMode,
      fallbackBehavior: null,
    };
  }
}
