type TemplateLocale = "zh-CN" | "en-US";
type PlanRuleView = {
  level: string;
  summary: string;
  rationale?: string | null;
};

type PlanTask = {
  id: string;
  title: string;
  owner: string;
  priority: string;
  dueDate: string;
  status: string;
  planSummary: string;
  dependsOn: string[];
  goal: string;
  deliverables: string[];
  acceptance: string[];
  ruleIds: string[];
};

type PlanTemplateContext = {
  locale?: string;
  currentProject: string;
  currentSprint: string;
  dateStamp: string;
  title: string;
  goal: string;
  requirementSummary: string;
  inScope: string[];
  outOfScope: string[];
  workflowStages: string[];
  planRules: PlanRuleView[];
  strategy: string[];
  risks: string[];
  acceptance: string[];
  verificationPath: string[];
  tasks: PlanTask[];
  csvColumns: string[];
  task: PlanTask;
  status: string;
  dryRun: boolean;
  workflowStatus: string;
  standardsPreset: string;
  files: unknown;
};

type TemplateRenderer = (context: PlanTemplateContext) => string;
type TemplateMap = Record<string, TemplateRenderer>;

function ensureTrailingNewline(content: string): string {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function titleizeSprint(value: unknown): string {
  return String(value)
    .replace("-", " ")
    .replace(/\b\w/g, (part) => part.toUpperCase());
}

function renderCsvRow(values: unknown[]): string {
  return values
    .map((value) => {
      const normalized = value === null || value === undefined ? "" : String(value);

      if (/[",\n]/.test(normalized)) {
        return `"${normalized.replaceAll('"', '""')}"`;
      }

      return normalized;
    })
    .join(",");
}

function renderRuleList(
  rules: PlanRuleView[],
  formatter: (rule: PlanRuleView, index: number) => string,
): string {
  return rules.map((rule, index) => formatter(rule, index)).join("\n");
}

const ZH_CN_TEMPLATES: TemplateMap = {
  sprintPlan(context) {
    return [
      `# ${context.currentProject.toUpperCase()} ${context.currentSprint} 计划`,
      "",
      "- 状态：active",
      `- 日期：${context.dateStamp}`,
      "- 生成命令：`repo-ai-governor plan`",
      `- 标题：${context.title}`,
      "",
      "## 目标",
      "",
      context.goal,
      "",
      "## 需求快照",
      "",
      context.requirementSummary,
      "",
      "## 纳入范围",
      "",
      ...context.inScope.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## 非范围",
      "",
      ...context.outOfScope.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## 流程焦点",
      "",
      ...context.workflowStages.map((stage, index) => `${index + 1}. \`${stage}\``),
      "",
      "## 本方案适用规范",
      "",
      renderRuleList(
        context.planRules,
        (rule, index) =>
          `${index + 1}. [${rule.level}] ${rule.summary}${rule.rationale ? `：${rule.rationale}` : ""}`,
      ),
      "",
      "## 交付策略",
      "",
      ...context.strategy.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## 风险",
      "",
      ...context.risks.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## 验收标准",
      "",
      ...context.acceptance.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## 验证路径",
      "",
      ...context.verificationPath.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## 任务拆解",
      "",
      ...context.tasks.map(
        (task, index) =>
          `${index + 1}. \`${task.id}\` ${task.title}（负责人：${task.owner}｜优先级：${task.priority}｜截止：${task.dueDate}）`,
      ),
    ].join("\n");
  },
  checklist(context) {
    return [
      `# ${titleizeSprint(context.currentSprint)} 任务清单`,
      "",
      ...context.tasks.flatMap((task) => [
        `- [ ] **${task.id}** ${task.title}（负责人：${task.owner}｜优先级：${task.priority}｜截止：${task.dueDate}｜状态：${task.status}）`,
        `  - 执行记录：plan=${task.planSummary};result=已由 plan 命令生成任务卡与计划骨架;verify=待执行`,
      ]),
    ].join("\n");
  },
  tasksCsv(context) {
    return [
      renderCsvRow(context.csvColumns),
      ...context.tasks.map((task) =>
        renderCsvRow([
          `${task.id}-01`,
          task.id,
          task.title,
          task.owner,
          task.priority,
          task.dueDate,
          task.status,
          context.currentProject,
          context.currentSprint,
          task.planSummary,
          "已由 plan 命令生成任务卡与计划骨架",
          "待执行",
          "",
          context.dateStamp,
        ]),
      ),
    ].join("\n");
  },
  taskFile(context) {
    const task = context.task;

    return [
      `# ${task.id} ${task.title}`,
      "",
      `- 状态：${task.status}`,
      `- 优先级：${task.priority}`,
      `- 项目：\`${context.currentProject}\``,
      `- Sprint：\`${context.currentSprint}\``,
      `- 负责人：${task.owner}`,
      `- 截止：${task.dueDate}`,
      `- 依赖：${task.dependsOn.length > 0 ? task.dependsOn.map((entry) => `\`${entry}\``).join("、") : "`无`"}`,
      "",
      "## 目标",
      "",
      task.goal,
      "",
      "## 交付物",
      "",
      ...task.deliverables.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## 验收标准",
      "",
      ...task.acceptance.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## 备注",
      "",
      `1. 由 \`repo-ai-governor plan\` 于 ${context.dateStamp} 生成。`,
      `2. 相关规范：${task.ruleIds.map((ruleId) => `\`${ruleId}\``).join("、")}。`,
      `3. 计划摘要：${task.planSummary}。`,
    ].join("\n");
  },
  summary(context) {
    return [
      "# plan",
      "",
      `- 状态：${context.status}`,
      `- 预览模式：${context.dryRun}`,
      `- 项目：\`${context.currentProject}\``,
      `- Sprint：\`${context.currentSprint}\``,
      `- 标题：${context.title}`,
      `- 流程状态：\`${context.workflowStatus}\``,
      `- 流程阶段：\`${JSON.stringify(context.workflowStages)}\``,
      `- 规范预设：\`${context.standardsPreset}\``,
      `- 生成任务：\`${JSON.stringify(context.tasks.map((task) => task.id))}\``,
      `- 文件：\`${JSON.stringify(context.files)}\``,
    ].join("\n");
  },
};

