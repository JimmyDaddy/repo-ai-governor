import type { I18nRuntimeConfig } from "../types/interfaces/i18n-runtime-config.interface.js";

export const I18N_RUNTIME_ENGINE = "i18next" as const;
export const DEFAULT_I18N_LOCALE = "zh-CN" as const;
export const DEFAULT_I18N_FALLBACK_LOCALE = "en-US" as const;
export const DEFAULT_I18N_SUPPORTED_LOCALES = [
  DEFAULT_I18N_LOCALE,
  DEFAULT_I18N_FALLBACK_LOCALE,
] as const;

/**
 * Provides a single default i18n runtime config for command surfaces.
 *
 * Why this exists:
 * keeping one shared baseline avoids each package drifting to different locale defaults.
 */
export const DEFAULT_I18N_RUNTIME_CONFIG: I18nRuntimeConfig = {
  runtimeEngine: I18N_RUNTIME_ENGINE,
  defaultLocale: DEFAULT_I18N_LOCALE,
  fallbackLocale: DEFAULT_I18N_FALLBACK_LOCALE,
  supportedLocales: [...DEFAULT_I18N_SUPPORTED_LOCALES],
};
