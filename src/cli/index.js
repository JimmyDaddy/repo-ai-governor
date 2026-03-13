import { createRequire } from "node:module";
import { Command, CommanderError } from "commander";
import { executeInitCommand } from "../commands/init-command.js";
import { executeDoctorCommand } from "../commands/doctor-command.js";
import { executePlanCommand } from "../commands/plan-command.js";
import { executeCheckCommand } from "../commands/check-command.js";
import { executeReviewCommand } from "../commands/review-command.js";
import { executeReviewVerifyCommand } from "../commands/review-verify-command.js";
import { executeReportCommand } from "../commands/report-command.js";
import { commandDefinitions, globalOptionDefinitions } from "./command-registry.js";
import { ConfigurationError } from "../config/errors.js";
import { loadResolvedConfig } from "../config/load-config.js";
import {
  createReviewFileName,
  createReviewSlug,
  createTaskFileName,
  resolveRepositoryLayout
} from "../config/repository-layout.js";
import { createCommandContext } from "./runtime/context.js";
import { ConfigError, InputError, InternalExecutionError, isCliError } from "./runtime/errors.js";
import { EXIT_CODES, mapCommanderErrorToExitCode } from "./runtime/exit-codes.js";
import { createLogger } from "./ui/logger.js";

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json");

function collectValues(value, previousValues = []) {
  return [...previousValues, value];
}

function toOptionFlags(definition) {
  const valuePart = definition.valueName ? ` <${definition.valueName}>` : "";
  return `${definition.long}${valuePart}`;
}

function applyOptions(target, definitions) {
  for (const definition of definitions) {
    const flags = toOptionFlags(definition);

    if (definition.multiple) {
      target.option(flags, definition.description, collectValues, []);
      continue;
    }

    target.option(flags, definition.description);
  }
}

function createProgramHelpText() {
  return [
    "",
    "Examples:",
    "  repo-ai-governor init --language typescript --adapter codex",
    "  repo-ai-governor doctor --project mvp --sprint sprint-001 --strict",
    "  repo-ai-governor review --path src/cli --base main --head HEAD",
    "  repo-ai-governor help review-verify"
  ].join("\n");
}

function createCommandHelpText(commandDefinition) {
  return [
    "",
    "Tip:",
    `  Use \`repo-ai-governor ${commandDefinition.name} --format json\` when the caller is an AI agent or CI.`
  ].join("\n");
}

