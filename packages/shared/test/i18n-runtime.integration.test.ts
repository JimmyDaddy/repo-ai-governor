import { Locale } from '../src/constants/i18n.constant.js';
import { I18nRuntime } from '../src/index.js';

describe('I18nRuntime smoke', () => {
  it('resolves locale by language fallback and renders localized message', async () => {
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
    expect(runtime.t('cli.commands.init.description')).toContain('初始化');
  });
});
