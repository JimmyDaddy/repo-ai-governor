import path from "node:path";

export function normalizeLocale(locale, options = {}) {
  const defaultLocale = options.defaultLocale === "en-US" ? "en-US" : "zh-CN";

  if (locale === "zh-CN" || locale === "en-US") {
    return locale;
  }

  return defaultLocale;
}

export function translateLocale(locale, zhCN, enUS, options = {}) {
  return normalizeLocale(locale, options) === "en-US" ? enUS : zhCN;
}

export function toRelativePath(cwd, targetPath) {
  const relativePath = path.relative(cwd, targetPath).split(path.sep).join("/");
  return relativePath || ".";
}

export function cloneValue(value) {
  return structuredClone(value);
}

export function isPlainObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
