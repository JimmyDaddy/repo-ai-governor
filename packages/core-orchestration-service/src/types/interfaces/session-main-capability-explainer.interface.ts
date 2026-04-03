import type { SessionMainCapabilityAnswerKind, SessionMainCapabilityId } from '../aliases/index.js';

/**
 * Defines one structured follow-up affordance attached to a capability explanation answer.
 */
export interface SessionMainCapabilitySuggestedAction {
  readonly label: string;
  readonly target: string;
  readonly suggestedSlashCommand?: string;
}

/**
 * Defines one structured capability explanation answer produced by the explainer route.
 */
export interface SessionMainCapabilityAnswer {
  readonly answerKind: SessionMainCapabilityAnswerKind;
  readonly referencedCapabilityIds: readonly SessionMainCapabilityId[];
  readonly suggestedActions: readonly SessionMainCapabilitySuggestedAction[];
  readonly assistantMessage: string;
  readonly assistantDelta: string;
  readonly routerDecisionReason: string;
}
