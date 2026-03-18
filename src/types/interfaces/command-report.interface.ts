import type { ReportFormat, UnifiedReport } from "../../reporting/report-model.js";
import type { loadReportSource } from "../../reporting/report-source.js";
import type { ReportCommandName, ReportCommandStatus } from "../aliases/command.type.js";

export interface ReportRun {
  cwd: string;
  sourceFilePath: string;
  sourceKind: ReturnType<typeof loadReportSource>["sourceKind"];
  report: UnifiedReport;
  locale: string;
  format: ReportFormat;
  dryRun: boolean;
  outputFilePath: string;
}

export interface ReportPayload {
  command: ReportCommandName;
  status: ReportCommandStatus;
  locale: string;
  sourceFile: string;
  sourceKind: ReturnType<typeof loadReportSource>["sourceKind"];
  format: ReportFormat;
  dryRun: boolean;
  outputFile: string | null;
}
