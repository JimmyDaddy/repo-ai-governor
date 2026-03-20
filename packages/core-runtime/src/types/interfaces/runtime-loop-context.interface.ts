/**
 * Describes runtime loop decision context.
 */
export interface RuntimeLoopContext {
  processId: string;
  executionId: string;
  nodeId: string;
  stageId: string;
  cycle: number;
  maxCycles: number;
  maxWallTimeSeconds: number;
  elapsedLoopMs: number;
  stageOutput: Record<string, unknown>;
}
