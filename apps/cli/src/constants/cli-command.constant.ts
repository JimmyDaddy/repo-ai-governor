/**
 * Defines finite command names exposed by the CLI runtime baseline.
 */
export enum CliCommandName {
  INIT = "init",
  DOCTOR = "doctor",
  CHECK = "check",
  RUN = "run",
  REVIEW = "review",
  REVIEW_VERIFY = "review-verify",
  PLAN = "plan",
  UPGRADE = "upgrade",
}

export const CLI_COMMAND_DEFINITIONS = [
  { name: CliCommandName.INIT, descriptionKey: "cli.commands.init.description" },
  { name: CliCommandName.DOCTOR, descriptionKey: "cli.commands.doctor.description" },
  { name: CliCommandName.CHECK, descriptionKey: "cli.commands.check.description" },
  { name: CliCommandName.RUN, descriptionKey: "cli.commands.run.description" },
  { name: CliCommandName.REVIEW, descriptionKey: "cli.commands.review.description" },
  { name: CliCommandName.REVIEW_VERIFY, descriptionKey: "cli.commands.reviewVerify.description" },
  { name: CliCommandName.PLAN, descriptionKey: "cli.commands.plan.description" },
  { name: CliCommandName.UPGRADE, descriptionKey: "cli.commands.upgrade.description" },
] as const;

/**
 * Defines the shared command-name list consumed by CLI and IDE wrapper surfaces.
 */
export const CLI_COMMAND_NAMES = [
  CliCommandName.INIT,
  CliCommandName.DOCTOR,
  CliCommandName.CHECK,
  CliCommandName.RUN,
  CliCommandName.REVIEW,
  CliCommandName.REVIEW_VERIFY,
  CliCommandName.PLAN,
  CliCommandName.UPGRADE,
] as const;
