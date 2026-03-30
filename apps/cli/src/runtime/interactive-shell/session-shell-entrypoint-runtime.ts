import type { ErrorOutputEnvironment } from '@repo-ai-governor/shared';
import { CLI_COMMAND_NAMES, CLI_PROGRAM_NAME } from '../../constants/cli-command.constant.js';
import { CliInteractiveUiMode } from '../../constants/cli-interactive-shell.constant.js';
import { CLI_OPTIONS_REQUIRING_VALUE } from '../../constants/cli-output.constant.js';
import type { CliReactThemePreset } from '../../constants/cli-react-theme.constant.js';
import { CliWorkspaceAction } from '../../constants/cli-workspace.constant.js';
import type {
  CliErrorOutputPayload,
  CliRuntimeDebugOptions,
  CliSessionShellCommandExecutionResult,
  CliSessionShellCommandExecutor,
  CliSessionShellRunOptions,
  CliSessionShellServiceClientLike,
  CliSuccessOutputPayload,
} from '../../types/index.js';
import { CliAgentProjectionPresenter } from '../presentation/agent-projection-presenter.js';

interface CliSessionShellNestedCliIoAdapters {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  cwd: () => string;
  isStdoutTty: () => boolean;
  isStdinTty: () => boolean;
  isStderrTty: () => boolean;
  env: () => NodeJS.ProcessEnv;
}

interface CliSessionShellNestedCommandExecutorOptions {
  locale: string;
  currentWorkingDirectory: string;
  environment: NodeJS.ProcessEnv;
  executeCli: (argv: string[], io: CliSessionShellNestedCliIoAdapters) => Promise<number>;
}

interface CliSessionShellEntrypointRuntimeOptions {
  sessionClient: CliSessionShellServiceClientLike;
  commandExecutor?: CliSessionShellCommandExecutor;
  currentWorkingDirectory: string;
  workspaceSummary: string;
  outputMode: ErrorOutputEnvironment;
  uiTheme?: CliReactThemePreset;
  translate: (key: string, interpolation?: Record<string, string>) => string;
}

interface CliSessionShellRunOptionOverrides {
  resumeOnStartup?: boolean;
  requestedSessionId?: string | null;
  initialPrompt?: string | null;
}

/**
 * Owns session-shell entrypoint routing and nested command wiring outside the legacy CLI main file.
 *
 * Why this exists:
 * the session-first shell now has enough bootstrap-specific behavior that the legacy entrypoint
 * should delegate to one focused runtime instead of absorbing more shell-only responsibilities.
 */
export class CliSessionShellEntrypointRuntime {
  private static readonly agentProjectionPresenter = new CliAgentProjectionPresenter();

  public constructor(private readonly options: CliSessionShellEntrypointRuntimeOptions) {}

  /**
   * Creates one nested command executor that re-enters the CLI in non-interactive JSON mode.
   * @param options Nested CLI execution contract.
   * @returns Session-shell bridge executor.
   */
  public static createNestedCommandExecutor(
    options: CliSessionShellNestedCommandExecutorOptions,
  ): CliSessionShellCommandExecutor {
    return async (argvTokens: string[]): Promise<CliSessionShellCommandExecutionResult> => {
      const nestedStdout: string[] = [];
      const nestedStderr: string[] = [];
      const nestedExitCode = await options.executeCli(
        [
          'node',
          CLI_PROGRAM_NAME,
          '--locale',
          options.locale,
          '--output',
          'json',
          '--no-interactive',
          ...argvTokens,
        ],
        {
          stdout: (value: string) => {
            nestedStdout.push(value);
          },
          stderr: (value: string) => {
            nestedStderr.push(value);
          },
          cwd: () => options.currentWorkingDirectory,
          isStdoutTty: () => false,
          isStdinTty: () => false,
          isStderrTty: () => false,
          env: () => options.environment,
        },
      );

      return CliSessionShellEntrypointRuntime.summarizeCommandResult({
        commandLine: argvTokens.join(' '),
        exitCode: nestedExitCode,
        stdoutText: nestedStdout.join('').trim(),
        stderrText: nestedStderr.join('').trim(),
      });
    };
  }

  /**
   * Creates one runner input payload from the shared CLI runtime context.
   * @param overrides Optional startup overrides such as resume or initial prompt.
   * @returns Session-shell run options.
   */
  public createRunOptions(
    overrides: CliSessionShellRunOptionOverrides = {},
  ): CliSessionShellRunOptions {
    return {
      sessionClient: this.options.sessionClient,
      ...(this.options.commandExecutor
        ? {
            commandExecutor: this.options.commandExecutor,
          }
        : {}),
      currentWorkingDirectory: this.options.currentWorkingDirectory,
      workspaceSummary: this.options.workspaceSummary,
      outputMode: this.options.outputMode,
      ...(this.options.uiTheme
        ? {
            uiTheme: this.options.uiTheme,
          }
        : {}),
      ...(overrides.resumeOnStartup !== undefined
        ? {
            resumeOnStartup: overrides.resumeOnStartup,
          }
        : {}),
      ...(overrides.requestedSessionId !== undefined
        ? {
            requestedSessionId: overrides.requestedSessionId,
          }
        : {}),
      ...(overrides.initialPrompt !== undefined
        ? {
            initialPrompt: overrides.initialPrompt,
          }
        : {}),
      translate: this.options.translate,
    };
  }

  /**
   * Detects whether the current output/UI contract can host the live session shell.
   * @param runtimeDebugOptions Resolved UI/TTY/interactivity contract snapshot.
   * @returns True when interactive React session shell usage is allowed.
   */
  public isInteractiveSessionShellAllowed(runtimeDebugOptions: CliRuntimeDebugOptions): boolean {
    return runtimeDebugOptions.uiMode === CliInteractiveUiMode.REACT;
  }

