import { ProcessCompiler, ProcessNodeType } from '@repo-ai-governor/core-process';
import { GovernorErrorCode } from '@repo-ai-governor/shared';
import { CompiledIrGraphAdapter } from '../src/index.js';

describe('core-runtime-langgraph compiled IR adapter', () => {
  it('maps compiled IR node and edge semantics into a graph plan', () => {
    const compiler = new ProcessCompiler();
    const adapter = new CompiledIrGraphAdapter(compiler);
    const compiledIr = compiler.compile({
      processId: 'langgraph-adapter-unit',
      executionId: 'exec-langgraph-adapter-unit',
      entryNodeId: 'node-entry',
      nodes: [
        {
          nodeId: 'node-entry',
          stageId: 'stage-entry',
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: 'entry',
          roleProfileId: 'runtime-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
        {
          nodeId: 'node-branch',
          stageId: 'stage-branch',
          nodeType: ProcessNodeType.CONDITION,
          routeKey: 'branch',
          roleProfileId: 'runtime-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
        {
          nodeId: 'node-parallel',
          stageId: 'stage-parallel',
          nodeType: ProcessNodeType.PARALLEL,
          routeKey: 'parallel',
          roleProfileId: 'runtime-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
        {
          nodeId: 'node-loop',
          stageId: 'stage-loop',
          nodeType: ProcessNodeType.LOOP,
          routeKey: 'loop',
          roleProfileId: 'runtime-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
          limits: {
            maxCycles: 3,
            maxWallTimeSeconds: 30,
          },
        },
        {
          nodeId: 'node-tail-a',
          stageId: 'stage-tail-a',
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: 'tail-a',
          roleProfileId: 'runtime-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
        {
          nodeId: 'node-tail-b',
          stageId: 'stage-tail-b',
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: 'tail-b',
          roleProfileId: 'runtime-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
        {
          nodeId: 'node-tail-c',
          stageId: 'stage-tail-c',
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: 'tail-c',
          roleProfileId: 'runtime-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
      ],
      edges: [
        { fromNodeId: 'node-entry', toNodeId: 'node-branch' },
        { fromNodeId: 'node-branch', toNodeId: 'node-parallel', conditionKey: 'approved' },
        { fromNodeId: 'node-branch', toNodeId: 'node-loop', conditionKey: 'revise' },
        { fromNodeId: 'node-parallel', toNodeId: 'node-tail-a' },
        { fromNodeId: 'node-parallel', toNodeId: 'node-tail-b' },
        { fromNodeId: 'node-loop', toNodeId: 'node-loop', conditionKey: 'continue' },
        { fromNodeId: 'node-loop', toNodeId: 'node-tail-c', conditionKey: 'exit' },
      ],
    });

    const plan = adapter.adapt(compiledIr);

    expect(plan.entryNodeId).toBe('node-entry');
    expect(plan.nodes.find((node) => node.nodeId === 'node-entry')?.behavior).toBe('invoke_stage');
    expect(plan.nodes.find((node) => node.nodeId === 'node-branch')?.behavior).toBe('branch');
    expect(plan.nodes.find((node) => node.nodeId === 'node-parallel')?.behavior).toBe('fan_out');
    expect(plan.nodes.find((node) => node.nodeId === 'node-loop')?.behavior).toBe('loop');
    expect(
      plan.edges.find(
        (edge) => edge.fromNodeId === 'node-branch' && edge.toNodeId === 'node-parallel',
      )?.behavior,
    ).toBe('conditional');
    expect(
      plan.edges.find(
        (edge) => edge.fromNodeId === 'node-parallel' && edge.toNodeId === 'node-tail-a',
      )?.behavior,
    ).toBe('parallel');
    expect(
      plan.edges.find((edge) => edge.fromNodeId === 'node-loop' && edge.toNodeId === 'node-loop')
        ?.behavior,
    ).toBe('loop_continue');
    expect(
      plan.edges.find((edge) => edge.fromNodeId === 'node-loop' && edge.toNodeId === 'node-tail-c')
        ?.behavior,
    ).toBe('loop_exit');
    expect(plan.terminalNodeIds).toEqual(['node-tail-a', 'node-tail-b', 'node-tail-c']);
    expect(plan.reducedStateKeys).toContain('execution.cursor');
    expect(plan.checkpointerStateKeys).toContain('execution.session_id');
  });

  it('fails closed when compiled IR still contains blocking compile errors', () => {
    const compiler = new ProcessCompiler();
    const adapter = new CompiledIrGraphAdapter(compiler);
    const compiledIr = compiler.compile({
      processId: 'langgraph-adapter-invalid',
      executionId: 'exec-langgraph-adapter-invalid',
      entryNodeId: 'node-missing',
      nodes: [],
      edges: [],
    });

    expect(() => adapter.adapt(compiledIr)).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.PROCESS_RUNTIME_IR_CONTAINS_COMPILE_ERRORS,
      }),
    );
  });

  it('fails closed when a persisted IR edge targets a missing node', () => {
    const compiler = new ProcessCompiler();
    const adapter = new CompiledIrGraphAdapter(compiler);
    const compiledIr = compiler.compile({
      processId: 'langgraph-adapter-dangling-edge',
      executionId: 'exec-langgraph-adapter-dangling-edge',
      entryNodeId: 'node-entry',
      nodes: [
        {
          nodeId: 'node-entry',
          stageId: 'stage-entry',
          nodeType: ProcessNodeType.SEQUENTIAL,
          routeKey: 'entry',
          roleProfileId: 'runtime-default',
          inputSchemaRef: 'schemas/input.json',
          outputSchemaRef: 'schemas/output.json',
          retryPolicyRef: 'policy/retry-default',
          timeoutPolicyRef: 'policy/timeout-default',
          budgetPolicyRef: 'policy/budget-default',
        },
      ],
      edges: [],
    });

    compiledIr.edges.push({
      fromNodeId: 'node-entry',
      toNodeId: 'node-missing',
    });

    expect(() => adapter.adapt(compiledIr)).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.PROCESS_RUNTIME_NODE_NOT_FOUND,
      }),
    );
  });
});
