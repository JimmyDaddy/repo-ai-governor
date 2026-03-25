import { existsSync } from "node:fs";
import { isAbsolute, resolve } from "node:path";

import { Command, CommanderError } from "commander";

import { AgentCapability } from "@repo-ai-governor/adapter-sdk";
import {
  type AdaptersConfig,
  ConfigLoader,
  type MemoryConfig,
  ProfileResolver,
  type ResolvedWorkspace,
  WorkspaceResolver,
} from "@repo-ai-governor/config";
import { FsCsvMemoryStoreProvider } from "@repo-ai-governor/memory-provider-fs-csv";
import type { MemoryStoreProvider } from "@repo-ai-governor/memory-store-adapter";
import {
  AdapterAvailability,
  AdapterSurface,
  DEFAULT_I18N_RUNTIME_CONFIG,
  DEFAULT_MEMORY_RUNTIME_CONFIG,
  DefaultRoleProfileId,
  ErrorOutputEnvironment,
  GovernorErrorCode,
  I18nRuntime,
  type I18nRuntimeConfig,
  type MemoryRuntimeConfig,
  MemoryStoreEngine,
  RuntimeError,
  type StandardizedError,
  standardizeError,
} from "@repo-ai-governor/shared";
import { CliGovernanceRuntime } from "./cli-governance-runtime.js";
import { CliOutputPresenter } from "./cli-output-presenter.js";
import { CLI_COMMAND_DEFINITIONS } from "./constants/cli-command.constant.js";
import {
  CLI_OPTIONS_REQUIRING_VALUE,
  CLI_OUTPUT_MODE_VALUES,
  CLI_OUTPUT_SCHEMA_VERSION,
  CLI_VERBOSITY_VALUES,
  CliNextAction,
  CliOutputStatus,
  type CliVerbosity,
  DEFAULT_CLI_OUTPUT_MODE,
  DEFAULT_CLI_VERBOSITY,
  NON_TTY_FALLBACK_OUTPUT_MODE,
} from "./constants/cli-output.constant.js";
import { CliCodexExecFixtureEnvironmentKey } from "./constants/codex-exec-fixture.constant.js";
import { CliGithubCopilotExecFixtureEnvironmentKey } from "./constants/github-copilot-exec-fixture.constant.js";
import {
  IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID,
  type IdeEntrySurface,
  IdeWrapperEnvironmentKey,
} from "./constants/ide-command-wrapper.constant.js";
import type { IdeStandardsSourceId } from "./constants/ide-standards-source.constant.js";
import { CliClaudeCodeExecFixtureRuntime } from "./runtime/claude-code-exec-fixture-runtime.js";
import { CliCodexExecFixtureRuntime } from "./runtime/codex-exec-fixture-runtime.js";
import { CliGithubCopilotExecFixtureRuntime } from "./runtime/github-copilot-exec-fixture-runtime.js";
import { IdeStandardsSourceRuntime } from "./runtime/ide-standards-source-runtime.js";
import { IdeSurfaceRegistryRuntime } from "./runtime/ide-surface-registry-runtime.js";
export {
  IDE_SURFACE_REGISTRY,
  IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
  IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS,
  IDE_WRAPPER_DEFAULT_STANDARDS_SOURCE_IDS,
  IDE_WRAPPER_SELF_HOSTED_STANDARDS_SOURCE_REGISTRY,
  IDE_WRAPPER_SUPPORTED_COMMANDS,
  IDE_WRAPPER_SUPPORTED_SURFACES,
  IdeEntrySurface,
  IdeStandardsSourceId,
  IdeStandardsSourceKind,
  IdeSurfaceCapability,
  IdeSurfaceDegradeMode,
  IdeWrapperEnvironmentKey,
} from "./constants/ide-command-wrapper.constant.js";
export { IdeCommandWrapper, standardizeIdeWrapperError } from "./ide-command-wrapper.js";
export type {
  IdeCommandInvocationEnvelope,
  IdeResolvedStandardsSource,
  IdeSurfaceContract,
  IdeCommandWrapperOptions,
  IdeCommandWrapperRequest,
  IdeStandardsInjectionPayload,
  IdeStandardsSourceDescriptor,
  IdeWrapperCommandName,
} from "./types/index.js";
import type {
  CliCommandDiagnostics,
  CliCommandExecutionResultPayload,
  CliErrorOutputPayload,
  CliResolvedOutputContext,
  CliRuntimeDebugOptions,
  CliSuccessOutputPayload,
} from "./types/index.js";