function renderRegisteredCommand(commandContext) {
  let repositoryLayout;
  let reviewSlug;
  let resolvedConfiguration;

  try {
    repositoryLayout = resolveRepositoryLayout({
      cwd: commandContext.globalOptions.cwd,
      project: commandContext.globalOptions.project,
      sprint: commandContext.globalOptions.sprint
    });
    reviewSlug = createReviewSlug(
      commandContext.command,
      commandContext.globalOptions.project ?? "default",
      commandContext.globalOptions.sprint ?? "sprint-001"
    );
    resolvedConfiguration = loadResolvedConfig({
      cwd: commandContext.globalOptions.cwd,
      configPath: commandContext.globalOptions.config,
      cliOverrides: {
        ...commandContext.globalOptions,
        ...commandContext.commandOptions
      },
      skipEnabledDefinitionCheck: commandContext.command === "init"
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new InputError(error.message, {
        code: "cli.invalid_naming_convention",
        details: {
          project: commandContext.globalOptions.project,
          sprint: commandContext.globalOptions.sprint
        }
      });
    }

    if (error instanceof ConfigurationError) {
      throw new ConfigError(error.message, {
        code: error.code,
        details: error.details
      });
    }

    throw error;
  }

  const payload = {
    command: commandContext.command,
    status: "registered",
    message: `Command ${commandContext.command} is wired into the CLI registry. Implementation lands in a follow-up task.`,
    globalOptions: commandContext.globalOptions,
    commandOptions: commandContext.commandOptions,
    positionals: commandContext.positionals,
    repositoryLayout: {
      relativePaths: repositoryLayout.relative,
      naming: {
        projectPattern: repositoryLayout.naming.projectPattern,
        sprintPattern: repositoryLayout.naming.sprintPattern,
        taskPattern: repositoryLayout.naming.taskPattern,
        reviewPatterns: repositoryLayout.naming.reviewPatterns,
        examples: {
          taskFile: createTaskFileName("TK-101"),
          reviewPending: createReviewFileName({ status: "pending", slug: reviewSlug }),
          reviewVerified: createReviewFileName({ status: "verified", slug: reviewSlug }),
          reviewResolved: createReviewFileName({ status: "resolved", slug: reviewSlug })
        }
      }
    },
    resolvedConfiguration: {
      configFile: resolvedConfiguration.paths.configFile,
      slotsDirectory: resolvedConfiguration.paths.slotsDirectory,
      adaptersDirectory: resolvedConfiguration.paths.adaptersDirectory,
      currentProject: resolvedConfiguration.config.execution.currentProject,
      currentSprint: resolvedConfiguration.config.execution.currentSprint,
      enabledSlots: resolvedConfiguration.config.slots.enabled,
      enabledAdapters: resolvedConfiguration.config.adapters.enabled,
      loadedSlotDefinitions: resolvedConfiguration.slotDefinitions.map((definition) => definition.id),
      loadedAdapterDefinitions: resolvedConfiguration.adapterDefinitions.map(
        (definition) => definition.id
      ),
      layers: resolvedConfiguration.layers
    }
  };

  return payload;
}

function writeRegisteredCommand(logger, commandContext) {
  const payload = renderRegisteredCommand(commandContext);

  if (commandContext.format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (commandContext.format === "markdown") {
    logger.raw(
      [
        `# ${payload.command}`,
        "",
        `- Status: ${payload.status}`,
        `- Message: ${payload.message}`,
        `- Global options: \`${JSON.stringify(payload.globalOptions)}\``,
        `- Command options: \`${JSON.stringify(payload.commandOptions)}\``,
        `- Positionals: \`${JSON.stringify(payload.positionals)}\``,
        `- Resolved config file: \`${payload.resolvedConfiguration.configFile}\``,
        `- Loaded slots: \`${JSON.stringify(payload.resolvedConfiguration.loadedSlotDefinitions)}\``,
        `- Loaded adapters: \`${JSON.stringify(
          payload.resolvedConfiguration.loadedAdapterDefinitions
        )}\``
      ].join("\n"),
      { ignoreQuiet: true }
    );
    return;
  }

  logger.debug(`Execution context: ${JSON.stringify(commandContext)}`);
  logger.success(`${payload.command} is registered`);
  logger.info(payload.message);
  logger.keyValue("Global options", JSON.stringify(payload.globalOptions));
  logger.keyValue("Command options", JSON.stringify(payload.commandOptions));
  logger.keyValue("Positionals", JSON.stringify(payload.positionals));
  logger.keyValue("Config file", payload.repositoryLayout.relativePaths.configFile);
  logger.keyValue("Resolved config file", payload.resolvedConfiguration.configFile);
  logger.keyValue("Loaded slots", JSON.stringify(payload.resolvedConfiguration.loadedSlotDefinitions));
  logger.keyValue(
    "Loaded adapters",
    JSON.stringify(payload.resolvedConfiguration.loadedAdapterDefinitions)
  );

  if (payload.repositoryLayout.relativePaths.sprintDir) {
    logger.keyValue("Sprint dir", payload.repositoryLayout.relativePaths.sprintDir);
    logger.keyValue("Tasks dir", payload.repositoryLayout.relativePaths.tasksDir);
    logger.keyValue("Code review dir", payload.repositoryLayout.relativePaths.codeReviewDir);
  }

  if (payload.resolvedConfiguration.currentProject) {
    logger.keyValue("Resolved project", payload.resolvedConfiguration.currentProject);
  }

  if (payload.resolvedConfiguration.currentSprint) {
    logger.keyValue("Resolved sprint", payload.resolvedConfiguration.currentSprint);
  }

  logger.keyValue("Task file naming", payload.repositoryLayout.naming.examples.taskFile);
  logger.keyValue("Pending review naming", payload.repositoryLayout.naming.examples.reviewPending);
}

function buildProgram(io) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const logger = createLogger({ stdout, stderr });

  const program = new Command();
  program.repoAiGovernorExitCode = EXIT_CODES.success;

  program
    .name("repo-ai-governor")
    .description(packageJson.description)
    .version(packageJson.version, "-v, --version", "显示版本号")
    .helpOption("-h, --help", "显示帮助信息")
    .showSuggestionAfterError(true)
    .showHelpAfterError(true)
    .addHelpCommand("help [command]", "显示命令帮助")
    .allowExcessArguments(false)
    .allowUnknownOption(false)
    .addHelpText("after", createProgramHelpText())
    .configureOutput({
      writeOut: (content) => stdout.write(content),
      writeErr: (content) => stderr.write(content),
      outputError: (content, write) => {
        const trimmed = content.trimEnd();

        if (trimmed.startsWith("error:")) {
          logger.error(trimmed.replace(/^error:\s*/, ""));
          return;
        }

        write(content);
      }
    })
    .exitOverride();

  applyOptions(program, globalOptionDefinitions);

  for (const commandDefinition of commandDefinitions) {
    const command = program
      .command(commandDefinition.name)
      .description(commandDefinition.description)
      .summary(commandDefinition.description)
      .allowExcessArguments(false)
      .allowUnknownOption(false)
      .addHelpText("after", createCommandHelpText(commandDefinition));

    const inheritedGlobalOptions = globalOptionDefinitions.filter(
      (definition) =>
        !commandDefinition.options.some((commandOption) => commandOption.long === definition.long)
    );

    applyOptions(command, inheritedGlobalOptions);
    applyOptions(command, commandDefinition.options);

    command.action(async function (...actionArgs) {
      const lastArgument = actionArgs.at(-1);
      const commandInstance = lastArgument instanceof Command ? lastArgument : this;
      const positionals = commandInstance.args ?? [];
      const commandContext = createCommandContext(
        commandDefinition,
        commandInstance.optsWithGlobals(),
        positionals
      );
      const commandLogger = createLogger({
        stdout,
        stderr,
        quiet: commandContext.quiet,
        verbose: commandContext.verbose
      });

      let exitCode = EXIT_CODES.success;

      if (commandDefinition.name === "init") {
        exitCode = executeInitCommand(commandContext, commandLogger) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "doctor") {
        exitCode = executeDoctorCommand(commandContext, commandLogger);
      } else if (commandDefinition.name === "plan") {
        exitCode = (await executePlanCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "check") {
        exitCode = (await executeCheckCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "review") {
        exitCode = (await executeReviewCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "review-verify") {
        exitCode =
          (await executeReviewVerifyCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "report") {
        exitCode = (await executeReportCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else {
        writeRegisteredCommand(commandLogger, commandContext);
      }

      program.repoAiGovernorExitCode = exitCode;
    });
  }

  return program;
}

export async function runCli(argv, io = {}) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const logger = createLogger({ stdout, stderr });
  const program = buildProgram(io);

  if (argv.length === 0) {
    program.outputHelp();
    return EXIT_CODES.success;
  }

  try {
    await program.parseAsync(argv, { from: "user" });
    return program.repoAiGovernorExitCode ?? EXIT_CODES.success;
  } catch (error) {
    if (error instanceof CommanderError) {
      const exitCode = mapCommanderErrorToExitCode(error.code);

      if (exitCode === EXIT_CODES.success) {
        return EXIT_CODES.success;
      }

      return exitCode;
    }

    if (isCliError(error)) {
      logger.error(error.message);

      if (error.details) {
        logger.debug(JSON.stringify(error.details));
      }

      return error.exitCode;
    }

    const internalError = new InternalExecutionError(
      error instanceof Error ? error.message : "Unexpected CLI state.",
      {
        details: error instanceof Error && error.stack ? { stack: error.stack } : undefined
      }
    );

    logger.error(internalError.message);
    logger.debug(JSON.stringify(internalError.details ?? {}));
    return internalError.exitCode;
  }
}
