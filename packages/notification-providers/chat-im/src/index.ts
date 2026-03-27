import { ChatImNotificationProvider } from './chat-im-notification-provider.js';

export { ChatImNotificationProvider } from './chat-im-notification-provider.js';
export type { ChatImNotificationProviderOptions } from './types/index.js';
import type { ChatImNotificationProviderOptions } from './types/index.js';

/**
 * Creates one chat-im notification provider through a plain factory surface.
 * @param options Provider options.
 * @returns Chat-im notification provider instance.
 */
export async function createNotificationProvider(
  options: ChatImNotificationProviderOptions,
): Promise<ChatImNotificationProvider> {
  return new ChatImNotificationProvider(options);
}
