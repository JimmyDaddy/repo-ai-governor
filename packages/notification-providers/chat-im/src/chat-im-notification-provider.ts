import { setTimeout as delay } from 'node:timers/promises';

import {
  NotificationChannel,
  type NotificationProvider,
  type NotificationProviderReceipt,
  type NotificationProviderRequest,
} from '@repo-ai-governor/notification-dispatcher';
import { GovernorErrorCode, RuntimeError, standardizeError } from '@repo-ai-governor/shared';
import {
  CHAT_IM_NOTIFICATION_DEFAULT_BACKOFF_BASE_MS,
  CHAT_IM_NOTIFICATION_DEFAULT_PROVIDER_ID,
  CHAT_IM_NOTIFICATION_DEFAULT_TIMEOUT_MS,
  CHAT_IM_NOTIFICATION_MAX_RESPONSE_SNIPPET_LENGTH,
} from './constants/index.js';
import type { ChatImNotificationProviderOptions } from './types/index.js';

interface ResolvedChatImNotificationProviderOptions {
  providerId: string;
  endpointUrl: string;
  authToken: string | null;
  headers: Record<string, string>;
  timeoutMs: number;
  backoffBaseMs: number;
}

/**
 * Sends HITL notification payloads to one generic chat-im incoming webhook endpoint.
 */
export class ChatImNotificationProvider implements NotificationProvider {
  public readonly providerId: string;
  public readonly channel = NotificationChannel.CHAT_IM;
  private readonly resolvedOptions: ResolvedChatImNotificationProviderOptions;

  public constructor(options: ChatImNotificationProviderOptions) {
    this.resolvedOptions = this.resolveOptions(options);
    this.providerId = this.resolvedOptions.providerId;
  }

  /**
   * Sends one notification request to the configured chat-im endpoint.
   * @param request Structured provider request.
   * @returns Normalized provider receipt.
   */
  public async send(request: NotificationProviderRequest): Promise<NotificationProviderReceipt> {
    this.validateRequest(request);
    await this.waitForRetryBackoff(request.attempt);

    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.resolvedOptions.timeoutMs);

