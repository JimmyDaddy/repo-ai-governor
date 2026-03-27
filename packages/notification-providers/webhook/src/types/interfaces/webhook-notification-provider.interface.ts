/**
 * Defines configuration for one webhook-backed notification provider instance.
 */
export interface WebhookNotificationProviderOptions {
  providerId?: string;
  endpointUrl: string;
  authToken?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  backoffBaseMs?: number;
}