  /**
   * Resolves one optional startup prompt when the entrypoint is used like `repo-ai-governor "query"`.
   * @param args CLI args excluding node and binary.
   * @returns Startup prompt text or `null` when argv should not be treated as a session query.
   */
  public resolveSessionStartupQuery(args: string[]): string | null {
    const positionalTokens = this.resolvePositionalTokens(args);
    if (positionalTokens.length === 0) {
      return null;
    }

    const firstToken = positionalTokens[0];
    if (this.isRecognizedTopLevelCommandToken(firstToken)) {
      return null;
    }

    return positionalTokens.join(' ');
  }

  /**
   * Detects whether the entrypoint should default into the session-first shell surface.
   * @param args CLI args excluding node and binary.
   * @param runtimeDebugOptions Resolved UI/TTY/interactivity contract snapshot.
   * @param sessionStartupQuery Resolved startup prompt, if any.
   * @returns True when no explicit command is present and the live session-shell contract is allowed.
   */
  public shouldEnterDefaultSessionShell(
    args: string[],
    runtimeDebugOptions: CliRuntimeDebugOptions,
    sessionStartupQuery: string | null,
  ): boolean {
    if (args.includes('--help') || args.includes('-h')) {
      return false;
    }

    if (!this.isInteractiveSessionShellAllowed(runtimeDebugOptions)) {
      return false;
    }

    if (sessionStartupQuery) {
      return true;
    }

    return this.resolveFirstPositionalToken(args) === null;
  }

  private resolveFirstPositionalToken(args: string[]): string | null {
    return this.resolvePositionalTokens(args)[0] ?? null;
  }

  private resolvePositionalTokens(args: string[]): string[] {
    const positionalTokens: string[] = [];

    for (let index = 0; index < args.length; index += 1) {
      const token = args[index];
      if (!token) {
        continue;
      }

      if (token === '--') {
        if (args[index + 1]) {
          positionalTokens.push(args[index + 1] as string);
        }
        break;
      }

      if (token.startsWith('--')) {
        if (!token.includes('=') && CLI_OPTIONS_REQUIRING_VALUE.has(token)) {
          const nextToken = args[index + 1];
          if (nextToken && !nextToken.startsWith('-')) {
            index += 1;
          }
        }
        continue;
      }

      if (token.startsWith('-')) {
        continue;
      }

      positionalTokens.push(token);
    }

    return positionalTokens;
  }

  private isRecognizedTopLevelCommandToken(token: string | null): boolean {
    if (!token) {
      return false;
    }

    return (
      CLI_COMMAND_NAMES.includes(token as (typeof CLI_COMMAND_NAMES)[number]) ||
      token === CliWorkspaceAction.SET_UI_THEME
    );
  }

  private static summarizeCommandResult(options: {
    commandLine: string;
    exitCode: number;
    stdoutText: string;
    stderrText: string;
  }): CliSessionShellCommandExecutionResult {
    const parsedPayload = CliSessionShellEntrypointRuntime.parseCliJsonOutput(options.stdoutText);
    if (!parsedPayload) {
      const fallbackMessage =
        options.stderrText || options.stdoutText || 'No CLI payload was captured.';
      return {
        artifactPaths: [],
        commandLine: options.commandLine,
        message: fallbackMessage,
        status: options.exitCode === 0 ? 'success' : 'error',
        summaryLines: [fallbackMessage],
      };
    }

    if ('error_code' in parsedPayload) {
      const artifactPaths = [
        parsedPayload.error_details?.report_path,
        parsedPayload.error_details?.replay_path,
      ].filter((value): value is string => typeof value === 'string' && value.length > 0);
      return {
        artifactPaths,
        commandLine: options.commandLine,
        message: parsedPayload.message,
        status: 'error',
        summaryLines: [
          parsedPayload.message,
          parsedPayload.hint,
          `next_action=${parsedPayload.next_action}`,
        ],
      };
    }

    const experienceLines = parsedPayload.command_result?.experience?.layeredLogs.summary ?? [];
    const artifactPaths =
      parsedPayload.command_result?.artifacts
        ?.map((artifact) => artifact.path)
        .filter((path) => typeof path === 'string' && path.length > 0) ?? [];
    const agentViewSummary = parsedPayload.command_result?.agentView
      ? CliSessionShellEntrypointRuntime.agentProjectionPresenter.buildSummaryLine(
          parsedPayload.command_result.agentView,
          parsedPayload.diagnostics.locale,
        )
      : null;
    const agentViewHighlights = parsedPayload.command_result?.agentView
      ? CliSessionShellEntrypointRuntime.agentProjectionPresenter.buildHighlightLines(
          parsedPayload.command_result.agentView,
          parsedPayload.diagnostics.locale,
          2,
        )
      : [];

    return {
      artifactPaths,
      commandLine: options.commandLine,
      message: parsedPayload.message,
      status: 'success',
      summaryLines: [
        parsedPayload.message,
        ...(parsedPayload.command_result?.summary ? [parsedPayload.command_result.summary] : []),
        ...(agentViewSummary ? [`agent_view=${agentViewSummary}`] : []),
        ...agentViewHighlights,
        ...experienceLines.slice(0, 2),
      ],
    };
  }

  private static parseCliJsonOutput(
    stdoutText: string,
  ): CliSuccessOutputPayload | CliErrorOutputPayload | null {
    if (stdoutText.length === 0) {
      return null;
    }

    try {
      return JSON.parse(stdoutText) as CliSuccessOutputPayload | CliErrorOutputPayload;
    } catch {
      return null;
    }
  }
}
