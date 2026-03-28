import { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import {
  CliInteractiveShellFallbackBehavior,
  CliInteractiveUiMode,
} from '../../src/constants/cli-interactive-shell.constant.js';
import { CliInteractiveShellUiModeResolver } from '../../src/runtime/interactive-shell/interactive-shell-ui-mode-resolver.js';

describe('CliInteractiveShellUiModeResolver', () => {
  it('defaults to classic when interactive pretty-mode TTY constraints are satisfied', () => {
    const resolver = new CliInteractiveShellUiModeResolver();
    const resolution = resolver.resolve({
      interactiveRequested: true,
      requestedUiMode: null,
      outputMode: ErrorOutputEnvironment.PRETTY,
      isOutputTty: true,
      isInputTty: true,
      isStderrTty: true,
    });

    expect(resolution.uiMode).toBe(CliInteractiveUiMode.CLASSIC);
    expect(resolution.fallbackBehavior).toBeNull();
  });

  it('honors explicit react mode when output and tty constraints are satisfied', () => {
    const resolver = new CliInteractiveShellUiModeResolver();
    const resolution = resolver.resolve({
      interactiveRequested: true,
      requestedUiMode: CliInteractiveUiMode.REACT,
      outputMode: ErrorOutputEnvironment.PRETTY,
      isOutputTty: true,
      isInputTty: true,
      isStderrTty: true,
    });

    expect(resolution.uiMode).toBe(CliInteractiveUiMode.REACT);
    expect(resolution.fallbackBehavior).toBeNull();
  });

  it('forces none when --no-interactive semantics disable interactive shell usage', () => {
    const resolver = new CliInteractiveShellUiModeResolver();
    const resolution = resolver.resolve({
      interactiveRequested: false,
      requestedUiMode: CliInteractiveUiMode.REACT,
      outputMode: ErrorOutputEnvironment.PRETTY,
      isOutputTty: true,
      isInputTty: true,
      isStderrTty: true,
    });

    expect(resolution.uiMode).toBe(CliInteractiveUiMode.NONE);
    expect(resolution.fallbackBehavior).toBe(CliInteractiveShellFallbackBehavior.NO_INTERACTIVE);
  });

  it('forces none when output mode is plain or json', () => {
    const resolver = new CliInteractiveShellUiModeResolver();
    const resolution = resolver.resolve({
      interactiveRequested: true,
      requestedUiMode: CliInteractiveUiMode.REACT,
      outputMode: ErrorOutputEnvironment.JSON,
      isOutputTty: true,
      isInputTty: true,
      isStderrTty: true,
    });

    expect(resolution.uiMode).toBe(CliInteractiveUiMode.NONE);
    expect(resolution.fallbackBehavior).toBe(
      CliInteractiveShellFallbackBehavior.OUTPUT_MODE_BLOCKED,
    );
  });

  it('forces none when terminal constraints are not satisfied', () => {
    const resolver = new CliInteractiveShellUiModeResolver();
    const resolution = resolver.resolve({
      interactiveRequested: true,
      requestedUiMode: CliInteractiveUiMode.REACT,
      outputMode: ErrorOutputEnvironment.PRETTY,
      isOutputTty: true,
      isInputTty: false,
      isStderrTty: true,
    });

    expect(resolution.uiMode).toBe(CliInteractiveUiMode.NONE);
    expect(resolution.fallbackBehavior).toBe(CliInteractiveShellFallbackBehavior.NON_TTY);
  });

  it('downgrades tui requests to classic until a dedicated TUI runtime exists', () => {
    const resolver = new CliInteractiveShellUiModeResolver();
    const resolution = resolver.resolve({
      interactiveRequested: true,
      requestedUiMode: CliInteractiveUiMode.TUI,
      outputMode: ErrorOutputEnvironment.PRETTY,
      isOutputTty: true,
      isInputTty: true,
      isStderrTty: true,
    });

    expect(resolution.uiMode).toBe(CliInteractiveUiMode.CLASSIC);
    expect(resolution.fallbackBehavior).toBe(
      CliInteractiveShellFallbackBehavior.TUI_NOT_IMPLEMENTED,
    );
  });
});
