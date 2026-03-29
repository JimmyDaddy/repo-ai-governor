/**
 * Defines parsed `workflow` command options captured from raw CLI argv.
 */
export interface CliWorkflowCommandOptions {
  action: string | null;
  templateId: string | null;
}
