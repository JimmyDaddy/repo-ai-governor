/**
 * Defines snake_case edge payload persisted in IR snapshot.
 */
export interface ProcessIrEdgeSnapshot {
  from_node_id: string;
  to_node_id: string;
  condition_key?: string;
}
