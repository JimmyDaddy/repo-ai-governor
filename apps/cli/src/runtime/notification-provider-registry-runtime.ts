import {
  type NotificationProvider,
  NotificationProviderRegistry,
} from "@repo-ai-governor/notification-dispatcher";
import { ChatImNotificationProvider } from "@repo-ai-governor/notification-provider-chat-im";
import { WebhookNotificationProvider } from "@repo-ai-governor/notification-provider-webhook";
import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import { CliNotificationProviderEnvironmentKey } from "../constants/notification-provider.constant.js";

/**
 * Resolves CLI notification providers from environment-backed configuration.
 */
export class CliNotificationProviderRegistryRuntime {
  /**
   * Resolves all configured notification providers in deterministic channel order.
   * @param environment Process-like environment map.
   * @returns Registered providers ready for dispatcher assembly.
   */
  public resolveProviders(environment: NodeJS.ProcessEnv): NotificationProvider[] {
    const registry = new NotificationProviderRegistry();
    const webhookProvider = this.resolveWebhookProvider(environment);
    if (webhookProvider) {
      registry.register(webhookProvider);
    }

    const chatImProvider = this.resolveChatImProvider(environment);
    if (chatImProvider) {
      registry.register(chatImProvider);
    }

    return registry.list();
  }

  /**
   * Resolves optional webhook provider from environment configuration.
   * @param environment Process-like environment map.
   * @returns Webhook provider when configured; otherwise null.
   */
  private resolveWebhookProvider(environment: NodeJS.ProcessEnv): NotificationProvider | null {
    const endpointUrl = this.readOptionalString(
      environment,
      CliNotificationProviderEnvironmentKey.WEBHOOK_URL,
    );
    if (!endpointUrl) {
      return null;
    }

    return new WebhookNotificationProvider({
      endpointUrl,
      ...(this.readOptionalString(
        environment,
        CliNotificationProviderEnvironmentKey.WEBHOOK_AUTH_TOKEN,
      )
        ? {
            authToken:
              this.readOptionalString(
                environment,
                CliNotificationProviderEnvironmentKey.WEBHOOK_AUTH_TOKEN,
              ) ?? undefined,
          }
        : {}),
      ...(this.readOptionalHeadersJson(
        environment,
        CliNotificationProviderEnvironmentKey.WEBHOOK_HEADERS_JSON,
      )
        ? {
            headers:
              this.readOptionalHeadersJson(
                environment,
                CliNotificationProviderEnvironmentKey.WEBHOOK_HEADERS_JSON,
              ) ?? undefined,
          }
        : {}),
      ...(this.readOptionalPositiveInteger(
        environment,
        CliNotificationProviderEnvironmentKey.WEBHOOK_TIMEOUT_MS,
      ) !== null
        ? {
            timeoutMs:
              this.readOptionalPositiveInteger(
                environment,
                CliNotificationProviderEnvironmentKey.WEBHOOK_TIMEOUT_MS,
              ) ?? undefined,
          }
        : {}),
      ...(this.readOptionalNonNegativeInteger(
        environment,
        CliNotificationProviderEnvironmentKey.WEBHOOK_BACKOFF_BASE_MS,
      ) !== null
        ? {
            backoffBaseMs:
              this.readOptionalNonNegativeInteger(
                environment,
                CliNotificationProviderEnvironmentKey.WEBHOOK_BACKOFF_BASE_MS,
              ) ?? undefined,
          }
        : {}),
    });
  }

  /**
   * Resolves optional chat-im provider from environment configuration.
   * @param environment Process-like environment map.
   * @returns Chat-im provider when configured; otherwise null.
   */
  private resolveChatImProvider(environment: NodeJS.ProcessEnv): NotificationProvider | null {
    const endpointUrl = this.readOptionalString(
      environment,
      CliNotificationProviderEnvironmentKey.CHAT_IM_URL,
    );
    if (!endpointUrl) {
      return null;
    }

    return new ChatImNotificationProvider({
      endpointUrl,
      ...(this.readOptionalString(
        environment,
        CliNotificationProviderEnvironmentKey.CHAT_IM_AUTH_TOKEN,
      )
        ? {
            authToken:
              this.readOptionalString(
                environment,
                CliNotificationProviderEnvironmentKey.CHAT_IM_AUTH_TOKEN,
              ) ?? undefined,
          }
        : {}),
      ...(this.readOptionalHeadersJson(
        environment,
        CliNotificationProviderEnvironmentKey.CHAT_IM_HEADERS_JSON,
      )
        ? {
            headers:
              this.readOptionalHeadersJson(
                environment,
                CliNotificationProviderEnvironmentKey.CHAT_IM_HEADERS_JSON,
              ) ?? undefined,
          }
        : {}),
      ...(this.readOptionalPositiveInteger(
        environment,
        CliNotificationProviderEnvironmentKey.CHAT_IM_TIMEOUT_MS,
      ) !== null
        ? {
            timeoutMs:
              this.readOptionalPositiveInteger(
                environment,
                CliNotificationProviderEnvironmentKey.CHAT_IM_TIMEOUT_MS,
              ) ?? undefined,
          }
        : {}),
      ...(this.readOptionalNonNegativeInteger(
        environment,
        CliNotificationProviderEnvironmentKey.CHAT_IM_BACKOFF_BASE_MS,
      ) !== null
        ? {
            backoffBaseMs:
              this.readOptionalNonNegativeInteger(
                environment,
                CliNotificationProviderEnvironmentKey.CHAT_IM_BACKOFF_BASE_MS,
              ) ?? undefined,
          }
        : {}),
    });
  }

