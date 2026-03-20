/**
 * Describes one directed edge between process nodes.
 */
export interface ProcessDslEdge {
  fromNodeId: string;
  toNodeId: string;
  conditionKey?: string;
}
