import {
  ErrorOutputEnvironment,
  GovernorErrorCode,
  RuntimeError,
  type StandardizedError,
  standardizeError,
} from "@repo-ai-governor/shared";
import {
  IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
  IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID,
  IDE_WRAPPER_DEFAULT_STANDARDS_SOURCES,
  IDE_WRAPPER_SUPPORTED_COMMANDS,
  IdeEntrySurface,
  IdeWrapperEnvironmentKey,
} from "./constants/ide-command-wrapper.constant.js";
import type {
  IdeCommandInvocationEnvelope,
  IdeCommandWrapperOptions,
  IdeCommandWrapperRequest,
  IdeStandardsInjectionPayload,
  IdeWrapperCommandName,
} from "./types/index.js";

const DEFAULT_NODE_EXECUTABLE = "node";
const DEFAULT_BINARY_ENTRYPOINT = "./dist/bin/repo-ai-governor.js";
const ERROR_OUTPUT_MODE_VALUES = new Set<string>(Object.values(ErrorOutputEnvironment));
const IDE_ENTRY_SURFACE_VALUES = new Set<string>(Object.values(IdeEntrySurface));
const RESERVED_WRAPPER_ENV_KEYS = new Set<string>(Object.values(IdeWrapperEnvironmentKey));

/**
 * Wraps CLI commands into one deterministic IDE/agent invocation envelope.
 *
 * Why this exists:
 * multi-entry surfaces should share one wrapper contract so command arguments,
 * output mode, and standards injection stay aligned with the CLI baseline.
 */
export class IdeCommandWrapper {
  private readonly nodeExecutable: string;
  private readonly binaryEntrypoint: string;
  private readonly supportedCommandSet: ReadonlySet<IdeWrapperCommandName>;
  private readonly standardsSources: readonly string[];

  /**
   * Creates IDE command wrapper with optional command and standards overrides.
   * @param options Wrapper customization options for multi-entry integration.
   */
  public constructor(options: IdeCommandWrapperOptions = {}) {
    this.nodeExecutable = options.nodeExecutable?.trim() || DEFAULT_NODE_EXECUTABLE;
    this.binaryEntrypoint =
      options.binaryEntrypoint?.trim() || options.binaryName?.trim() || DEFAULT_BINARY_ENTRYPOINT;
    this.supportedCommandSet = new Set(
      options.supportedCommands ?? IDE_WRAPPER_SUPPORTED_COMMANDS,
    ) as ReadonlySet<IdeWrapperCommandName>;
    this.standardsSources = options.standardsSources ?? IDE_WRAPPER_DEFAULT_STANDARDS_SOURCES;
  }

  /**
   * Builds one command envelope with shared argv/env/standards injection payload.
   * @param request Wrapper request payload from IDE or agent entrypoint.
   * @returns Structured invocation envelope consumed by command runners.
   */
  public wrapCommand(request: IdeCommandWrapperRequest): IdeCommandInvocationEnvelope {
    const command = this.normalizeCommand(request.command);
    const args = this.normalizeArgs(request.args);
    const locale = this.normalizeOptionalText(request.locale);
    const profileId = this.normalizeOptionalText(request.profileId);
    const outputMode = this.normalizeOutputMode(request.outputMode);
    const surface = this.normalizeSurface(request.surface);
    const standards = this.buildStandardsInjection(request.standardsProfileId);
    const customEnv = this.normalizeAdditionalEnv(request.additionalEnv);

    const argv = [this.nodeExecutable, this.binaryEntrypoint];
    if (locale) {
      argv.push("--locale", locale);
    }
    if (profileId) {
      argv.push("--profile", profileId);
    }
    argv.push(command, ...args);

    const env: Record<string, string> = {
      ...customEnv,
      [IdeWrapperEnvironmentKey.OUTPUT_MODE]: outputMode,
      [IdeWrapperEnvironmentKey.ENTRY_SURFACE]: surface,
      [IdeWrapperEnvironmentKey.STANDARDS_PROFILE_ID]: standards.profileId,
      [IdeWrapperEnvironmentKey.STANDARDS_SOURCES]: standards.sources.join(","),
    };

    return {
      argv,
      env,
      metadata: {
        command,
        surface,
        outputMode,
        standards,
      },
    };
  }

  /**
   * Creates standards injection payload used by wrapper metadata and env output.
   * @param standardsProfileId Optional standards profile id override.
   * @returns Standards payload with profile and source list.
   */
  public buildStandardsInjection(standardsProfileId?: string): IdeStandardsInjectionPayload {
    const profileId =
      this.normalizeOptionalText(standardsProfileId) ?? IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID;

    return {
      profileId,
      sources: [...this.standardsSources],
    };
  }

