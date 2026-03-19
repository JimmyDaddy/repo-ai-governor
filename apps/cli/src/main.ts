import { existsSync } from "node:fs";
import { resolve } from "node:path";

import { Command, CommanderError } from "commander";

import {
  ConfigLoader,
  ProfileResolver,
  type ResolvedWorkspace,
  WorkspaceResolver,
} from "../../../packages/config/src/index.js";
import {
  DEFAULT_I18N_RUNTIME_CONFIG,
  I18nRuntime,
  type I18nRuntimeConfig,
  standardizeError,
} from "../../../packages/shared/src/index.js";
import { CLI_SKELETON_COMMAND_DEFINITIONS } from "./constants/cli-command.constant.js";

const DEFAULT_I18N_CONFIG: I18nRuntimeConfig = {
  ...DEFAULT_I18N_RUNTIME_CONFIG,
  supportedLocales: [...DEFAULT_I18N_RUNTIME_CONFIG.supportedLocales],
};

const DEFAULT_IO = {
  stdout: (value: string): void => {
    process.stdout.write(value);
  },
  stderr: (value: string): void => {
    process.stderr.write(value);
  },
  cwd: (): string => process.cwd(),
};

/**
 * Runs the Stage-1 CLI skeleton runtime with shared i18n and config baseline.
 * @param argv Raw process argv from Node runtime.
 * @param io Runtime I/O adapters for stdout/stderr/cwd.
 * @returns CLI exit code where `0` means command handled successfully.
 */
export async function runCli(
  argv: string[],
  io: {
    stdout: (value: string) => void;
    stderr: (value: string) => void;
    cwd: () => string;
  } = DEFAULT_IO,
): Promise<number> {
  const rawArgs = argv.slice(2);
  const requestedLocale = readOptionValue(rawArgs, "--locale");
  const requestedProfileId = readOptionValue(rawArgs, "--profile");
  const runtimeContext = resolveRuntimeContext(io.cwd(), requestedProfileId);

  const i18nRuntime = new I18nRuntime();
  const resolvedLocale = await i18nRuntime.initialize(runtimeContext.i18n, requestedLocale);
  const profileLabel = runtimeContext.profileId ?? i18nRuntime.t("cli.skeleton.noProfile");

  const program = new Command();
  program.name("repo-ai-governor");
  program.description(i18nRuntime.t("cli.app.description"));
  program.option("--locale <locale>", i18nRuntime.t("cli.options.locale"));
  program.option("--profile <profileId>", i18nRuntime.t("cli.options.profile"));
  program.showHelpAfterError();
  program.configureOutput({
    writeOut: (value) => io.stdout(value),
    writeErr: (value) => io.stderr(value),
  });
  program.exitOverride();

  for (const commandDefinition of CLI_SKELETON_COMMAND_DEFINITIONS) {
    program
      .command(commandDefinition.name)
      .description(i18nRuntime.t(commandDefinition.descriptionKey))
      .action(async () => {
        io.stdout(
          `${i18nRuntime.t("cli.skeleton.executed", {
            command: commandDefinition.name,
            locale: resolvedLocale,
            profile: profileLabel,
            source: runtimeContext.configSource,
            workspaceMode: runtimeContext.workspace.mode,
            workspaceRoot: runtimeContext.workspace.workspaceRoot,
            workspaceId: runtimeContext.workspace.workspaceId,
            workspaceModeSource: runtimeContext.workspace.modeSource,
          })}\n`,
        );
      });
  }

  if (rawArgs.length === 0) {
    program.outputHelp();
    return 0;
  }

  try {
    await program.parseAsync(argv, { from: "node" });
    return 0;
  } catch (error) {
    if (error instanceof CommanderError) {
      return error.exitCode;
    }

    const standardizedError = standardizeError(error);
    io.stderr(
      `${i18nRuntime.t("cli.errors.unexpected", {
        code: standardizedError.code,
        message: standardizedError.message,
      })}\n`,
    );
    return 1;
  }
}

/**
 * Resolves an option value from raw argv segments.
 * @param args CLI args excluding node and binary.
 * @param flag Long option flag (for example `--locale`).
 * @returns Option value when present; otherwise undefined.
 */
function readOptionValue(args: string[], flag: string): string | undefined {
  const exactFlagIndex = args.indexOf(flag);
  if (exactFlagIndex >= 0) {
    return args[exactFlagIndex + 1];
  }

  const pairArgument = args.find((item) => item.startsWith(`${flag}=`));
  if (!pairArgument) {
    return undefined;
  }

  return pairArgument.slice(flag.length + 1);
}

/**
 * Resolves runtime config from repository file when available, otherwise uses defaults.
 * @param currentWorkingDirectory Execution working directory.
 * @param requestedProfileId Optional requested profile id.
 * @returns Effective i18n context plus selected profile and source metadata.
 */
function resolveRuntimeContext(
  currentWorkingDirectory: string,
  requestedProfileId?: string,
): {
  i18n: I18nRuntimeConfig;
  profileId: string | null;
  configSource: "default" | "file";
  workspace: ResolvedWorkspace;
} {
  const configLoader = new ConfigLoader();
  const profileResolver = new ProfileResolver();
  const workspaceResolver = new WorkspaceResolver();
  const defaultWorkspace = workspaceResolver.resolve({ currentWorkingDirectory });
  const repoLocalConfigPath = resolve(currentWorkingDirectory, ".repo-ai-governor/governor.yaml");
  const configPathCandidates = Array.from(
    new Set([repoLocalConfigPath, defaultWorkspace.configPath]),
  );

  for (const configPath of configPathCandidates) {
    if (!existsSync(configPath)) {
      continue;
    }

    const loadedConfig = configLoader.loadFromFile(configPath);
    const resolvedConfig = profileResolver.resolve(loadedConfig, requestedProfileId);
    const resolvedWorkspace = workspaceResolver.resolve({
      currentWorkingDirectory,
      config: resolvedConfig.config,
    });

    return {
      i18n: resolvedConfig.config.i18n,
      profileId: resolvedConfig.profileId,
      configSource: "file",
      workspace: resolvedWorkspace,
    };
  }

  return {
    i18n: DEFAULT_I18N_CONFIG,
    profileId: null,
    configSource: "default",
    workspace: defaultWorkspace,
  };
}
