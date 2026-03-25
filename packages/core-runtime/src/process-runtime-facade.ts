import { type ProcessCompiledIr, ProcessCompiler } from "@repo-ai-governor/core-process";
import type { LangGraphRuntimeBackend } from "@repo-ai-governor/core-runtime-langgraph";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { RuntimeExecutionStatus } from "./constants/index.js";
import { ProcessRuntimeEngine } from "./process-runtime-engine.js";
import type {
  ProcessRuntimeBackendAvailability,
  ProcessRuntimeBackendKind,
  ProcessRuntimeBackendSelection,
  ProcessRuntimeBackendSelectorOptions,
  ProcessRuntimeFacadeDependencies,
  ProcessRuntimeFacadePrepareOptions,
  ProcessRuntimeLifecycleEvent,
  ProcessRuntimePreparedExecution,
  ProcessRuntimePreparedExecutionProfile,
} from "./types/index.js";

const DEFAULT_PROCESS_RUNTIME_BACKEND: ProcessRuntimeBackendKind = "langgraph";
const LEGACY_RUNTIME_INTERRUPT_KINDS = ["timeout", "cancelled"];
const LEGACY_RUNTIME_TERMINAL_STATUSES = [
  RuntimeExecutionStatus.SUCCEEDED,
  RuntimeExecutionStatus.FAILED,
  RuntimeExecutionStatus.TIMEOUT,
  RuntimeExecutionStatus.CANCELLED,
];

function formatRfc3339Seconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

export class ProcessRuntimeFacade {
  private readonly processCompiler: ProcessCompiler;
  private readonly legacyRuntimeEngine: ProcessRuntimeEngine;
  private readonly langgraphRuntimeBackend?: LangGraphRuntimeBackend;
  private readonly defaultBackend: ProcessRuntimeBackendKind;
  private readonly nowProvider: () => Date;

  public constructor(dependencies: ProcessRuntimeFacadeDependencies = {}) {
    this.processCompiler = dependencies.processCompiler ?? new ProcessCompiler();
    this.legacyRuntimeEngine =
      dependencies.legacyRuntimeEngine ?? new ProcessRuntimeEngine(this.processCompiler);
    this.langgraphRuntimeBackend = dependencies.langgraphRuntimeBackend;
    this.defaultBackend = dependencies.defaultBackend ?? DEFAULT_PROCESS_RUNTIME_BACKEND;
    this.nowProvider = dependencies.nowProvider ?? (() => new Date());
  }

  public selectBackend(
    options: ProcessRuntimeBackendSelectorOptions = {},
  ): ProcessRuntimeBackendSelection {
    const availability = this.resolveAvailability();
    const primaryBackend = options.preferredBackend ?? this.defaultBackend;
    this.assertBackendAvailable(primaryBackend, availability);

    let comparisonBackend: ProcessRuntimeBackendKind | undefined;
    if (options.enableParityHarness) {
      comparisonBackend =
        options.comparisonBackend ?? (primaryBackend === "langgraph" ? "legacy" : "langgraph");

      if (comparisonBackend === primaryBackend) {
        comparisonBackend = undefined;
      } else if (comparisonBackend) {
        this.assertBackendAvailable(comparisonBackend, availability);
      }
    }

    return {
      primaryBackend,
      ...(comparisonBackend ? { comparisonBackend } : {}),
      parityMode: comparisonBackend ? "comparison" : "disabled",
      availability,
      reason: this.buildSelectionReason(primaryBackend, comparisonBackend),
    };
  }

  public prepare(
    compiledIr: ProcessCompiledIr,
    options: ProcessRuntimeFacadePrepareOptions = {},
  ): ProcessRuntimePreparedExecution {
    this.processCompiler.assertIrVersionCompatibleOrThrow(compiledIr.irVersion);
    this.assertCompilableOrThrow(compiledIr);

    const selection = this.selectBackend(options);
    const primary = this.prepareProfile(selection.primaryBackend, compiledIr);
    const comparison = selection.comparisonBackend
      ? this.prepareProfile(selection.comparisonBackend, compiledIr)
      : undefined;

    return {
      selection,
      primary,
      ...(comparison ? { comparison } : {}),
    };
  }

  private resolveAvailability(): ProcessRuntimeBackendAvailability {
    return {
      legacy: Boolean(this.legacyRuntimeEngine),
      langgraph: Boolean(this.langgraphRuntimeBackend),
    };
  }

