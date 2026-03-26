/**
 * Defines raw workspace-command option values parsed from CLI flags.
 */
export interface CliWorkspaceCommandOptions {
  action: string | null;
  targetMode: string | null;
  targetRoot: string | null;
  planPath: string | null;
}
