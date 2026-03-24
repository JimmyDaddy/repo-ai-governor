import type { ErrorOutputEnvironment } from "@repo-ai-governor/shared";
import type {
  IdeEntrySurface,
  IdeSurfaceCapability,
  IdeSurfaceDegradeMode,
  IdeWrapperEnvironmentKey,
} from "../../constants/ide-command-wrapper.constant.js";
import type {
  IdeStandardsSourceId,
  IdeStandardsSourceKind,
} from "../../constants/ide-standards-source.constant.js";
import type { IdeWrapperCommandName } from "../aliases/ide-command-wrapper.type.js";

/**
 * Defines one self-hosted standards source descriptor bound to a stable source ID.
 */
export interface IdeStandardsSourceDescriptor {
  sourceId: IdeStandardsSourceId;
  sourceKind: IdeStandardsSourceKind;
  defaultSelfHostedPath: string;
  description: string;
}

/**
 * Defines one resolved standards source emitted by wrapper metadata.
 */
export interface IdeResolvedStandardsSource {
  sourceId: IdeStandardsSourceId;
  sourceKind: IdeStandardsSourceKind;
  resolvedPath: string;
}

/**
 * Defines one standards injection payload shared across entry surfaces.
 */
export interface IdeStandardsInjectionPayload {
  profileId: string;
  sourceIds: IdeStandardsSourceId[];
  resolvedSources: IdeResolvedStandardsSource[];
}

/**
 * Defines one surface contract shared across IDE/agent wrapper entries.
 */
export interface IdeSurfaceContract {
  surfaceId: IdeEntrySurface;
  displayName: string;
  capabilities: IdeSurfaceCapability[];
  defaultOutputMode: ErrorOutputEnvironment;
  degradeMode: IdeSurfaceDegradeMode;
  degradeTargetSurface?: IdeEntrySurface;
  reservedEnvironmentKeys: IdeWrapperEnvironmentKey[];
  nextAction: string;
}

/**
 * Defines one wrapper request payload from IDE/agent entry surfaces.
 */
export interface IdeCommandWrapperRequest {
  command: IdeWrapperCommandName | string;
  args?: string[];
  locale?: string;
  profileId?: string;
  surface?: IdeEntrySurface;
  outputMode?: ErrorOutputEnvironment;
  standardsProfileId?: string;
  additionalEnv?: Record<string, string>;
}

/**
 * Defines wrapped invocation payload consumed by entrypoint runners.
 */
export interface IdeCommandInvocationEnvelope {
  argv: string[];
  env: Record<string, string>;
  metadata: {
    command: IdeWrapperCommandName;
    surface: IdeEntrySurface;
    outputMode: ErrorOutputEnvironment;
    standards: IdeStandardsInjectionPayload;
    surfaceContract: IdeSurfaceContract;
    nextAction: string;
  };
}

/**
 * Defines constructor options for IDE command wrapper customization.
 */
export interface IdeCommandWrapperOptions {
  nodeExecutable?: string;
  binaryEntrypoint?: string;
  binaryName?: string;
  supportedCommands?: readonly IdeWrapperCommandName[];
  standardsSourceIds?: readonly IdeStandardsSourceId[];
  standardsSourceRegistry?: readonly IdeStandardsSourceDescriptor[];
  surfaceRegistry?: readonly IdeSurfaceContract[];
}
