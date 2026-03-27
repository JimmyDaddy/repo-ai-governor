/**
 * Defines configuration for one chat-im notification provider instance.
 */
export interface ChatImNotificationProviderOptions {
  providerId?: string;
  endpointUrl: string;
  authToken?: string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  backoffBaseMs?: number;
}
