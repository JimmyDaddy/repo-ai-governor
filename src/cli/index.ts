import { createRequire } from "node:module";
import { Command, CommanderError } from "commander";
import { executeCheckCommand } from "../commands/check-command.js";
import { executeDoctorCommand } from "../commands/doctor-command.js";
import { executeInitCommand } from "../commands/init-command.js";
import { executePlanCommand } from "../commands/plan-command.js";
import { executeReportCommand } from "../commands/report-command.js";
import { executeReviewCommand } from "../commands/review-command.js";
import { executeReviewVerifyCommand } from "../commands/review-verify-command.js";
import { executeRunCommand } from "../commands/run-command.js";
import { executeSkillsCommand } from "../commands/skills-command.js";
import { executeUpgradeCommand } from "../commands/upgrade-command.js";
import { ConfigurationError } from "../config/errors.js";
import { loadResolvedConfig } from "../config/load-config.js";
import {
  createReviewFileName,
  createReviewSlug,
  createTaskFileName,
  resolveRepositoryLayout,
} from "../config/repository-layout.js";
import { normalizeLocale, translateLocale } from "../utils/common.js";
import { commandDefinitions, globalOptionDefinitions } from "./command-registry.js";
import type {
  ArgumentDefinition,
  CommandDefinition,
  OptionDefinition,
} from "./command-registry.js";
import { createCommandContext } from "./runtime/context.js";
import type { CommandContext } from "./runtime/context.js";
import { ConfigError, InputError, InternalExecutionError, isCliError } from "./runtime/errors.js";
import { EXIT_CODES, mapCommanderErrorToExitCode } from "./runtime/exit-codes.js";
import { createLogger } from "./ui/logger.js";
import type { Logger } from "./ui/logger.js";

type WritableLike = {
  isTTY?: boolean;
  write: (chunk: string) => unknown;
};

type CliIo = {
  stdout?: WritableLike;
  stderr?: WritableLike;
};

type CliProgram = Command & {
  repoAiGovernorExitCode?: number;
};

type PackageJsonLike = {
  description: string;
  version: string;
};

type RepositoryLayoutState = ReturnType<typeof resolveRepositoryLayout>;
type ResolvedConfigState = ReturnType<typeof loadResolvedConfig>;

const require = createRequire(import.meta.url);
const packageJson = require("../../package.json") as PackageJsonLike;

function t(locale: string | null | undefined, zhCN: string, enUS: string): string {
  return translateLocale(locale, zhCN, enUS);
}

function getStringOption(options: Record<string, unknown>, key: string): string | undefined {
  const value = options[key];
  return typeof value === "string" ? value : undefined;
}

function getStringArrayOption(options: Record<string, unknown>, key: string): string[] | undefined {
  const value = options[key];

  if (!Array.isArray(value)) {
    return undefined;
  }

  return value.every((item) => typeof item === "string") ? (value as string[]) : undefined;
}

function collectValues(value: string, previousValues: string[] = []): string[] {
  return [...previousValues, value];
}

function toOptionFlags(definition: OptionDefinition): string {
  const valuePart = definition.valueName ? ` <${definition.valueName}>` : "";
  return `${definition.long}${valuePart}`;
}

function applyOptions(target: Command, definitions: OptionDefinition[]): void {
  for (const definition of definitions) {
    const flags = toOptionFlags(definition);

    if (definition.multiple) {
      target.option(flags, definition.description, collectValues, []);
      continue;
    }

    target.option(flags, definition.description);
  }
}

function applyArguments(target: Command, definitions: ArgumentDefinition[] = []): void {
  for (const definition of definitions) {
    target.argument(definition.name, definition.description);
  }
}

function createProgramHelpText(): string {
  return [
    "",
    "示例 / Examples:",
    "  repo-ai-governor init --language typescript --adapter codex",
    "  repo-ai-governor skills list --surface codex --format json",
    "  repo-ai-governor doctor --project mvp --sprint sprint-001 --strict",
    "  repo-ai-governor run --mode assisted --routing-profile multi-ai-dev-review",
    "  repo-ai-governor run --mode assisted --validate-process --format json",
    "  repo-ai-governor review --path src/cli --base main --head HEAD",
    "  repo-ai-governor help review-verify",
  ].join("\n");
}

function createCommandHelpText(commandDefinition: CommandDefinition): string {
  return [
    "",
    "提示 / Tip:",
    `  当调用方是 AI 或 CI 时，可使用 \`repo-ai-governor ${commandDefinition.name} --format json\`。`,
  ].join("\n");
}

