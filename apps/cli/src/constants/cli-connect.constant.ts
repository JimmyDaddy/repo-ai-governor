import { AdapterSurface, AdapterTransportKind } from '@repo-ai-governor/shared';

/**
 * Defines explicit connect workflow actions exposed by the CLI surface.
 */
export enum CliConnectAction {
  GENERATE = 'generate',
  DIFF = 'diff',
  APPLY = 'apply',
}

/**
 * Defines deterministic write modes used by connect candidate/apply artifacts.
 */
export enum CliConnectWriteMode {
  MERGE = 'merge',
  OVERWRITE = 'overwrite',
}

/**
 * Defines supported connect workflow actions as a reusable validation set.
 */
export const CLI_CONNECT_ACTION_VALUES = new Set<string>(Object.values(CliConnectAction));

/**
 * Defines supported connect write modes as a reusable validation set.
 */
export const CLI_CONNECT_WRITE_MODE_VALUES = new Set<string>(Object.values(CliConnectWriteMode));

/**
 * Declares the surfaces whose connect-generated candidates should materialize explicit transport.
 */
export const CLI_CONNECT_TRANSPORT_AUTHORING_SURFACES = new Set<AdapterSurface>([
  AdapterSurface.CODEX,
  AdapterSurface.CLAUDE_CODE,
]);

/**
 * Declares supported connect-time transport overrides by surface.
 */
export const CLI_CONNECT_SUPPORTED_TRANSPORTS_BY_SURFACE = new Map<
  AdapterSurface,
  ReadonlySet<AdapterTransportKind>
>([
  [AdapterSurface.CODEX, new Set([AdapterTransportKind.CLI_EXEC, AdapterTransportKind.REMOTE_API])],
  [
    AdapterSurface.CLAUDE_CODE,
    new Set([AdapterTransportKind.CLI_EXEC, AdapterTransportKind.REMOTE_API]),
  ],
  [AdapterSurface.GITHUB_COPILOT, new Set([AdapterTransportKind.CLI_EXEC])],
]);
