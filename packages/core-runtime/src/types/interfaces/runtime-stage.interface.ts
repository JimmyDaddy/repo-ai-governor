import type { ProcessNodeType } from '@repo-ai-governor/core-process';
import type { GovernorErrorCode } from '@repo-ai-governor/shared';
import type { RoleSource } from '@repo-ai-governor/shared';
import type { RuntimeStageStatus } from '../../constants/runtime.constant.js';

/**
 * Describes stage execution context passed to runtime stage handlers.
 */
export interface RuntimeStageContext {
  processId: string;
  executionId: string;
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType;
  routeKey: string;
  roleProfileId: string;
  roleProfileVersion?: string;
  roleSource?: RoleSource;
  attempt: number;
  elapsedFlowMs: number;
  input: Record<string, unknown>;
}

/**
 * Describes one runtime stage execution result row.
 */
export interface RuntimeStageResult {
  nodeId: string;
  stageId: string;
  nodeType: ProcessNodeType;
  status: RuntimeStageStatus;
  attempt: number;
  startedAt: string;
  endedAt: string;
  durationMs: number;
  output?: Record<string, unknown>;
  errorCode?: GovernorErrorCode;
  errorMessage?: string;
}