const DEFAULT_I18N_CONFIG: I18nRuntimeConfig = {
  ...DEFAULT_I18N_RUNTIME_CONFIG,
  supportedLocales: [...DEFAULT_I18N_RUNTIME_CONFIG.supportedLocales],
};
const DEFAULT_MEMORY_CONFIG: MemoryRuntimeConfig = {
  ...DEFAULT_MEMORY_RUNTIME_CONFIG,
};
const DEFAULT_ADAPTERS_CONFIG: AdaptersConfig = {
  roles: [
    {
      roleId: "planner",
      roleProfileId: DefaultRoleProfileId.PLANNER,
      requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
      required: true,
    },
    {
      roleId: "architect",
      roleProfileId: DefaultRoleProfileId.ARCHITECT,
      requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
      required: true,
    },
    {
      roleId: "coder",
      roleProfileId: DefaultRoleProfileId.CODER,
      requiredCapabilities: [AgentCapability.TOOL_CALLING],
      required: true,
    },
    {
      roleId: "tester",
      roleProfileId: DefaultRoleProfileId.TESTER,
      requiredCapabilities: [AgentCapability.TOOL_CALLING],
      required: true,
    },
    {
      roleId: "reviewer",
      roleProfileId: DefaultRoleProfileId.REVIEWER,
      requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
      required: true,
    },
    {
      roleId: "verifier",
      roleProfileId: DefaultRoleProfileId.VERIFIER,
      requiredCapabilities: [AgentCapability.STRUCTURED_OUTPUT],
      required: true,
    },
  ],
  routing: {
    roleBindings: {
      planner: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
      },
      architect: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
      },
      coder: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.GITHUB_COPILOT, AdapterSurface.CLAUDE_CODE],
      },
      tester: {
        primarySurface: AdapterSurface.GITHUB_COPILOT,
        fallbackSurfaces: [AdapterSurface.CODEX, AdapterSurface.CLAUDE_CODE],
      },
      reviewer: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
      },
      verifier: {
        primarySurface: AdapterSurface.CODEX,
        fallbackSurfaces: [AdapterSurface.CLAUDE_CODE, AdapterSurface.GITHUB_COPILOT],
      },
    },
  },
  tools: [
    {
      toolId: AdapterSurface.CODEX,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    },
    {
      toolId: AdapterSurface.GITHUB_COPILOT,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    },
    {
      toolId: AdapterSurface.CLAUDE_CODE,
      enabled: true,
      availability: AdapterAvailability.AVAILABLE,
    },
  ],
};

const DEFAULT_IO: CliIoAdapters = {
  stdout: (value: string): void => {
    process.stdout.write(value);
  },
  stderr: (value: string): void => {
    process.stderr.write(value);
  },
  cwd: (): string => process.cwd(),
  isStdoutTty: (): boolean => Boolean(process.stdout.isTTY),
  env: (): NodeJS.ProcessEnv => process.env,
};

/**
 * Defines IO adapters used by CLI runtime execution.
 */
interface CliIoAdapters {
  stdout: (value: string) => void;
  stderr: (value: string) => void;
  cwd: () => string;
  isStdoutTty?: () => boolean;
  env?: () => NodeJS.ProcessEnv;
}

/**
 * Defines one runtime context merged from defaults and repository configuration.
 */
interface ResolvedCliRuntimeContext {
  i18n: I18nRuntimeConfig;
  memory: MemoryRuntimeConfig;
  adapters: AdaptersConfig;
  profileId: string | null;
  configSource: "default" | "file";
  workspace: ResolvedWorkspace;
}

/**
 * Defines resolved memory provider metadata rendered into command diagnostics.
 */
interface MemoryStoreComposition {
  memoryStoreRoot: string;
  providerName: string;
  provider: MemoryStoreProvider;
}

/**
 * Defines parsed option state for robust CLI flag handling.
 */
interface ReadOptionResult {
  isPresent: boolean;
  value: string | undefined;
}

/**
 * Defines normalized failure details shared by all runtime catch paths.
 */
interface CliFailureResolution {
  standardizedError: StandardizedError;
  exitCode: number;
}

/**
 * Defines validated IDE wrapper environment overlay consumed by the real CLI entrypoint.
 */
interface ResolvedIdeWrapperEnvironment {
  entrySurface: IdeEntrySurface | null;
  standardsProfileId: string | null;
  standardsSourceIds: IdeStandardsSourceId[];
}

/**
 * Runs the Stage-6 CLI output-contract baseline with TTY-aware fallback semantics.
 * @param argv Raw process argv from Node runtime.
 * @param io Runtime I/O adapters for stdout/stderr/cwd.
 * @returns CLI exit code where `0` means command handled successfully.
 */
