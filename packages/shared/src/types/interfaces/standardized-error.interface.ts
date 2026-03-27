import type { GovernorErrorCode } from '../../errors/error-code.constant.js';

/**
 * Describes a normalized runtime error payload for cross-package display/output.
 */
export interface StandardizedError {
  code: GovernorErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
