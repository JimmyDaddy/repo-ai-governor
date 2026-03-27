import { GovernorErrorCode, RuntimeError } from "@repo-ai-governor/shared";
import type { NotificationChannel } from "./constants/index.js";
import type { NotificationProvider } from "./types/index.js";

/**
 * Owns deterministic registration and lookup for notification channel providers.
 *
 * Why this exists:
 * provider implementations now live in independent workspace packages, so runtime
 * assembly needs one reusable registry surface instead of rebuilding maps ad hoc.
 */
export class NotificationProviderRegistry {
  private readonly providerByChannel = new Map<NotificationChannel, NotificationProvider>();

  public constructor(providers: NotificationProvider[] = []) {
    this.registerMany(providers);
  }

  /**
   * Registers one provider for its declared notification channel.
   * @param provider Provider instance.
   * @returns Registry instance for fluent assembly.
   */
  public register(provider: NotificationProvider): NotificationProviderRegistry {
    if (!provider || typeof provider !== "object") {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        "Notification provider registry requires non-null provider instances.",
      );
    }

    const providerId = this.readRequiredString(provider.providerId, "provider.providerId");
    const channel = this.readRequiredString(provider.channel, "provider.channel");
    if (typeof provider.send !== "function") {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Notification provider "${providerId}" must expose one send(request) function.`,
      );
    }

    if (this.providerByChannel.has(channel as NotificationChannel)) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Duplicate notification provider registration for channel "${channel}".`,
        {
          channel,
          providerId,
        },
      );
    }

    this.providerByChannel.set(channel as NotificationChannel, provider);
    return this;
  }

  /**
   * Registers multiple providers in declaration order.
   * @param providers Provider list.
   * @returns Registry instance for fluent assembly.
   */
  public registerMany(providers: NotificationProvider[]): NotificationProviderRegistry {
    for (const provider of providers) {
      this.register(provider);
    }
    return this;
  }

  /**
   * Resolves one provider by notification channel.
   * @param channel Notification channel id.
   * @returns Provider instance when registered; otherwise undefined.
   */
  public resolve(channel: NotificationChannel): NotificationProvider | undefined {
    return this.providerByChannel.get(channel);
  }

  /**
   * Returns providers in deterministic registration order.
   * @returns Ordered provider array.
   */
  public list(): NotificationProvider[] {
    return Array.from(this.providerByChannel.values());
  }

  /**
   * Validates one required string field for registry input.
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
    if (normalizedValue.length === 0) {
      throw new RuntimeError(
        GovernorErrorCode.NOTIFICATION_DISPATCH_INPUT_INVALID,
        `Field "${fieldName}" cannot be empty.`,
      );
    }

    return normalizedValue;
  }
}
