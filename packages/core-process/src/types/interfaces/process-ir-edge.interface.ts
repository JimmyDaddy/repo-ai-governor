/**
 * Describes one normalized edge entry in compiled IR.
 */
export interface ProcessIrEdge {
  fromNodeId: string;
  toNodeId: string;
  conditionKey?: string;
}
