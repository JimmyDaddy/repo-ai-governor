import type {
  ProcessCompilerIssueCode,
  ProcessCompilerSeverity,
} from "../../constants/compiler-ir.constant.js";

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
