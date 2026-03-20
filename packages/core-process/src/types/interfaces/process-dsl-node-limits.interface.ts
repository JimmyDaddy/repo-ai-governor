/**
 * Defines Loop node guardrails declared by process DSL.
 */
export interface ProcessDslNodeLimits {
  maxCycles?: number;
  maxWallTimeSeconds?: number;
}
