/**
 * Defines finite command names exposed by the CLI runtime baseline.
 */
export const CLI_PROGRAM_NAME = 'repo-ai-governor';

export enum CliCommandName {
  INIT = 'init',
  CONFIG = 'config',
  SECRET = 'secret',
  CONNECT = 'connect',
  DOCTOR = 'doctor',
  CHECK = 'check',
  ADOPT = 'adopt',
  RUN = 'run',
  REVIEW = 'review',
  REVIEW_VERIFY = 'review-verify',
  PLAN = 'plan',
  HOST = 'host',
  RESUME = 'resume',
  UPGRADE = 'upgrade',
  WORKSPACE = 'workspace',
  WORKFLOW = 'workflow',
}

export const CLI_COMMAND_DEFINITIONS = [
  { name: CliCommandName.INIT, descriptionKey: 'cli.commands.init.description' },
  { name: CliCommandName.CONFIG, descriptionKey: 'cli.commands.config.description' },
  { name: CliCommandName.SECRET, descriptionKey: 'cli.commands.secret.description' },
  { name: CliCommandName.CONNECT, descriptionKey: 'cli.commands.connect.description' },
  { name: CliCommandName.DOCTOR, descriptionKey: 'cli.commands.doctor.description' },
  { name: CliCommandName.CHECK, descriptionKey: 'cli.commands.check.description' },
  { name: CliCommandName.ADOPT, descriptionKey: 'cli.commands.adopt.description' },
  { name: CliCommandName.RUN, descriptionKey: 'cli.commands.run.description' },
  { name: CliCommandName.REVIEW, descriptionKey: 'cli.commands.review.description' },
  { name: CliCommandName.REVIEW_VERIFY, descriptionKey: 'cli.commands.reviewVerify.description' },
  { name: CliCommandName.PLAN, descriptionKey: 'cli.commands.plan.description' },
  { name: CliCommandName.HOST, descriptionKey: 'cli.commands.host.description' },
  { name: CliCommandName.RESUME, descriptionKey: 'cli.commands.resume.description' },
  { name: CliCommandName.UPGRADE, descriptionKey: 'cli.commands.upgrade.description' },
  { name: CliCommandName.WORKSPACE, descriptionKey: 'cli.commands.workspace.description' },
  { name: CliCommandName.WORKFLOW, descriptionKey: 'cli.commands.workflow.description' },
] as const;

/**
 * Defines the shared command-name list consumed by CLI and IDE wrapper surfaces.
 */
export const CLI_COMMAND_NAMES = [
  CliCommandName.INIT,
  CliCommandName.CONFIG,
  CliCommandName.SECRET,
  CliCommandName.CONNECT,
  CliCommandName.DOCTOR,
  CliCommandName.CHECK,
  CliCommandName.ADOPT,
  CliCommandName.RUN,
  CliCommandName.REVIEW,
  CliCommandName.REVIEW_VERIFY,
  CliCommandName.PLAN,
  CliCommandName.HOST,
  CliCommandName.RESUME,
  CliCommandName.UPGRADE,
  CliCommandName.WORKSPACE,
  CliCommandName.WORKFLOW,
] as const;
