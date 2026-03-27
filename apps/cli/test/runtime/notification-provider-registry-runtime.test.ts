import { NotificationChannel } from '@repo-ai-governor/notification-dispatcher';
import { GovernorErrorCode } from '@repo-ai-governor/shared';
import { CliNotificationProviderEnvironmentKey } from '../../src/constants/notification-provider.constant.js';
import { CliNotificationProviderRegistryRuntime } from '../../src/runtime/notification-provider-registry-runtime.js';

describe('CliNotificationProviderRegistryRuntime', () => {
  it('resolves configured webhook and chat-im providers from environment', () => {
    const runtime = new CliNotificationProviderRegistryRuntime();

    const providers = runtime.resolveProviders({
      [CliNotificationProviderEnvironmentKey.WEBHOOK_URL]: 'https://example.com/webhook',
      [CliNotificationProviderEnvironmentKey.CHAT_IM_URL]: 'https://example.com/chat',
      [CliNotificationProviderEnvironmentKey.WEBHOOK_HEADERS_JSON]: '{"x-env-header":"webhook"}',
      [CliNotificationProviderEnvironmentKey.CHAT_IM_HEADERS_JSON]: '{"x-env-header":"chat"}',
    });

    expect(providers.map((provider) => provider.channel)).toEqual([
      NotificationChannel.WEBHOOK,
      NotificationChannel.CHAT_IM,
    ]);
  });

  it('rejects invalid headers JSON payloads', () => {
    const runtime = new CliNotificationProviderRegistryRuntime();

    expect(() =>
      runtime.resolveProviders({
        [CliNotificationProviderEnvironmentKey.WEBHOOK_URL]: 'https://example.com/webhook',
        [CliNotificationProviderEnvironmentKey.WEBHOOK_HEADERS_JSON]: '{invalid-json',
      }),
    ).toThrowError(
      expect.objectContaining({
        code: GovernorErrorCode.ENTRYPOINT_COMMAND_WRAPPER_INVALID,
      }),
    );
  });
});
