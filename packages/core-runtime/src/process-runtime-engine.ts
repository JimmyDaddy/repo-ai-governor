import {
  type ProcessCompiledIr,
  ProcessCompiler,
  type ProcessIrEdge,
  type ProcessIrNode,
  ProcessNodeType,
} from "../../core-process/src/index.js";
import {
  GovernorErrorCode,
  RuntimeError,
  type StandardizedError,
  standardizeError,
} from "../../shared/src/index.js";
import {
  DEFAULT_RUNTIME_FLOW_TIMEOUT_MS,
  DEFAULT_RUNTIME_MAX_TRANSITIONS,
  DEFAULT_RUNTIME_STAGE_TIMEOUT_MS,
  RuntimeExecutionStatus,
  RuntimeStageStatus,
  RuntimeTimeoutScope,
} from "./constants/index.js";
import { DefaultRuntimeNowProvider, type RuntimeNowProvider } from "./providers/index.js";
import type {
  RuntimeConditionResolver,
  RuntimeExecuteOptions,
  RuntimeExecutionInterruption,
  RuntimeExecutionResult,
  RuntimeLoopController,
  RuntimeStageHandler,
  RuntimeStageInputMap,
  RuntimeStageResult,
} from "./types/index.js";

interface ResolvedRuntimeConfig {
  stageTimeoutMs: number;
  flowTimeoutMs: number;
  maxTransitions: number;
  signal?: AbortSignal;
  stageInputs: RuntimeStageInputMap;
  conditionResolver?: RuntimeConditionResolver;
  loopController?: RuntimeLoopController;
  nowProvider: RuntimeNowProvider;
}

interface RuntimeLoopState {
  startedAtMs: number;
  cycles: number;
}

interface RuntimeExecutionState {
  startedAtMs: number;
  transitions: number;
  visitedNodeIds: string[];
  stageResults: RuntimeStageResult[];
  nodeAttemptCounter: Map<string, number>;
  loopStateByNodeId: Map<string, RuntimeLoopState>;
}

/**
 * Executes compiled process IR using baseline control-flow semantics.
 *
 * Why this exists:
 * runtime behavior for Sequential/Parallel/Loop/Condition should be centralized
 * so policy, audit, and adapter layers consume one deterministic execution model.
 */
export class ProcessRuntimeEngine {
  constructor(private readonly processCompiler: ProcessCompiler = new ProcessCompiler()) {}

