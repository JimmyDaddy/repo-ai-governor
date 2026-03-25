import type { ProcessCompiledIr } from "@repo-ai-governor/core-process";
import {
  GovernorErrorCode,
  RuntimeError,
  type StandardizedError,
  standardizeError,
} from "@repo-ai-governor/shared";
import { CompiledIrGraphAdapter } from "./compiled-ir-graph-adapter.js";
import {
  LANGGRAPH_RUNTIME_INTERRUPT_KINDS,
  LANGGRAPH_RUNTIME_TERMINAL_STATUSES,
  type LangGraphRuntimeExecutionStatus,
  type LangGraphRuntimeTerminalStatus,
} from "./constants/index.js";
import type {
  LangGraphCompiledGraphEdge,
  LangGraphCompiledGraphNode,
  LangGraphPreparedExecution,
  LangGraphRuntimeConditionResolver,
  LangGraphRuntimeExecuteOptions,
  LangGraphRuntimeExecutionInterruption,
  LangGraphRuntimeExecutionResult,
  LangGraphRuntimeLifecycleEvent,
  LangGraphRuntimeLoopController,
  LangGraphRuntimeStageHandler,
  LangGraphRuntimeStageResult,
} from "./types/index.js";

const DEFAULT_STAGE_TIMEOUT_MS = 30000;
const DEFAULT_FLOW_TIMEOUT_MS = 300000;
const DEFAULT_MAX_TRANSITIONS = 1000;

interface ResolvedLangGraphRuntimeConfig {
  stageTimeoutMs: number;
  flowTimeoutMs: number;
  maxTransitions: number;
  signal?: AbortSignal;
  stageInputs: Record<string, Record<string, unknown>>;
  conditionResolver?: LangGraphRuntimeConditionResolver;
  loopController?: LangGraphRuntimeLoopController;
  nowProvider: () => Date;
}

interface LangGraphLoopState {
  startedAtMs: number;
  cycles: number;
}

interface LangGraphExecutionState {
  startedAtMs: number;
  transitions: number;
  visitedNodeIds: string[];
  stageResults: LangGraphRuntimeStageResult[];
  nodeAttemptCounter: Map<string, number>;
  loopStateByNodeId: Map<string, LangGraphLoopState>;
  parallelJoinArrivals: Map<string, Set<string>>;
}

interface LangGraphActiveParallelContext {
  fanOutNodeId: string;
  branchRootNodeId: string;
}

interface LangGraphParallelJoinExpectation {
  fanOutNodeId: string;
  targetNodeId: string;
  branchRootNodeIds: string[];
}

function formatRfc3339Seconds(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/u, "Z");
}

export class LangGraphRuntimeBackend {
  constructor(
    private readonly compiledIrGraphAdapter: CompiledIrGraphAdapter = new CompiledIrGraphAdapter(),
    private readonly nowProvider: () => Date = () => new Date(),
  ) {}