export async function runCli(argv: string[], io: CliIoAdapters = DEFAULT_IO): Promise<number> {
  const rawArgs = argv.slice(2);
  const commandName = resolveRequestedCommandName(rawArgs);
  const environment = io.env?.() ?? process.env;
  const outputPresenter = new CliOutputPresenter({
    stdout: io.stdout,
    stderr: io.stderr,
  });

  let outputContext = resolveFallbackOutputContext(io);
  let i18nRuntime: I18nRuntime | undefined;
  let memoryStoreComposition: MemoryStoreComposition | undefined;

  try {
    outputContext = resolveOutputModeContext(rawArgs, io);
    outputContext = {
      ...outputContext,
      verbosity: resolveVerbosityOption(rawArgs),
    };

    const requestedLocale = readOptionValue(rawArgs, "--locale");
    const requestedProfileId = readOptionValue(rawArgs, "--profile");
    const ideWrapperEnvironment = resolveIdeWrapperEnvironment(environment);
    const codexExecFixtureRuntime = new CliCodexExecFixtureRuntime();
    const codexExecRunner = codexExecFixtureRuntime.resolveExecRunner(environment);
    const claudeCodeExecFixtureRuntime = new CliClaudeCodeExecFixtureRuntime();
    const claudeCodeExecRunner = claudeCodeExecFixtureRuntime.resolveExecRunner(environment);
    const githubCopilotExecFixtureRuntime = new CliGithubCopilotExecFixtureRuntime();
    const githubCopilotExecRunner = githubCopilotExecFixtureRuntime.resolveExecRunner(environment);
    const runtimeDebugOptions = resolveRuntimeDebugOptions(rawArgs, io.cwd());
    const runtimeContext = resolveRuntimeContext(io.cwd(), requestedProfileId);
    memoryStoreComposition = await composeMemoryStoreProvider(
      runtimeContext.workspace.workspaceRoot,
      runtimeContext.memory,
    );
    const activeMemoryStoreComposition = memoryStoreComposition;

    i18nRuntime = new I18nRuntime();
    const runtimeI18n = i18nRuntime;
    const resolvedLocale = await runtimeI18n.initialize(runtimeContext.i18n, requestedLocale);
    const profileLabel = runtimeContext.profileId ?? runtimeI18n.t("cli.skeleton.noProfile");
    const governanceRuntime = new CliGovernanceRuntime({
      currentWorkingDirectory: io.cwd(),
      workspace: runtimeContext.workspace,
      configSource: runtimeContext.configSource,
      profileId: runtimeContext.profileId,
      locale: resolvedLocale,
      outputMode: outputContext.outputMode,
      isTty: outputContext.isTty,
      memoryConfig: runtimeContext.memory,
      memoryStoreRoot: activeMemoryStoreComposition.memoryStoreRoot,
      memoryStoreProviderName: activeMemoryStoreComposition.providerName,
      memoryStoreProvider: activeMemoryStoreComposition.provider,
      adaptersConfig: runtimeContext.adapters,
      runtimeDebugOptions,
      ...(codexExecRunner
        ? {
            codexExecRunner,
          }
        : {}),
      ...(claudeCodeExecRunner
        ? {
            claudeCodeExecRunner,
          }
        : {}),
      ...(githubCopilotExecRunner
        ? {
            githubCopilotExecRunner,
          }
        : {}),
    });

    const program = new Command();
    program.name("repo-ai-governor");
    program.description(runtimeI18n.t("cli.app.description"));
    program.option("--locale <locale>", runtimeI18n.t("cli.options.locale"));
    program.option("--profile <profileId>", runtimeI18n.t("cli.options.profile"));
    program.option("--output <mode>", runtimeI18n.t("cli.options.output"));
    program.option("--verbosity <level>", runtimeI18n.t("cli.options.verbosity"));
    program.option("--compact", runtimeI18n.t("cli.options.compact"));
    program.option("--no-color", runtimeI18n.t("cli.options.noColor"));
    program.option("--adapters", runtimeI18n.t("cli.options.adapters"));
    program.option("--fix", runtimeI18n.t("cli.options.fix"));
    program.option("--record-ledger", runtimeI18n.t("cli.options.recordLedger"));
    program.option("--task-id <taskId>", runtimeI18n.t("cli.options.taskId"));
    program.option("--dry-run", runtimeI18n.t("cli.options.dryRun"));
    program.option("--trace", runtimeI18n.t("cli.options.trace"));
    program.option("--replay <path>", runtimeI18n.t("cli.options.replay"));
    program.option("--restricted-network", runtimeI18n.t("cli.options.restrictedNetwork"));
    program.option("--restricted-reason <reason>", runtimeI18n.t("cli.options.restrictedReason"));
    program.option("--no-local-fallback", runtimeI18n.t("cli.options.noLocalFallback"));
    program.option(
      "--hitl-decision <decision>",
      "HITL decision receipt (`approve`, `reject`, or `revise`).",
    );
    program.option(
      "--hitl-decision-reason <reason>",
      "Human-readable reason attached to the HITL decision receipt.",
    );
    program.option(
      "--hitl-resume-action <action>",
      "Resume action applied after HITL decision (`resume`, `terminate`, or `degrade`).",
    );
    program.option(
      "--hitl-decided-by <actor>",
      "Actor identifier recorded in the HITL decision receipt.",
    );
    program.option(
      "--hitl-constraints <constraints>",
      "Comma-separated constraints attached to the HITL decision receipt.",
    );
    program.showHelpAfterError(false);
    program.configureOutput({
      writeOut: (value) => io.stdout(value),
      writeErr: () => undefined,
    });
    program.exitOverride();

    for (const commandDefinition of CLI_COMMAND_DEFINITIONS) {
      program
        .command(commandDefinition.name)
        .description(runtimeI18n.t(commandDefinition.descriptionKey))
        .action(async () => {
          const diagnostics: CliCommandDiagnostics = {
            configSource: runtimeContext.configSource,
            locale: resolvedLocale,
            profile: profileLabel,
            workspaceMode: runtimeContext.workspace.mode,
            workspaceModeSource: runtimeContext.workspace.modeSource,
            workspaceId: runtimeContext.workspace.workspaceId,
            workspaceRoot: runtimeContext.workspace.workspaceRoot,
            memoryStoreEngine: runtimeContext.memory.storeEngine,
            memoryStoreRoot: activeMemoryStoreComposition.memoryStoreRoot,
            memoryStoreProvider: activeMemoryStoreComposition.providerName,
            ...(ideWrapperEnvironment.entrySurface
              ? {
                  entrySurface: ideWrapperEnvironment.entrySurface,
                }
              : {}),
            ...(ideWrapperEnvironment.standardsProfileId
              ? {
                  standardsProfileId: ideWrapperEnvironment.standardsProfileId,
                }
              : {}),
            ...(ideWrapperEnvironment.standardsSourceIds.length > 0
              ? {
                  standardsSourceIds: [...ideWrapperEnvironment.standardsSourceIds],
                }
              : {}),
            ...(environment[CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE]
              ? {
                  codexExecFixture:
                    environment[CliCodexExecFixtureEnvironmentKey.EXEC_FIXTURE] ?? null,
                }
              : {}),
            ...(environment[CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE]
              ? {
                  githubCopilotExecFixture:
                    environment[CliGithubCopilotExecFixtureEnvironmentKey.EXEC_FIXTURE] ?? null,
                }
              : {}),
          };
          const executionResult = await governanceRuntime.execute(commandDefinition.name);

          outputPresenter.writeSuccess(
            buildSuccessOutputPayload(
              commandDefinition.name,
              executionResult.message,
              outputContext,
              diagnostics,
              executionResult.commandResult,
            ),
          );
        });
    }

    if (rawArgs.length === 0) {
      program.outputHelp();
      return 0;
    }

    await program.parseAsync(argv, { from: "node" });
    return 0;
  } catch (error) {
    if (isCommanderHelpDisplayed(error)) {
      return 0;
    }

    const { standardizedError, exitCode } = resolveCliFailure(error);
    const message = i18nRuntime
      ? i18nRuntime.t("cli.errors.unexpected", {
          code: standardizedError.code,
          message: standardizedError.message,
        })
      : `CLI execution failed [${standardizedError.code}]: ${standardizedError.message}`;

    outputPresenter.writeError(
      buildErrorOutputPayload(commandName, message, standardizedError, outputContext),
    );
    return exitCode;
  } finally {
    await memoryStoreComposition?.provider.dispose?.();
  }
}

