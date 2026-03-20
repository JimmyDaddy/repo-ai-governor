import type { NotificationRiskLevelPolicyMatrix } from "../types/aliases/index.js";

/**
 * Defines supported notification channels for HITL dispatch.
 */
export enum NotificationChannel {
  EMAIL = "email",
  WEBHOOK = "webhook",
  CHAT_IM = "chat_im",
  ISSUE_SYSTEM = "issue_system",
}

/**
 * Defines normalized risk levels consumed by notification policy routing.
 *
 * Why this exists:
 * dependency-boundary rules keep this package decoupled from `core-change-risk`,
 * so these values intentionally mirror `ChangeRiskLevel` and must stay synchronized.
 */
export enum NotificationRiskLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Defines notification dispatch status values written into audit payloads.
 */
export enum NotificationDispatchStatus {
  SKIPPED = "skipped",
  DELIVERED_PRIMARY = "delivered_primary",
  DELIVERED_FALLBACK = "delivered_fallback",
  ESCALATED = "escalated",
  FAILED = "failed",
}

/**
 * Defines default primary-attempt count before fallback routing.
 */
export const DEFAULT_NOTIFICATION_PRIMARY_MAX_ATTEMPTS = 2;

/**
 * Defines baseline channel policy by risk level.
 */
export const DEFAULT_NOTIFICATION_POLICY_MATRIX: NotificationRiskLevelPolicyMatrix = {
  [NotificationRiskLevel.LOW]: {
    primaryChannel: NotificationChannel.WEBHOOK,
    fallbackChannels: [NotificationChannel.CHAT_IM],
    escalationChannel: NotificationChannel.ISSUE_SYSTEM,
  },
  [NotificationRiskLevel.MEDIUM]: {
    primaryChannel: NotificationChannel.CHAT_IM,
    fallbackChannels: [NotificationChannel.WEBHOOK, NotificationChannel.EMAIL],
    escalationChannel: NotificationChannel.ISSUE_SYSTEM,
  },
  [NotificationRiskLevel.HIGH]: {
    primaryChannel: NotificationChannel.CHAT_IM,
    fallbackChannels: [NotificationChannel.EMAIL, NotificationChannel.WEBHOOK],
    escalationChannel: NotificationChannel.ISSUE_SYSTEM,
  },
  [NotificationRiskLevel.CRITICAL]: {
    primaryChannel: NotificationChannel.ISSUE_SYSTEM,
    fallbackChannels: [NotificationChannel.CHAT_IM, NotificationChannel.EMAIL],
    escalationChannel: NotificationChannel.ISSUE_SYSTEM,
  },
};

/**
 * Defines policy outcomes that require HITL notification dispatch.
 */
export const NOTIFICATION_TRIGGER_OUTCOME_VALUES = new Set<string>(["confirm", "escalate"]);

/**
 * Defines supported enum value sets for runtime validation.
 */
export const NOTIFICATION_CHANNEL_VALUES = new Set<string>(Object.values(NotificationChannel));
export const NOTIFICATION_RISK_LEVEL_VALUES = new Set<string>(Object.values(NotificationRiskLevel));