function renderRegisteredCommand(commandContext: CommandContext) {
  let repositoryLayout: RepositoryLayoutState;
  let reviewSlug: string;
  let resolvedConfiguration: ResolvedConfigState;
  const locale = normalizeLocale(getStringOption(commandContext.globalOptions, "locale"));
  const cwd = getStringOption(commandContext.globalOptions, "cwd");
  const project = getStringOption(commandContext.globalOptions, "project");
  const sprint = getStringOption(commandContext.globalOptions, "sprint");
  const configPath = getStringOption(commandContext.globalOptions, "config");
  const commandLocale = getStringOption(commandContext.commandOptions, "locale");
  const commandLanguage = getStringOption(commandContext.commandOptions, "language");
  const commandPreset = getStringOption(commandContext.commandOptions, "preset");
  const commandAdapter =
    getStringArrayOption(commandContext.commandOptions, "adapter") ??
    getStringOption(commandContext.commandOptions, "adapter");
  const cliOverrides = {
    project,
    sprint,
    locale: commandLocale ?? locale,
    language: commandLanguage,
    preset: commandPreset,
    adapter: commandAdapter,
  };

  try {
    repositoryLayout = resolveRepositoryLayout({
      cwd,
      project,
      sprint,
    });
    reviewSlug = createReviewSlug(
      commandContext.command,
      project ?? "default",
      sprint ?? "sprint-001",
    );
    resolvedConfiguration = loadResolvedConfig({
      cwd,
      configPath,
      cliOverrides,
      skipEnabledDefinitionCheck: commandContext.command === "init",
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new InputError(error.message, {
        code: "cli.invalid_naming_convention",
        details: {
          project,
          sprint,
        },
      });
    }

    if (error instanceof ConfigurationError) {
      throw new ConfigError(error.message, {
        code: error.code,
        details: error.details,
      });
    }

    throw error;
  }

  const payload = {
    command: commandContext.command,
    status: "registered",
    message: t(
      locale,
      `命令 ${commandContext.command} 已挂载到 CLI 注册表，具体实现将在后续任务补齐。`,
      `Command ${commandContext.command} is wired into the CLI registry. Implementation lands in a follow-up task.`,
    ),
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
          reviewResolved: createReviewFileName({ status: "resolved", slug: reviewSlug }),
        },
      },
    },
    resolvedConfiguration: {
      configFile: resolvedConfiguration.paths.configFile,
      slotsDirectory: resolvedConfiguration.paths.slotsDirectory,
      adaptersDirectory: resolvedConfiguration.paths.adaptersDirectory,
      currentProject: resolvedConfiguration.config.execution.currentProject,
      currentSprint: resolvedConfiguration.config.execution.currentSprint,
      enabledSlots: resolvedConfiguration.config.slots.enabled,
      enabledAdapters: resolvedConfiguration.config.adapters.enabled,
      loadedSlotDefinitions: resolvedConfiguration.slotDefinitions.map(
        (definition) => definition.id,
      ),
      loadedAdapterDefinitions: resolvedConfiguration.adapterDefinitions.map(
        (definition) => definition.id,
      ),
      layers: resolvedConfiguration.layers,
    },
  };

  return payload;
}

