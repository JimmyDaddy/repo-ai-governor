import type { PolicyGateOutcome } from '@repo-ai-governor/core-policy';
import type {
  NotificationChannel,
  NotificationDispatchStatus,
  NotificationRiskLevel,
} from '../../constants/index.js';
import type { NotificationChannelPolicy } from '../interfaces/index.js';

/**
 * Defines policy outcome value space consumed by notification dispatcher.
 */
export type NotificationPolicyOutcome = PolicyGateOutcome;

/**
 * Defines channel identifiers used by provider registry.
 */
export type NotificationChannelKey = NotificationChannel;

/**
 * Defines normalized notification dispatch status value space.
 */
export type NotificationDispatchState = NotificationDispatchStatus;

/**
 * Defines risk-level identifiers used by policy matrix.
 */
export type NotificationRiskLevelKey = NotificationRiskLevel;

/**
 * Defines channel-policy mapping keyed by normalized risk level.
 */
export type NotificationRiskLevelPolicyMatrix = Record<
  NotificationRiskLevel,
  NotificationChannelPolicy
>;