  /**
   * Executes one compiled IR payload with stage handler callbacks.
   * @param compiledIr Compiled IR payload produced by ProcessCompiler.
   * @param stageHandler Stage callback invoked per node execution.
   * @param options Runtime options for timeout/cancel/loop/condition behavior.
   * @returns Runtime execution result with stage rows and interruption details.
   */
  public async execute(
    compiledIr: ProcessCompiledIr,
    stageHandler: RuntimeStageHandler,
    options: RuntimeExecuteOptions = {},
  ): Promise<RuntimeExecutionResult> {
    this.processCompiler.assertIrVersionCompatibleOrThrow(compiledIr.irVersion);
    this.assertCompilableOrThrow(compiledIr);

    const nodeById = this.createNodeIndex(compiledIr.nodes);
    const edgeByFromNodeId = this.createEdgeIndex(compiledIr.edges);
    const entryNode = nodeById.get(compiledIr.entryNodeId);
    if (!entryNode) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_ENTRY_NODE_NOT_FOUND,
        `Entry node "${compiledIr.entryNodeId}" not found in compiled IR.`,
        {
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          entryNodeId: compiledIr.entryNodeId,
        },
      );
    }

    const runtimeConfig = this.resolveRuntimeConfig(options);
    const startedAtDate = runtimeConfig.nowProvider.now();
    const runtimeState: RuntimeExecutionState = {
      startedAtMs: startedAtDate.getTime(),
      transitions: 0,
      visitedNodeIds: [],
      stageResults: [],
      nodeAttemptCounter: new Map<string, number>(),
      loopStateByNodeId: new Map<string, RuntimeLoopState>(),
    };

    let executionStatus = RuntimeExecutionStatus.SUCCEEDED;
    let interruption: RuntimeExecutionInterruption | undefined;

    try {
      await this.executeNode(
        entryNode.nodeId,
        compiledIr,
        nodeById,
        edgeByFromNodeId,
        stageHandler,
        runtimeConfig,
        runtimeState,
      );
    } catch (error) {
      const standardizedError = standardizeError(error);
      executionStatus = this.resolveExecutionStatus(standardizedError);
      interruption = this.resolveInterruption(standardizedError, executionStatus);
    }

    const endedAtDate = runtimeConfig.nowProvider.now();
    return {
      processId: compiledIr.processId,
      executionId: compiledIr.executionId,
      status: executionStatus,
      startedAt: formatRfc3339Seconds(startedAtDate),
      endedAt: formatRfc3339Seconds(endedAtDate),
      durationMs: endedAtDate.getTime() - runtimeState.startedAtMs,
      visitedNodeIds: runtimeState.visitedNodeIds,
      stageResults: runtimeState.stageResults,
      ...(interruption ? { interruption } : {}),
    };
  }

  /**
   * Ensures compiled IR does not contain blocking compile errors.
   * @param compiledIr Compiled IR payload.
   * @returns Nothing when compile errors are empty.
   */
  private assertCompilableOrThrow(compiledIr: ProcessCompiledIr): void {
    if (compiledIr.compileErrors.length === 0) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_IR_CONTAINS_COMPILE_ERRORS,
      "Compiled IR contains blocking compile errors and cannot be executed.",
      {
        processId: compiledIr.processId,
        executionId: compiledIr.executionId,
        compileErrorCount: compiledIr.compileErrors.length,
      },
    );
  }

  /**
   * Executes one node and dispatches next transitions by node type.
   * @param nodeId Node id to execute.
   * @param compiledIr Compiled IR payload.
   * @param nodeById Node index map.
   * @param edgeByFromNodeId Edge index map.
   * @param stageHandler Stage callback.
   * @param runtimeConfig Resolved runtime config.
   * @param runtimeState Mutable runtime execution state.
   * @returns Nothing after this node branch completes.
   */
  private async executeNode(
    nodeId: string,
    compiledIr: ProcessCompiledIr,
    nodeById: Map<string, ProcessIrNode>,
    edgeByFromNodeId: Map<string, ProcessIrEdge[]>,
    stageHandler: RuntimeStageHandler,
    runtimeConfig: ResolvedRuntimeConfig,
    runtimeState: RuntimeExecutionState,
  ): Promise<void> {
    this.assertFlowHealthOrThrow(runtimeConfig, runtimeState, compiledIr);
    runtimeState.transitions += 1;
    runtimeState.visitedNodeIds.push(nodeId);

    const node = nodeById.get(nodeId);
    if (!node) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_NODE_NOT_FOUND,
        `Node "${nodeId}" not found during runtime execution.`,
        {
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          nodeId,
        },
      );
    }

    const stageOutput = await this.executeStage(
      node,
      compiledIr,
      stageHandler,
      runtimeConfig,
      runtimeState,
    );

    this.assertFlowHealthOrThrow(runtimeConfig, runtimeState, compiledIr);
    const outgoingEdges = edgeByFromNodeId.get(node.nodeId) ?? [];

    if (node.nodeType === ProcessNodeType.SEQUENTIAL) {
      const nextEdge = outgoingEdges[0];
      if (nextEdge) {
        await this.executeNode(
          nextEdge.toNodeId,
          compiledIr,
          nodeById,
          edgeByFromNodeId,
          stageHandler,
          runtimeConfig,
          runtimeState,
        );
      }
      return;
    }

    if (node.nodeType === ProcessNodeType.CONDITION) {
      const nextEdge = await this.resolveConditionEdge(
        node,
        compiledIr,
        outgoingEdges,
        stageOutput,
        runtimeConfig.conditionResolver,
      );
      if (nextEdge) {
        await this.executeNode(
          nextEdge.toNodeId,
          compiledIr,
          nodeById,
          edgeByFromNodeId,
          stageHandler,
          runtimeConfig,
          runtimeState,
        );
      }
      return;
    }

    if (node.nodeType === ProcessNodeType.LOOP) {
      const nextEdge = await this.resolveLoopNextEdge(
        node,
        compiledIr,
        outgoingEdges,
        stageOutput,
        runtimeConfig,
        runtimeState,
      );
      if (nextEdge) {
        await this.executeNode(
          nextEdge.toNodeId,
          compiledIr,
          nodeById,
          edgeByFromNodeId,
          stageHandler,
          runtimeConfig,
          runtimeState,
        );
      }
      return;
    }

    await Promise.all(
      outgoingEdges.map((edge) =>
        this.executeNode(
          edge.toNodeId,
          compiledIr,
          nodeById,
          edgeByFromNodeId,
          stageHandler,
          runtimeConfig,
          runtimeState,
        ),
      ),
    );
  }

  /**
   * Executes one stage and records stage-level result row.
   * @param node Runtime node payload.
   * @param compiledIr Compiled IR payload.
   * @param stageHandler Stage callback.
   * @param runtimeConfig Resolved runtime config.
   * @param runtimeState Mutable runtime state.
   * @returns Stage output object.
   */
  private async executeStage(
    node: ProcessIrNode,
    compiledIr: ProcessCompiledIr,
    stageHandler: RuntimeStageHandler,
    runtimeConfig: ResolvedRuntimeConfig,
    runtimeState: RuntimeExecutionState,
  ): Promise<Record<string, unknown>> {
    const stageStartedAtDate = runtimeConfig.nowProvider.now();
    const stageStartedAtMs = stageStartedAtDate.getTime();
    const attempt = (runtimeState.nodeAttemptCounter.get(node.nodeId) ?? 0) + 1;
    runtimeState.nodeAttemptCounter.set(node.nodeId, attempt);
    const stageInput = runtimeConfig.stageInputs[node.nodeId] ?? {};

    try {
      const stageOutput = await this.runStageWithTimeout(
        stageHandler({
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          nodeId: node.nodeId,
          stageId: node.stageId,
          nodeType: node.nodeType,
          attempt,
          elapsedFlowMs: stageStartedAtMs - runtimeState.startedAtMs,
          input: stageInput,
        }),
        node,
        runtimeConfig.stageTimeoutMs,
      );

      const endedAtDate = runtimeConfig.nowProvider.now();
      runtimeState.stageResults.push({
        nodeId: node.nodeId,
        stageId: node.stageId,
        nodeType: node.nodeType,
        status: RuntimeStageStatus.SUCCEEDED,
        attempt,
        startedAt: formatRfc3339Seconds(stageStartedAtDate),
        endedAt: formatRfc3339Seconds(endedAtDate),
        durationMs: endedAtDate.getTime() - stageStartedAtMs,
        ...(stageOutput ? { output: stageOutput } : {}),
      });

      return stageOutput ?? {};
    } catch (error) {
      const standardizedError = standardizeError(error);
      const endedAtDate = runtimeConfig.nowProvider.now();

      runtimeState.stageResults.push({
        nodeId: node.nodeId,
        stageId: node.stageId,
        nodeType: node.nodeType,
        status: this.resolveStageStatus(standardizedError),
        attempt,
        startedAt: formatRfc3339Seconds(stageStartedAtDate),
        endedAt: formatRfc3339Seconds(endedAtDate),
        durationMs: endedAtDate.getTime() - stageStartedAtMs,
        errorCode: standardizedError.code,
        errorMessage: standardizedError.message,
      });

      throw error;
    }
  }

  /**
   * Resolves next edge for condition node.
   * @param node Condition node payload.
   * @param compiledIr Compiled IR payload.
   * @param outgoingEdges Candidate outgoing edges.
   * @param stageOutput Stage output payload.
   * @param conditionResolver Optional resolver hook.
   * @returns Selected next edge, or undefined when flow should terminate.
   */
  private async resolveConditionEdge(
    node: ProcessIrNode,
    compiledIr: ProcessCompiledIr,
    outgoingEdges: ProcessIrEdge[],
    stageOutput: Record<string, unknown>,
    conditionResolver?: RuntimeConditionResolver,
  ): Promise<ProcessIrEdge | undefined> {
    if (outgoingEdges.length === 0) {
      return undefined;
    }

    const conditionKey = conditionResolver
      ? await conditionResolver.resolveConditionKey({
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          nodeId: node.nodeId,
          stageId: node.stageId,
          outgoingEdges,
          stageOutput,
        })
      : undefined;

    if (conditionKey) {
      const matchedEdge = outgoingEdges.find((edge) => edge.conditionKey === conditionKey);
      if (matchedEdge) {
        return matchedEdge;
      }
    }

    return outgoingEdges.find((edge) => edge.conditionKey === undefined) ?? outgoingEdges[0];
  }

  /**
   * Resolves next edge for loop node based on limits and optional controller.
   * @param node Loop node payload.
   * @param compiledIr Compiled IR payload.
   * @param outgoingEdges Loop outgoing edges.
   * @param stageOutput Stage output payload.
   * @param runtimeConfig Resolved runtime config.
   * @param runtimeState Mutable runtime state.
   * @returns Selected next edge, or undefined when loop terminates.
   */
  private async resolveLoopNextEdge(
    node: ProcessIrNode,
    compiledIr: ProcessCompiledIr,
    outgoingEdges: ProcessIrEdge[],
    stageOutput: Record<string, unknown>,
    runtimeConfig: ResolvedRuntimeConfig,
    runtimeState: RuntimeExecutionState,
  ): Promise<ProcessIrEdge | undefined> {
    if (outgoingEdges.length === 0) {
      return undefined;
    }

    const selfEdge = outgoingEdges.find((edge) => edge.toNodeId === node.nodeId);
    const exitEdge = outgoingEdges.find((edge) => edge.toNodeId !== node.nodeId);
    if (!node.limits || !selfEdge) {
      return exitEdge ?? selfEdge;
    }

    const currentLoopState =
      runtimeState.loopStateByNodeId.get(node.nodeId) ??
      ({
        startedAtMs: runtimeConfig.nowProvider.now().getTime(),
        cycles: 0,
      } satisfies RuntimeLoopState);
    currentLoopState.cycles += 1;
    runtimeState.loopStateByNodeId.set(node.nodeId, currentLoopState);

    const nowMs = runtimeConfig.nowProvider.now().getTime();
    const elapsedLoopMs = nowMs - currentLoopState.startedAtMs;
    const maxWallTimeMs = node.limits.maxWallTimeSeconds * 1000;

    const withinCycleLimit = currentLoopState.cycles < node.limits.maxCycles;
    const withinWallTimeLimit = elapsedLoopMs < maxWallTimeMs;
    const shouldContinueByController = runtimeConfig.loopController
      ? await runtimeConfig.loopController.shouldContinue({
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          nodeId: node.nodeId,
          stageId: node.stageId,
          cycle: currentLoopState.cycles,
          maxCycles: node.limits.maxCycles,
          maxWallTimeSeconds: node.limits.maxWallTimeSeconds,
          elapsedLoopMs,
          stageOutput,
        })
      : true;

    if (withinCycleLimit && withinWallTimeLimit && shouldContinueByController) {
      return selfEdge;
    }

    return exitEdge;
  }

  /**
   * Runs stage promise under stage timeout guard.
   * @param stagePromise Stage promise from handler.
   * @param node Runtime node payload.
   * @param stageTimeoutMs Stage timeout milliseconds.
   * @returns Stage output or undefined.
   */
  private async runStageWithTimeout(
    stagePromise: Promise<Record<string, unknown> | undefined>,
    node: ProcessIrNode,
    stageTimeoutMs: number,
  ): Promise<Record<string, unknown> | undefined> {
    let timeoutHandle: ReturnType<typeof setTimeout> | undefined;

    const timeoutPromise = new Promise<never>((_, reject) => {
      timeoutHandle = setTimeout(() => {
        reject(
          new RuntimeError(
            GovernorErrorCode.PROCESS_RUNTIME_STAGE_TIMEOUT,
            `Stage "${node.stageId}" timed out after ${stageTimeoutMs}ms.`,
            {
              nodeId: node.nodeId,
              stageId: node.stageId,
              stageTimeoutMs,
            },
          ),
        );
      }, stageTimeoutMs);
    });

    try {
      return await Promise.race([stagePromise, timeoutPromise]);
    } finally {
      if (timeoutHandle !== undefined) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  /**
   * Checks flow health constraints before dispatching next transitions.
   * @param runtimeConfig Resolved runtime config.
   * @param runtimeState Mutable runtime state.
   * @param compiledIr Compiled IR payload.
   * @returns Nothing when flow can continue.
   */
  private assertFlowHealthOrThrow(
    runtimeConfig: ResolvedRuntimeConfig,
    runtimeState: RuntimeExecutionState,
    compiledIr: ProcessCompiledIr,
  ): void {
    if (runtimeConfig.signal?.aborted) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        "Runtime execution was cancelled.",
        {
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          transitions: runtimeState.transitions,
        },
      );
    }

    const nowMs = runtimeConfig.nowProvider.now().getTime();
    const elapsedFlowMs = nowMs - runtimeState.startedAtMs;
    if (elapsedFlowMs > runtimeConfig.flowTimeoutMs) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT,
        `Runtime flow timed out after ${runtimeConfig.flowTimeoutMs}ms.`,
        {
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          flowTimeoutMs: runtimeConfig.flowTimeoutMs,
          elapsedFlowMs,
        },
      );
    }

    if (runtimeState.transitions >= runtimeConfig.maxTransitions) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_MAX_TRANSITIONS_EXCEEDED,
        `Runtime exceeded maxTransitions=${runtimeConfig.maxTransitions}.`,
        {
          processId: compiledIr.processId,
          executionId: compiledIr.executionId,
          maxTransitions: runtimeConfig.maxTransitions,
          transitions: runtimeState.transitions,
        },
      );
    }
  }

  /**
   * Resolves stage status from standardized error code.
   * @param standardizedError Standardized error payload.
   * @returns Stage status enum.
   */
  private resolveStageStatus(standardizedError: StandardizedError): RuntimeStageStatus {
    if (standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_STAGE_TIMEOUT) {
      return RuntimeStageStatus.TIMEOUT;
    }

    if (standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED) {
      return RuntimeStageStatus.CANCELLED;
    }

    return RuntimeStageStatus.FAILED;
  }

  /**
   * Resolves execution status from standardized error code.
   * @param standardizedError Standardized error payload.
   * @returns Execution status enum.
   */
  private resolveExecutionStatus(standardizedError: StandardizedError): RuntimeExecutionStatus {
    if (
      standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_STAGE_TIMEOUT ||
      standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT
    ) {
      return RuntimeExecutionStatus.TIMEOUT;
    }

    if (standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED) {
      return RuntimeExecutionStatus.CANCELLED;
    }

    return RuntimeExecutionStatus.FAILED;
  }

  /**
   * Resolves interruption payload for timeout/cancelled execution status.
   * @param standardizedError Standardized error payload.
   * @param executionStatus Resolved execution status.
   * @returns Interruption payload when status is timeout/cancelled.
   */
  private resolveInterruption(
    standardizedError: StandardizedError,
    executionStatus: RuntimeExecutionStatus,
  ): RuntimeExecutionInterruption | undefined {
    if (
      executionStatus !== RuntimeExecutionStatus.TIMEOUT &&
      executionStatus !== RuntimeExecutionStatus.CANCELLED
    ) {
      return undefined;
    }

    if (executionStatus === RuntimeExecutionStatus.CANCELLED) {
      return {
        reason: RuntimeExecutionStatus.CANCELLED,
        errorCode: standardizedError.code,
        message: standardizedError.message,
      };
    }

    return {
      reason: RuntimeExecutionStatus.TIMEOUT,
      errorCode: standardizedError.code,
      message: standardizedError.message,
      timeoutScope:
        standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT
          ? RuntimeTimeoutScope.FLOW
          : RuntimeTimeoutScope.STAGE,
    };
  }

  /**
   * Resolves runtime options to deterministic defaults.
   * @param options Raw runtime options.
   * @returns Resolved runtime config object.
   */
  private resolveRuntimeConfig(options: RuntimeExecuteOptions): ResolvedRuntimeConfig {
    return {
      stageTimeoutMs: options.stageTimeoutMs ?? DEFAULT_RUNTIME_STAGE_TIMEOUT_MS,
      flowTimeoutMs: options.flowTimeoutMs ?? DEFAULT_RUNTIME_FLOW_TIMEOUT_MS,
      maxTransitions: options.maxTransitions ?? DEFAULT_RUNTIME_MAX_TRANSITIONS,
      signal: options.signal,
      stageInputs: options.stageInputs ?? {},
      conditionResolver: options.conditionResolver,
      loopController: options.loopController,
      nowProvider: options.nowProvider ?? new DefaultRuntimeNowProvider(),
    };
  }

  /**
   * Builds node index map by nodeId.
   * @param nodes IR node list.
   * @returns Node index map.
   */
  private createNodeIndex(nodes: ProcessIrNode[]): Map<string, ProcessIrNode> {
    return new Map(nodes.map((node) => [node.nodeId, node]));
  }

  /**
   * Builds edge index map by fromNodeId.
   * @param edges IR edge list.
   * @returns Edge index map.
   */
  private createEdgeIndex(edges: ProcessIrEdge[]): Map<string, ProcessIrEdge[]> {
    const edgeByFromNodeId = new Map<string, ProcessIrEdge[]>();

    for (const edge of edges) {
      const currentEdges = edgeByFromNodeId.get(edge.fromNodeId) ?? [];
      edgeByFromNodeId.set(edge.fromNodeId, [...currentEdges, edge]);
    }

    return edgeByFromNodeId;
  }
}

/**
 * Formats Date to RFC3339 seconds precision.
 * @param value Date object to format.
 * @returns RFC3339 timestamp without milliseconds.
 */
function formatRfc3339Seconds(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/u, "Z");
}
