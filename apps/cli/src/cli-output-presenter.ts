import { ErrorOutputEnvironment } from "@repo-ai-governor/shared";
import { CliVerbosity } from "./constants/cli-output.constant.js";
import type { CliErrorOutputPayload, CliSuccessOutputPayload } from "./types/interfaces/index.js";

const ANSI_RESET = "\u001b[0m";
const ANSI_SUCCESS = "\u001b[1;32m";
const ANSI_ERROR = "\u001b[1;31m";

/**
 * Renders and writes CLI output payloads for success/error flows.
 *
 * Why this exists:
 * one presenter keeps `pretty/plain/json` behavior deterministic across commands
 * and ensures non-TTY fallback still emits a stable output contract.
 */
export class CliOutputPresenter {
  /**
   * Creates a presenter bound to runtime stdout/stderr writers.
   * @param io Output writer adapters from CLI runtime.
   */
  public constructor(
    private readonly io: {
      stdout: (value: string) => void;
      stderr: (value: string) => void;
    },
  ) {}

  /**
   * Writes one successful payload to stdout using resolved output mode.
   * @param payload Successful execution payload.
   * @returns Void.
   */
  public writeSuccess(payload: CliSuccessOutputPayload): void {
    this.io.stdout(this.ensureTrailingNewLine(this.renderSuccess(payload)));
  }

  /**
   * Writes one error payload to stderr using resolved output mode.
   * @param payload Failed execution payload.
   * @returns Void.
   */
  public writeError(payload: CliErrorOutputPayload): void {
    this.io.stderr(this.ensureTrailingNewLine(this.renderError(payload)));
  }

  /**
   * Renders one success payload by mode.
   * @param payload Successful execution payload.
   * @returns Rendered output text.
   */
  private renderSuccess(payload: CliSuccessOutputPayload): string {
    if (payload.output_mode === ErrorOutputEnvironment.JSON) {
      return JSON.stringify(payload);
    }

    if (payload.output_mode === ErrorOutputEnvironment.PRETTY) {
      return this.renderPrettySuccess(payload);
    }

    return this.renderPlainSuccess(payload);
  }

  /**
   * Renders one error payload by mode.
   * @param payload Failed execution payload.
   * @returns Rendered output text.
   */
  private renderError(payload: CliErrorOutputPayload): string {
    if (payload.output_mode === ErrorOutputEnvironment.JSON) {
      return JSON.stringify(payload);
    }

    if (payload.output_mode === ErrorOutputEnvironment.PRETTY) {
      return this.renderPrettyError(payload);
    }

    return this.renderPlainError(payload);
  }

