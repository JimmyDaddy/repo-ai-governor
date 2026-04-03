import { isDeepStrictEqual } from 'node:util';

import {
  SESSION_PROVIDER_CONTINUATIONS_CONTEXT_KEY,
  SESSION_PROVIDER_CONTINUATIONS_VERSION,
} from './constants/provider-continuation.constant.js';
import type {
  SessionProviderContinuationHandle,
  SessionProviderContinuationMutation,
  SessionProviderContinuationSessionState,
  SessionProviderContinuationSlot,
} from './types/interfaces/provider-continuation.interface.js';

/**
 * Owns shared-session provider continuation state parsing and slot mutation application.
 *
 * Why this exists:
 * orchestration runtime must keep provider continuation truth inside shared-session context
 * without leaking raw handles into presenters or duplicating mutation logic across callers.
 */
export class ProviderContinuationSessionRuntime {
  /**
   * Reads one persisted provider continuation state payload from session context when present.
   * @param context Shared-session context snapshot.
   * @returns Parsed continuation session state or `undefined` when absent/invalid.
   */
  public readSessionState(
    context: Record<string, unknown> | null | undefined,
  ): SessionProviderContinuationSessionState | undefined {
    if (!context) {
      return undefined;
    }
    const candidate = context[SESSION_PROVIDER_CONTINUATIONS_CONTEXT_KEY];
    if (!candidate || typeof candidate !== 'object' || Array.isArray(candidate)) {
      return undefined;
    }

    const record = candidate as Record<string, unknown>;
    if (record.version !== SESSION_PROVIDER_CONTINUATIONS_VERSION) {
      return undefined;
    }
    const slotsRecord = this.readRecord(record.slots);
    if (!slotsRecord) {
      return undefined;
    }

    const slots: Record<string, SessionProviderContinuationSlot> = {};
    for (const [laneKey, slotCandidate] of Object.entries(slotsRecord)) {
      const parsedSlot = this.parseSlot(laneKey, slotCandidate);
      if (parsedSlot) {
        slots[laneKey] = parsedSlot;
      }
    }

    return {
      version: SESSION_PROVIDER_CONTINUATIONS_VERSION,
      slots,
    };
  }

  /**
   * Applies turn-owned continuation slot mutations and produces one context patch payload.
   * @param context Current shared-session context snapshot.
   * @param mutations Turn-owned continuation mutations.
   * @returns Context patch for `updateContext()`, or `null` when nothing changed.
   */
  public createContextPatch(
    context: Record<string, unknown>,
    mutations: readonly SessionProviderContinuationMutation[] | undefined,
  ): Record<string, unknown> | null {
    if (!mutations || mutations.length === 0) {
      return null;
    }

    const currentState = this.readSessionState(context) ?? {
      version: SESSION_PROVIDER_CONTINUATIONS_VERSION,
      slots: {},
    };
    const nextSlots: Record<string, SessionProviderContinuationSlot> = {};
    for (const [laneKey, slot] of Object.entries(currentState.slots)) {
      nextSlots[laneKey] = this.cloneSlot(slot);
    }

    for (const mutation of mutations) {
      if (mutation.slot) {
        nextSlots[mutation.laneKey] = this.cloneSlot(mutation.slot);
        continue;
      }
      delete nextSlots[mutation.laneKey];
    }

    if (isDeepStrictEqual(nextSlots, currentState.slots)) {
      return null;
    }

    return {
      [SESSION_PROVIDER_CONTINUATIONS_CONTEXT_KEY]: {
        version: SESSION_PROVIDER_CONTINUATIONS_VERSION,
        slots: nextSlots,
      },
    };
  }

  private parseSlot(
    laneKey: string,
    candidate: unknown,
  ): SessionProviderContinuationSlot | undefined {
    const record = this.readRecord(candidate);
    if (!record) {
      return undefined;
    }
    const handle = this.parseHandle(record.handle);
    const routeId = this.readString(record.routeId);
    const stageId = this.readString(record.stageId);
    const selectedSurface = this.readString(record.selectedSurface);
    const providerId = this.readString(record.providerId);
    const transportKind = this.readString(record.transportKind);
    const policyEnvelope = this.readString(record.policyEnvelope);
    const workspaceRoot = this.readString(record.workspaceRoot);
    const currentWorkingDirectory = this.readString(record.currentWorkingDirectory);
    const updatedAt = this.readString(record.updatedAt);
    if (
      !handle ||
      !routeId ||
      !stageId ||
      !selectedSurface ||
      !providerId ||
      !transportKind ||
      !policyEnvelope ||
      !workspaceRoot ||
      !currentWorkingDirectory ||
      !updatedAt
    ) {
      return undefined;
    }

    return {
      laneKey,
      routeId,
      stageId,
      roleId: this.readNullableString(record.roleId),
      selectedSurface,
      providerId,
      transportKind,
      model: this.readNullableString(record.model),
      policyEnvelope,
      workspaceRoot,
      currentWorkingDirectory,
      handle,
      updatedAt,
    };
  }

  private parseHandle(candidate: unknown): SessionProviderContinuationHandle | undefined {
    const record = this.readRecord(candidate);
    if (!record) {
      return undefined;
    }
    const providerId = this.readString(record.providerId);
    const surface = this.readString(record.surface);
    const transportKind = this.readString(record.transportKind);
    const handleKind = this.readString(record.handleKind);
    const value = this.readString(record.value);
    const acquiredAt = this.readString(record.acquiredAt);
    if (!providerId || !surface || !transportKind || !handleKind || !value || !acquiredAt) {
      return undefined;
    }

    const metadata = this.readRecord(record.metadata);
    return {
      providerId,
      surface,
      transportKind,
      handleKind,
      value,
      model: this.readNullableString(record.model),
      acquiredAt,
      ...(metadata ? { metadata: { ...metadata } } : {}),
    };
  }

  private cloneSlot(slot: SessionProviderContinuationSlot): SessionProviderContinuationSlot {
    return {
      ...slot,
      handle: this.cloneHandle(slot.handle),
    };
  }

  private cloneHandle(
    handle: SessionProviderContinuationHandle,
  ): SessionProviderContinuationHandle {
    return {
      ...handle,
      ...(handle.metadata ? { metadata: { ...handle.metadata } } : {}),
    };
  }

  private readRecord(value: unknown): Record<string, unknown> | undefined {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return undefined;
    }
    return value as Record<string, unknown>;
  }

  private readString(value: unknown): string | undefined {
    return typeof value === 'string' && value.trim().length > 0 ? value : undefined;
  }

  private readNullableString(value: unknown): string | null {
    return typeof value === 'string' && value.trim().length > 0 ? value : null;
  }
}
