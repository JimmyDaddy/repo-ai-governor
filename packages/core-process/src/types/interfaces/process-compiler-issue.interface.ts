import type {
  ProcessCompilerIssueCode,
  ProcessCompilerSeverity,
} from '../../constants/compiler-ir.constant.js';

/**
 * Defines one compiler warning/error record in compile output.
 */
export interface ProcessCompilerIssue {
  errorCode: ProcessCompilerIssueCode;
  severity: ProcessCompilerSeverity;
  message: string;
  location: string;
  suggestion: string;
}

/**
 * Defines snake_case compiler issue payload persisted in IR snapshot.
 */
export interface ProcessCompilerIssueSnapshot {
  error_code: ProcessCompilerIssueCode;
  severity: ProcessCompilerSeverity;
  message: string;
  location: string;
  suggestion: string;
}