/**
 * Resolves runtime config from repository file when available, otherwise uses defaults.
 * @param currentWorkingDirectory Execution working directory.
 * @param requestedProfileId Optional requested profile id.
 * @returns Effective runtime context plus selected profile and source metadata.
 */
function resolveRuntimeContext(
  currentWorkingDirectory: string,
  requestedProfileId?: string,
): ResolvedCliRuntimeContext {
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
      adapters: resolveAdaptersRuntimeConfig(resolvedConfig.config.adapters),
      profileId: resolvedConfig.profileId,
      configSource: "file",
      workspace: resolvedWorkspace,
    };
  }

  return {
    i18n: DEFAULT_I18N_CONFIG,
    memory: DEFAULT_MEMORY_CONFIG,
    adapters: resolveAdaptersRuntimeConfig(undefined),
    profileId: null,
    configSource: "default",
    workspace: defaultWorkspace,
  };
}

/**
 * Resolves and validates IDE wrapper env injected by official IDE templates.
 * @param environment Process-level environment map.
 * @returns Validated IDE wrapper overlay snapshot for diagnostics and fail-fast validation.
 */
function resolveIdeWrapperEnvironment(
  environment: NodeJS.ProcessEnv,
): ResolvedIdeWrapperEnvironment {
  const ideSurfaceRegistryRuntime = new IdeSurfaceRegistryRuntime();
  const ideStandardsSourceRuntime = new IdeStandardsSourceRuntime();
  const entrySurfaceValue = normalizeWrapperEnvironmentValue(
    environment[IdeWrapperEnvironmentKey.ENTRY_SURFACE],
    IdeWrapperEnvironmentKey.ENTRY_SURFACE,
  );
  const standardsProfileIdValue = normalizeWrapperEnvironmentValue(
    environment[IdeWrapperEnvironmentKey.STANDARDS_PROFILE_ID],
    IdeWrapperEnvironmentKey.STANDARDS_PROFILE_ID,
  );
  const standardsSourcesValue = normalizeWrapperEnvironmentValue(
    environment[IdeWrapperEnvironmentKey.STANDARDS_SOURCES],
    IdeWrapperEnvironmentKey.STANDARDS_SOURCES,
  );

  const entrySurface = entrySurfaceValue
    ? ideSurfaceRegistryRuntime.resolveSurfaceContract(entrySurfaceValue as IdeEntrySurface)
        .surfaceId
    : null;
  const standardsProfileId =
    standardsProfileIdValue ??
    (standardsSourcesValue ? IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID : null);
  const standardsSourceIds = standardsSourcesValue
    ? parseIdeStandardsSourceIds(standardsSourcesValue, ideStandardsSourceRuntime)
    : [];

  return {
    entrySurface,
    standardsProfileId,
    standardsSourceIds,
  };
}

/**
 * Normalizes one IDE wrapper environment value and rejects blank strings.
 * @param rawValue Raw environment value.
 * @param environmentKey Environment variable key.
 * @returns Trimmed value or null when omitted.
 */
