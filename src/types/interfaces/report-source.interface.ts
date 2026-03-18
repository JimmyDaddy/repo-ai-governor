import type { ReportSourceKind } from "../aliases/report.type.js";
import type { UnifiedReport } from "./report-model.interface.js";

export interface LoadedReportSource {
  sourceKind: ReportSourceKind;
  report: UnifiedReport;
}

export interface ParsedFinding {
  id: string;
  severity: string;
  status: string;
  message: string;
  target: string | null;
  ruleId: string | null;
  suggestion: string | null;
}