function writeRegisteredCommand(logger: Logger, commandContext: CommandContext): void {
  const payload = renderRegisteredCommand(commandContext);
  const locale = normalizeLocale(getStringOption(commandContext.globalOptions, "locale"));

  if (commandContext.format === "json") {
    logger.raw(JSON.stringify(payload, null, 2), { ignoreQuiet: true });
    return;
  }

  if (commandContext.format === "markdown") {
    logger.raw(
      [
        `# ${payload.command}`,
        "",
        `- ${t(locale, "状态", "Status")}: ${payload.status}`,
        `- ${t(locale, "说明", "Message")}: ${payload.message}`,
        `- ${t(locale, "全局选项", "Global options")}: \`${JSON.stringify(payload.globalOptions)}\``,
        `- ${t(locale, "命令选项", "Command options")}: \`${JSON.stringify(payload.commandOptions)}\``,
        `- ${t(locale, "位置参数", "Positionals")}: \`${JSON.stringify(payload.positionals)}\``,
        `- ${t(locale, "解析后的配置文件", "Resolved config file")}: \`${payload.resolvedConfiguration.configFile}\``,
        `- ${t(locale, "已加载 slots", "Loaded slots")}: \`${JSON.stringify(payload.resolvedConfiguration.loadedSlotDefinitions)}\``,
        `- ${t(locale, "已加载 adapters", "Loaded adapters")}: \`${JSON.stringify(
          payload.resolvedConfiguration.loadedAdapterDefinitions,
        )}\``,
      ].join("\n"),
      { ignoreQuiet: true },
    );
    return;
  }

  logger.debug(`Execution context: ${JSON.stringify(commandContext)}`);
  logger.success(t(locale, `${payload.command} 已注册`, `${payload.command} is registered`));
  logger.info(payload.message);
  logger.keyValue(t(locale, "全局选项", "Global options"), JSON.stringify(payload.globalOptions));
  logger.keyValue(t(locale, "命令选项", "Command options"), JSON.stringify(payload.commandOptions));
  logger.keyValue(t(locale, "位置参数", "Positionals"), JSON.stringify(payload.positionals));
  logger.keyValue(
    t(locale, "配置文件", "Config file"),
    payload.repositoryLayout.relativePaths.configFile,
  );
  logger.keyValue(
    t(locale, "解析后的配置文件", "Resolved config file"),
    payload.resolvedConfiguration.configFile,
  );
  logger.keyValue(
    t(locale, "已加载 slots", "Loaded slots"),
    JSON.stringify(payload.resolvedConfiguration.loadedSlotDefinitions),
  );
  logger.keyValue(
    t(locale, "已加载 adapters", "Loaded adapters"),
    JSON.stringify(payload.resolvedConfiguration.loadedAdapterDefinitions),
  );

  if (payload.repositoryLayout.relativePaths.sprintDir) {
    logger.keyValue(
      t(locale, "Sprint 目录", "Sprint dir"),
      payload.repositoryLayout.relativePaths.sprintDir,
    );
    logger.keyValue(
      t(locale, "Tasks 目录", "Tasks dir"),
      payload.repositoryLayout.relativePaths.tasksDir,
    );
    logger.keyValue(
      t(locale, "Code review 目录", "Code review dir"),
      payload.repositoryLayout.relativePaths.codeReviewDir,
    );
  }

  if (payload.resolvedConfiguration.currentProject) {
    logger.keyValue(
      t(locale, "解析后的 project", "Resolved project"),
      payload.resolvedConfiguration.currentProject,
    );
  }

  if (payload.resolvedConfiguration.currentSprint) {
    logger.keyValue(
      t(locale, "解析后的 sprint", "Resolved sprint"),
      payload.resolvedConfiguration.currentSprint,
    );
  }

  logger.keyValue(
    t(locale, "任务文件命名", "Task file naming"),
    payload.repositoryLayout.naming.examples.taskFile,
  );
  logger.keyValue(
    t(locale, "待复核文件命名", "Pending review naming"),
    payload.repositoryLayout.naming.examples.reviewPending,
  );
}

function buildProgram(io: CliIo): CliProgram {
  const stdout = io.stdout ?? process.stdout;
  const stderr = io.stderr ?? process.stderr;
  const logger = createLogger({ stdout, stderr });

  const program = new Command() as CliProgram;
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
      },
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
        !commandDefinition.options.some((commandOption) => commandOption.long === definition.long),
    );

    applyArguments(command, commandDefinition.arguments);
    applyOptions(command, inheritedGlobalOptions);
    applyOptions(command, commandDefinition.options);

    command.action(async function (this: Command, ...actionArgs: unknown[]) {
      const lastArgument = actionArgs.at(-1);
      const commandInstance = lastArgument instanceof Command ? lastArgument : this;
      const positionals = commandInstance.args ?? [];
      const commandContext = createCommandContext(
        commandDefinition,
        commandInstance.optsWithGlobals() as Record<string, unknown>,
        positionals,
      );
      const commandLogger = createLogger({
        stdout,
        stderr,
        quiet: commandContext.quiet,
        verbose: commandContext.verbose,
      });

      let exitCode: number = EXIT_CODES.success;

      if (commandDefinition.name === "init") {
        exitCode = executeInitCommand(commandContext, commandLogger) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "skills") {
        exitCode =
          (await executeSkillsCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "doctor") {
        exitCode = executeDoctorCommand(commandContext, commandLogger);
      } else if (commandDefinition.name === "plan") {
        exitCode = (await executePlanCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "check") {
        exitCode = (await executeCheckCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "run") {
        exitCode = (await executeRunCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "review") {
        exitCode =
          (await executeReviewCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "review-verify") {
        exitCode =
          (await executeReviewVerifyCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "report") {
        exitCode =
          (await executeReportCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else if (commandDefinition.name === "upgrade") {
        exitCode =
          (await executeUpgradeCommand(commandContext, commandLogger)) ?? EXIT_CODES.success;
      } else {
        writeRegisteredCommand(commandLogger, commandContext);
      }

      program.repoAiGovernorExitCode = exitCode;
    });
  }

  return program;
}

export async function runCli(argv: string[], io: CliIo = {}): Promise<number> {
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
        details: error instanceof Error && error.stack ? { stack: error.stack } : undefined,
      },
    );

    logger.error(internalError.message);
    logger.debug(JSON.stringify(internalError.details ?? {}));
    return internalError.exitCode;
  }
}
