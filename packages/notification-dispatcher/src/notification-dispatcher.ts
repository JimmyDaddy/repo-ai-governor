import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import {
  DEFAULT_NOTIFICATION_POLICY_MATRIX,
  DEFAULT_NOTIFICATION_PRIMARY_MAX_ATTEMPTS,
  NOTIFICATION_CHANNEL_VALUES,
  NOTIFICATION_RISK_LEVEL_VALUES,
  NOTIFICATION_TRIGGER_OUTCOME_VALUES,
  type NotificationChannel,
  NotificationDispatchStatus,
  NotificationRiskLevel,
} from "./constants/index.js";
import type {
  NotificationChannelAttempt,
  NotificationChannelPolicy,
  NotificationDispatchRequest,
  NotificationDispatchResult,
  NotificationDispatcherOptions,
  NotificationMessage,
  NotificationPayload,
  NotificationProvider,
  NotificationRiskLevelPolicyMatrix,
} from "./types/index.js";

interface ResolvedNotificationDispatcherOptions {
  providerByChannel: Map<NotificationChannel, NotificationProvider>;
  primaryMaxAttempts: number;
  policyMatrix: NotificationRiskLevelPolicyMatrix;
}

interface NormalizedDispatchRequest {
  policyEvaluation: NotificationDispatchRequest["policyEvaluation"];
  policy: NotificationChannelPolicy;
  message?: NotificationMessage;
  deadlineAt?: string;
}

/**
 * Routes HITL notification payloads with primary/fallback/escalation strategy.
 *
 * Why this exists:
 * policy/HITL decisions must fan out through one deterministic dispatcher so
 * runtime and adapters do not reimplement channel fallback behavior.
 */
export class NotificationDispatcher {
  private readonly resolvedOptions: ResolvedNotificationDispatcherOptions;

  public constructor(options: NotificationDispatcherOptions = {}) {
    this.resolvedOptions = this.resolveOptions(options);
  }

  /**
   * Dispatches notification when policy result requires HITL intervention.
   * @param request Policy evaluation plus optional message/policy override payload.
   * @returns Structured dispatch result with channel attempts and audit fields.
   */
  public async dispatch(request: NotificationDispatchRequest): Promise<NotificationDispatchResult> {
    const normalizedRequest = this.normalizeDispatchRequest(request);
    const shouldNotify = this.shouldDispatch(normalizedRequest.policyEvaluation.policyOutcome);

    if (!shouldNotify) {
      return this.createSkippedResult();
    }

    const payload = this.createNotificationPayload(normalizedRequest);
    const message = normalizedRequest.message ?? this.createDefaultMessage(payload);
    const attemptedChannels: NotificationChannelAttempt[] = [];

    const primaryDelivery = await this.sendByChannel(
      normalizedRequest.policy.primaryChannel,
      this.resolvedOptions.primaryMaxAttempts,
      message,
      payload,
      attemptedChannels,
    );
    if (primaryDelivery) {
      return this.createDispatchedResult(
        NotificationDispatchStatus.DELIVERED_PRIMARY,
        normalizedRequest.policy.primaryChannel,
        attemptedChannels,
        payload,
        message,
      );
    }

    for (const fallbackChannel of normalizedRequest.policy.fallbackChannels) {
      const fallbackDelivery = await this.sendByChannel(
        fallbackChannel,
        1,
        message,
        payload,
        attemptedChannels,
      );
      if (fallbackDelivery) {
        return this.createDispatchedResult(
          NotificationDispatchStatus.DELIVERED_FALLBACK,
          fallbackChannel,
          attemptedChannels,
          payload,
          message,
        );
      }
    }

    const escalationDelivery = await this.sendByChannel(
      normalizedRequest.policy.escalationChannel,
      1,
      message,
      payload,
      attemptedChannels,
    );
    if (escalationDelivery) {
      return this.createDispatchedResult(
        NotificationDispatchStatus.ESCALATED,
        normalizedRequest.policy.escalationChannel,
        attemptedChannels,
        payload,
        message,
      );
    }

    throw new RuntimeError(
      GovernorErrorCode.NOTIFICATION_DISPATCH_FAILED,
      "Notification dispatch exhausted primary/fallback/escalation channels.",
      {
        executionId: payload.executionId,
        stageId: payload.stageId,
        policyOutcome: payload.policyOutcome,
        attemptedChannels,
      },
    );
  }