  public prepare(compiledIr: ProcessCompiledIr): LangGraphPreparedExecution {
    const plan = this.compiledIrGraphAdapter.adapt(compiledIr);
    const entryNode = plan.nodes.find((node) => node.nodeId === plan.entryNodeId);
    if (!entryNode) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_ENTRY_NODE_NOT_FOUND,
        `Entry node "${plan.entryNodeId}" not found in LangGraph plan.`,
        {
          processId: plan.processId,
          executionId: plan.executionId,
          entryNodeId: plan.entryNodeId,
        },
      );
    }

    const currentStatus: LangGraphRuntimeExecutionStatus = "pending";
    const occurredAt = formatRfc3339Seconds(this.nowProvider());
    const lifecycleEvents: LangGraphRuntimeLifecycleEvent[] = [
      {
        type: "execution.ready",
        processId: plan.processId,
        executionId: plan.executionId,
        status: currentStatus,
        occurredAt,
        nodeId: plan.entryNodeId,
        message: "LangGraph graph-first backend prepared the execution envelope.",
      },
      {
        type: "graph.compiled",
        processId: plan.processId,
        executionId: plan.executionId,
        status: currentStatus,
        occurredAt,
        message: `Compiled IR was adapted into a graph plan with ${plan.nodes.length} node(s) and ${plan.edges.length} edge(s).`,
      },
      ...plan.nodes.map<LangGraphRuntimeLifecycleEvent>((node) => ({
        type: "node.ready",
        processId: plan.processId,
        executionId: plan.executionId,
        status: currentStatus,
        occurredAt,
        nodeId: node.nodeId,
        message: `Node "${node.nodeId}" is registered for graph-first scheduling.`,
      })),
      ...plan.edges.map<LangGraphRuntimeLifecycleEvent>((edge) => ({
        type: "edge.ready",
        processId: plan.processId,
        executionId: plan.executionId,
        status: currentStatus,
        occurredAt,
        edgeId: edge.edgeId,
        message: `Edge "${edge.edgeId}" is registered for graph-first routing.`,
      })),
    ];

    return {
      plan,
      executionMode: "graph_first_dispatch",
      initialNodeIds: [entryNode.nodeId],
      currentStatus,
      supportedInterruptKinds: [...LANGGRAPH_RUNTIME_INTERRUPT_KINDS],
      supportedTerminalStatuses: [...LANGGRAPH_RUNTIME_TERMINAL_STATUSES],
      lifecycleEvents,
    };
  }

  public async execute(
    compiledIr: ProcessCompiledIr,
    stageHandler: LangGraphRuntimeStageHandler,
    options: LangGraphRuntimeExecuteOptions = {},
  ): Promise<LangGraphRuntimeExecutionResult> {
    const preparedExecution = this.prepare(compiledIr);
    const runtimeConfig = this.resolveRuntimeConfig(options);
    const nodeById = new Map(
      preparedExecution.plan.nodes.map((node) => [node.nodeId, node] as const),
    );
    const edgeByFromNodeId = new Map<string, LangGraphCompiledGraphEdge[]>();
    for (const edge of preparedExecution.plan.edges) {
      const outgoingEdges = edgeByFromNodeId.get(edge.fromNodeId) ?? [];
      outgoingEdges.push(edge);
      edgeByFromNodeId.set(edge.fromNodeId, outgoingEdges);
    }
    const parallelJoinExpectations = this.buildParallelJoinExpectations(
      preparedExecution.plan.nodes,
      edgeByFromNodeId,
    );

    const startedAtDate = runtimeConfig.nowProvider();
    const runtimeState: LangGraphExecutionState = {
      startedAtMs: startedAtDate.getTime(),
      transitions: 0,
      visitedNodeIds: [],
      stageResults: [],
      nodeAttemptCounter: new Map(),
      loopStateByNodeId: new Map(),
      parallelJoinArrivals: new Map(),
    };

    let executionStatus: LangGraphRuntimeExecutionResult["status"] = "succeeded";
    let interruption: LangGraphRuntimeExecutionInterruption | undefined;

    try {
      await this.executeNode(
        preparedExecution.plan.entryNodeId,
        preparedExecution.plan.processId,
        preparedExecution.plan.executionId,
        nodeById,
        edgeByFromNodeId,
        parallelJoinExpectations,
        stageHandler,
        runtimeConfig,
        runtimeState,
        [],
      );
    } catch (error) {
      const standardizedError = standardizeError(error);
      executionStatus = this.resolveExecutionStatus(standardizedError);
      interruption = this.resolveInterruption(standardizedError, executionStatus);
    }

    const endedAtDate = runtimeConfig.nowProvider();
    return {
      processId: preparedExecution.plan.processId,
      executionId: preparedExecution.plan.executionId,
      status: executionStatus,
      startedAt: formatRfc3339Seconds(startedAtDate),
      endedAt: formatRfc3339Seconds(endedAtDate),
      durationMs: endedAtDate.getTime() - runtimeState.startedAtMs,
      visitedNodeIds: runtimeState.visitedNodeIds,
      stageResults: runtimeState.stageResults,
      ...(interruption ? { interruption } : {}),
    };
  }

  private resolveRuntimeConfig(
    options: LangGraphRuntimeExecuteOptions,
  ): ResolvedLangGraphRuntimeConfig {
    return {
      stageTimeoutMs: options.stageTimeoutMs ?? DEFAULT_STAGE_TIMEOUT_MS,
      flowTimeoutMs: options.flowTimeoutMs ?? DEFAULT_FLOW_TIMEOUT_MS,
      maxTransitions: options.maxTransitions ?? DEFAULT_MAX_TRANSITIONS,
      ...(options.signal ? { signal: options.signal } : {}),
      stageInputs: options.stageInputs ?? {},
      ...(options.conditionResolver ? { conditionResolver: options.conditionResolver } : {}),
      ...(options.loopController ? { loopController: options.loopController } : {}),
      nowProvider: options.nowProvider ?? this.nowProvider,
    };
  }

  private async executeNode(
    nodeId: string,
    processId: string,
    executionId: string,
    nodeById: Map<string, LangGraphCompiledGraphNode>,
    edgeByFromNodeId: Map<string, LangGraphCompiledGraphEdge[]>,
    parallelJoinExpectations: Map<string, LangGraphParallelJoinExpectation>,
    stageHandler: LangGraphRuntimeStageHandler,
    runtimeConfig: ResolvedLangGraphRuntimeConfig,
    runtimeState: LangGraphExecutionState,
    activeParallelContexts: LangGraphActiveParallelContext[],
  ): Promise<void> {
    const joinBarrierResolution = this.resolveJoinBarrier(
      nodeId,
      activeParallelContexts,
      parallelJoinExpectations,
      runtimeState,
    );
    if (joinBarrierResolution.blocked) {
      return;
    }

    this.assertFlowHealthOrThrow(processId, executionId, runtimeConfig, runtimeState);
    runtimeState.transitions += 1;
    runtimeState.visitedNodeIds.push(nodeId);

    const node = nodeById.get(nodeId);
    if (!node) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_NODE_NOT_FOUND,
        `Node "${nodeId}" not found during LangGraph execution.`,
        {
          processId,
          executionId,
          nodeId,
        },
      );
    }

    const stageOutput = await this.executeStage(
      node,
      processId,
      executionId,
      stageHandler,
      runtimeConfig,
      runtimeState,
    );
    const outgoingEdges = edgeByFromNodeId.get(node.nodeId) ?? [];
    const downstreamParallelContexts = joinBarrierResolution.nextParallelContexts;

    if (node.behavior === "invoke_stage") {
      const nextEdge = outgoingEdges[0];
      if (nextEdge) {
        await this.executeNode(
          nextEdge.toNodeId,
          processId,
          executionId,
          nodeById,
          edgeByFromNodeId,
          parallelJoinExpectations,
          stageHandler,
          runtimeConfig,
          runtimeState,
          downstreamParallelContexts,
        );
      }
      return;
    }

    if (node.behavior === "branch") {
      const nextEdge = await this.resolveConditionEdge(
        node,
        processId,
        executionId,
        outgoingEdges,
        stageOutput,
        runtimeConfig.conditionResolver,
      );
      if (nextEdge) {
        await this.executeNode(
          nextEdge.toNodeId,
          processId,
          executionId,
          nodeById,
          edgeByFromNodeId,
          parallelJoinExpectations,
          stageHandler,
          runtimeConfig,
          runtimeState,
          downstreamParallelContexts,
        );
      }
      return;
    }

    if (node.behavior === "loop") {
      const nextEdge = await this.resolveLoopNextEdge(
        node,
        processId,
        executionId,
        outgoingEdges,
        stageOutput,
        runtimeConfig,
        runtimeState,
      );
      if (nextEdge) {
        await this.executeNode(
          nextEdge.toNodeId,
          processId,
          executionId,
          nodeById,
          edgeByFromNodeId,
          parallelJoinExpectations,
          stageHandler,
          runtimeConfig,
          runtimeState,
          downstreamParallelContexts,
        );
      }
      return;
    }

    await Promise.all(
      outgoingEdges.map((edge) =>
        this.executeNode(
          edge.toNodeId,
          processId,
          executionId,
          nodeById,
          edgeByFromNodeId,
          parallelJoinExpectations,
          stageHandler,
          runtimeConfig,
          runtimeState,
          [
            ...downstreamParallelContexts,
            {
              fanOutNodeId: node.nodeId,
              branchRootNodeId: edge.toNodeId,
            },
          ],
        ),
      ),
    );
  }

  private buildParallelJoinExpectations(
    nodes: LangGraphCompiledGraphNode[],
    edgeByFromNodeId: Map<string, LangGraphCompiledGraphEdge[]>,
  ): Map<string, LangGraphParallelJoinExpectation> {
    const expectationByKey = new Map<string, LangGraphParallelJoinExpectation>();
    for (const node of nodes) {
      if (node.behavior !== "fan_out") {
        continue;
      }

      const outgoingEdges = edgeByFromNodeId.get(node.nodeId) ?? [];
      const reachableBranchRootsByNodeId = new Map<string, Set<string>>();
      for (const edge of outgoingEdges) {
        const reachableNodeIds = this.collectReachableNodeIds(
          edge.toNodeId,
          edgeByFromNodeId,
          new Set(),
        );
        for (const reachableNodeId of reachableNodeIds) {
          const branchRoots = reachableBranchRootsByNodeId.get(reachableNodeId) ?? new Set();
          branchRoots.add(edge.toNodeId);
          reachableBranchRootsByNodeId.set(reachableNodeId, branchRoots);
        }
      }

      for (const [targetNodeId, branchRootNodeIds] of reachableBranchRootsByNodeId) {
        if (branchRootNodeIds.size <= 1) {
          continue;
        }
        const expectationKey = this.buildParallelJoinKey(node.nodeId, targetNodeId);
        expectationByKey.set(expectationKey, {
          fanOutNodeId: node.nodeId,
          targetNodeId,
          branchRootNodeIds: [...branchRootNodeIds],
        });
      }
    }

    return expectationByKey;
  }

  private collectReachableNodeIds(
    nodeId: string,
    edgeByFromNodeId: Map<string, LangGraphCompiledGraphEdge[]>,
    visitedNodeIds: Set<string>,
  ): Set<string> {
    if (visitedNodeIds.has(nodeId)) {
      return new Set();
    }
    visitedNodeIds.add(nodeId);

    const reachableNodeIds = new Set([nodeId]);
    const outgoingEdges = edgeByFromNodeId.get(nodeId) ?? [];
    for (const edge of outgoingEdges) {
      const downstreamReachableNodeIds = this.collectReachableNodeIds(
        edge.toNodeId,
        edgeByFromNodeId,
        visitedNodeIds,
      );
      for (const reachableNodeId of downstreamReachableNodeIds) {
        reachableNodeIds.add(reachableNodeId);
      }
    }

    return reachableNodeIds;
  }

  private resolveJoinBarrier(
    nodeId: string,
    activeParallelContexts: LangGraphActiveParallelContext[],
    parallelJoinExpectations: Map<string, LangGraphParallelJoinExpectation>,
    runtimeState: LangGraphExecutionState,
  ): {
    blocked: boolean;
    nextParallelContexts: LangGraphActiveParallelContext[];
  } {
    for (let index = activeParallelContexts.length - 1; index >= 0; index -= 1) {
      const parallelContext = activeParallelContexts[index];
      const expectation = parallelJoinExpectations.get(
        this.buildParallelJoinKey(parallelContext.fanOutNodeId, nodeId),
      );
      if (!expectation) {
        continue;
      }

      const arrivalKey = this.buildParallelJoinArrivalKey(parallelContext.fanOutNodeId, nodeId);
      const arrivals = runtimeState.parallelJoinArrivals.get(arrivalKey) ?? new Set<string>();
      arrivals.add(parallelContext.branchRootNodeId);
      runtimeState.parallelJoinArrivals.set(arrivalKey, arrivals);

      if (arrivals.size < expectation.branchRootNodeIds.length) {
        return {
          blocked: true,
          nextParallelContexts: activeParallelContexts,
        };
      }

      return {
        blocked: false,
        nextParallelContexts: activeParallelContexts.filter(
          (candidate, candidateIndex) => candidateIndex !== index,
        ),
      };
    }

    return {
      blocked: false,
      nextParallelContexts: activeParallelContexts,
    };
  }

  private buildParallelJoinKey(fanOutNodeId: string, targetNodeId: string): string {
    return `${fanOutNodeId}::${targetNodeId}`;
  }

  private buildParallelJoinArrivalKey(fanOutNodeId: string, targetNodeId: string): string {
    return this.buildParallelJoinKey(fanOutNodeId, targetNodeId);
  }

  private async executeStage(
    node: LangGraphCompiledGraphNode,
    processId: string,
    executionId: string,
    stageHandler: LangGraphRuntimeStageHandler,
    runtimeConfig: ResolvedLangGraphRuntimeConfig,
    runtimeState: LangGraphExecutionState,
  ): Promise<Record<string, unknown>> {
    const stageStartedAtDate = runtimeConfig.nowProvider();
    const stageStartedAtMs = stageStartedAtDate.getTime();
    const attempt = (runtimeState.nodeAttemptCounter.get(node.nodeId) ?? 0) + 1;
    runtimeState.nodeAttemptCounter.set(node.nodeId, attempt);
    const stageInput = runtimeConfig.stageInputs[node.nodeId] ?? {};

    try {
      const stageOutput = await this.runStageWithTimeout(
        stageHandler({
          processId,
          executionId,
          nodeId: node.nodeId,
          stageId: node.stageId,
          nodeType: node.nodeType,
          routeKey: node.routeKey,
          roleProfileId: node.roleProfileId,
          attempt,
          elapsedFlowMs: stageStartedAtMs - runtimeState.startedAtMs,
          input: stageInput,
        }),
        node,
        runtimeConfig.stageTimeoutMs,
      );

      const endedAtDate = runtimeConfig.nowProvider();
      runtimeState.stageResults.push({
        nodeId: node.nodeId,
        stageId: node.stageId,
        nodeType: node.nodeType,
        status: "succeeded",
        attempt,
        startedAt: formatRfc3339Seconds(stageStartedAtDate),
        endedAt: formatRfc3339Seconds(endedAtDate),
        durationMs: endedAtDate.getTime() - stageStartedAtMs,
        ...(stageOutput ? { output: stageOutput } : {}),
      });

      return stageOutput ?? {};
    } catch (error) {
      const standardizedError = standardizeError(error);
      const endedAtDate = runtimeConfig.nowProvider();

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

  private async resolveConditionEdge(
    node: LangGraphCompiledGraphNode,
    processId: string,
    executionId: string,
    outgoingEdges: LangGraphCompiledGraphEdge[],
    stageOutput: Record<string, unknown>,
    conditionResolver?: LangGraphRuntimeConditionResolver,
  ): Promise<LangGraphCompiledGraphEdge | undefined> {
    if (outgoingEdges.length === 0) {
      return undefined;
    }

    const conditionKey = conditionResolver
      ? await conditionResolver.resolveConditionKey({
          processId,
          executionId,
          nodeId: node.nodeId,
          stageId: node.stageId,
          outgoingEdges: outgoingEdges.map((edge) => ({
            edgeId: edge.edgeId,
            fromNodeId: edge.fromNodeId,
            toNodeId: edge.toNodeId,
            ...(edge.conditionKey ? { conditionKey: edge.conditionKey } : {}),
          })),
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

  private async resolveLoopNextEdge(
    node: LangGraphCompiledGraphNode,
    processId: string,
    executionId: string,
    outgoingEdges: LangGraphCompiledGraphEdge[],
    stageOutput: Record<string, unknown>,
    runtimeConfig: ResolvedLangGraphRuntimeConfig,
    runtimeState: LangGraphExecutionState,
  ): Promise<LangGraphCompiledGraphEdge | undefined> {
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
        startedAtMs: runtimeConfig.nowProvider().getTime(),
        cycles: 0,
      } satisfies LangGraphLoopState);
    currentLoopState.cycles += 1;
    runtimeState.loopStateByNodeId.set(node.nodeId, currentLoopState);

    const nowMs = runtimeConfig.nowProvider().getTime();
    const elapsedLoopMs = nowMs - currentLoopState.startedAtMs;
    const maxWallTimeMs = node.limits.maxWallTimeSeconds * 1000;

    const withinCycleLimit = currentLoopState.cycles < node.limits.maxCycles;
    const withinWallTimeLimit = elapsedLoopMs < maxWallTimeMs;
    const shouldContinueByController = runtimeConfig.loopController
      ? await runtimeConfig.loopController.shouldContinue({
          processId,
          executionId,
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

  private async runStageWithTimeout(
    stagePromise: Promise<Record<string, unknown> | undefined>,
    node: LangGraphCompiledGraphNode,
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

  private assertFlowHealthOrThrow(
    processId: string,
    executionId: string,
    runtimeConfig: ResolvedLangGraphRuntimeConfig,
    runtimeState: LangGraphExecutionState,
  ): void {
    if (runtimeConfig.signal?.aborted) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CANCELLED,
        "LangGraph execution was cancelled by abort signal.",
        {
          processId,
          executionId,
        },
      );
    }

    const nowMs = runtimeConfig.nowProvider().getTime();
    if (nowMs - runtimeState.startedAtMs >= runtimeConfig.flowTimeoutMs) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT,
        `LangGraph execution timed out after ${runtimeConfig.flowTimeoutMs}ms.`,
        {
          processId,
          executionId,
          flowTimeoutMs: runtimeConfig.flowTimeoutMs,
        },
      );
    }

    if (runtimeState.transitions >= runtimeConfig.maxTransitions) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_MAX_TRANSITIONS_EXCEEDED,
        `LangGraph execution exceeded maxTransitions=${runtimeConfig.maxTransitions}.`,
        {
          processId,
          executionId,
          maxTransitions: runtimeConfig.maxTransitions,
          transitions: runtimeState.transitions,
        },
      );
    }
  }

  private resolveStageStatus(
    standardizedError: StandardizedError,
  ): LangGraphRuntimeStageResult["status"] {
    if (standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_STAGE_TIMEOUT) {
      return "timeout";
    }

    if (standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED) {
      return "cancelled";
    }

    return "failed";
  }

  private resolveExecutionStatus(
    standardizedError: StandardizedError,
  ): LangGraphRuntimeExecutionResult["status"] {
    if (
      standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_STAGE_TIMEOUT ||
      standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT
    ) {
      return "timeout";
    }

    if (standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_CANCELLED) {
      return "cancelled";
    }

    return "failed";
  }

  private resolveInterruption(
    standardizedError: StandardizedError,
    executionStatus: LangGraphRuntimeExecutionResult["status"],
  ): LangGraphRuntimeExecutionInterruption | undefined {
    if (executionStatus !== "timeout" && executionStatus !== "cancelled") {
      return undefined;
    }

    if (executionStatus === "cancelled") {
      return {
        reason: "cancelled",
        errorCode: standardizedError.code,
        message: standardizedError.message,
      };
    }

    return {
      reason: "timeout",
      errorCode: standardizedError.code,
      message: standardizedError.message,
      timeoutScope:
        standardizedError.code === GovernorErrorCode.PROCESS_RUNTIME_FLOW_TIMEOUT
          ? "flow"
          : "stage",
    };
  }
}