  /**
   * Renders a pretty success message with sectioned key details.
   * @param payload Successful execution payload.
   * @returns Pretty-formatted text.
   */
  private renderPrettySuccess(payload: CliSuccessOutputPayload): string {
    const title = this.decorateIfColorEnabled(
      "repo-ai-governor: command succeeded",
      ANSI_SUCCESS,
      payload.runtime.color_enabled,
    );
    const lines = [title, `  message: ${payload.message}`, `  command: ${payload.command}`];
    const commandResult = payload.command_result;

    if (commandResult) {
      lines.push(
        `  operation: ${commandResult.operation}`,
        `  operation_summary: ${commandResult.summary}`,
      );

      if (commandResult.attach_mode) {
        lines.push(`  attach_mode: ${commandResult.attach_mode}`);
      }
      if (commandResult.check_totals) {
        lines.push(
          `  checks: pass=${commandResult.check_totals.pass} warn=${commandResult.check_totals.warn} fail=${commandResult.check_totals.fail}`,
        );
      }
    }

    if (payload.verbosity !== CliVerbosity.QUIET) {
      lines.push(
        `  locale: ${payload.diagnostics.locale}`,
        `  profile: ${payload.diagnostics.profile}`,
        `  output_mode: ${payload.output_mode}`,
        `  downgraded_from: ${payload.runtime.downgraded_from ?? "none"}`,
      );
    }

    if (payload.verbosity === CliVerbosity.VERBOSE) {
      lines.push(
        `  config_source: ${payload.diagnostics.configSource}`,
        `  workspace_mode: ${payload.diagnostics.workspaceMode}`,
        `  workspace_mode_source: ${payload.diagnostics.workspaceModeSource}`,
        `  workspace_id: ${payload.diagnostics.workspaceId}`,
        `  workspace_root: ${payload.diagnostics.workspaceRoot}`,
        `  memory_store_engine: ${payload.diagnostics.memoryStoreEngine}`,
        `  memory_store_root: ${payload.diagnostics.memoryStoreRoot}`,
        `  memory_store_provider: ${payload.diagnostics.memoryStoreProvider}`,
      );

      if (commandResult?.checks) {
        const checkSummary = commandResult.checks
          .map((check) => `${check.id}:${check.status}`)
          .join(", ");
        lines.push(`  check_summary: ${checkSummary}`);
      }
      if (commandResult?.artifacts) {
        const artifactSummary = commandResult.artifacts
          .map((artifact) => `${artifact.id}=${artifact.path}`)
          .join(", ");
        lines.push(`  artifacts: ${artifactSummary}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Renders a plain success message for log-safe deterministic outputs.
   * @param payload Successful execution payload.
   * @returns Plain text output.
   */
  private renderPlainSuccess(payload: CliSuccessOutputPayload): string {
    const commandResult = payload.command_result;

    if (payload.verbosity === CliVerbosity.QUIET) {
      return `${payload.message} outputMode=${payload.output_mode}${commandResult ? ` operation=${commandResult.operation}` : ""}`;
    }

    if (payload.verbosity === CliVerbosity.VERBOSE) {
      return `${payload.message} outputMode=${payload.output_mode} verbosity=${payload.verbosity} configSource=${payload.diagnostics.configSource} downgradedFrom=${payload.runtime.downgraded_from ?? "none"}${commandResult ? ` operation=${commandResult.operation}` : ""}`;
    }

    return `${payload.message} outputMode=${payload.output_mode} verbosity=${payload.verbosity}${commandResult ? ` operation=${commandResult.operation}` : ""}`;
  }

  /**
   * Renders a pretty error block with stable structured fields.
   * @param payload Failed execution payload.
   * @returns Pretty-formatted error text.
   */
  private renderPrettyError(payload: CliErrorOutputPayload): string {
    const title = this.decorateIfColorEnabled(
      "repo-ai-governor: command failed",
      ANSI_ERROR,
      payload.runtime.color_enabled,
    );
    const lines = [
      title,
      `  message: ${payload.message}`,
      `  error_code: ${payload.error_code}`,
      `  hint: ${payload.hint}`,
      `  next_action: ${payload.next_action}`,
    ];

    if (payload.verbosity === CliVerbosity.VERBOSE) {
      lines.push(
        `  command: ${payload.command}`,
        `  output_mode: ${payload.output_mode}`,
        `  downgraded_from: ${payload.runtime.downgraded_from ?? "none"}`,
      );
      if (payload.error_details?.report_path) {
        lines.push(`  report_path: ${payload.error_details.report_path}`);
      }
      if (payload.error_details?.replay_path) {
        lines.push(`  replay_path: ${payload.error_details.replay_path}`);
      }
      if (payload.error_details?.pending_status) {
        lines.push(`  pending_status: ${payload.error_details.pending_status}`);
      }
    }

    return lines.join("\n");
  }

  /**
   * Renders a plain one-line error with required structured fields.
   * @param payload Failed execution payload.
   * @returns Plain text output.
   */
  private renderPlainError(payload: CliErrorOutputPayload): string {
    const detailSegments = [
      payload.error_details?.report_path ? `report_path=${payload.error_details.report_path}` : "",
      payload.error_details?.replay_path ? `replay_path=${payload.error_details.replay_path}` : "",
      payload.error_details?.pending_status
        ? `pending_status=${payload.error_details.pending_status}`
        : "",
    ].filter((segment) => segment.length > 0);

    return `${payload.message} error_code=${payload.error_code} hint=${payload.hint} next_action=${payload.next_action}${detailSegments.length > 0 ? ` ${detailSegments.join(" ")}` : ""}`;
  }

  /**
   * Applies ANSI decoration only when color output is allowed.
   * @param text Base plain text.
   * @param colorCode ANSI color code.
   * @param colorEnabled Whether color output is allowed.
   * @returns Decorated or plain text.
   */
  private decorateIfColorEnabled(text: string, colorCode: string, colorEnabled: boolean): string {
    if (!colorEnabled) {
      return text;
    }

    return `${colorCode}${text}${ANSI_RESET}`;
  }

  /**
   * Ensures renderer output always writes exactly one trailing newline.
   * @param value Rendered output text.
   * @returns Output with normalized trailing newline.
   */
  private ensureTrailingNewLine(value: string): string {
    return value.endsWith("\n") ? value : `${value}\n`;
  }
}
