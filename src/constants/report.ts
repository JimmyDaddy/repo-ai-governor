export enum ReportFormatEnum {
  Summary = "summary",
  Markdown = "markdown",
  Json = "json",
}

export const REPORT_FORMATS = Object.freeze(
  Object.values(ReportFormatEnum),
) as readonly `${ReportFormatEnum}`[];

export enum ReportSourceKindEnum {
  GovernanceReport = "governance-report",
  CommandPayload = "command-payload",
  ReviewRecord = "review-record",
}

export const REPORT_SOURCE_KINDS = Object.freeze(
  Object.values(ReportSourceKindEnum),
) as readonly `${ReportSourceKindEnum}`[];

export enum ReportDocumentKindEnum {
  GovernanceReport = "governance-report",
}

export const REPORT_DOCUMENT_KINDS = Object.freeze(
  Object.values(ReportDocumentKindEnum),
) as readonly `${ReportDocumentKindEnum}`[];

export enum ReportSchemaVersionEnum {
  V1 = "1",
}

export const REPORT_SCHEMA_VERSIONS = Object.freeze(
  Object.values(ReportSchemaVersionEnum),
) as readonly `${ReportSchemaVersionEnum}`[];
