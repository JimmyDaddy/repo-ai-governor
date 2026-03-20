import type { PolicyGateEvaluationResult } from "@repo-ai-governor/core-policy";
import type {
  NotificationChannel,
  NotificationDispatchStatus,
  NotificationRiskLevel,
} from "../../constants/index.js";

/**
 * Defines human-readable notification message payload.
 */
export interface NotificationMessage {
  title: string;
  body: string;
  metadata?: Record<string, unknown>;
}

/**
 * Defines minimal HITL notification payload required by technical solution.
 */
export interface NotificationPayload {
  executionId: string;
  stageId: string;
  routeKey: string;
  riskLevel: string;
  requiredAction: string;
  deadlineAt?: string;
  policyOutcome: string;
  reason: string;
  matchedPolicies: string[];
  requiredReviewerRoles: string[];
}

/**
 * Defines per-risk channel routing policy.
 */
export interface NotificationChannelPolicy {
  primaryChannel: NotificationChannel;
  fallbackChannels: NotificationChannel[];
  escalationChannel: NotificationChannel;
}

/**
 * Defines provider-call payload sent by dispatcher.
 */
export interface NotificationProviderRequest {
  channel: NotificationChannel;
  attempt: number;
  message: NotificationMessage;
  payload: NotificationPayload;
}

/**
 * Defines normalized provider send result.
 */
export interface NotificationProviderReceipt {
  delivered: boolean;
  providerMessageId?: string;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Defines channel-provider contract used by notification dispatcher.
 */
export interface NotificationProvider {
  providerId: string;
  channel: NotificationChannel;

  /**
   * Sends one notification request through concrete provider channel.
   * @param request Structured provider request payload.
   * @returns Provider send receipt with delivery result.
   */
  send(request: NotificationProviderRequest): Promise<NotificationProviderReceipt>;
}

/**
 * Defines one channel attempt row for audit/debug replay.
 */
export interface NotificationChannelAttempt {
  channel: NotificationChannel;
  providerId?: string;
  attempt: number;
  delivered: boolean;
  errorMessage?: string;
}

/**
 * Defines notification fields consumed by audit event sinks.
 */
export interface NotificationAuditRecord {
  notificationChannel: NotificationChannel | null;
  notificationStatus: NotificationDispatchStatus;
  notifiedAtDisplay: string | null;
}

/**
 * Defines notification dispatcher runtime options.
 */
export interface NotificationDispatcherOptions {
  providers?: NotificationProvider[];
  primaryMaxAttempts?: number;
  policyMatrix?: Record<NotificationRiskLevel, NotificationChannelPolicy>;
}

/**
 * Defines one notification dispatch request.
 */
export interface NotificationDispatchRequest {
  policyEvaluation: PolicyGateEvaluationResult;
  message?: NotificationMessage;
  deadlineAt?: string;
  policyOverride?: NotificationChannelPolicy;
}

/**
 * Defines one normalized notification dispatch result.
 */
export interface NotificationDispatchResult {
  shouldNotify: boolean;
  dispatchStatus: NotificationDispatchStatus;
  attemptedChannels: NotificationChannelAttempt[];
  selectedChannel: NotificationChannel | null;
  payload: NotificationPayload | null;
  message: NotificationMessage | null;
  auditRecord: NotificationAuditRecord;
}