const EN_US_TEMPLATES: TemplateMap = {
  sprintPlan(context) {
    return [
      `# ${context.currentProject.toUpperCase()} ${context.currentSprint} Plan`,
      "",
      "- Status: active",
      `- Date: ${context.dateStamp}`,
      "- Generated by: `repo-ai-governor plan`",
      `- Title: ${context.title}`,
      "",
      "## Goal",
      "",
      context.goal,
      "",
      "## Requirement Snapshot",
      "",
      context.requirementSummary,
      "",
      "## In Scope",
      "",
      ...context.inScope.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## Out Of Scope",
      "",
      ...context.outOfScope.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## Workflow Focus",
      "",
      ...context.workflowStages.map((stage, index) => `${index + 1}. \`${stage}\``),
      "",
      "## Standards For This Plan",
      "",
      renderRuleList(
        context.planRules,
        (rule, index) =>
          `${index + 1}. [${rule.level}] ${rule.summary}${rule.rationale ? `: ${rule.rationale}` : ""}`,
      ),
      "",
      "## Delivery Strategy",
      "",
      ...context.strategy.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## Risks",
      "",
      ...context.risks.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## Acceptance",
      "",
      ...context.acceptance.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## Verification Path",
      "",
      ...context.verificationPath.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## Task Breakdown",
      "",
      ...context.tasks.map(
        (task, index) =>
          `${index + 1}. \`${task.id}\` ${task.title} (Owner: ${task.owner} | Priority: ${task.priority} | Due: ${task.dueDate})`,
      ),
    ].join("\n");
  },
  checklist(context) {
    return [
      `# ${titleizeSprint(context.currentSprint)} Checklist`,
      "",
      ...context.tasks.flatMap((task) => [
        `- [ ] **${task.id}** ${task.title} (Owner: ${task.owner} | Priority: ${task.priority} | Due: ${task.dueDate} | Status: ${task.status})`,
        `  - Execution log: plan=${task.planSummary};result=Task card and planning scaffold generated by the plan command;verify=pending`,
      ]),
    ].join("\n");
  },
  tasksCsv(context) {
    return [
      renderCsvRow(context.csvColumns),
      ...context.tasks.map((task) =>
        renderCsvRow([
          `${task.id}-01`,
          task.id,
          task.title,
          task.owner,
          task.priority,
          task.dueDate,
          task.status,
          context.currentProject,
          context.currentSprint,
          task.planSummary,
          "Task card and planning scaffold generated by the plan command",
          "Pending",
          "",
          context.dateStamp,
        ]),
      ),
    ].join("\n");
  },
  taskFile(context) {
    const task = context.task;

    return [
      `# ${task.id} ${task.title}`,
      "",
      `- Status: ${task.status}`,
      `- Priority: ${task.priority}`,
      `- Project: \`${context.currentProject}\``,
      `- Sprint: \`${context.currentSprint}\``,
      `- Owner: ${task.owner}`,
      `- Due: ${task.dueDate}`,
      `- Depends On: ${task.dependsOn.length > 0 ? task.dependsOn.map((entry) => `\`${entry}\``).join(", ") : "`none`"}`,
      "",
      "## Goal",
      "",
      task.goal,
      "",
      "## Deliverables",
      "",
      ...task.deliverables.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## Acceptance",
      "",
      ...task.acceptance.map((entry, index) => `${index + 1}. ${entry}`),
      "",
      "## Notes",
      "",
      `1. Generated by \`repo-ai-governor plan\` on ${context.dateStamp}.`,
      `2. Relevant standards: ${task.ruleIds.map((ruleId) => `\`${ruleId}\``).join(", ")}.`,
      `3. Plan summary: ${task.planSummary}.`,
    ].join("\n");
  },
  summary(context) {
    return [
      "# plan",
      "",
      `- Status: ${context.status}`,
      `- Dry run: ${context.dryRun}`,
      `- Project: \`${context.currentProject}\``,
      `- Sprint: \`${context.currentSprint}\``,
      `- Title: ${context.title}`,
      `- Workflow status: \`${context.workflowStatus}\``,
      `- Workflow stages: \`${JSON.stringify(context.workflowStages)}\``,
      `- Standards preset: \`${context.standardsPreset}\``,
      `- Generated tasks: \`${JSON.stringify(context.tasks.map((task) => task.id))}\``,
      `- Files: \`${JSON.stringify(context.files)}\``,
    ].join("\n");
  },
};

const PLAN_DOCUMENT_TEMPLATES: Record<TemplateLocale, TemplateMap> = {
  "zh-CN": ZH_CN_TEMPLATES,
  "en-US": EN_US_TEMPLATES,
};

export function resolvePlanTemplateLocale(locale: unknown): TemplateLocale {
  return locale === "zh-CN" || locale === "en-US" ? locale : "zh-CN";
}

export function renderPlanDocument(documentId: string, context: PlanTemplateContext): string {
  const locale = resolvePlanTemplateLocale(context.locale);
  const template = PLAN_DOCUMENT_TEMPLATES[locale][documentId];

  if (!template) {
    throw new TypeError(`Unsupported plan document template: ${documentId}`);
  }

  return ensureTrailingNewline(template(context));
}