function normalizeWrapperEnvironmentValue(
  rawValue: string | undefined,
  environmentKey: IdeWrapperEnvironmentKey,
): string | null {
  if (rawValue === undefined) {
    return null;
  }

  const normalizedValue = rawValue.trim();
  if (normalizedValue.length === 0) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Environment variable ${environmentKey} must not be empty.`,
      {
        environmentKey,
      },
    );
  }

  return normalizedValue;
}

/**
 * Parses IDE standards source IDs from comma-separated env input and validates them.
 * @param standardsSourcesValue Comma-separated source IDs.
 * @param ideStandardsSourceRuntime Standards source validation runtime.
 * @returns Ordered validated source IDs.
 */
function parseIdeStandardsSourceIds(
  standardsSourcesValue: string,
  ideStandardsSourceRuntime: IdeStandardsSourceRuntime,
): IdeStandardsSourceId[] {
  const sourceTokens = standardsSourcesValue.split(",").map((sourceId) => sourceId.trim());
  if (sourceTokens.some((sourceId) => sourceId.length === 0)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Environment variable ${IdeWrapperEnvironmentKey.STANDARDS_SOURCES} must be a comma-separated list of non-empty source IDs.`,
      {
        environmentKey: IdeWrapperEnvironmentKey.STANDARDS_SOURCES,
        value: standardsSourcesValue,
      },
    );
  }

  const sourceIds = sourceTokens as IdeStandardsSourceId[];
  ideStandardsSourceRuntime.resolveSources(sourceIds);
  return [...sourceIds];
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
 * Resolves adapters runtime config with default role/routing/tool baseline.
 * @param adaptersConfig Optional adapters config from repository file and profile overrides.
 * @returns Fully-resolved adapters runtime config.
 */
function resolveAdaptersRuntimeConfig(
  adaptersConfig: Partial<AdaptersConfig> | undefined,
): AdaptersConfig {
  const roles = (adaptersConfig?.roles ?? DEFAULT_ADAPTERS_CONFIG.roles).map((role) => ({
    ...role,
    requiredCapabilities: [...role.requiredCapabilities],
  }));
  const roleBindings = Object.fromEntries(
    Object.entries({
      ...DEFAULT_ADAPTERS_CONFIG.routing.roleBindings,
      ...(adaptersConfig?.routing?.roleBindings ?? {}),
    }).map(([roleId, binding]) => [
      roleId,
      {
        ...binding,
        ...(binding.fallbackSurfaces
          ? {
              fallbackSurfaces: [...binding.fallbackSurfaces],
            }
          : {}),
      },
    ]),
  );
  const toolsById = new Map(
    (DEFAULT_ADAPTERS_CONFIG.tools ?? []).map((tool) => [tool.toolId, { ...tool }]),
  );
  for (const tool of adaptersConfig?.tools ?? []) {
    toolsById.set(tool.toolId, {
      ...(toolsById.get(tool.toolId) ?? {}),
      ...tool,
      ...(tool.unavailableReasons
        ? {
            unavailableReasons: [...tool.unavailableReasons],
          }
        : {}),
    });
  }

  return {
    roles,
    routing: {
      roleBindings,
    },
    ...(toolsById.size > 0
      ? {
          tools: Array.from(toolsById.values()),
        }
      : {}),
  };
}

/**
 * Composes a concrete memory provider from runtime memory config.
 * @param workspaceRoot Resolved workspace root.
 * @param memoryConfig Memory runtime config.
 * @returns Provider composition metadata for runtime diagnostics.
 */
