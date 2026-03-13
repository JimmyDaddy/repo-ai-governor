function uniqueValues(values) {
  return Array.from(new Set(values.filter(Boolean)));
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

function buildNextActions(payload, findings) {
  const suggestedActions = uniqueValues(
    findings
      .filter((finding) => finding.severity === "error" || finding.severity === "warning")
      .map((finding) => finding.suggestion)
  );

  if (suggestedActions.length > 0) {
    return suggestedActions;
  }

  if (payload.status === "fail") {
    return ["Investigate the blocking findings and rerun the relevant governance command."];
  }

  if (payload.status === "warn") {
    return ["Review the warning findings and decide whether they require fixes or explicit risk notes."];
  }

  return ["No follow-up actions required."];
}

export function buildUnifiedReport(payload, options = {}) {
  const findings = normalizeFindings(payload);
  const workflow = normalizeWorkflow(payload);
  const standards = normalizeStandards(payload, findings);

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
      locale: options.locale ?? payload.locale ?? null
    },
    summary: payload.summary ?? null,
    workflow,
    standards,
    findings,
    artifacts: buildArtifacts(payload),
    nextActions: buildNextActions(payload, findings)
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
  const workflowSection =
    report.workflow === null
      ? "1. No workflow data."
      : report.workflow.stages.length === 0
        ? "1. No workflow stages."
        : report.workflow.stages
            .map(
              (stage, index) =>
                `${index + 1}. \`${stage.id}\` ${stage.status ?? "unknown"}${stage.summary ? ` - ${stage.summary}` : ""}`
            )
            .join("\n");

  const findingsSection =
    report.findings.length === 0
      ? "1. No findings."
      : report.findings
          .map((finding, index) => {
            const lines = [
              `${index + 1}. [${finding.severity}] \`${finding.id}\` ${finding.message}`
            ];

            if (finding.target) {
              lines.push(`Target: \`${finding.target}\``);
            }

            if (finding.ruleId) {
              lines.push(`Rule: \`${finding.ruleId}\``);
            }

            if (finding.suggestion) {
              lines.push(`Suggestion: ${finding.suggestion}`);
            }

            return lines.join("\n");
          })
          .join("\n\n");

  const nextActionsSection = report.nextActions
    .map((action, index) => `${index + 1}. ${action}`)
    .join("\n");

  return [
    `# Governance Report: ${report.command}`,
    "",
    `- Status: ${report.status}`,
    `- Project: \`${report.context.project ?? ""}\``,
    `- Sprint: \`${report.context.sprint ?? ""}\``,
    `- Generated At: ${report.generatedAt}`,
    "",
    "## Workflow",
    "",
    workflowSection,
    "",
    "## Findings",
    "",
    findingsSection,
    "",
    "## Next Actions",
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
