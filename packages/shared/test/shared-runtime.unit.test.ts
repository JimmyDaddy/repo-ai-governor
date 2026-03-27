import { Locale } from '../src/constants/i18n.constant.js';
import { GovernorErrorCode, I18nRuntime, standardizeError } from '../src/index.js';

describe('shared unit', () => {
  it('resolves locale fallback and renders localized message', async () => {
    const runtime = new I18nRuntime();
    const resolvedLocale = await runtime.initialize(
      {
        runtimeEngine: 'i18next',
        defaultLocale: Locale.ZH_CN,
        fallbackLocale: Locale.EN_US,
        supportedLocales: [Locale.ZH_CN, Locale.EN_US],
      },
      'zh-TW',
    );

    expect(resolvedLocale).toBe(Locale.ZH_CN);
    expect(runtime.formatMessage('cli.commands.init.description')).toContain('初始化');
  });

  it('standardizes unknown throwable payload into governor error shape', () => {
    const standardizedError = standardizeError({
      message: 'unexpected payload',
    });

    expect(standardizedError.code).toBe(GovernorErrorCode.UNKNOWN);
    expect(standardizedError.message).toContain('unexpected payload');
  });
});
