import { WebhookNotificationProvider } from './webhook-notification-provider.js';

export { WebhookNotificationProvider } from './webhook-notification-provider.js';
export type { WebhookNotificationProviderOptions } from './types/index.js';
import type { WebhookNotificationProviderOptions } from './types/index.js';

/**
 * Creates one webhook notification provider through a plain factory surface.
 * @param options Provider options.
 * @returns Webhook notification provider instance.
 */
export async function createNotificationProvider(
  options: WebhookNotificationProviderOptions,
): Promise<WebhookNotificationProvider> {
  return new WebhookNotificationProvider(options);
}
