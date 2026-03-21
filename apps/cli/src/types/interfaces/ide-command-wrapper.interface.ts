import type { ErrorOutputEnvironment } from "@repo-ai-governor/shared";
import type { IdeEntrySurface } from "../../constants/ide-command-wrapper.constant.js";
import type { IdeWrapperCommandName } from "../aliases/ide-command-wrapper.type.js";

/**
 * Defines one standards injection payload shared across entry surfaces.
 */
export interface IdeStandardsInjectionPayload {
  profileId: string;
  sources: string[];
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
  standardsSources?: readonly string[];
}
