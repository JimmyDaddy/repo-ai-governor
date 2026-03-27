import { type GovernorErrorCode, RuntimeError } from '@repo-ai-governor/shared';

/**
 * Validates a required string field and returns a trimmed value.
 *
 * Why this exists:
 * standards modules share the same required-string boundary validation logic
 * and only differ by domain error code; centralizing this helper avoids drift.
 */
export function readRequiredString(
  value: unknown,
  fieldName: string,
  errorCode: GovernorErrorCode,
): string {
  if (typeof value !== 'string') {
    throw new RuntimeError(errorCode, `Field "${fieldName}" must be a string.`);
  }

  const normalizedValue = value.trim();
  if (!normalizedValue) {
    throw new RuntimeError(errorCode, `Field "${fieldName}" cannot be empty.`);
  }

  return normalizedValue;
}