  private assertBackendAvailable(
    backend: ProcessRuntimeBackendKind,
    availability: ProcessRuntimeBackendAvailability,
  ): void {
    if (availability[backend]) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
      `Selected runtime backend "${backend}" is not available in the current facade.`,
      {
        backend,
        availability,
      },
    );
  }

  private buildSelectionReason(
    primaryBackend: ProcessRuntimeBackendKind,
    comparisonBackend?: ProcessRuntimeBackendKind,
  ): string {
    if (!comparisonBackend) {
      return `Selected "${primaryBackend}" as the active process runtime backend.`;
    }

    return `Selected "${primaryBackend}" as the active process runtime backend and "${comparisonBackend}" as the short-lived parity comparison baseline.`;
  }

  private assertCompilableOrThrow(compiledIr: ProcessCompiledIr): void {
    if (compiledIr.compileErrors.length === 0) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_IR_CONTAINS_COMPILE_ERRORS,
      "Compiled IR contains blocking compile errors and cannot be prepared by the runtime facade.",
      {
        processId: compiledIr.processId,
        executionId: compiledIr.executionId,
        compileErrorCount: compiledIr.compileErrors.length,
      },
    );
  }

  private prepareProfile(
    backend: ProcessRuntimeBackendKind,
    compiledIr: ProcessCompiledIr,
  ): ProcessRuntimePreparedExecutionProfile {
    if (backend === "langgraph") {
      return this.prepareLangGraphProfile(compiledIr);
    }

    return this.prepareLegacyProfile(compiledIr);
  }

  private prepareLangGraphProfile(
    compiledIr: ProcessCompiledIr,
  ): ProcessRuntimePreparedExecutionProfile {
    if (!this.langgraphRuntimeBackend) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_BACKEND_UNAVAILABLE,
        'Selected runtime backend "langgraph" is not available in the current facade.',
        {
          backend: "langgraph",
        },
      );
    }

    const preparedExecution = this.langgraphRuntimeBackend.prepare(compiledIr);

    return {
      backend: "langgraph",
      processId: preparedExecution.plan.processId,
      executionId: preparedExecution.plan.executionId,
      entryNodeId: preparedExecution.plan.entryNodeId,
      currentStatus: preparedExecution.currentStatus,
      nodeCount: preparedExecution.plan.nodes.length,
      edgeCount: preparedExecution.plan.edges.length,
      initialNodeIds: [...preparedExecution.initialNodeIds],
      supportedInterruptKinds: [...preparedExecution.supportedInterruptKinds],
      supportedTerminalStatuses: [...preparedExecution.supportedTerminalStatuses],
      lifecycleEvents: preparedExecution.lifecycleEvents.map((event) => ({ ...event })),
    };
  }

  private prepareLegacyProfile(
    compiledIr: ProcessCompiledIr,
  ): ProcessRuntimePreparedExecutionProfile {
    const occurredAt = formatRfc3339Seconds(this.nowProvider());
    const lifecycleEvents: ProcessRuntimeLifecycleEvent[] = [
      {
        type: "execution.ready",
        processId: compiledIr.processId,
        executionId: compiledIr.executionId,
        status: "pending",
        occurredAt,
        nodeId: compiledIr.entryNodeId,
        message: "Legacy runtime execution envelope is ready for direct execution.",
      },
      ...compiledIr.nodes.map<ProcessRuntimeLifecycleEvent>((node) => ({
        type: "node.ready",
        processId: compiledIr.processId,
        executionId: compiledIr.executionId,
        status: "pending",
        occurredAt,
        nodeId: node.nodeId,
        message: `Node "${node.nodeId}" is registered for legacy runtime dispatch.`,
      })),
      ...compiledIr.edges.map<ProcessRuntimeLifecycleEvent>((edge, index) => ({
        type: "edge.ready",
        processId: compiledIr.processId,
        executionId: compiledIr.executionId,
        status: "pending",
        occurredAt,
        edgeId: `legacy-edge-${index + 1}`,
        message: `Edge "${edge.fromNodeId}" -> "${edge.toNodeId}" is registered for legacy runtime routing.`,
      })),
    ];

    return {
      backend: "legacy",
      processId: compiledIr.processId,
      executionId: compiledIr.executionId,
      entryNodeId: compiledIr.entryNodeId,
      currentStatus: "pending",
      nodeCount: compiledIr.nodes.length,
      edgeCount: compiledIr.edges.length,
      initialNodeIds: [compiledIr.entryNodeId],
      supportedInterruptKinds: [...LEGACY_RUNTIME_INTERRUPT_KINDS],
      supportedTerminalStatuses: [...LEGACY_RUNTIME_TERMINAL_STATUSES],
      lifecycleEvents,
    };
  }
}
