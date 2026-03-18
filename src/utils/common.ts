import path from "node:path";
import { LocaleEnum } from "../constants/locale.js";
import type { Locale } from "../types/aliases/locale.type.js";
import type { LocaleOptions } from "../types/interfaces/locale-options.interface.js";

export function normalizeLocale(
  locale: string | null | undefined,
  options: LocaleOptions = {},
): Locale {
  const defaultLocale =
    options.defaultLocale === LocaleEnum.EnUS ? LocaleEnum.EnUS : LocaleEnum.ZhCN;

  if (locale === LocaleEnum.ZhCN || locale === LocaleEnum.EnUS) {
    return locale;
  }

  return defaultLocale;
}

export function translateLocale<T>(
  locale: string | null | undefined,
  zhCN: T,
  enUS: T,
  options: LocaleOptions = {},
): T {
  return normalizeLocale(locale, options) === LocaleEnum.EnUS ? enUS : zhCN;
}

export function toRelativePath(cwd: string, targetPath: string): string {
  const relativePath = path.relative(cwd, targetPath).split(path.sep).join("/");
  return relativePath || ".";
}

export function cloneValue<T>(value: T): T {
  return structuredClone(value);
}

export function isPlainObject(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