    try {
      const response = await fetch(this.resolvedOptions.endpointUrl, {
        method: 'POST',
        headers: this.createRequestHeaders(),
        body: JSON.stringify(this.createRequestBody(request)),
        signal: controller.signal,
      });
      const responseBodyText = await response.text();
      return this.createReceipt(response, responseBodyText);
    } catch (error) {
      const standardizedError = standardizeError(error);
      return {
        delivered: false,
        errorMessage: standardizedError.message,
        metadata: {
          code: standardizedError.code,
        },
      };
    } finally {
      clearTimeout(timeoutHandle);
    }
  }

  /**
   * Validates constructor options and fills deterministic defaults.
   * @param options Provider options.
   * @returns Normalized provider options.
   */
  private resolveOptions(
    options: ChatImNotificationProviderOptions,
  ): ResolvedChatImNotificationProviderOptions {
    if (!options || typeof options !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        'ChatImNotificationProvider requires one non-null options object.',
      );
    }

    const providerId = this.readRequiredString(
      options.providerId ?? CHAT_IM_NOTIFICATION_DEFAULT_PROVIDER_ID,
      'providerId',
    );
    const endpointUrl = this.readUrl(options.endpointUrl, 'endpointUrl');
    const authToken =
      options.authToken === undefined
        ? null
        : this.readRequiredString(options.authToken, 'authToken');
    const headers = this.normalizeHeaders(options.headers);
    const timeoutMs = this.readPositiveInteger(
      options.timeoutMs ?? CHAT_IM_NOTIFICATION_DEFAULT_TIMEOUT_MS,
      'timeoutMs',
    );
    const backoffBaseMs = this.readNonNegativeInteger(
      options.backoffBaseMs ?? CHAT_IM_NOTIFICATION_DEFAULT_BACKOFF_BASE_MS,
      'backoffBaseMs',
    );

    return {
      providerId,
      endpointUrl,
      authToken,
      headers,
      timeoutMs,
      backoffBaseMs,
    };
  }

  /**
   * Validates request channel and attempt semantics.
   * @param request Provider request.
   * @returns Void.
   */
  private validateRequest(request: NotificationProviderRequest): void {
    if (!request || typeof request !== 'object') {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        'Chat-im notification request must be a non-null object.',
      );
    }

    if (request.channel !== this.channel) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Chat-im provider only supports channel "${this.channel}".`,
        {
          channel: request.channel,
        },
      );
    }

    if (!Number.isInteger(request.attempt) || request.attempt < 1) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        'Field "attempt" must be an integer greater than 0.',
        {
          attempt: request.attempt,
        },
      );
    }
  }

  /**
   * Applies exponential backoff before retry attempts.
   * @param attempt Current dispatcher attempt.
   * @returns Void.
   */
  private async waitForRetryBackoff(attempt: number): Promise<void> {
    if (attempt <= 1 || this.resolvedOptions.backoffBaseMs === 0) {
      return;
    }

    const backoffMs = this.resolvedOptions.backoffBaseMs * 2 ** (attempt - 2);
    await delay(backoffMs);
  }

  /**
   * Builds request headers including JSON content type and optional auth token.
   * @returns HTTP headers payload.
   */
  private createRequestHeaders(): Record<string, string> {
    return {
      'content-type': 'application/json',
      ...(this.resolvedOptions.authToken
        ? {
            authorization: `Bearer ${this.resolvedOptions.authToken}`,
          }
        : {}),
      ...this.resolvedOptions.headers,
    };
  }

  /**
   * Builds deterministic JSON payload sent to the chat-im endpoint.
   * @param request Provider request.
   * @returns Serializable request body.
   */
  private createRequestBody(request: NotificationProviderRequest): Record<string, unknown> {
    return {
      providerId: this.providerId,
      channel: request.channel,
      attempt: request.attempt,
      text: `${request.message.title}\n${request.message.body}`,
      title: request.message.title,
      body: request.message.body,
      metadata: request.message.metadata ?? null,
      payload: request.payload,
    };
  }

  /**
   * Converts one HTTP response into the shared provider receipt contract.
   * @param response Fetch response.
   * @param responseBodyText Raw response text.
   * @returns Normalized provider receipt.
   */
  private createReceipt(response: Response, responseBodyText: string): NotificationProviderReceipt {
    const responseBodySnippet = responseBodyText.slice(
      0,
      CHAT_IM_NOTIFICATION_MAX_RESPONSE_SNIPPET_LENGTH,
    );
    const providerMessageId = this.resolveProviderMessageId(response, responseBodyText);

    if (!response.ok) {
      return {
        delivered: false,
        errorMessage: `Chat-im endpoint returned HTTP ${response.status}.`,
        metadata: {
          statusCode: response.status,
          responseBodySnippet,
        },
      };
    }

    return {
      delivered: true,
      ...(providerMessageId
        ? {
            providerMessageId,
          }
        : {}),
      metadata: {
        statusCode: response.status,
        ...(responseBodySnippet.length > 0
          ? {
              responseBodySnippet,
            }
          : {}),
      },
    };
  }

  /**
   * Resolves one provider receipt id from headers or JSON response payload.
   * @param response Fetch response.
   * @param responseBodyText Raw response body text.
   * @returns Provider message id when present.
   */
  private resolveProviderMessageId(
    response: Response,
    responseBodyText: string,
  ): string | undefined {
    const headerMessageId =
      response.headers.get('x-request-id') ?? response.headers.get('x-message-id');
    if (headerMessageId) {
      return headerMessageId;
    }

    if (responseBodyText.trim().length === 0) {
      return undefined;
    }

    try {
      const parsedBody = JSON.parse(responseBodyText) as Record<string, unknown>;
      const messageIdCandidate =
        parsedBody.id ?? parsedBody.messageId ?? parsedBody.notificationId ?? null;
      return typeof messageIdCandidate === 'string' && messageIdCandidate.trim().length > 0
        ? messageIdCandidate.trim()
        : undefined;
    } catch {
      return undefined;
    }
  }

  /**
   * Validates one required string input.
   * @param value Raw value.
   * @param fieldName Field name.
   * @returns Trimmed string.
   */
  private readRequiredString(value: unknown, fieldName: string): string {
    if (typeof value !== 'string') {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be a string.`,
      );
    }

    const normalizedValue = value.trim();
    if (normalizedValue.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" cannot be empty.`,
      );
    }

    return normalizedValue;
  }

  /**
   * Validates one URL-like string.
   * @param value Raw value.
   * @param fieldName Field name.
   * @returns Absolute URL string.
   */
  private readUrl(value: unknown, fieldName: string): string {
    const normalizedValue = this.readRequiredString(value, fieldName);
    try {
      return new URL(normalizedValue).toString();
    } catch {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be a valid absolute URL.`,
        {
          value: normalizedValue,
        },
      );
    }
  }

  /**
   * Validates one positive integer field.
   * @param value Raw value.
   * @param fieldName Field name.
   * @returns Positive integer.
   */
  private readPositiveInteger(value: unknown, fieldName: string): number {
    if (!Number.isInteger(value) || Number(value) < 1) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be an integer greater than 0.`,
        {
          value,
        },
      );
    }

    return Number(value);
  }

  /**
   * Validates one non-negative integer field.
   * @param value Raw value.
   * @param fieldName Field name.
   * @returns Non-negative integer.
   */
  private readNonNegativeInteger(value: unknown, fieldName: string): number {
    if (!Number.isInteger(value) || Number(value) < 0) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" must be a non-negative integer.`,
        {
          value,
        },
      );
    }

    return Number(value);
  }

  /**
   * Normalizes one optional headers object into trimmed string pairs.
   * @param headers Raw headers payload.
   * @returns Normalized headers map.
   */
  private normalizeHeaders(headers: unknown): Record<string, string> {
    if (headers === undefined) {
      return {};
    }

    if (!headers || typeof headers !== 'object' || Array.isArray(headers)) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        'Field "headers" must be a string-record object when provided.',
      );
    }

    const normalizedHeaders: Record<string, string> = {};
    for (const [headerName, headerValue] of Object.entries(headers as Record<string, unknown>)) {
      const normalizedHeaderName = this.readRequiredString(headerName, 'headers.key');
      const normalizedHeaderValue = this.readRequiredString(headerValue, `headers.${headerName}`);
      normalizedHeaders[normalizedHeaderName] = normalizedHeaderValue;
    }
    return normalizedHeaders;
  }
}
