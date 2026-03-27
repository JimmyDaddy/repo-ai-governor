import { randomUUID } from 'node:crypto';

import { GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';
import {
  LANGGRAPH_CHECKPOINT_SOURCES,
  LANGGRAPH_REDUCED_STATE_KEYS,
  LANGGRAPH_RUNTIME_INTERRUPT_KINDS,
  type LangGraphReducedStateKey,
} from './constants/index.js';
import type {
  LangGraphCheckpointEnvelope,
  LangGraphCheckpointPendingInterrupt,
  LangGraphCheckpointer,
  LangGraphRecoveredExecution,
  LangGraphSaveCheckpointOptions,
} from './types/index.js';

/**
 * Shares envelope creation and fail-closed validation across checkpoint transports.
 *
 * Why this exists:
 * file-backed and sqlite-fs checkpoint transports must keep exactly the same payload
 * semantics so recovery behavior does not drift when storage medium changes.
 */
export abstract class LangGraphCheckpointerBase implements LangGraphCheckpointer {
  protected constructor(
    private readonly nowProvider: () => Date = () => new Date(),
    private readonly checkpointIdProvider: () => string = () => randomUUID(),
  ) {}

  public abstract save(
    options: LangGraphSaveCheckpointOptions,
  ): Promise<LangGraphCheckpointEnvelope>;

  public abstract read(
    executionId: string,
    executionSessionId: string,
    expectedProcessId: string,
  ): Promise<LangGraphCheckpointEnvelope | undefined>;

  public abstract recover(
    executionId: string,
    executionSessionId: string,
    expectedProcessId: string,
  ): Promise<LangGraphRecoveredExecution | undefined>;

  protected createCheckpointEnvelope(
    options: LangGraphSaveCheckpointOptions,
    checkpointSource: LangGraphCheckpointEnvelope['checkpointSource'],
    checkpointPath: string,
  ): LangGraphCheckpointEnvelope {
    this.assertReducedStateKeysAllowed(options.plan.reducedStateKeys, options.reducedState);
    const timestamp = this.formatRfc3339Seconds(this.nowProvider());

    return {
      checkpointId: this.checkpointIdProvider(),
      checkpointSource,
      processId: options.plan.processId,
      executionId: options.plan.executionId,
      executionSessionId: options.executionSessionId,
      createdAt: timestamp,
      updatedAt: timestamp,
      checkpointPath,
      activeNodeIds: [...options.activeNodeIds],
      visitedNodeIds: [...options.visitedNodeIds],
      reducedState: { ...options.reducedState },
      artifactReferenceIds: [...(options.artifactReferenceIds ?? [])],
      ...(options.taskReferenceId ? { taskReferenceId: options.taskReferenceId } : {}),
      ...(options.pendingInterrupt ? { pendingInterrupt: options.pendingInterrupt } : {}),
    };
  }

  protected createRecoveredExecution(
    checkpointEnvelope: LangGraphCheckpointEnvelope,
  ): LangGraphRecoveredExecution {
    return {
      recovered: true,
      checkpointSource: checkpointEnvelope.checkpointSource,
      checkpointId: checkpointEnvelope.checkpointId,
      checkpointPath: checkpointEnvelope.checkpointPath,
      processId: checkpointEnvelope.processId,
      executionId: checkpointEnvelope.executionId,
      executionSessionId: checkpointEnvelope.executionSessionId,
      nextNodeIds: [...checkpointEnvelope.activeNodeIds],
      visitedNodeIds: [...checkpointEnvelope.visitedNodeIds],
      ...(checkpointEnvelope.pendingInterrupt
        ? { pendingInterrupt: checkpointEnvelope.pendingInterrupt }
        : {}),
      recoveredAt: this.formatRfc3339Seconds(this.nowProvider()),
    };
  }

  protected assertReducedStateKeysAllowed(
    allowedKeys: readonly LangGraphReducedStateKey[],
    reducedState: Partial<Record<LangGraphReducedStateKey, unknown>>,
  ): void {
    const disallowedKeys = Object.keys(reducedState).filter(
      (key) => !allowedKeys.includes(key as LangGraphReducedStateKey),
    );
    if (disallowedKeys.length === 0) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
      'Checkpoint reduced state contains keys that are not allowed by the compiled graph plan.',
      {
        disallowedKeys,
        allowedKeys,
      },
    );
  }

  protected assertCheckpointEnvelope(
    envelope: LangGraphCheckpointEnvelope,
    checkpointPath: string,
    expectedExecutionId: string,
    expectedExecutionSessionId: string,
    expectedProcessId: string,
  ): void {
    if (
      envelope.executionId !== expectedExecutionId ||
      envelope.executionSessionId !== expectedExecutionSessionId
    ) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        'Checkpoint payload does not match the requested execution/session namespace.',
        {
          checkpointPath,
          expectedExecutionId,
          actualExecutionId: envelope.executionId,
          expectedExecutionSessionId,
          actualExecutionSessionId: envelope.executionSessionId,
        },
      );
    }

    if (envelope.processId !== expectedProcessId) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        'Checkpoint payload does not match the requested process id.',
        {
          checkpointPath,
          expectedProcessId,
          actualProcessId: envelope.processId,
        },
      );
    }

    if (!LANGGRAPH_CHECKPOINT_SOURCES.includes(envelope.checkpointSource)) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        'Checkpoint payload uses an unsupported checkpoint source.',
        {
          checkpointPath,
          checkpointSource: envelope.checkpointSource,
        },
      );
    }

    if (envelope.checkpointPath !== checkpointPath) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        'Checkpoint payload path does not match the resolved checkpoint path.',
        {
          checkpointPath,
          payloadCheckpointPath: envelope.checkpointPath,
        },
      );
    }

    this.assertStringArray(envelope.activeNodeIds, 'activeNodeIds', checkpointPath);
    this.assertStringArray(envelope.visitedNodeIds, 'visitedNodeIds', checkpointPath);
    this.assertReducedStateKeysAllowed(LANGGRAPH_REDUCED_STATE_KEYS, envelope.reducedState);
    this.assertPendingInterruptShape(envelope.pendingInterrupt, checkpointPath);
  }

  protected assertStringArray(value: unknown, fieldName: string, checkpointPath: string): void {
    if (
      Array.isArray(value) &&
      value.every((entry) => typeof entry === 'string' && entry.trim().length > 0)
    ) {
      return;
    }

    throw new RuntimeError(
      GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
      `Checkpoint payload field "${fieldName}" must be a string array.`,
      {
        checkpointPath,
        fieldName,
      },
    );
  }

  protected assertPendingInterruptShape(
    value: LangGraphCheckpointPendingInterrupt | undefined,
    checkpointPath: string,
  ): void {
    if (!value) {
      return;
    }

    if (
      typeof value.kind !== 'string' ||
      value.kind.trim().length === 0 ||
      !LANGGRAPH_RUNTIME_INTERRUPT_KINDS.includes(value.kind) ||
      typeof value.recordedAt !== 'string' ||
      value.recordedAt.trim().length === 0
    ) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        'Checkpoint pending interrupt payload is invalid.',
        {
          checkpointPath,
        },
      );
    }

    if (
      value.reason !== undefined &&
      (typeof value.reason !== 'string' || value.reason.length === 0)
    ) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        'Checkpoint pending interrupt reason must be a non-empty string when present.',
        {
          checkpointPath,
        },
      );
    }

    if (
      value.payload !== undefined &&
      (typeof value.payload !== 'object' || value.payload === null)
    ) {
      throw new RuntimeError(
        GovernorErrorCode.PROCESS_RUNTIME_CHECKPOINT_PAYLOAD_INVALID,
        'Checkpoint pending interrupt payload must be an object when present.',
        {
          checkpointPath,
        },
      );
    }
  }

  protected formatRfc3339Seconds(date: Date): string {
    return date.toISOString().replace(/\.\d{3}Z$/u, 'Z');
  }
}
