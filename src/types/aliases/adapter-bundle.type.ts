import type { loadResolvedConfig } from "../../config/load-config.js";
import type { BuildBaseAdapterBundleOptions } from "../interfaces/adapter-bundle.interface.js";

export type GenericRecord = Record<string, unknown>;

export type ResolvedConfigState = ReturnType<typeof loadResolvedConfig>;

export type BuildClaudeCodeAdapterBundleOptions = Omit<
  BuildBaseAdapterBundleOptions,
  "adapterPreset" | "includeEntryFiles"
>;

export type BuildCodexAdapterBundleOptions = Omit<
  BuildBaseAdapterBundleOptions,
  "adapterPreset" | "includeEntryFiles"
>;

export type BuildGitHubCopilotAdapterBundleOptions = Omit<
  BuildBaseAdapterBundleOptions,
  "adapterPreset" | "includeRepositoryReferences"
>;
