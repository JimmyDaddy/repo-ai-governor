import type { AdaptersConfig, ResolvedWorkspace } from "@repo-ai-governor/config";
import type { MemoryStoreProvider } from "@repo-ai-governor/memory-store-adapter";
import type { AdapterSurface } from "@repo-ai-governor/shared";
import type { ErrorOutputEnvironment, MemoryRuntimeConfig } from "@repo-ai-governor/shared";
import type { CliAdapterDiagnosticsRuntime } from "../../runtime/adapter-diagnostics-runtime.js";
import type { CliReviewQueueRuntime } from "../../runtime/artifacts/review-queue-runtime.js";
import type { CliCommandExperienceBuilder } from "../../runtime/presentation/command-experience-builder.js";
import type { CliLocalAdapterProbeOverride } from "./cli-adapter-verification.interface.js";
import type { CliAdapterVerificationResolution } from "./cli-adapter-verification.interface.js";
import type {
  CliCommandExecutionResultPayload,
  CliCommandResultCheck,
} from "./cli-output.interface.js";
import type { CliRuntimeDebugOptions } from "./cli-runtime-debug.interface.js";

/**
 * Defines CLI runtime constructor options shared by the facade and extracted command executors.
 */
export interface CliGovernanceRuntimeOptions {
  currentWorkingDirectory: string;
  workspace: ResolvedWorkspace;
  configSource: "default" | "file";
  profileId: string | null;
  locale: string;
  outputMode: ErrorOutputEnvironment;
  isTty: boolean;
  memoryConfig: MemoryRuntimeConfig;
  memoryStoreRoot: string;
  memoryStoreProviderName: string;
  memoryStoreProvider: MemoryStoreProvider;
  adaptersConfig: AdaptersConfig;
  runtimeDebugOptions?: CliRuntimeDebugOptions;
  adapterLocalProbeOverrides?: Partial<Record<AdapterSurface, CliLocalAdapterProbeOverride>>;
  commandProbeExecutor?: (command: string, args: readonly string[]) => Promise<void>;
}

/**
 * Defines one normalized command result returned by runtime/command executors.
 */
export interface CliGovernanceCommandResult {
  message: string;
  commandResult: CliCommandExecutionResultPayload;
}

/**
 * Defines pass/warn/fail aggregate totals used by command result payloads.
 */
export interface CliCheckTotals {
  pass: number;
  warn: number;
  fail: number;
}

/**
 * Defines normalized runtime debug flags after deterministic defaulting.
 */
export interface CliNormalizedRuntimeDebugOptions {
  dryRun: boolean;
  trace: boolean;
  replayPath: string | null;
  adapters: boolean;
  fix: boolean;
  recordLedger: boolean;
  taskId: string | null;
  restrictedNetwork: boolean;
  restrictedReason: string | null;
  allowLocalFallback: boolean;
}

/**
 * Defines one artifact writer contract consumed by extracted command executors.
 */
export interface CliArtifactWriter {
  writeTextArtifact(filePath: string, content: string): Promise<void>;
  writeJsonArtifact(filePath: string, payload: unknown): Promise<void>;
  safeReadJson(filePath: string): Promise<Record<string, unknown> | null>;
}

/**
 * Defines one execution context passed to extracted CLI command executors.
 */
export interface CliCommandExecutorContext {
  options: CliGovernanceRuntimeOptions;
  artifactWriter: CliArtifactWriter;
  adapterDiagnosticsRuntime: CliAdapterDiagnosticsRuntime;
  reviewQueueRuntime: CliReviewQueueRuntime;
  commandExperienceBuilder: CliCommandExperienceBuilder;
  executeRunCommand(): Promise<CliGovernanceCommandResult>;
  calculateCheckTotals(checks: CliCommandResultCheck[]): CliCheckTotals;
  buildDefaultConfigContent(): string;
  toRfc3339SecondsTimestamp(value: Date): string;
  formatExecFailureDetail(error: unknown): string;
  resolveRuntimeDebugOptions(): CliNormalizedRuntimeDebugOptions;
  resolveAdapterVerification(): Promise<CliAdapterVerificationResolution>;
  canWritePath(filePath: string): Promise<boolean>;
  localizeText(english: string, chinese: string): string;
  runNodeScript(scriptPath: string): Promise<{
    stdout: string;
    stderr: string;
  }>;
}