  /**
   * Reads one optional trimmed string environment value.
   * @param environment Process-like environment map.
   * @param environmentKey Environment key.
   * @returns Trimmed value or null when omitted.
   */
  private readOptionalString(
    environment: NodeJS.ProcessEnv,
    environmentKey: CliNotificationProviderEnvironmentKey,
  ): string | null {
    const rawValue = environment[environmentKey];
    if (rawValue === undefined) {
      return null;
    }

    const normalizedValue = rawValue.trim();
    if (normalizedValue.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Environment variable ${environmentKey} must not be empty.`,
        {
          environmentKey,
        },
      );
    }

    return normalizedValue;
  }

  /**
   * Reads one optional positive integer environment value.
   * @param environment Process-like environment map.
   * @param environmentKey Environment key.
   * @returns Parsed integer or null when omitted.
   */
  private readOptionalPositiveInteger(
    environment: NodeJS.ProcessEnv,
    environmentKey: CliNotificationProviderEnvironmentKey,
  ): number | null {
    const rawValue = this.readOptionalString(environment, environmentKey);
    if (!rawValue) {
      return null;
    }

    const numericValue = Number(rawValue);
    if (!Number.isInteger(numericValue) || numericValue < 1) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Environment variable ${environmentKey} must be an integer greater than 0.`,
        {
          environmentKey,
          value: rawValue,
        },
      );
    }

    return numericValue;
  }

  /**
   * Reads one optional non-negative integer environment value.
   * @param environment Process-like environment map.
   * @param environmentKey Environment key.
   * @returns Parsed integer or null when omitted.
   */
  private readOptionalNonNegativeInteger(
    environment: NodeJS.ProcessEnv,
    environmentKey: CliNotificationProviderEnvironmentKey,
  ): number | null {
    const rawValue = this.readOptionalString(environment, environmentKey);
    if (!rawValue) {
      return null;
    }

    const numericValue = Number(rawValue);
    if (!Number.isInteger(numericValue) || numericValue < 0) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Environment variable ${environmentKey} must be a non-negative integer.`,
        {
          environmentKey,
          value: rawValue,
        },
      );
    }

    return numericValue;
  }

  /**
   * Reads one optional JSON object of string headers from environment.
   * @param environment Process-like environment map.
   * @param environmentKey Environment key.
   * @returns Header record or null when omitted.
   */
  private readOptionalHeadersJson(
    environment: NodeJS.ProcessEnv,
    environmentKey: CliNotificationProviderEnvironmentKey,
  ): Record<string, string> | null {
    const rawValue = this.readOptionalString(environment, environmentKey);
    if (!rawValue) {
      return null;
    }

    let parsedValue: unknown;
    try {
      parsedValue = JSON.parse(rawValue);
    } catch {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Environment variable ${environmentKey} must be valid JSON.`,
        {
          environmentKey,
        },
      );
    }

    if (!parsedValue || typeof parsedValue !== "object" || Array.isArray(parsedValue)) {
      throw new RuntimeError(
        GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
        `Environment variable ${environmentKey} must be a JSON object.`,
        {
          environmentKey,
        },
      );
    }

    const normalizedHeaders: Record<string, string> = {};
    for (const [headerName, headerValue] of Object.entries(
      parsedValue as Record<string, unknown>,
    )) {
      const normalizedHeaderName = headerName.trim();
      const normalizedHeaderValue = String(headerValue ?? "").trim();
      if (normalizedHeaderName.length === 0 || normalizedHeaderValue.length === 0) {
        throw new RuntimeError(
          GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
          `Environment variable ${environmentKey} must only contain non-empty string header pairs.`,
          {
            environmentKey,
          },
        );
      }
      normalizedHeaders[normalizedHeaderName] = normalizedHeaderValue;
    }

    return normalizedHeaders;
  }
}
