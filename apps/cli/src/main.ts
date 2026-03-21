import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { Command, CommanderError } from "commander";

import {
  ConfigLoader,
  type MemoryConfig,
  ProfileResolver,
  type ResolvedWorkspace,
  WorkspaceResolver,
} from "@repo-ai-governor/config";
import { FsCsvMemoryStoreProvider } from "@repo-ai-governor/memory-provider-fs-csv";
import { SqliteFsMemoryStoreProvider } from "@repo-ai-governor/memory-provider-sqlite-fs";
import {
  DEFAULT_I18N_RUNTIME_CONFIG,
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  I18nRuntime,
  type I18nRuntimeConfig,
  type MemoryRuntimeConfig,
  MemoryStoreEngine,
  standardizeError,
} from "@repo-ai-governor/shared";
import { CLI_SKELETON_COMMAND_DEFINITIONS } from "./constants/cli-command.constant.js";
export { IdeCommandWrapper, standardizeIdeWrapperError } from "./ide-command-wrapper.js";
export type {
  IdeCommandInvocationEnvelope,
  IdeCommandWrapperOptions,
  IdeCommandWrapperRequest,
  IdeStandardsInjectionPayload,
  IdeWrapperCommandName,
} from "./types/index.js";

const DEFAULT_I18N_CONFIG: I18nRuntimeConfig = {
  ...DEFAULT_I18N_RUNTIME_CONFIG,
  supportedLocales: [...DEFAULT_I18N_RUNTIME_CONFIG.supportedLocales],
};
const DEFAULT_MEMORY_CONFIG: MemoryRuntimeConfig = {
  ...DEFAULT_MEMORY_RUNTIME_CONFIG,
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
  const memoryStoreComposition = composeMemoryStoreProvider(
    runtimeContext.workspace.workspaceRoot,
    runtimeContext.memory,
  );

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
            memoryStoreEngine: runtimeContext.memory.storeEngine,
            memoryStoreRoot: memoryStoreComposition.memoryStoreRoot,
            memoryStoreProvider: memoryStoreComposition.providerName,
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
  memory: MemoryRuntimeConfig;
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
      memory: resolveMemoryRuntimeConfig(resolvedConfig.config.memory),
      profileId: resolvedConfig.profileId,
      configSource: "file",
      workspace: resolvedWorkspace,
    };
  }

  return {
    i18n: DEFAULT_I18N_CONFIG,
    memory: DEFAULT_MEMORY_CONFIG,
    profileId: null,
    configSource: "default",
    workspace: defaultWorkspace,
  };
}

/**
 * Resolves memory runtime config with shared defaults.
 * @param memoryConfig Optional memory config from repository file and profile overrides.
 * @returns Fully-resolved memory runtime config.
 */
function resolveMemoryRuntimeConfig(
  memoryConfig: Partial<MemoryConfig> | undefined,
): MemoryRuntimeConfig {
  return {
    ...DEFAULT_MEMORY_CONFIG,
    ...(memoryConfig ?? {}),
  };
}

/**
 * Composes a concrete memory provider from runtime memory config.
 * @param workspaceRoot Resolved workspace root.
 * @param memoryConfig Memory runtime config.
 * @returns Provider composition metadata for runtime diagnostics.
 */
function composeMemoryStoreProvider(
  workspaceRoot: string,
  memoryConfig: MemoryRuntimeConfig,
): {
  memoryStoreRoot: string;
  providerName: string;
} {
  const memoryStoreRoot = resolveMemoryStoreRoot(workspaceRoot, memoryConfig.storeRoot);
  const provider =
    memoryConfig.storeEngine === MemoryStoreEngine.SQLITE_FS
      ? new SqliteFsMemoryStoreProvider({
          rootDirectory: memoryStoreRoot,
        })
      : new FsCsvMemoryStoreProvider({
          rootDirectory: memoryStoreRoot,
        });

  return {
    memoryStoreRoot,
    providerName: provider.constructor.name,
  };
}

/**
 * Resolves store root to absolute path under workspace root when relative.
 * @param workspaceRoot Resolved workspace root.
 * @param storeRoot Configured memory store root.
 * @returns Absolute memory store root path.
 */
function resolveMemoryStoreRoot(workspaceRoot: string, storeRoot: string): string {
  if (isAbsolute(storeRoot)) {
    return storeRoot;
  }

  return resolve(workspaceRoot, storeRoot);
}
