/**
 * Defines default retention days for audit records when runtime config is absent.
 *
 * Why this exists:
 * product baseline requires a deterministic 90-day retention policy across environments.
 */
export const DEFAULT_AUDIT_RETENTION_DAYS = 90;

/**
 * Defines whether write-time masking is enabled by default.
 *
 * Why this exists:
 * default-on masking reduces accidental sensitive-data persistence in audit payloads.
 */
export const DEFAULT_AUDIT_MASKING_ENABLED = true;

/**
 * Defines masked placeholder used when sensitive fields are redacted.
 */
export const DEFAULT_AUDIT_MASKED_VALUE = '[REDACTED]';

/**
 * Defines exact field names treated as sensitive for object-key based masking.
 */
export const AUDIT_SENSITIVE_FIELD_NAME_MARKERS = [
  'accessToken',
  'refreshToken',
  'sessionToken',
  'secret',
  'clientSecret',
  'password',
  'passwd',
  'authorization',
  'credential',
  'apiKey',
  'apikey',
  'accessKey',
  'privateKey',
] as const;

/**
 * Defines normalized field-name suffix markers treated as sensitive.
 */
export const AUDIT_SENSITIVE_FIELD_SUFFIX_MARKERS = [
  'token',
  'secret',
  'password',
  'passwd',
  'apikey',
  'accesskey',
  'privatekey',
  'credential',
  'authorization',
] as const;

/**
 * Defines non-sensitive metric fields explicitly excluded from key-based masking.
 */
export const AUDIT_NON_SENSITIVE_FIELD_NAME_EXCEPTIONS = ['tokenBudget', 'tokenUsed'] as const;

/**
 * Defines text patterns treated as sensitive when embedded in free-form strings.
 */
export const AUDIT_SENSITIVE_TEXT_PATTERNS = [
  /(bearer\s+)[^\s,;]+/giu,
  /((?:api[_-]?key|access[_-]?token|refresh[_-]?token|authorization|password|passwd|secret|client[_-]?secret|private[_-]?key|session[_-]?token)\s*[:=]\s*)([^,\s;]+)/giu,
  /(eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)/gu,
  /(sk-[A-Za-z0-9_-]{12,})/gu,
] as const;

/**
 * Defines milliseconds per day for retention window math.
 */
export const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000;
