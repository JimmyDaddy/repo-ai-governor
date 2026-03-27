import {
  ErrorOutputEnvironment,
  GovernorErrorCode,
  RuntimeError,
  type StandardizedError,
  standardizeError,
} from '@repo-ai-governor/shared';
import {
  IDE_WRAPPER_DEFAULT_OUTPUT_MODE,
  IDE_WRAPPER_DEFAULT_STANDARDS_PROFILE_ID,
  IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS,
  IDE_WRAPPER_SUPPORTED_COMMANDS,
  IDE_WRAPPER_SUPPORTED_SURFACES,
  IdeWrapperEnvironmentKey,
} from './constants/ide-command-wrapper.constant.js';
import type { IdeStandardsSourceId } from './constants/ide-standards-source.constant.js';
import { IdeStandardsSourceRuntime } from './runtime/ide-standards-source-runtime.js';
import { IdeSurfaceRegistryRuntime } from './runtime/ide-surface-registry-runtime.js';
import type {
  IdeCommandInvocationEnvelope,
  IdeCommandWrapperOptions,
  IdeCommandWrapperRequest,
  IdeStandardsInjectionPayload,
  IdeSurfaceContract,
  IdeWrapperCommandName,
} from './types/index.js';

const DEFAULT_NODE_EXECUTABLE = 'node';
const DEFAULT_BINARY_ENTRYPOINT = './dist/bin/repo-ai-governor.js';
const ERROR_OUTPUT_MODE_VALUES = new Set<string>(Object.values(ErrorOutputEnvironment));
const RESERVED_WRAPPER_ENV_KEYS = new Set<string>(IDE_WRAPPER_RESERVED_ENVIRONMENT_KEYS);

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
  private readonly standardsSourceIds: readonly IdeStandardsSourceId[];
  private readonly ideSurfaceRegistryRuntime: IdeSurfaceRegistryRuntime;
  private readonly ideStandardsSourceRuntime: IdeStandardsSourceRuntime;

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
    this.ideSurfaceRegistryRuntime = new IdeSurfaceRegistryRuntime(options.surfaceRegistry);
    this.ideStandardsSourceRuntime = new IdeStandardsSourceRuntime(options.standardsSourceRegistry);
    this.standardsSourceIds =
      options.standardsSourceIds ?? this.ideStandardsSourceRuntime.resolveDefaultSourceIds();
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
    const surfaceContract = this.ideSurfaceRegistryRuntime.resolveSurfaceContract(request.surface);
    const outputMode = this.normalizeOutputMode(request.outputMode, surfaceContract);
    const standards = this.buildStandardsInjection(request.standardsProfileId);
    const customEnv = this.normalizeAdditionalEnv(request.additionalEnv, surfaceContract);

    const argv = [this.nodeExecutable, this.binaryEntrypoint];
    if (locale) {
      argv.push('--locale', locale);
    }
    if (profileId) {
      argv.push('--profile', profileId);
    }
    argv.push(command, ...args);

    const env: Record<string, string> = {
      ...customEnv,
      [IdeWrapperEnvironmentKey.OUTPUT_MODE]: outputMode,
      [IdeWrapperEnvironmentKey.ENTRY_SURFACE]: surfaceContract.surfaceId,
      [IdeWrapperEnvironmentKey.STANDARDS_PROFILE_ID]: standards.profileId,
      [IdeWrapperEnvironmentKey.STANDARDS_SOURCES]: standards.sourceIds.join(','),
    };

    return {
      argv,
      env,
      metadata: {
        command,
        surface: surfaceContract.surfaceId,
        outputMode,
        standards,
        surfaceContract,
        nextAction: surfaceContract.nextAction,
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
    const sourceIds = [...this.standardsSourceIds];

    return {
      profileId,
      sourceIds,
      resolvedSources: this.ideStandardsSourceRuntime.resolveSources(sourceIds),
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
    surfaceContract: IdeSurfaceContract,
  ): ErrorOutputEnvironment {
    if (outputMode === undefined) {
      return surfaceContract.defaultOutputMode ?? IDE_WRAPPER_DEFAULT_OUTPUT_MODE;
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
   * Normalizes args and rejects non-string items for stable argv generation.
   * @param args Optional command arg list.
   * @returns Normalized arg list.
   */
  private normalizeArgs(args: string[] | undefined): string[] {
    if (args === undefined) {
      return [];
    }

    if (!Array.isArray(args) || !args.every((item) => typeof item === 'string')) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'IDE wrapper args must be an array of strings.',
      );
    }

    return args.map((item) => item.trim()).filter((item) => item.length > 0);
  }

  /**
   * Validates custom env payload and rejects reserved key override attempts.
   * @param additionalEnv Optional env payload from wrapper request.
   * @returns Normalized custom env map.
   */
  private normalizeAdditionalEnv(
    additionalEnv: Record<string, string> | undefined,
    surfaceContract: IdeSurfaceContract,
  ): Record<string, string> {
    if (additionalEnv === undefined) {
      return {};
    }

    if (typeof additionalEnv !== 'object' || Array.isArray(additionalEnv)) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        'IDE wrapper additionalEnv must be a plain object.',
      );
    }

    const normalizedEnv: Record<string, string> = {};
    const reservedEnvironmentKeys = new Set<string>(surfaceContract.reservedEnvironmentKeys);
    for (const [envKey, envValue] of Object.entries(additionalEnv)) {
      if (reservedEnvironmentKeys.has(envKey) || RESERVED_WRAPPER_ENV_KEYS.has(envKey)) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `IDE wrapper additionalEnv must not override reserved key "${envKey}".`,
          {
            envKey,
            surface: surfaceContract.surfaceId,
            nextAction: surfaceContract.nextAction,
          },
        );
      }
      if (typeof envValue !== 'string') {
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
  const standardizedError = standardizeError(error);
  const nextAction = resolveIdeWrapperNextAction(error);
  if (!nextAction) {
    return standardizedError;
  }

  return {
    ...standardizedError,
    details: {
      ...(standardizedError.details ?? {}),
      nextAction,
    },
  };
}

/**
 * Resolves one caller-facing next action for wrapper failures.
 * @param error Unknown wrapper failure.
 * @returns Next action text when available.
 */
function resolveIdeWrapperNextAction(error: unknown): string | undefined {
  if (!(error instanceof RuntimeError)) {
    return undefined;
  }

  const nextAction =
    typeof error.details?.nextAction === 'string' ? error.details.nextAction.trim() : '';
  if (nextAction.length > 0) {
    return nextAction;
  }

  if (Array.isArray(error.details?.supportedCommands)) {
    return 'Retry with one of the supported wrapper commands declared by the IDE contract.';
  }

  if (Array.isArray(error.details?.supportedSurfaces)) {
    return `Retry with one of ${IDE_WRAPPER_SUPPORTED_SURFACES.join(', ')} or omit surface to use generic_ide.`;
  }

  if (typeof error.details?.envKey === 'string') {
    return 'Remove the reserved IDE wrapper environment override and let the wrapper populate baseline keys.';
  }

  return 'Inspect integrations/ide/contracts/command-wrapper.contract.json and retry with the baseline wrapper contract.';
}
