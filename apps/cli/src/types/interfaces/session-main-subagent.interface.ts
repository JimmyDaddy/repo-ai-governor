/**
 * Defines the minimal role-subagent descriptor consumed by the `session.main` supervisor runtime.
 */
export interface SessionMainSubagentDescriptor {
  roleId: string;
  roleProfileId: string;
  agentId: string;
  routeKey: string;
  stageId: string;
  permissionLevel: 'read' | 'edit' | 'test' | 'commit' | 'pr';
  requiredCapabilities: string[];
  primarySurface: string;
  fallbackSurfaces: string[];
  projectionStatus: string | null;
  selectedSurface: string | null;
  selectedBy: string | null;
  dispatchBoundary: 'local_projection' | 'remote_bridge_reserved';
  transportKind: 'local_protocol' | 'a2a_reserved';
}
