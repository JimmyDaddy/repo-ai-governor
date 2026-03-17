import {
  normalizeLocale as normalizeLocaleValue,
  translateLocale,
  type Locale,
} from "../utils/common.js";

type GenericRecord = Record<string, unknown>;

export type ReportFormat = "summary" | "markdown" | "json";

export type NormalizedFinding = {
  id: string;
  ruleId: string | null;
  severity: string;
  status: string;
  message: string;
  target: string | null;
  suggestion: string | null;
  stageId: string | null;
};

export type NormalizedWorkflowStage = {
  id: string;
  status: string | null;
  summary: unknown;
  blockedBy: string[];
  matchedRules: string[];
};

export type NormalizedWorkflow = {
  status: string | null;
  selectedStageIds: string[];
  summary: unknown;
  stages: NormalizedWorkflowStage[];
};

export type NormalizedStandards = {
  preset: string | null;
  totalRules: number;
  matchedRuleIds: string[];
};

export type ReportArtifacts = {
  reportFile: string | null;
  reviewFile: string | null;
  sourceFile: string | null;
  outputFile: string | null;
};

export type UnifiedReport = {
  schemaVersion: "1";
  kind: "governance-report";
  command: string | null;
  status: string | null;
  generatedAt: string;
  context: {
    cwd: string | null;
    configFile: string | null;
    project: string | null;
    sprint: string | null;
    locale: Locale;
  };
  summary: unknown;
  workflow: NormalizedWorkflow | null;
  standards: NormalizedStandards;
  findings: NormalizedFinding[];
  artifacts: ReportArtifacts;
  nextActions: string[];
};

export type BuildUnifiedReportOptions = {
  locale?: string;
  generatedAt?: string;
};

function asRecord(value: unknown): GenericRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as GenericRecord;
}

function asString(value: unknown): string | null {
  return typeof value === "string" ? value : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((item): item is string => typeof item === "string");
}

function uniqueValues(values: Array<string | null | undefined>): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value))));
}

function normalizeLocale(locale: string | null | undefined): Locale {
  return normalizeLocaleValue(locale, { defaultLocale: "en-US" });
}

function t<T>(locale: string | null | undefined, zhCN: T, enUS: T): T {
  return translateLocale(locale, zhCN, enUS, { defaultLocale: "en-US" });
}

function normalizeFinding(input: unknown, index: number): NormalizedFinding {
  const finding = asRecord(input);
  const severity = asString(finding.severity) ?? "info";

  return {
    id: asString(finding.id) ?? `finding-${index + 1}`,
    ruleId: asString(finding.ruleId),
    severity,
    status: asString(finding.status) ?? (severity === "error" ? "fail" : "pass"),
    message: asString(finding.message) ?? "",
    target: asString(finding.target),
    suggestion: asString(finding.suggestion),
    stageId: asString(finding.stageId),
  };
}

function normalizeFindings(payload: GenericRecord): NormalizedFinding[] {
  const sourceFindings = Array.isArray(payload.findings)
    ? payload.findings
    : Array.isArray(payload.checks)
      ? payload.checks
      : [];

  return sourceFindings.map((finding, index) => normalizeFinding(finding, index));
}

function normalizeWorkflow(payload: GenericRecord): NormalizedWorkflow | null {
  if (payload.workflow === null || payload.workflow === undefined) {
    return null;
  }

  const workflow = asRecord(payload.workflow);
  const stages = Array.isArray(workflow.stages) ? workflow.stages : [];

  return {
    status: asString(workflow.status),
    selectedStageIds: asStringArray(workflow.selectedStageIds),
    summary: workflow.summary ?? null,
    stages: stages.map((stage, index) => {
      const stageRecord = asRecord(stage);

      return {
        id: asString(stageRecord.id) ?? `stage-${index + 1}`,
        status: asString(stageRecord.status),
        summary: stageRecord.summary ?? null,
        blockedBy: asStringArray(stageRecord.blockedBy),
        matchedRules: asStringArray(stageRecord.matchedRules),
      };
    }),
  };
}

function normalizeStandards(
  payload: GenericRecord,
  findings: NormalizedFinding[],
): NormalizedStandards {
  const standards = asRecord(payload.standards);
  const matchedRuleIds = uniqueValues([
    ...asStringArray(standards.matchedRuleIds),
    ...findings.map((finding) => finding.ruleId),
  ]);

  return {
    preset: asString(standards.preset),
    totalRules: typeof standards.totalRules === "number" ? standards.totalRules : 0,
    matchedRuleIds,
  };
}

function buildArtifacts(payload: GenericRecord): ReportArtifacts {
  return {
    reportFile: asString(payload.reportFile),
    reviewFile: asString(payload.reviewFile),
    sourceFile: asString(payload.sourceFile),
    outputFile: asString(payload.outputFile),
  };
}

