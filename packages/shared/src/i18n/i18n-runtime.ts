import { createInstance, type i18n } from 'i18next';

import { I18N_RUNTIME_ENGINE, Locale } from '../constants/i18n.constant.js';
import { GovernorErrorCode, I18nError } from '../errors/index.js';
import type { I18nRuntimeConfig } from '../types/interfaces/index.js';
import { EN_US_TRANSLATIONS } from './locales/en-us.js';
import { ZH_CN_TRANSLATIONS } from './locales/zh-cn.js';

const I18N_RESOURCES = {
  [Locale.ZH_CN]: {
    translation: ZH_CN_TRANSLATIONS,
  },
  [Locale.EN_US]: {
    translation: EN_US_TRANSLATIONS,
  },
};
const I18N_RESOURCE_LOCALE_KEYS = Object.keys(I18N_RESOURCES);

/**
 * Provides shared i18n runtime capabilities for CLI and governance modules.
 *
 * Why this exists:
 * keeping locale resolution and translation access in one runtime avoids each module
 * implementing different fallback behavior and leaking inconsistent user experience.
 */
export class I18nRuntime {
  private readonly instance: i18n = createInstance();
  private initialized = false;

  /**
   * Initializes translation resources and activates the resolved locale.
   * @param config Runtime locale policy from repository config or defaults.
   * @param requestedLocale Optional locale requested by runtime flags.
   * @returns Effective locale used by this runtime instance.
   */
  public async initialize(config: I18nRuntimeConfig, requestedLocale?: string): Promise<string> {
    if (config.runtimeEngine !== I18N_RUNTIME_ENGINE) {
      throw new I18nError(
        GovernorErrorCode.I18N_RUNTIME_ENGINE_UNSUPPORTED,
        `I18nRuntime currently supports only runtimeEngine='${I18N_RUNTIME_ENGINE}'.`,
        { runtimeEngine: config.runtimeEngine },
      );
    }

    const resolvedLocale = this.resolveLocale(
      requestedLocale,
      config.supportedLocales,
      config.defaultLocale,
      config.fallbackLocale,
    );

    await this.instance.init({
      resources: I18N_RESOURCES,
      lng: resolvedLocale,
      fallbackLng: config.fallbackLocale,
      supportedLngs: Array.from(new Set([...config.supportedLocales, config.fallbackLocale])),
      showSupportNotice: false,
      interpolation: {
        escapeValue: false,
      },
      returnNull: false,
    });

    this.initialized = true;
    return resolvedLocale;
  }

  /**
   * Resolves locale using deterministic fallback order.
   * @param requestedLocale Runtime requested locale (for example from CLI flag).
   * @param supportedLocales Locale allowlist from config.
   * @param defaultLocale Default locale from config.
   * @param fallbackLocale Final fallback locale from config.
   * @returns Locale that can be safely loaded from runtime resources.
   */
  public resolveLocale(
    requestedLocale: string | undefined,
    supportedLocales: string[],
    defaultLocale: string,
    fallbackLocale: string,
  ): string {
    const candidates = [
      requestedLocale,
      this.toLanguageBase(requestedLocale),
      defaultLocale,
      this.toLanguageBase(defaultLocale),
      fallbackLocale,
      this.toLanguageBase(fallbackLocale),
    ].filter((item): item is string => Boolean(item));

    for (const candidate of candidates) {
      const matchedLocale = this.matchSupportedLocale(candidate, supportedLocales);
      if (matchedLocale) {
        return this.resolveResourceLocale(matchedLocale);
      }
    }

    if (supportedLocales.length > 0) {
      return this.resolveResourceLocale(supportedLocales[0]);
    }

    return this.resolveResourceLocale(fallbackLocale);
  }

  /**
   * Translates a key with optional interpolation values.
   * @param key Translation key in shared semantic namespace.
   * @param interpolation Optional template variables.
   * @returns Localized message string.
   */
  public t(key: string, interpolation?: Record<string, string>): string {
    this.assertInitialized();
    return this.instance.t(key, interpolation);
  }

  /**
   * Formats a localized message for call sites that prefer semantic naming.
   * @param key Translation key in shared semantic namespace.
   * @param interpolation Optional template variables.
   * @returns Localized message string.
   */
  public formatMessage(key: string, interpolation?: Record<string, string>): string {
    return this.t(key, interpolation);
  }

  /**
   * Finds the best supported locale from an arbitrary candidate.
   * @param candidate Locale candidate from flags/default/fallback chain.
   * @param supportedLocales Locale allowlist from config.
   * @returns Matched locale or undefined when no safe match exists.
   */
  private matchSupportedLocale(candidate: string, supportedLocales: string[]): string | undefined {
    const exactMatch = supportedLocales.find(
      (supportedLocale) => supportedLocale.toLowerCase() === candidate.toLowerCase(),
    );
    if (exactMatch) {
      return exactMatch;
    }

    const candidateLanguage = this.toLanguageBase(candidate);
    if (!candidateLanguage) {
      return undefined;
    }

    const languageMatch = supportedLocales.find((supportedLocale) => {
      const supportedLanguage = this.toLanguageBase(supportedLocale);
      return supportedLanguage?.toLowerCase() === candidateLanguage.toLowerCase();
    });

    return languageMatch;
  }

  /**
   * Collapses locale code to language base (for example `zh-CN` -> `zh`).
   * @param locale Locale code.
   * @returns Language base when locale is non-empty.
   */
  private toLanguageBase(locale: string | undefined): string | undefined {
    if (!locale) {
      return undefined;
    }

    const normalizedLocale = locale.trim();
    if (!normalizedLocale) {
      return undefined;
    }

    return normalizedLocale.split('-')[0];
  }

  /**
   * Maps any locale variant to a locale key that exists in runtime resources.
   * @param locale Locale from config fallback chain.
   * @returns Locale key guaranteed to exist in translation resources.
   */
  private resolveResourceLocale(locale: string): string {
    const exactResourceLocale = I18N_RESOURCE_LOCALE_KEYS.find(
      (resourceLocale) => resourceLocale.toLowerCase() === locale.toLowerCase(),
    );
    if (exactResourceLocale) {
      return exactResourceLocale;
    }

    const languageBase = this.toLanguageBase(locale);
    if (!languageBase) {
      return I18N_RESOURCE_LOCALE_KEYS[0];
    }

    const languageResourceLocale = I18N_RESOURCE_LOCALE_KEYS.find((resourceLocale) => {
      const resourceLanguage = this.toLanguageBase(resourceLocale);
      return resourceLanguage?.toLowerCase() === languageBase.toLowerCase();
    });

    return languageResourceLocale ?? I18N_RESOURCE_LOCALE_KEYS[0];
  }

  /**
   * Guards translation calls before initialize has been completed.
   * @returns Void.
   */
  private assertInitialized(): void {
    if (!this.initialized) {
      throw new I18nError(
        GovernorErrorCode.I18N_RUNTIME_NOT_INITIALIZED,
        'I18nRuntime must be initialized before translation calls.',
      );
    }
  }
}
