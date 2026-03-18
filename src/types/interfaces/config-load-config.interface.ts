import type { GenericRecord } from "../aliases/index.js";

export interface GovernorConfig extends GenericRecord {
  schemaVersion?: string;
  slots: {
    directory: string;
    enabled?: string[];
    disabled?: string[];
    [key: string]: unknown;
  };
  adapters: {
    directory: string;
    enabled?: string[];
    [key: string]: unknown;
  };
  execution: {
    currentProject?: string;
    currentSprint?: string;
    [key: string]: unknown;
  };
  standards: {
    preset?: string;
    locales?: {
      default?: string;
      supported?: string[];
    };
    [key: string]: unknown;
  };
  project: {
    language?: string;
    framework?: string;
    [key: string]: unknown;
  };
  reporting: {
    formats?: string[];
    [key: string]: unknown;
  };
}

export interface MergeContext {
  path: string[];
  baseLayer: string;
  incomingLayer: string;
}

export interface LayerInput {
  name: string;
  previousLayerName: string;
  value: unknown;
}

export interface CliConfigOverrideOptions {
  project?: string;
  sprint?: string;
  locale?: string;
  language?: string;
  preset?: string;
  adapter?: string | string[];
}

export interface LoadResolvedConfigOptions {
  cwd?: string;
  configPath?: string;
  requireConfigFile?: boolean;
  environment?: NodeJS.ProcessEnv;
  cliOverrides?: CliConfigOverrideOptions;
  skipEnabledDefinitionCheck?: boolean;
}

export interface LoadedDefinition<TConfig = GenericRecord> {
  id: string;
  filePath: string;
  config: TConfig;
}

export interface LoadedDefinitionDirectory<TConfig = GenericRecord> {
  directoryPath: string;
  files: string[];
  definitions: Array<LoadedDefinition<TConfig>>;
}