  /**
   * Resolves options with deterministic defaults and validation.
   * @param options Dispatcher options.
   * @returns Normalized options.
   */
  private resolveOptions(
    options: NotificationDispatcherOptions,
  ): ResolvedNotificationDispatcherOptions {
    const primaryMaxAttempts =
      options.primaryMaxAttempts ?? DEFAULT_NOTIFICATION_PRIMARY_MAX_ATTEMPTS;
    if (!Number.isInteger(primaryMaxAttempts) || primaryMaxAttempts < 1) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        'NotificationDispatcher option "primaryMaxAttempts" must be an integer greater than 0.',
        {
          primaryMaxAttempts,
        },
      );
    }

    return {
      providerByChannel: this.normalizeProviders(options.providers ?? []),
      primaryMaxAttempts,
      policyMatrix: this.normalizePolicyMatrix(
        options.policyMatrix ?? DEFAULT_NOTIFICATION_POLICY_MATRIX,
        "policyMatrix",
      ),
    };
  }

  /**
   * Validates and normalizes dispatch request payload.
   * @param request Raw dispatch request.
   * @returns Normalized dispatch request.
   */
  private normalizeDispatchRequest(
    request: NotificationDispatchRequest,
  ): NormalizedDispatchRequest {
    if (!request || typeof request !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        "Notification dispatch request must be a non-null object.",
      );
    }

    const policyEvaluation = request.policyEvaluation;
    if (!policyEvaluation || typeof policyEvaluation !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        "Notification dispatch request requires policyEvaluation object.",
      );
    }

    const riskLevel = this.readRiskLevel(
      policyEvaluation.auditRecord?.riskLevel,
      "policyEvaluation.auditRecord.riskLevel",
    );
    const policy = this.normalizeChannelPolicy(
      request.policyOverride ?? this.resolvedOptions.policyMatrix[riskLevel],
      "policy",
    );

    const message = request.message ? this.normalizeMessage(request.message, "message") : undefined;
    const deadlineAt =
      request.deadlineAt === undefined
        ? undefined
        : this.readRequiredString(request.deadlineAt, "deadlineAt");

    return {
      policyEvaluation,
      policy,
      ...(message ? { message } : {}),
      ...(deadlineAt ? { deadlineAt } : {}),
    };
  }

  /**
   * Normalizes provider definitions into channel lookup map.
   * @param providers Provider list.
   * @returns Channel-to-provider map.
   */
  private normalizeProviders(
    providers: NotificationProvider[],
  ): Map<NotificationChannel, NotificationProvider> {
    if (!Array.isArray(providers)) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        'NotificationDispatcher option "providers" must be an array.',
      );
    }

    const providerByChannel = new Map<NotificationChannel, NotificationProvider>();
    for (let providerIndex = 0; providerIndex < providers.length; providerIndex += 1) {
      const provider = providers[providerIndex];
      if (!provider || typeof provider !== "object") {
        throw new RuntimeError(
          GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
          "Notification provider must be an object.",
          {
            providerIndex,
          },
        );
      }

      this.readRequiredString(provider.providerId, `providers[${providerIndex}].providerId`);
      const normalizedChannel = this.readNotificationChannel(
        provider.channel,
        `providers[${providerIndex}].channel`,
      );
      if (typeof provider.send !== "function") {
        throw new RuntimeError(
          GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
          `Field "providers[${providerIndex}].send" must be a function.`,
        );
      }

      providerByChannel.set(normalizedChannel, provider);
    }

    return providerByChannel;
  }

  /**
   * Validates and normalizes policy matrix payload.
   * @param policyMatrix Raw matrix payload.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized policy matrix.
   */
  private normalizePolicyMatrix(
    policyMatrix: NotificationRiskLevelPolicyMatrix,
    fieldName: string,
  ): NotificationRiskLevelPolicyMatrix {
    const normalizedPolicyMatrix = {} as NotificationRiskLevelPolicyMatrix;

    for (const riskLevel of Object.values(NotificationRiskLevel)) {
      const policy = policyMatrix[riskLevel];
      normalizedPolicyMatrix[riskLevel] = this.normalizeChannelPolicy(
        policy,
        `${fieldName}.${riskLevel}`,
      );
    }

    return normalizedPolicyMatrix;
  }

  /**
   * Validates and normalizes one channel policy.
   * @param policy Raw policy payload.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized channel policy.
   */
  private normalizeChannelPolicy(policy: unknown, fieldName: string): NotificationChannelPolicy {
    if (!policy || typeof policy !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be an object.`,
      );
    }

    const policyRecord = policy as Record<string, unknown>;
    const primaryChannel = this.readNotificationChannel(
      policyRecord.primaryChannel,
      `${fieldName}.primaryChannel`,
    );
    const fallbackChannels = this.normalizeChannelList(
      policyRecord.fallbackChannels,
      `${fieldName}.fallbackChannels`,
    ).filter((channel) => channel !== primaryChannel);
    const escalationChannel = this.readNotificationChannel(
      policyRecord.escalationChannel,
      `${fieldName}.escalationChannel`,
    );

    return {
      primaryChannel,
      fallbackChannels,
      escalationChannel,
    };
  }

  /**
   * Normalizes custom notification message payload.
   * @param message Raw message payload.
   * @param fieldName Field name for diagnostics.
   * @returns Normalized message payload.
   */
  private normalizeMessage(message: unknown, fieldName: string): NotificationMessage {
    if (!message || typeof message !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be an object.`,
      );
    }

    const messageRecord = message as Record<string, unknown>;
    const normalizedTitle = this.readRequiredString(messageRecord.title, `${fieldName}.title`);
    const normalizedBody = this.readRequiredString(messageRecord.body, `${fieldName}.body`);

    if (messageRecord.metadata !== undefined && !this.isRecord(messageRecord.metadata)) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}.metadata" must be an object when provided.`,
      );
    }

    return {
      title: normalizedTitle,
      body: normalizedBody,
      ...(this.isRecord(messageRecord.metadata) ? { metadata: messageRecord.metadata } : {}),
    };
  }

  /**
   * Builds normalized notification payload from policy evaluation.
   * @param request Normalized request payload.
   * @returns Notification payload.
   */
  private createNotificationPayload(request: NormalizedDispatchRequest): NotificationPayload {
    const policyEvaluation = request.policyEvaluation;
    const auditRecord = policyEvaluation.auditRecord;
    const riskLevel = this.readRiskLevel(
      auditRecord.riskLevel,
      "policyEvaluation.auditRecord.riskLevel",
    );

    return {
      executionId: this.readRequiredString(
        auditRecord.executionId,
        "policyEvaluation.auditRecord.executionId",
      ),
      stageId: this.readRequiredString(auditRecord.stageId, "policyEvaluation.auditRecord.stageId"),
      routeKey: this.readRequiredString(
        auditRecord.routeKey,
        "policyEvaluation.auditRecord.routeKey",
      ),
      riskLevel,
      requiredAction: this.readRequiredString(
        auditRecord.requiredAction,
        "policyEvaluation.auditRecord.requiredAction",
      ),
      ...(request.deadlineAt ? { deadlineAt: request.deadlineAt } : {}),
      policyOutcome: this.readRequiredString(
        policyEvaluation.policyOutcome,
        "policyEvaluation.policyOutcome",
      ),
      reason: this.readRequiredString(policyEvaluation.reason, "policyEvaluation.reason"),
      matchedPolicies: this.normalizeStringList(
        policyEvaluation.matchedPolicies,
        "policyEvaluation.matchedPolicies",
      ),
      requiredReviewerRoles: this.normalizeStringList(
        policyEvaluation.requiredReviewerRoles,
        "policyEvaluation.requiredReviewerRoles",
      ),
    };
  }

  /**
   * Creates default message text when custom message is absent.
   * @param payload Notification payload.
   * @returns Auto-generated message payload.
   */
  private createDefaultMessage(payload: NotificationPayload): NotificationMessage {
    return {
      title: `[HITL] ${payload.policyOutcome.toUpperCase()} required for ${payload.stageId}`,
      body:
        `execution=${payload.executionId}; route=${payload.routeKey}; ` +
        `risk=${payload.riskLevel}; requiredAction=${payload.requiredAction}; reason=${payload.reason}`,
    };
  }

  /**
   * Sends notification through one channel with retry policy.
   * @param channel Target channel.
   * @param maxAttempts Retry attempts.
   * @param message Notification message.
   * @param payload Notification payload.
   * @param attemptedChannels Mutable attempt collector.
   * @returns True when delivery succeeds.
   */
  private async sendByChannel(
    channel: NotificationChannel,
    maxAttempts: number,
    message: NotificationMessage,
    payload: NotificationPayload,
    attemptedChannels: NotificationChannelAttempt[],
  ): Promise<boolean> {
    const provider = this.resolvedOptions.providerByChannel.get(channel);
    if (!provider) {
      attemptedChannels.push({
        channel,
        attempt: 1,
        delivered: false,
        errorMessage: `${GovernorErrorCode.NOTIFICATION_PROVIDER_NOT_FOUND}: No provider registered for channel "${channel}".`,
      });
      return false;
    }

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const receipt = await provider.send({
          channel,
          attempt,
          message,
          payload,
        });
        const delivered = Boolean(receipt?.delivered);
        attemptedChannels.push({
          channel,
          providerId: provider.providerId,
          attempt,
          delivered,
          ...(delivered
            ? {}
            : {
                errorMessage:
                  this.normalizeOptionalString(receipt?.errorMessage) ??
                  "Provider returned delivered=false.",
              }),
        });

        if (delivered) {
          return true;
        }
      } catch (error) {
        attemptedChannels.push({
          channel,
          providerId: provider.providerId,
          attempt,
          delivered: false,
          errorMessage: this.resolveUnknownErrorMessage(error),
        });
      }
    }

    return false;
  }

  /**
   * Builds successful dispatch result payload.
   * @param dispatchStatus Dispatch status.
   * @param selectedChannel Selected channel.
   * @param attemptedChannels Attempt rows.
   * @param payload Notification payload.
   * @param message Notification message.
   * @returns Dispatch result.
   */
  private createDispatchedResult(
    dispatchStatus: NotificationDispatchStatus,
    selectedChannel: NotificationChannel,
    attemptedChannels: NotificationChannelAttempt[],
    payload: NotificationPayload,
    message: NotificationMessage,
  ): NotificationDispatchResult {
    return {
      shouldNotify: true,
      dispatchStatus,
      attemptedChannels,
      selectedChannel,
      payload,
      message,
      auditRecord: {
        notificationChannel: selectedChannel,
        notificationStatus: dispatchStatus,
        notifiedAtDisplay: this.toDisplayTimestamp(new Date()),
      },
    };
  }

  /**
   * Builds skipped dispatch result for non-HITL outcomes.
   * @returns Dispatch result.
   */
  private createSkippedResult(): NotificationDispatchResult {
    return {
      shouldNotify: false,
      dispatchStatus: NotificationDispatchStatus.SKIPPED,
      attemptedChannels: [],
      selectedChannel: null,
      payload: null,
      message: null,
      auditRecord: {
        notificationChannel: null,
        notificationStatus: NotificationDispatchStatus.SKIPPED,
        notifiedAtDisplay: null,
      },
    };
  }

  /**
   * Determines whether one policy outcome should trigger notifications.
   * @param policyOutcome Policy outcome value.
   * @returns True when outcome belongs to notification-trigger set.
   */
  private shouldDispatch(policyOutcome: unknown): boolean {
    return NOTIFICATION_TRIGGER_OUTCOME_VALUES.has(String(policyOutcome ?? "").trim());
  }

  /**
   * Normalizes string-array payloads with deduplication.
   * @param values Raw values.
   * @param fieldName Field name for diagnostics.
   * @returns Deduplicated list.
   */
  private normalizeStringList(values: unknown, fieldName: string): string[] {
    if (!Array.isArray(values)) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be an array.`,
      );
    }

    const uniqueValues = new Set(
      // Why this exists:
      // notification dispatch should stay resilient when upstream payloads include
      // non-string noise; invalid entries are dropped while canonical fields are
      // still validated by required-string checks and enum guards.
      values
        .filter((value): value is string => typeof value === "string")
        .map((value) => value.trim())
        .filter((value) => value.length > 0),
    );
    return Array.from(uniqueValues.values());
  }

  /**
   * Normalizes one notification channel array.
   * @param values Raw values.
   * @param fieldName Field name for diagnostics.
   * @returns Valid channel list.
   */
  private normalizeChannelList(values: unknown, fieldName: string): NotificationChannel[] {
    if (!Array.isArray(values)) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be an array.`,
      );
    }

    return this.normalizeStringList(values, fieldName).map((value, valueIndex) =>
      this.readNotificationChannel(value, `${fieldName}[${valueIndex}]`),
    );
  }

  /**
   * Validates and normalizes one required string.
   * @param value Raw value.
   * @param fieldName Field name for diagnostics.
   * @returns Trimmed string value.
   */
  private readRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== "string") {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be a string.`,
      );
    }

    const normalizedValue = value.trim();
    if (!normalizedValue) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" cannot be empty.`,
      );
    }

    return normalizedValue;
  }

  /**
   * Validates and normalizes one channel enum value.
   * @param value Raw value.
   * @param fieldName Field name for diagnostics.
   * @returns Notification channel.
   */
  private readNotificationChannel(value: unknown, fieldName: string): NotificationChannel {
    const normalizedValue = this.readRequiredString(value, fieldName);
    if (!NOTIFICATION_CHANNEL_VALUES.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" has unsupported channel value.`,
        {
          value: normalizedValue,
        },
      );
    }

    return normalizedValue as NotificationChannel;
  }

  /**
   * Validates and normalizes one risk-level enum value.
   * @param value Raw value.
   * @param fieldName Field name for diagnostics.
   * @returns Notification risk level.
   */
  private readRiskLevel(value: unknown, fieldName: string): NotificationRiskLevel {
    const normalizedValue = this.readRequiredString(value, fieldName);
    if (!NOTIFICATION_RISK_LEVEL_VALUES.has(normalizedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" has unsupported risk level value.`,
        {
          value: normalizedValue,
        },
      );
    }

    return normalizedValue as NotificationRiskLevel;
  }

  /**
   * Formats one timestamp into human-readable UTC offset output.
   * @param date Date object.
   * @returns Display-formatted timestamp.
   */
  private toDisplayTimestamp(date: Date): string {
    const pad = (value: number): string => String(value).padStart(2, "0");
    const offsetMinutes = -date.getTimezoneOffset();
    const offsetSign = offsetMinutes >= 0 ? "+" : "-";
    const offsetHour = Math.floor(Math.abs(offsetMinutes) / 60);
    const offsetMinute = Math.abs(offsetMinutes) % 60;

    return (
      `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ` +
      `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())} ` +
      `UTC${offsetSign}${pad(offsetHour)}:${pad(offsetMinute)}`
    );
  }

  /**
   * Resolves unknown errors into user-facing text without leaking throwables.
   * @param error Unknown thrown value.
   * @returns Best-effort message string.
   */
  private resolveUnknownErrorMessage(error: unknown): string {
    if (this.isRecord(error) && typeof error.message === "string") {
      return error.message;
    }

    return String(error);
  }

  /**
   * Reads optional string values from unknown payloads.
   * @param value Raw value.
   * @returns Trimmed string when provided and non-empty.
   */
  private normalizeOptionalString(value: unknown): string | undefined {
    if (typeof value !== "string") {
      return undefined;
    }

    const normalizedValue = value.trim();
    return normalizedValue || undefined;
  }

  /**
   * Checks whether one value is a plain record object.
   * @param value Raw value.
   * @returns True when value is a non-array object.
   */
  private isRecord(value: unknown): value is Record<string, unknown> {
    return Boolean(value) && typeof value === "object" && !Array.isArray(value);
  }
}
