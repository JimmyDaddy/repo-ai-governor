import { createRequire } from "node:module";
import { Command, CommanderError } from "commander";
import { commandDefinitions, globalOptionDefinitions } from "./command-registry.js";
import { createCommandContext } from "./runtime/context.js";
import { InternalExecutionError, isCliError } from "./runtime/errors.js";
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
  const payload = {
    command: commandContext.command,
    status: "registered",
    message: `Command ${commandContext.command} is wired into the CLI registry. Implementation lands in a follow-up task.`,
    globalOptions: commandContext.globalOptions,
    commandOptions: commandContext.commandOptions,
    positionals: commandContext.positionals
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
        `- Positionals: \`${JSON.stringify(payload.positionals)}\``
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
}

function buildProgram(io) {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const logger = createLogger({ stdout, stderr });

  const program = new Command();

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

    command.action(function (...actionArgs) {
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

      writeRegisteredCommand(commandLogger, commandContext);
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
    return EXIT_CODES.success;
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
