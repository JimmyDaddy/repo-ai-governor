import type { AgentLayeredHealthCheckResult } from '@repo-ai-governor/adapter-sdk';
import { AdapterTransportKind } from '@repo-ai-governor/shared';

const CLI_EXEC_LAUNCH_DIAGNOSTIC_CODES = {
  SHELL_WRAPPED: 'protocol.shell_wrapped',
  PROCESS_TREE_POLICY: 'protocol.process_tree_policy',
  SPAWN_ERROR_CODE: 'install.spawn_error_code',
} as const;

/**
 * Projects probe-visible native cli_exec launch facts into one additive consumer companion.
 */
export class CliLaunchDiagnosticsProjectionRuntime {
  /**
   * Creates one snake_case launch_diagnostics payload from cli_exec probe truth.
   * @param options Projection inputs composed from transport truth and one layered health check.
   * @returns Additive launch diagnostics payload, or null when the surface is not cli_exec.
   */
  public createLaunchDiagnosticsPayload(options: {
    transportKind: unknown;
    healthCheck?: AgentLayeredHealthCheckResult | null;
  }): Record<string, unknown> | null {
    if (options.transportKind !== AdapterTransportKind.CLI_EXEC || !options.healthCheck) {
      return null;
    }

    const shellWrappedDetail = this.findHealthCheckDiagnosticDetail(
      options.healthCheck,
      CLI_EXEC_LAUNCH_DIAGNOSTIC_CODES.SHELL_WRAPPED,
    );
    const processTreePolicy = this.findHealthCheckDiagnosticDetail(
      options.healthCheck,
      CLI_EXEC_LAUNCH_DIAGNOSTIC_CODES.PROCESS_TREE_POLICY,
    );
    const spawnErrorCode = this.findHealthCheckDiagnosticDetail(
      options.healthCheck,
      CLI_EXEC_LAUNCH_DIAGNOSTIC_CODES.SPAWN_ERROR_CODE,
    );
    const shellWrapped =
      shellWrappedDetail === 'true' ? true : shellWrappedDetail === 'false' ? false : null;

    return {
      selected_entrypoint: options.healthCheck.selectedEntrypoint,
      request_cancellation_mode: options.healthCheck.requestCancellationMode,
      ...(shellWrapped !== null ? { shell_wrapped: shellWrapped } : {}),
      ...(processTreePolicy ? { process_tree_policy: processTreePolicy } : {}),
      ...(spawnErrorCode ? { spawn_error_code: spawnErrorCode } : {}),
    };
  }

  /**
   * Reads one additive diagnostic detail from a layered health-check snapshot.
   * @param healthCheck Layered health-check result that may contain cli_exec launch diagnostics.
   * @param code Structured diagnostic code to resolve.
   * @returns Diagnostic detail text, or null when the detail is absent.
   */
  private findHealthCheckDiagnosticDetail(
    healthCheck: AgentLayeredHealthCheckResult,
    code: string,
  ): string | null {
    const diagnostic = healthCheck.diagnostics.find((candidate) => candidate.code === code);
    return typeof diagnostic?.detail === 'string' && diagnostic.detail.length > 0
      ? diagnostic.detail
      : null;
  }
}