  /**
   * Normalizes and validates wrapped command names against finite command set.
   * @param command Raw command value from wrapper request.
   * @returns Normalized command name.
   */
  private normalizeCommand(command: string): IdeWrapperCommandName {
    const normalizedCommand = this.normalizeOptionalText(command);
    if (
      !normalizedCommand ||
      !this.supportedCommandSet.has(normalizedCommand as IdeWrapperCommandName)
    ) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Unsupported IDE wrapper command "${command}".`,
        {
          command,
          supportedCommands: Array.from(this.supportedCommandSet),
        },
      );
    }

    return normalizedCommand as IdeWrapperCommandName;
  }

  /**
   * Normalizes output mode to shared enum baseline with strict validation.
   * @param outputMode Optional output mode input.
   * @returns Normalized output mode.
   */
  private normalizeOutputMode(
    outputMode: ErrorOutputEnvironment | undefined,
  ): ErrorOutputEnvironment {
    if (outputMode === undefined) {
      return IDE_WRAPPER_DEFAULT_OUTPUT_MODE;
    }

    if (!ERROR_OUTPUT_MODE_VALUES.has(outputMode)) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Unsupported IDE wrapper output mode "${outputMode}".`,
        {
          outputMode,
          supportedOutputModes: Array.from(ERROR_OUTPUT_MODE_VALUES),
        },
      );
    }

    return outputMode;
  }

  /**
   * Normalizes IDE entry surface values with deterministic default.
   * @param surface Optional surface from request payload.
   * @returns Normalized IDE entry surface.
   */
  private normalizeSurface(surface: IdeEntrySurface | undefined): IdeEntrySurface {
    if (surface === undefined) {
      return IdeEntrySurface.GENERIC_IDE;
    }

    if (!IDE_ENTRY_SURFACE_VALUES.has(surface)) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Unsupported IDE entry surface "${surface}".`,
        {
          surface,
          supportedSurfaces: Array.from(IDE_ENTRY_SURFACE_VALUES),
        },
      );
    }

    return surface;
  }

  /**
   * Normalizes args and rejects non-string items for stable argv generation.
   * @param args Optional command arg list.
   * @returns Normalized arg list.
   */
  private normalizeArgs(args: string[] | undefined): string[] {
    if (args === undefined) {
      return [];
    }

    if (!Array.isArray(args) || !args.every((item) => typeof item === "string")) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        "IDE wrapper args must be an array of strings.",
      );
    }

    return args.map((item) => item.trim()).filter((item) => item.length > 0);
  }

  /**
   * Validates custom env payload and rejects reserved key override attempts.
   * @param additionalEnv Optional env payload from wrapper request.
   * @returns Normalized custom env map.
   */
  private normalizeAdditionalEnv(additionalEnv?: Record<string, string>): Record<string, string> {
    if (additionalEnv === undefined) {
      return {};
    }

    if (typeof additionalEnv !== "object" || Array.isArray(additionalEnv)) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        "IDE wrapper additionalEnv must be a plain object.",
      );
    }

    const normalizedEnv: Record<string, string> = {};
    for (const [envKey, envValue] of Object.entries(additionalEnv)) {
      if (RESERVED_WRAPPER_ENV_KEYS.has(envKey)) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `IDE wrapper additionalEnv must not override reserved key "${envKey}".`,
          {
            envKey,
          },
        );
      }
      if (typeof envValue !== "string") {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `IDE wrapper additionalEnv["${envKey}"] must be a string.`,
          {
            envKey,
            valueType: typeof envValue,
          },
        );
      }

      normalizedEnv[envKey] = envValue;
    }

    return normalizedEnv;
  }

  /**
   * Trims optional text fields and converts empty values to undefined.
   * @param value Optional text value.
   * @returns Trimmed text or undefined.
   */
  private normalizeOptionalText(value: string | undefined): string | undefined {
    if (value === undefined) {
      return undefined;
    }

    const normalizedValue = value.trim();
    return normalizedValue.length > 0 ? normalizedValue : undefined;
  }
}

/**
 * Converts unknown wrapper errors into standardized error payloads.
 * @param error Unknown wrapper failure.
 * @returns Standardized error for caller-facing output.
 */
export function standardizeIdeWrapperError(error: unknown): StandardizedError {
  return standardizeError(error);
}
