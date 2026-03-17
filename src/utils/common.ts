import path from "node:path";

export type Locale = "zh-CN" | "en-US";

export type LocaleOptions = {
  defaultLocale?: Locale;
};

export function normalizeLocale(
  locale: string | null | undefined,
  options: LocaleOptions = {},
): Locale {
  const defaultLocale = options.defaultLocale === "en-US" ? "en-US" : "zh-CN";

  if (locale === "zh-CN" || locale === "en-US") {
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
  return normalizeLocale(locale, options) === "en-US" ? enUS : zhCN;
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
