import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

import { GovernorErrorCode, RuntimeError } from "../../shared/src/errors/index.js";
import {
  COMPILED_IR_ROOT_SEGMENTS,
  PROCESS_IR_SUPPORTED_MAJOR_VERSION,
  PROCESS_IR_VERSION,
  ProcessCompilerIssueCode,
  ProcessCompilerSeverity,
  ProcessNodeType,
} from "./constants/index.js";
import type {
  ProcessCompiledIr,
  ProcessCompiledIrSnapshot,
  ProcessCompilerIssue,
  ProcessCompilerIssueSnapshot,
  ProcessDslDefinition,
  ProcessDslEdge,
  ProcessDslNode,
  ProcessIrEdge,
  ProcessIrEdgeSnapshot,
  ProcessIrNode,
  ProcessIrNodeLimits,
  ProcessIrNodeLimitsSnapshot,
  ProcessIrNodeSnapshot,
} from "./types/index.js";

const PROCESS_NODE_TYPE_VALUES = new Set<string>(Object.values(ProcessNodeType));

/**
 * Compiles process DSL into Compiler IR v1 and manages IR snapshot persistence.
 *
 * Why this exists:
 * Stage-2 runtime and policy modules need one deterministic compiler contract so
 * process semantics, diagnostics, and replay snapshots stay aligned.
 */
