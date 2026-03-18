import type {
  REPORT_DOCUMENT_KINDS,
  REPORT_FORMATS,
  REPORT_SCHEMA_VERSIONS,
  REPORT_SOURCE_KINDS,
} from "../../constants/report.js";

export type ReportFormat = (typeof REPORT_FORMATS)[number];

export type ReportSourceKind = (typeof REPORT_SOURCE_KINDS)[number];

export type ReportDocumentKind = (typeof REPORT_DOCUMENT_KINDS)[number];

export type ReportSchemaVersion = (typeof REPORT_SCHEMA_VERSIONS)[number];
