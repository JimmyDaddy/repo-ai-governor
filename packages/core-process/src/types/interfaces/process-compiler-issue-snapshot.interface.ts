import type {
  ProcessCompilerIssueCode,
  ProcessCompilerSeverity,
} from "../../constants/compiler-ir.constant.js";

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
