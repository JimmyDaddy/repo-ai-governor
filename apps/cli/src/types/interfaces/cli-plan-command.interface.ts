/**
 * Defines parsed `plan` command options captured from raw CLI argv.
 */
export interface CliPlanCommandOptions {
  action: string | null;
  artifactPath: string | null;
  confirmationDecision: string | null;
}
