import fs from "node:fs";

export function normalizeSurfaceId(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function toPositiveInteger(value, fallbackValue) {
  const parsed = Number(value);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    return fallbackValue;
  }

  return Math.floor(parsed);
}

export function normalizeTaskId(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase();
}

export function normalizeTaskStatus(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

export function normalizeRiskTag(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

export function normalizeStringList(values) {
  return Array.from(
    new Set(
      (Array.isArray(values) ? values : values ? [values] : [])
        .map((value) => String(value ?? "").trim())
        .filter(Boolean)
    )
  );
}

export function parseRiskTagList(rawValues) {
  const normalizedValues = normalizeStringList(
    (Array.isArray(rawValues) ? rawValues : rawValues ? [rawValues] : []).flatMap((value) =>
      String(value ?? "")
        .split(",")
        .map((segment) => segment.trim())
    )
  )
    .map(normalizeRiskTag)
    .filter(Boolean);

  return Array.from(new Set(normalizedValues));
}

export function readTextFileIfExists(filePath) {
  if (!filePath || !fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    return "";
  }

  return fs.readFileSync(filePath, "utf8");
}

export function findPatternEvidence(content, pattern) {
  const match = String(content ?? "").match(pattern);
  const raw = match?.[0] ?? null;

  if (!raw) {
    return null;
  }

  const compact = raw.replace(/\s+/g, " ").trim();
  return compact.length > 96 ? `${compact.slice(0, 93)}...` : compact;
}
