/**
 * Defines snake_case loop limits payload persisted in IR snapshot.
 */
export interface ProcessIrNodeLimitsSnapshot {
  max_cycles: number;
  max_wall_time_seconds: number;
}