export class ProcessCompiler {
  /**
   * Compiles process DSL payload into normalized IR with warnings/errors.
   * @param definition DSL payload with nodes/edges and execution metadata.
   * @returns Compiler IR v1 payload consumable by runtime and audit layers.
   */
  public compile(definition: ProcessDslDefinition): ProcessCompiledIr {
    const compileWarnings: ProcessCompilerIssue[] = [];
    const compileErrors: ProcessCompilerIssue[] = [];

    const processId = (definition.processId ?? "").trim();
    const executionId = (definition.executionId ?? "").trim();
    const entryNodeId = (definition.entryNodeId ?? "").trim();
    const nodes = Array.isArray(definition.nodes) ? definition.nodes : [];
    const edges = Array.isArray(definition.edges) ? definition.edges : [];
    const nodeIds = this.collectNodeIds(nodes, compileErrors);

    if (!processId) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.PROCESS_ID_REQUIRED,
          ProcessCompilerSeverity.ERROR,
          "processId is required.",
          "/processId",
          "Provide a stable processId for runtime and audit correlation.",
        ),
      );
    }

    if (!executionId) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.EXECUTION_ID_REQUIRED,
          ProcessCompilerSeverity.ERROR,
          "executionId is required.",
          "/executionId",
          "Provide executionId so snapshots and audit events can be traced.",
        ),
      );
    }

    if (!entryNodeId) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.ENTRY_NODE_ID_REQUIRED,
          ProcessCompilerSeverity.ERROR,
          "entryNodeId is required.",
          "/entryNodeId",
          "Declare one nodeId as the runtime entry node.",
        ),
      );
    } else if (!nodeIds.has(entryNodeId)) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.ENTRY_NODE_NOT_FOUND,
          ProcessCompilerSeverity.ERROR,
          `entryNodeId "${entryNodeId}" does not exist in nodes.`,
          "/entryNodeId",
          "Ensure entryNodeId references one defined node.",
        ),
      );
    }

    if (nodes.length === 0) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.NODES_REQUIRED,
          ProcessCompilerSeverity.ERROR,
          "At least one process node is required.",
          "/nodes",
          "Define one or more nodes before compile.",
        ),
      );
    }

    const compiledNodes = nodes.map((node, index) =>
      this.compileNode(node, index, compileWarnings, compileErrors),
    );
    const compiledEdges = edges.map((edge, index) =>
      this.compileEdge(edge, index, nodeIds, compileErrors),
    );

    return {
      irVersion: PROCESS_IR_VERSION,
      processId,
      executionId,
      compiledAt: formatRfc3339Seconds(new Date()),
      entryNodeId,
      nodes: compiledNodes,
      edges: compiledEdges,
      globals: definition.globals ?? {},
      compileWarnings,
      compileErrors,
    };
  }

  /**
   * Checks whether compile result is free of blocking compile errors.
   * @param compiledIr Compiler IR payload returned by `compile`.
   * @returns True when runtime can proceed with this IR.
   */
  public isCompilable(compiledIr: ProcessCompiledIr): boolean {
    return compiledIr.compileErrors.length === 0;
  }

  /**
   * Verifies one IR version is compatible with current runtime major version.
   * @param irVersion IR version read from compiled snapshot.
   * @returns Nothing when version is compatible; throws standardized error otherwise.
   */
  public assertIrVersionCompatibleOrThrow(irVersion: string): void {
    const majorVersion = this.parseMajorVersion(irVersion);
    if (majorVersion === PROCESS_IR_SUPPORTED_MAJOR_VERSION) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_COMPILER_IR_VERSION_UNSUPPORTED,
      `Unsupported IR major version: expected ${PROCESS_IR_SUPPORTED_MAJOR_VERSION}, received ${irVersion}.`,
      {
        expectedMajorVersion: PROCESS_IR_SUPPORTED_MAJOR_VERSION,
        receivedIrVersion: irVersion,
      },
    );
  }

  /**
   * Persists compiled IR snapshot under `<workspace_root>/context/compiled-ir`.
   * @param workspaceRoot Resolved workspace root for current execution.
   * @param compiledIr Compiler IR payload to persist.
   * @returns Absolute snapshot file path for replay/audit references.
   */
  public persistCompiledIrSnapshot(workspaceRoot: string, compiledIr: ProcessCompiledIr): string {
    const compiledIrDirectory = resolve(workspaceRoot, ...COMPILED_IR_ROOT_SEGMENTS);
    const snapshotPath = resolve(compiledIrDirectory, `${compiledIr.executionId}.json`);
    const compiledIrSnapshot = this.toCompiledIrSnapshot(compiledIr);

    try {
      mkdirSync(compiledIrDirectory, { recursive: true });
      writeFileSync(snapshotPath, `${JSON.stringify(compiledIrSnapshot, null, 2)}\n`, "utf8");
      return snapshotPath;
    } catch (error) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_COMPILED_IR_SNAPSHOT_PERSIST_FAILED,
        `Failed to persist compiled IR snapshot: ${snapshotPath}`,
        {
          snapshotPath,
          executionId: compiledIr.executionId,
        },
        error,
      );
    }
  }

  /**
   * Collects and validates node IDs for duplicate/empty checks.
   * @param nodes Input DSL nodes.
   * @param compileErrors Compile error collector.
   * @returns Set of valid node IDs.
   */
  private collectNodeIds(
    nodes: ProcessDslNode[],
    compileErrors: ProcessCompilerIssue[],
  ): Set<string> {
    const nodeIds = new Set<string>();

    for (const [index, node] of nodes.entries()) {
      const nodeId = (node.nodeId ?? "").trim();
      const location = `/nodes/${index}/nodeId`;

      if (!nodeId) {
        compileErrors.push(
          this.createIssue(
            ProcessCompilerIssueCode.NODE_ID_REQUIRED,
            ProcessCompilerSeverity.ERROR,
            "nodeId is required.",
            location,
            "Provide a stable nodeId for graph references.",
          ),
        );
        continue;
      }

      if (nodeIds.has(nodeId)) {
        compileErrors.push(
          this.createIssue(
            ProcessCompilerIssueCode.NODE_ID_DUPLICATED,
            ProcessCompilerSeverity.ERROR,
            `nodeId "${nodeId}" is duplicated.`,
            location,
            "Ensure every nodeId is unique inside one process definition.",
          ),
        );
        continue;
      }

      nodeIds.add(nodeId);
    }

    return nodeIds;
  }

  /**
   * Compiles one DSL node into normalized IR node and records diagnostics.
   * @param node Raw DSL node entry.
   * @param index Node array index.
   * @param compileWarnings Warning collector.
   * @param compileErrors Error collector.
   * @returns Normalized IR node.
   */
  private compileNode(
    node: ProcessDslNode,
    index: number,
    compileWarnings: ProcessCompilerIssue[],
    compileErrors: ProcessCompilerIssue[],
  ): ProcessIrNode {
    const nodeId = (node.nodeId ?? "").trim();
    const nodeType = this.resolveNodeType(node.nodeType, index, compileErrors);
    const stageId = (node.stageId ?? "").trim();
    const routeKey = (node.routeKey ?? "").trim();
    const roleProfileId = (node.roleProfileId ?? "").trim();
    const inputSchemaRef = (node.inputSchemaRef ?? "").trim();
    const outputSchemaRef = (node.outputSchemaRef ?? "").trim();
    const retryPolicyRef = (node.retryPolicyRef ?? "").trim();
    const timeoutPolicyRef = (node.timeoutPolicyRef ?? "").trim();
    const budgetPolicyRef = (node.budgetPolicyRef ?? "").trim();
    const baseLocation = `/nodes/${index}`;

    this.requireNodeField(
      stageId,
      ProcessCompilerIssueCode.STAGE_ID_REQUIRED,
      `${baseLocation}/stageId`,
      "stageId is required.",
      "Set stageId for stage-level traceability and policy correlation.",
      compileErrors,
    );
    this.requireNodeField(
      routeKey,
      ProcessCompilerIssueCode.ROUTE_KEY_REQUIRED,
      `${baseLocation}/routeKey`,
      "routeKey is required.",
      "Set routeKey to bind runtime routing and role policy.",
      compileErrors,
    );
    this.requireNodeField(
      roleProfileId,
      ProcessCompilerIssueCode.ROLE_PROFILE_ID_REQUIRED,
      `${baseLocation}/roleProfileId`,
      "roleProfileId is required.",
      "Set roleProfileId for agent role governance.",
      compileErrors,
    );
    this.requireNodeField(
      inputSchemaRef,
      ProcessCompilerIssueCode.INPUT_SCHEMA_REF_REQUIRED,
      `${baseLocation}/inputSchemaRef`,
      "inputSchemaRef is required.",
      "Declare input schema reference for contract validation.",
      compileErrors,
    );
    this.requireNodeField(
      outputSchemaRef,
      ProcessCompilerIssueCode.OUTPUT_SCHEMA_REF_REQUIRED,
      `${baseLocation}/outputSchemaRef`,
      "outputSchemaRef is required.",
      "Declare output schema reference for contract validation.",
      compileErrors,
    );
    this.requireNodeField(
      retryPolicyRef,
      ProcessCompilerIssueCode.RETRY_POLICY_REF_REQUIRED,
      `${baseLocation}/retryPolicyRef`,
      "retryPolicyRef is required.",
      "Bind node retry policy to avoid implicit retry behavior.",
      compileErrors,
    );
    this.requireNodeField(
      timeoutPolicyRef,
      ProcessCompilerIssueCode.TIMEOUT_POLICY_REF_REQUIRED,
      `${baseLocation}/timeoutPolicyRef`,
      "timeoutPolicyRef is required.",
      "Bind node timeout policy to avoid hanging stage execution.",
      compileErrors,
    );
    this.requireNodeField(
      budgetPolicyRef,
      ProcessCompilerIssueCode.BUDGET_POLICY_REF_REQUIRED,
      `${baseLocation}/budgetPolicyRef`,
      "budgetPolicyRef is required.",
      "Bind node budget policy for token/time/cost governance.",
      compileErrors,
    );

    const limits = this.compileNodeLimits(node, nodeType, index, compileWarnings, compileErrors);

    return {
      nodeId,
      stageId,
      nodeType,
      routeKey,
      roleProfileId,
      inputSchemaRef,
      outputSchemaRef,
      retryPolicyRef,
      timeoutPolicyRef,
      budgetPolicyRef,
      ...(limits ? { limits } : {}),
    };
  }

  /**
   * Validates and normalizes node loop limits.
   * @param node Raw DSL node.
   * @param nodeType Resolved and validated node type.
   * @param index Node array index.
   * @param compileWarnings Warning collector.
   * @param compileErrors Error collector.
   * @returns Normalized loop limits when applicable.
   */
  private compileNodeLimits(
    node: ProcessDslNode,
    nodeType: ProcessNodeType,
    index: number,
    compileWarnings: ProcessCompilerIssue[],
    compileErrors: ProcessCompilerIssue[],
  ): ProcessIrNodeLimits | undefined {
    const limits = node.limits;
    const baseLocation = `/nodes/${index}/limits`;

    if (nodeType !== ProcessNodeType.LOOP) {
      if (limits !== undefined) {
        compileWarnings.push(
          this.createIssue(
            ProcessCompilerIssueCode.LOOP_LIMITS_IGNORED,
            ProcessCompilerSeverity.WARNING,
            "limits is ignored for non-loop nodes.",
            baseLocation,
            "Remove limits or switch nodeType to loop when guardrails are required.",
          ),
        );
      }

      return undefined;
    }

    const maxCycles = limits?.maxCycles;
    const maxWallTimeSeconds = limits?.maxWallTimeSeconds;

    if (!isPositiveInteger(maxCycles)) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.LOOP_MAX_CYCLES_REQUIRED,
          ProcessCompilerSeverity.ERROR,
          "Loop node requires a positive integer maxCycles.",
          `${baseLocation}/maxCycles`,
          "Set maxCycles to a positive integer to prevent unbounded retry loops.",
        ),
      );
    }

    if (!isPositiveInteger(maxWallTimeSeconds)) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.LOOP_MAX_WALL_TIME_REQUIRED,
          ProcessCompilerSeverity.ERROR,
          "Loop node requires a positive integer maxWallTimeSeconds.",
          `${baseLocation}/maxWallTimeSeconds`,
          "Set maxWallTimeSeconds to bound long-running loop execution.",
        ),
      );
    }

    if (!isPositiveInteger(maxCycles) || !isPositiveInteger(maxWallTimeSeconds)) {
      return undefined;
    }

    return {
      maxCycles,
      maxWallTimeSeconds,
    };
  }

  /**
   * Compiles one DSL edge into normalized IR edge and validates node references.
   * @param edge Raw DSL edge.
   * @param index Edge array index.
   * @param nodeIds Known node IDs for reference validation.
   * @param compileErrors Error collector.
   * @returns Normalized IR edge.
   */
  private compileEdge(
    edge: ProcessDslEdge,
    index: number,
    nodeIds: Set<string>,
    compileErrors: ProcessCompilerIssue[],
  ): ProcessIrEdge {
    const fromNodeId = (edge.fromNodeId ?? "").trim();
    const toNodeId = (edge.toNodeId ?? "").trim();
    const conditionKey = edge.conditionKey?.trim();
    const baseLocation = `/edges/${index}`;

    if (!fromNodeId || !nodeIds.has(fromNodeId)) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.EDGE_FROM_NODE_NOT_FOUND,
          ProcessCompilerSeverity.ERROR,
          `Edge source "${fromNodeId || "<empty>"}" does not match a known nodeId.`,
          `${baseLocation}/fromNodeId`,
          "Ensure edge source references one declared nodeId.",
        ),
      );
    }

    if (!toNodeId || !nodeIds.has(toNodeId)) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.EDGE_TO_NODE_NOT_FOUND,
          ProcessCompilerSeverity.ERROR,
          `Edge target "${toNodeId || "<empty>"}" does not match a known nodeId.`,
          `${baseLocation}/toNodeId`,
          "Ensure edge target references one declared nodeId.",
        ),
      );
    }

    return {
      fromNodeId,
      toNodeId,
      ...(conditionKey ? { conditionKey } : {}),
    };
  }

  /**
   * Resolves and validates one node type for compile compatibility.
   * @param nodeTypeCandidate Raw node type candidate from external DSL payload.
   * @param nodeIndex Node array index.
   * @param compileErrors Error collector.
   * @returns Valid node type used by IR payload.
   */
  private resolveNodeType(
    nodeTypeCandidate: unknown,
    nodeIndex: number,
    compileErrors: ProcessCompilerIssue[],
  ): ProcessNodeType {
    const nodeTypeLocation = `/nodes/${nodeIndex}/nodeType`;
    if (typeof nodeTypeCandidate !== "string" || nodeTypeCandidate.trim().length === 0) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.NODE_TYPE_REQUIRED,
          ProcessCompilerSeverity.ERROR,
          "nodeType is required.",
          nodeTypeLocation,
          "Provide one of sequential/parallel/loop/condition.",
        ),
      );
      return ProcessNodeType.SEQUENTIAL;
    }

    if (!PROCESS_NODE_TYPE_VALUES.has(nodeTypeCandidate)) {
      compileErrors.push(
        this.createIssue(
          ProcessCompilerIssueCode.NODE_TYPE_INVALID,
          ProcessCompilerSeverity.ERROR,
          `Unsupported nodeType "${nodeTypeCandidate}".`,
          nodeTypeLocation,
          `Use one of: ${Array.from(PROCESS_NODE_TYPE_VALUES).join(", ")}.`,
        ),
      );
      return ProcessNodeType.SEQUENTIAL;
    }

    return nodeTypeCandidate as ProcessNodeType;
  }

  /**
   * Converts in-memory IR payload to snake_case snapshot contract for disk persistence.
   * @param compiledIr In-memory camelCase IR payload.
   * @returns Snapshot payload aligned with tool-level technical contract.
   */
  private toCompiledIrSnapshot(compiledIr: ProcessCompiledIr): ProcessCompiledIrSnapshot {
    return {
      ir_version: compiledIr.irVersion,
      process_id: compiledIr.processId,
      execution_id: compiledIr.executionId,
      compiled_at: compiledIr.compiledAt,
      entry_node_id: compiledIr.entryNodeId,
      nodes: compiledIr.nodes.map((node) => this.toProcessIrNodeSnapshot(node)),
      edges: compiledIr.edges.map((edge) => this.toProcessIrEdgeSnapshot(edge)),
      globals: compiledIr.globals,
      compile_warnings: compiledIr.compileWarnings.map((issue) =>
        this.toProcessCompilerIssueSnapshot(issue),
      ),
      compile_errors: compiledIr.compileErrors.map((issue) =>
        this.toProcessCompilerIssueSnapshot(issue),
      ),
    };
  }

  /**
   * Converts one in-memory node payload to snapshot node contract.
   * @param node In-memory IR node.
   * @returns Snake_case snapshot node.
   */
  private toProcessIrNodeSnapshot(node: ProcessIrNode): ProcessIrNodeSnapshot {
    return {
      node_id: node.nodeId,
      stage_id: node.stageId,
      node_type: node.nodeType,
      route_key: node.routeKey,
      role_profile_id: node.roleProfileId,
      input_schema_ref: node.inputSchemaRef,
      output_schema_ref: node.outputSchemaRef,
      retry_policy_ref: node.retryPolicyRef,
      timeout_policy_ref: node.timeoutPolicyRef,
      budget_policy_ref: node.budgetPolicyRef,
      ...(node.limits ? { limits: this.toProcessIrNodeLimitsSnapshot(node.limits) } : {}),
    };
  }

  /**
   * Converts one in-memory edge payload to snapshot edge contract.
   * @param edge In-memory IR edge.
   * @returns Snake_case snapshot edge.
   */
  private toProcessIrEdgeSnapshot(edge: ProcessIrEdge): ProcessIrEdgeSnapshot {
    return {
      from_node_id: edge.fromNodeId,
      to_node_id: edge.toNodeId,
      ...(edge.conditionKey ? { condition_key: edge.conditionKey } : {}),
    };
  }

  /**
   * Converts one in-memory loop-limits payload to snapshot limits contract.
   * @param limits In-memory loop limits.
   * @returns Snake_case snapshot loop limits.
   */
  private toProcessIrNodeLimitsSnapshot(limits: ProcessIrNodeLimits): ProcessIrNodeLimitsSnapshot {
    return {
      max_cycles: limits.maxCycles,
      max_wall_time_seconds: limits.maxWallTimeSeconds,
    };
  }

  /**
   * Converts one in-memory compiler issue to snapshot issue contract.
   * @param issue In-memory compiler issue.
   * @returns Snake_case snapshot compiler issue.
   */
  private toProcessCompilerIssueSnapshot(
    issue: ProcessCompilerIssue,
  ): ProcessCompilerIssueSnapshot {
    return {
      error_code: issue.errorCode,
      severity: issue.severity,
      message: issue.message,
      location: issue.location,
      suggestion: issue.suggestion,
    };
  }

  /**
   * Records missing required node fields into compile error collector.
   * @param value Trimmed field value.
   * @param errorCode Stable issue code.
   * @param location Json-pointer-like issue location.
   * @param message Human-readable issue summary.
   * @param suggestion Suggested fix guidance.
   * @param compileErrors Error collector.
   * @returns Nothing.
   */
  private requireNodeField(
    value: string,
    errorCode: ProcessCompilerIssueCode,
    location: string,
    message: string,
    suggestion: string,
    compileErrors: ProcessCompilerIssue[],
  ): void {
    if (value) {
      return;
    }

    compileErrors.push(
      this.createIssue(errorCode, ProcessCompilerSeverity.ERROR, message, location, suggestion),
    );
  }

  /**
   * Creates one standardized compiler issue payload.
   * @param errorCode Stable issue code.
   * @param severity Issue severity.
   * @param message Human-readable issue summary.
   * @param location Json-pointer-like issue location.
   * @param suggestion Suggested fix guidance.
   * @returns Standardized compiler issue.
   */
  private createIssue(
    errorCode: ProcessCompilerIssueCode,
    severity: ProcessCompilerSeverity,
    message: string,
    location: string,
    suggestion: string,
  ): ProcessCompilerIssue {
    return {
      errorCode,
      severity,
      message,
      location,
      suggestion,
    };
  }

  /**
   * Parses semantic major version from string.
   * @param irVersion Raw IR version string.
   * @returns Parsed major version; returns `-1` when parsing fails.
   */
  private parseMajorVersion(irVersion: string): number {
    const majorSegment = irVersion.split(".", 1)[0];
    if (!majorSegment) {
      return -1;
    }

    const parsedMajorVersion = Number.parseInt(majorSegment, 10);
    if (Number.isNaN(parsedMajorVersion)) {
      return -1;
    }

    return parsedMajorVersion;
  }
}

/**
 * Checks whether value is a positive integer.
 * @param value Candidate value.
 * @returns True when value is integer greater than zero.
 */
function isPositiveInteger(value: unknown): value is number {
  return Number.isInteger(value) && Number(value) > 0;
}

/**
 * Formats Date to RFC3339 seconds precision.
 * @param value Date object to format.
 * @returns RFC3339 timestamp without milliseconds.
 */
function formatRfc3339Seconds(value: Date): string {
  return value.toISOString().replace(/\.\d{3}Z$/u, "Z");
}