function buildNextActions(
  payload: GenericRecord,
  findings: NormalizedFinding[],
  locale: Locale,
): string[] {
  const suggestedActions = uniqueValues(
    findings
      .filter((finding) => finding.severity === "error" || finding.severity === "warning")
      .map((finding) => finding.suggestion),
  );

  if (suggestedActions.length > 0) {
    return suggestedActions;
  }

  const status = asString(payload.status) ?? asString(asRecord(payload.summary).status);

  if (status === "fail") {
    return [
      t(
        locale,
        "请排查阻断发现并重新执行对应治理命令。",
        "Investigate the blocking findings and rerun the relevant governance command.",
      ),
    ];
  }

  if (status === "warn") {
    return [
      t(
        locale,
        "请审阅告警发现并判断是否需要修复或显式记录风险。",
        "Review the warning findings and decide whether they require fixes or explicit risk notes.",
      ),
    ];
  }

  return [t(locale, "无需后续动作。", "No follow-up actions required.")];
}

export function buildUnifiedReport(
  payload: GenericRecord,
  options: BuildUnifiedReportOptions = {},
): UnifiedReport {
  const findings = normalizeFindings(payload);
  const workflow = normalizeWorkflow(payload);
  const standards = normalizeStandards(payload, findings);
  const locale = normalizeLocale(options.locale ?? asString(payload.locale));

  return {
    schemaVersion: "1",
    kind: "governance-report",
    command: asString(payload.command),
    status: asString(payload.status) ?? asString(asRecord(payload.summary).status),
    generatedAt: options.generatedAt ?? asString(payload.generatedAt) ?? new Date().toISOString(),
    context: {
      cwd: asString(payload.cwd),
      configFile: asString(payload.configFile),
      project: asString(payload.currentProject),
      sprint: asString(payload.currentSprint),
      locale,
    },
    summary: payload.summary ?? null,
    workflow,
    standards,
    findings,
    artifacts: buildArtifacts(payload),
    nextActions: buildNextActions(payload, findings, locale),
  };
}

function renderSummary(report: UnifiedReport): string {
  const workflowSummary = report.workflow?.summary
    ? JSON.stringify(report.workflow.summary)
    : "null";

  return (
    [
      `status=${report.status}`,
      `command=${report.command}`,
      `project=${report.context.project ?? ""}`,
      `sprint=${report.context.sprint ?? ""}`,
      `findings=${report.findings.length}`,
      `matched_rules=${report.standards.matchedRuleIds.join(",")}`,
      `workflow=${workflowSummary}`,
      ...report.findings.map((finding) => {
        const parts = [finding.severity, finding.id, finding.message];

        if (finding.target) {
          parts.push(finding.target);
        }

        return parts.join(":");
      }),
      ...report.nextActions.map((action, index) => `next_action_${index + 1}=${action}`),
    ].join("\n") + "\n"
  );
}

function renderMarkdown(report: UnifiedReport): string {
  const locale = normalizeLocale(report.context.locale);
  const workflowSection =
    report.workflow === null
      ? t(locale, "1. 无流程数据。", "1. No workflow data.")
      : report.workflow.stages.length === 0
        ? t(locale, "1. 无流程阶段数据。", "1. No workflow stages.")
        : report.workflow.stages
            .map(
              (stage, index) =>
                `${index + 1}. \`${stage.id}\` ${stage.status ?? "unknown"}${stage.summary ? ` - ${String(stage.summary)}` : ""}`,
            )
            .join("\n");

  const findingsSection =
    report.findings.length === 0
      ? t(locale, "1. 无发现。", "1. No findings.")
      : report.findings
          .map((finding, index) => {
            const lines = [
              `${index + 1}. [${finding.severity}] \`${finding.id}\` ${finding.message}`,
            ];

            if (finding.target) {
              lines.push(`${t(locale, "目标", "Target")}: \`${finding.target}\``);
            }

            if (finding.ruleId) {
              lines.push(`${t(locale, "规则", "Rule")}: \`${finding.ruleId}\``);
            }

            if (finding.suggestion) {
              lines.push(`${t(locale, "建议", "Suggestion")}: ${finding.suggestion}`);
            }

            return lines.join("\n");
          })
          .join("\n\n");

  const nextActionsSection = report.nextActions
    .map((action, index) => `${index + 1}. ${action}`)
    .join("\n");

  return (
    [
      `${t(locale, "# 治理报告", "# Governance Report")}: ${report.command}`,
      "",
      `- ${t(locale, "状态", "Status")}: ${report.status}`,
      `- ${t(locale, "项目", "Project")}: \`${report.context.project ?? ""}\``,
      `- Sprint: \`${report.context.sprint ?? ""}\``,
      `- ${t(locale, "生成时间", "Generated At")}: ${report.generatedAt}`,
      "",
      `## ${t(locale, "流程", "Workflow")}`,
      "",
      workflowSection,
      "",
      `## ${t(locale, "发现", "Findings")}`,
      "",
      findingsSection,
      "",
      `## ${t(locale, "后续动作", "Next Actions")}`,
      "",
      nextActionsSection,
    ].join("\n") + "\n"
  );
}

export function renderUnifiedReport(
  report: UnifiedReport,
  format: ReportFormat = "summary",
): string {
  if (format === "json") {
    return `${JSON.stringify(report, null, 2)}\n`;
  }

  if (format === "markdown") {
    return renderMarkdown(report);
  }

  return renderSummary(report);
}
