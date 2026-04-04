/**
 * Defines parsed `upgrade` command options captured from raw CLI argv.
 */
export interface CliUpgradeCommandOptions {
  action: string | null;
  artifactPath: string | null;
  targetVersion: string | null;
  confirmationDecision: string | null;
}