async function composeMemoryStoreProvider(
  workspaceRoot: string,
  memoryConfig: MemoryRuntimeConfig,
): Promise<MemoryStoreComposition> {
  const memoryStoreRoot = resolveMemoryStoreRoot(workspaceRoot, memoryConfig.storeRoot);
  if (memoryConfig.storeEngine === MemoryStoreEngine.SQLITE_FS) {
    // Why: lazy-loading avoids node:sqlite side effects when default fs-csv engine is used.
    const { SqliteFsMemoryStoreProvider } = await import(
      "@repo-ai-governor/memory-provider-sqlite-fs"
    );
    const provider = new SqliteFsMemoryStoreProvider({
      rootDirectory: memoryStoreRoot,
    });

    return {
      memoryStoreRoot,
      providerName: provider.constructor.name,
      provider,
    };
  }

  const provider = new FsCsvMemoryStoreProvider({
    rootDirectory: memoryStoreRoot,
  });

  return {
    memoryStoreRoot,
    providerName: provider.constructor.name,
    provider,
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

/**
 * Resolves fallback output context when option parsing has not completed yet.
 * @param io Runtime IO adapters.
 * @returns Safe fallback output context.
 */
function resolveFallbackOutputContext(io: CliIoAdapters): CliResolvedOutputContext {
  const isTty = resolveIsStdoutTty(io);
  const outputMode = isTty ? DEFAULT_CLI_OUTPUT_MODE : NON_TTY_FALLBACK_OUTPUT_MODE;

  return {
    outputMode,
    verbosity: DEFAULT_CLI_VERBOSITY,
    compact: false,
    noColor: false,
    isTty,
    colorEnabled: outputMode === ErrorOutputEnvironment.PRETTY && isTty,
    downgradedFrom: null,
  };
}

/**
 * Resolves output mode/no-color first so JSON error contract is preserved.
 * @param args CLI args excluding node and binary.
 * @param io Runtime IO adapters.
 * @returns Output context with mode fallback and default verbosity.
 */
function resolveOutputModeContext(args: string[], io: CliIoAdapters): CliResolvedOutputContext {
  const requestedOutputMode = resolveOutputModeOption(args);
  const isTty = resolveIsStdoutTty(io);
  const downgradedFrom =
    requestedOutputMode === ErrorOutputEnvironment.PRETTY && !isTty
      ? ErrorOutputEnvironment.PRETTY
      : null;
  const outputMode = downgradedFrom ? NON_TTY_FALLBACK_OUTPUT_MODE : requestedOutputMode;
  const noColor = hasFlag(args, "--no-color");
  const compact = hasFlag(args, "--compact");

  return {
    outputMode,
    verbosity: DEFAULT_CLI_VERBOSITY,
    compact,
    noColor,
    isTty,
    colorEnabled: !noColor && outputMode === ErrorOutputEnvironment.PRETTY && isTty,
    downgradedFrom,
  };
}

/**
 * Resolves `--output` option and validates allowed values.
 * @param args CLI args excluding node and binary.
 * @returns Validated output mode.
 */
function resolveOutputModeOption(args: string[]): ErrorOutputEnvironment {
  const option = readOptionInput(args, "--output");
  if (!option.isPresent) {
    return DEFAULT_CLI_OUTPUT_MODE;
  }

  if (!option.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      "Option --output requires one value: pretty|plain|json.",
      { option: "--output" },
    );
  }

  if (!CLI_OUTPUT_MODE_VALUES.has(option.value)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option --output must be one of pretty|plain|json; received '${option.value}'.`,
      { option: "--output", value: option.value },
    );
  }

  return option.value as ErrorOutputEnvironment;
}

/**
 * Resolves `--verbosity` option and validates allowed values.
 * @param args CLI args excluding node and binary.
 * @returns Validated verbosity value.
 */
function resolveVerbosityOption(args: string[]): CliVerbosity {
  const option = readOptionInput(args, "--verbosity");
  if (!option.isPresent) {
    return DEFAULT_CLI_VERBOSITY;
  }

  if (!option.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      "Option --verbosity requires one value: quiet|normal|verbose.",
      { option: "--verbosity" },
    );
  }

  if (!CLI_VERBOSITY_VALUES.has(option.value)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      `Option --verbosity must be one of quiet|normal|verbose; received '${option.value}'.`,
      { option: "--verbosity", value: option.value },
    );
  }

  return option.value as CliVerbosity;
}

/**
 * Resolves local debug/replay flags for `run` execution path.
 * @param args CLI args excluding node and binary.
 * @param currentWorkingDirectory Runtime current working directory.
 * @returns Normalized debug options.
 */
function resolveRuntimeDebugOptions(
  args: string[],
  currentWorkingDirectory: string,
): CliRuntimeDebugOptions {
  const readRequiredOption = (flag: string, errorMessage: string): string | null => {
    const option = readOptionInput(args, flag);
    if (option.isPresent && !option.value) {
      throw new RuntimeError(GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID, errorMessage, {
        option: flag,
      });
    }

    return option.value?.trim() || null;
  };
  const replayOption = readOptionInput(args, "--replay");
  if (replayOption.isPresent && !replayOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      "Option --replay requires one path value.",
      { option: "--replay" },
    );
  }

  const replayPath =
    replayOption.value && replayOption.value.trim().length > 0
      ? resolveReplayPath(currentWorkingDirectory, replayOption.value.trim())
      : null;
  const taskIdOption = readOptionInput(args, "--task-id");
  if (taskIdOption.isPresent && !taskIdOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      "Option --task-id requires one value.",
      { option: "--task-id" },
    );
  }
  const restrictedReasonOption = readOptionInput(args, "--restricted-reason");
  if (restrictedReasonOption.isPresent && !restrictedReasonOption.value) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      "Option --restricted-reason requires one value.",
      { option: "--restricted-reason" },
    );
  }

  const hitlDecision = readRequiredOption(
    "--hitl-decision",
    "Option --hitl-decision requires one value.",
  );
  const hitlDecisionReason = readRequiredOption(
    "--hitl-decision-reason",
    "Option --hitl-decision-reason requires one value.",
  );
  const hitlResumeAction = readRequiredOption(
    "--hitl-resume-action",
    "Option --hitl-resume-action requires one value.",
  );
  const hitlDecidedBy = readRequiredOption(
    "--hitl-decided-by",
    "Option --hitl-decided-by requires one value.",
  );
  const hitlConstraintsInput = readRequiredOption(
    "--hitl-constraints",
    "Option --hitl-constraints requires one value.",
  );
  const hitlConstraints =
    hitlConstraintsInput
      ?.split(",")
      .map((constraint) => constraint.trim())
      .filter(Boolean) ?? [];

  if (hitlDecision && !["approve", "reject", "revise"].includes(hitlDecision)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      "Option --hitl-decision must be one of: approve, reject, revise.",
      {
        option: "--hitl-decision",
        value: hitlDecision,
      },
    );
  }

  if (hitlResumeAction && !["resume", "terminate", "degrade"].includes(hitlResumeAction)) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      "Option --hitl-resume-action must be one of: resume, terminate, degrade.",
      {
        option: "--hitl-resume-action",
        value: hitlResumeAction,
      },
    );
  }

  if (
    !hitlDecision &&
    (hitlDecisionReason || hitlResumeAction || hitlDecidedBy || hitlConstraints.length > 0)
  ) {
    throw new RuntimeError(
      GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      "HITL receipt companion options require --hitl-decision.",
      {
        option: "--hitl-decision",
      },
    );
  }

  return {
    dryRun: hasFlag(args, "--dry-run"),
    trace: hasFlag(args, "--trace"),
    replayPath,
    adapters: hasFlag(args, "--adapters"),
    fix: hasFlag(args, "--fix"),
    recordLedger: hasFlag(args, "--record-ledger"),
    taskId: taskIdOption.value?.trim() || null,
    restrictedNetwork: hasFlag(args, "--restricted-network"),
    restrictedReason: restrictedReasonOption.value?.trim() || null,
    allowLocalFallback: !hasFlag(args, "--no-local-fallback"),
    hitlDecision,
    hitlDecisionReason,
    hitlResumeAction,
    hitlDecidedBy,
    hitlConstraints,
  };
}

/**
 * Resolves replay source path to absolute path for deterministic diagnostics output.
 * @param currentWorkingDirectory Runtime current working directory.
 * @param replayPath Replay source path from CLI option.
 * @returns Absolute replay source path.
 */
function resolveReplayPath(currentWorkingDirectory: string, replayPath: string): string {
  if (isAbsolute(replayPath)) {
    return replayPath;
  }

  return resolve(currentWorkingDirectory, replayPath);
}

/**
 * Builds stable success payload for JSON and text renderers.
 * @param command Executed command name.
 * @param message Human-readable command summary.
 * @param outputContext Resolved output runtime context.
 * @param diagnostics Runtime diagnostics snapshot.
 * @param commandResult Optional command-level governance payload.
 * @returns Stable success payload.
 */
function buildSuccessOutputPayload(
  command: string,
  message: string,
  outputContext: CliResolvedOutputContext,
  diagnostics: CliCommandDiagnostics,
  commandResult?: CliCommandExecutionResultPayload,
): CliSuccessOutputPayload {
  return {
    schema_version: CLI_OUTPUT_SCHEMA_VERSION,
    status: CliOutputStatus.SUCCESS,
    output_mode: outputContext.outputMode,
    verbosity: outputContext.verbosity,
    command,
    message,
    runtime: {
      is_tty: outputContext.isTty,
      color_enabled: outputContext.colorEnabled,
      compact: outputContext.compact,
      downgraded_from: outputContext.downgradedFrom,
    },
    diagnostics,
    ...(commandResult ? { command_result: commandResult } : {}),
  };
}

/**
 * Builds stable error payload with structured hint/next_action fields.
 * @param command Requested command name.
 * @param message Human-readable error summary.
 * @param standardizedError Standardized error object.
 * @param outputContext Resolved output runtime context.
 * @returns Stable error payload.
 */
function buildErrorOutputPayload(
  command: string,
  message: string,
  standardizedError: StandardizedError,
  outputContext: CliResolvedOutputContext,
): CliErrorOutputPayload {
  const guidance = resolveErrorGuidance(standardizedError.code);
  const errorDetails = resolveCliErrorDetails(standardizedError.details);

  return {
    schema_version: CLI_OUTPUT_SCHEMA_VERSION,
    status: CliOutputStatus.ERROR,
    output_mode: outputContext.outputMode,
    verbosity: outputContext.verbosity,
    command,
    message,
    error_code: standardizedError.code,
    hint: guidance.hint,
    next_action: guidance.nextAction,
    ...(errorDetails ? { error_details: errorDetails } : {}),
    runtime: {
      is_tty: outputContext.isTty,
      color_enabled: outputContext.colorEnabled,
      compact: outputContext.compact,
      downgraded_from: outputContext.downgradedFrom,
    },
  };
}

/**
 * Resolves hint and next action from standardized error code.
 * @param code Standardized error code.
 * @returns User/action guidance tuple.
 */
function resolveErrorGuidance(code: GovernorErrorCode): {
  hint: string;
  nextAction: CliNextAction;
} {
  if (code === GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID) {
    return {
      hint: "Command name or option values are invalid.",
      nextAction: CliNextAction.CHECK_COMMAND_USAGE,
    };
  }

  if (code.startsWith("CONFIG_")) {
    return {
      hint: "governor.yaml might be invalid or incompatible.",
      nextAction: CliNextAction.INSPECT_GOVERNOR_CONFIG,
    };
  }

  if (code.startsWith("I18N_")) {
    return {
      hint: "Locale setup is invalid or unsupported by current runtime.",
      nextAction: CliNextAction.RETRY_WITH_VERBOSE,
    };
  }

  if (code.startsWith("ADAPTER_")) {
    return {
      hint: "Adapter routing or capability verification failed.",
      nextAction: CliNextAction.INSPECT_GOVERNOR_CONFIG,
    };
  }

  if (
    code === GovernorErrorCode.POLICY_GATE_EVALUATION_FAILED ||
    code === GovernorErrorCode.POLICY_GATE_HITL_FEEDBACK_INVALID
  ) {
    return {
      hint: "Policy gate did not allow this run; inspect report/replay diagnostics artifacts.",
      nextAction: CliNextAction.INSPECT_POLICY_DIAGNOSTICS,
    };
  }

  if (code === GovernorErrorCode.REPORT_REPLAY_INPUT_INVALID) {
    return {
      hint: "Replay source path or payload is invalid for diagnostics replay.",
      nextAction: CliNextAction.CHECK_REPLAY_SOURCE,
    };
  }

  return {
    hint: "Unexpected runtime failure occurred.",
    nextAction: CliNextAction.REPORT_ISSUE,
  };
}

/**
 * Selects stable CLI error details from standardized error diagnostics.
 * @param details Optional standardized error details payload.
 * @returns Whitelisted CLI error details, or null when no supported fields exist.
 */
function resolveCliErrorDetails(
  details: Record<string, unknown> | undefined,
): CliErrorOutputPayload["error_details"] | null {
  if (!details) {
    return null;
  }

  const normalizedDetails: CliErrorOutputPayload["error_details"] = {};
  if (typeof details.reportPath === "string") {
    normalizedDetails.report_path = details.reportPath;
  }
  if (typeof details.replayPath === "string") {
    normalizedDetails.replay_path = details.replayPath;
  }
  if (typeof details.pendingStatus === "string") {
    normalizedDetails.pending_status = details.pendingStatus;
  }

  if (
    !normalizedDetails.report_path &&
    !normalizedDetails.replay_path &&
    !normalizedDetails.pending_status
  ) {
    return null;
  }

  return normalizedDetails;
}

/**
 * Resolves standardized error and exit code from any throw path.
 * @param error Unknown thrown value.
 * @returns Standardized failure resolution.
 */
function resolveCliFailure(error: unknown): CliFailureResolution {
  if (error instanceof CommanderError) {
    return {
      standardizedError: {
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        message: error.message,
      },
      exitCode: error.exitCode,
    };
  }

  return {
    standardizedError: standardizeError(error),
    exitCode: 1,
  };
}

/**
 * Detects Commander help-display control flow emitted by `exitOverride`.
 * @param error Unknown thrown value.
 * @returns True when Commander intentionally interrupted parse after printing help.
 */
function isCommanderHelpDisplayed(error: unknown): boolean {
  if (!(error instanceof CommanderError)) {
    return false;
  }

  return error.code === "commander.helpDisplayed";
}

/**
 * Resolves option value when present and syntactically valid.
 * @param args CLI args excluding node and binary.
 * @param flag Long option flag (for example `--locale`).
 * @returns Option value when present; otherwise undefined.
 */
function readOptionValue(args: string[], flag: string): string | undefined {
  return readOptionInput(args, flag).value;
}

/**
 * Resolves option presence and value across `--flag value` and `--flag=value`.
 * @param args CLI args excluding node and binary.
 * @param flag Long option flag.
 * @returns Parsed option presence and optional value.
 */
function readOptionInput(args: string[], flag: string): ReadOptionResult {
  const exactFlagIndex = args.indexOf(flag);
  if (exactFlagIndex >= 0) {
    const candidateValue = args[exactFlagIndex + 1];
    if (!candidateValue || candidateValue.startsWith("-")) {
      return { isPresent: true, value: undefined };
    }

    return { isPresent: true, value: candidateValue };
  }

  const pairArgument = args.find((item) => item.startsWith(`${flag}=`));
  if (!pairArgument) {
    return { isPresent: false, value: undefined };
  }

  const value = pairArgument.slice(flag.length + 1);
  return {
    isPresent: true,
    value: value.length > 0 ? value : undefined,
  };
}

/**
 * Checks whether one boolean flag appears in raw args.
 * @param args CLI args excluding node and binary.
 * @param flag Long option flag.
 * @returns True when flag is present.
 */
function hasFlag(args: string[], flag: string): boolean {
  return args.includes(flag);
}

/**
 * Resolves requested command token from raw args for fallback error payloads.
 * @param args CLI args excluding node and binary.
 * @returns Requested command token, or `help` when no command token exists.
 */
function resolveRequestedCommandName(args: string[]): string {
  for (let index = 0; index < args.length; index += 1) {
    const token = args[index];
    if (!token) {
      continue;
    }

    if (token === "--") {
      return args[index + 1] ?? "help";
    }

    if (token.startsWith("--")) {
      if (!token.includes("=") && CLI_OPTIONS_REQUIRING_VALUE.has(token)) {
        const nextToken = args[index + 1];
        if (nextToken && !nextToken.startsWith("-")) {
          index += 1;
        }
      }
      continue;
    }

    if (token.startsWith("-")) {
      continue;
    }

    return token;
  }

  return "help";
}

/**
 * Resolves terminal TTY state from runtime adapters with safe defaults.
 * @param io Runtime IO adapters.
 * @returns Whether stdout is a TTY terminal.
 */
function resolveIsStdoutTty(io: CliIoAdapters): boolean {
  if (!io.isStdoutTty) {
    return false;
  }

  return io.isStdoutTty();
}
