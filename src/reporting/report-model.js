function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
}

function normalizeLocale(locale) {
  return locale === "zh-CN" ? "zh-CN" : "en-US";
}

function isEnglishLocale(locale) {
  return normalizeLocale(locale) === "en-US";
}

function t(locale, zhCN, enUS) {
  return isEnglishLocale(locale) ? enUS : zhCN;
}

function normalizeFinding(finding, index) {
  return {
    id: finding.id ?? `finding-${index + 1}`,
    ruleId: finding.ruleId ?? null,
    severity: finding.severity ?? "info",
    status: finding.status ?? (finding.severity === "error" ? "fail" : "pass"),
    message: finding.message ?? "",
    target: finding.target ?? null,
    suggestion: finding.suggestion ?? null,
    stageId: finding.stageId ?? null
  };
}

function normalizeFindings(payload) {
  const sourceFindings = payload.findings ?? payload.checks ?? [];
  return sourceFindings.map((finding, index) => normalizeFinding(finding, index));
}

function normalizeWorkflow(payload) {
  const workflow = payload.workflow ?? null;

  if (!workflow) {
    return null;
  }

  return {
    status: workflow.status ?? null,
    selectedStageIds: workflow.selectedStageIds ?? [],
    summary: workflow.summary ?? null,
    stages: (workflow.stages ?? []).map((stage) => ({
      id: stage.id,
      status: stage.status ?? null,
      summary: stage.summary ?? null,
      blockedBy: stage.blockedBy ?? [],
      matchedRules: stage.matchedRules ?? []
    }))
  };
}

function normalizeStandards(payload, findings) {
  const standards = payload.standards ?? {};
  const matchedRuleIds = uniqueValues([
    ...(standards.matchedRuleIds ?? []),
    ...findings.map((finding) => finding.ruleId).filter(Boolean)
  ]);

  return {
    preset: standards.preset ?? null,
    totalRules: standards.totalRules ?? 0,
    matchedRuleIds
  };
}

function buildArtifacts(payload) {
  return {
    reportFile: payload.reportFile ?? null,
    reviewFile: payload.reviewFile ?? null,
    sourceFile: payload.sourceFile ?? null,
    outputFile: payload.outputFile ?? null
  };
}

function buildNextActions(payload, findings, locale) {
  const suggestedActions = uniqueValues(
    findings
      .filter((finding) => finding.severity === "error" || finding.severity === "warning")
      .map((finding) => finding.suggestion)
  );

  if (suggestedActions.length > 0) {
    return suggestedActions;
  }

  if (payload.status === "fail") {
    return [
      t(
        locale,
        "请排查阻断发现并重新执行对应治理命令。",
        "Investigate the blocking findings and rerun the relevant governance command."
      )
    ];
  }

  if (payload.status === "warn") {
    return [
      t(
        locale,
        "请审阅告警发现并判断是否需要修复或显式记录风险。",
        "Review the warning findings and decide whether they require fixes or explicit risk notes."
      )
    ];
  }

  return [t(locale, "无需后续动作。", "No follow-up actions required.")];
}

export function buildUnifiedReport(payload, options = {}) {
  const findings = normalizeFindings(payload);
  const workflow = normalizeWorkflow(payload);
  const standards = normalizeStandards(payload, findings);
  const locale = normalizeLocale(options.locale ?? payload.locale);

  return {
    schemaVersion: "1",
    kind: "governance-report",
    command: payload.command ?? null,
    status: payload.status ?? payload.summary?.status ?? null,
    generatedAt: options.generatedAt ?? payload.generatedAt ?? new Date().toISOString(),
    context: {
      cwd: payload.cwd ?? null,
      configFile: payload.configFile ?? null,
      project: payload.currentProject ?? null,
      sprint: payload.currentSprint ?? null,
      locale
    },
    summary: payload.summary ?? null,
    workflow,
    standards,
    findings,
    artifacts: buildArtifacts(payload),
    nextActions: buildNextActions(payload, findings, locale)
  };
}

function renderSummary(report) {
  const workflowSummary = report.workflow?.summary
    ? JSON.stringify(report.workflow.summary)
    : "null";

  return [
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
    ...report.nextActions.map((action, index) => `next_action_${index + 1}=${action}`)
  ].join("\n") + "\n";
}

function renderMarkdown(report) {
  const locale = normalizeLocale(report.context?.locale);
  const workflowSection =
    report.workflow === null
      ? t(locale, "1. 无流程数据。", "1. No workflow data.")
      : report.workflow.stages.length === 0
        ? t(locale, "1. 无流程阶段数据。", "1. No workflow stages.")
        : report.workflow.stages
            .map(
              (stage, index) =>
                `${index + 1}. \`${stage.id}\` ${stage.status ?? "unknown"}${stage.summary ? ` - ${stage.summary}` : ""}`
            )
            .join("\n");

  const findingsSection =
    report.findings.length === 0
      ? t(locale, "1. 无发现。", "1. No findings.")
      : report.findings
          .map((finding, index) => {
            const lines = [
              `${index + 1}. [${finding.severity}] \`${finding.id}\` ${finding.message}`
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

  return [
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
    nextActionsSection
  ].join("\n") + "\n";
}

export function renderUnifiedReport(report, format = "summary") {
  if (format === "json") {
    return `${JSON.stringify(report, null, 2)}\n`;
  }

  if (format === "markdown") {
    return renderMarkdown(report);
  }

  return renderSummary(report);
}
