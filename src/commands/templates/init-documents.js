function ensureTrailingNewline(content) {
  return content.endsWith("\n") ? content : `${content}\n`;
}

function titleizeSprint(value) {
  return String(value)
    .replace("-", " ")
    .replace(/\b\w/g, (part) => part.toUpperCase());
}

function renderCsvRow(values) {
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

const ZH_CN_TEMPLATES = {
  agents(context) {
    return [
      "# Repo AI Governor Workspace Rules",
      "",
      "## Current Context",
      "",
      `- Current project: \`${context.currentProject}\``,
      `- Current sprint: \`${context.currentSprint}\``,
      `- Project docs root: \`${context.docsRoot}/\``,
      `- Task records: \`${context.docsRoot}/tasks/\``,
      `- Code review records: \`${context.docsRoot}/code-review/\``,
      "",
      "## Source Of Truth",
      "",
      "1. Structured configuration and standards documents are the source of truth.",
      "2. `AGENTS.md` is the repository-level AI execution entrypoint for IDEs and agents.",
      "3. When rules in docs and `AGENTS.md` diverge, update `AGENTS.md` to match the structured docs.",
      "",
      "## Working Rules",
      "",
      "1. Keep repository configuration under the configured governor root directory.",
      "2. Write project execution artifacts under `docs/<project>/sprint-xxx/`.",
      "3. Keep code review output under `code-review/` with status-prefixed file names.",
      "4. Prefer the configured workflow order: plan -> breakdown -> implement -> self-check -> review -> review-verify -> task-sync.",
      "",
      "## Naming Rules",
      "",
      "1. Project directory format: `docs/<project>/`.",
      "2. Sprint directory format: `sprint-xxx`.",
      "3. Task file format: `TK-xxx.md`.",
      "4. Review file format: `review_<slug>.md`, `verified_review_<slug>.md`, `resolved_review_<slug>.md`.",
      "",
      "## Default Workflow",
      "",
      "1. Load `.repo-ai-governor/governor.yaml` and validate it against schema v1.",
      "2. Read enabled slot and adapter definitions before running workflow steps.",
      "3. Update sprint task records after implementation and self-check.",
      "4. Append verify results into the same CR file and rename it to the next review status."
    ].join("\n");
  },
  sprintIndex(context) {
    return [
      `# ${context.currentProject.toUpperCase()} ${context.currentSprint} Index`,
      "",
      "- Status: active",
      `- Date: ${context.dateStamp}`,
      `- Project: \`${context.currentProject}\``,
      `- Sprint: \`${context.currentSprint}\``,
      "",
      "## Scope",
      "",
      `本目录用于沉淀当前 \`${context.currentProject}\` 项目的 \`${context.currentSprint}\` 执行资料。`,
      "",
      "## Files",
      "",
      `- [${context.planFileName}](${context.planRelativePath}): 当前 sprint 的方案与任务拆解。`,
      `- [${context.tasksDirectoryName}/${context.checklistFileName}](${context.checklistRelativePath}): 任务执行 checklist。`,
      `- [${context.tasksDirectoryName}/${context.taskCsvFileName}](${context.taskCsvRelativePath}): 任务执行 CSV 台账。`,
      `- \`${context.codeReviewDirectoryName}/\`: 状态化 code review 记录目录。`,
      "",
      "## Notes",
      "",
      "1. 新任务应先写入 `plan.md`，再同步任务卡、checklist 与 CSV 台账。",
      "2. CR 结果统一写入 `code-review/`，并通过文件名前缀体现评审状态。"
    ].join("\n");
  },
  sprintPlan(context) {
    return [
      `# ${context.currentProject.toUpperCase()} ${context.currentSprint} Plan`,
      "",
      "- Status: active",
      `- Date: ${context.dateStamp}`,
      "",
      "## Goal",
      "",
      "完成仓库治理基础设施的初始化，并为当前项目与 sprint 准备标准执行目录。",
      "",
      "## Bootstrap Scope",
      "",
      `1. 生成主配置文件 \`${context.configFilePath}\` 与 AI 入口文件 \`${context.agentEntryPath}\`。`,
      `2. 初始化当前项目 \`${context.currentProject}\` 与 \`${context.currentSprint}\` 的任务和 code review 目录。`,
      `3. 预置已启用的 adapter 定义：${context.enabledAdaptersMarkdown}。`,
      "",
      "## Next Actions",
      "",
      "1. 在本文件补充当前 sprint 的目标、范围和任务拆解。",
      "2. 在 `tasks/checklist.md` 中追加任务条目与执行记录。",
      "3. 在 `tasks/tasks.csv` 中按执行记录逐行追加台账。",
      "4. 在 `code-review/` 目录中按状态化命名规则写入 CR 结果。"
    ].join("\n");
  },
  checklist(context) {
    return [
      `# ${titleizeSprint(context.currentSprint)} Checklist`,
      "",
      "- [ ] **TK-001** 在当前 sprint 中补充首个真实任务（负责人：TBD｜优先级：P0｜截止：TBD｜状态：todo）",
      "  - 执行记录：plan=初始化完成后补充首个真实任务;result=待补充;verify=待补充"
    ].join("\n");
  },
  tasksCsv(context) {
    return [
      renderCsvRow(context.csvColumns),
      renderCsvRow([
        "TK-001-01",
        "TK-001",
        "Bootstrap initial sprint records",
        "TBD",
        "P0",
        context.dateStamp,
        "todo",
        context.currentProject,
        context.currentSprint,
        "初始化后补充首个真实任务",
        "待补充",
        "待补充",
        "",
        context.dateStamp
      ])
    ].join("\n");
  }
};

const EN_US_TEMPLATES = {
  agents(context) {
    return [
      "# Repo AI Governor Workspace Rules",
      "",
      "## Current Context",
      "",
      `- Current project: \`${context.currentProject}\``,
      `- Current sprint: \`${context.currentSprint}\``,
      `- Project docs root: \`${context.docsRoot}/\``,
      `- Task records: \`${context.docsRoot}/tasks/\``,
      `- Code review records: \`${context.docsRoot}/code-review/\``,
      "",
      "## Source Of Truth",
      "",
      "1. Structured configuration and standards documents are the source of truth.",
      "2. `AGENTS.md` is the repository-level AI execution entrypoint for IDEs and agents.",
      "3. When rules in docs and `AGENTS.md` diverge, update `AGENTS.md` to match the structured docs.",
      "",
      "## Working Rules",
      "",
      "1. Keep repository configuration under the configured governor root directory.",
      "2. Write project execution artifacts under `docs/<project>/sprint-xxx/`.",
      "3. Keep code review output under `code-review/` with status-prefixed file names.",
      "4. Prefer the configured workflow order: plan -> breakdown -> implement -> self-check -> review -> review-verify -> task-sync.",
      "",
      "## Naming Rules",
      "",
      "1. Project directory format: `docs/<project>/`.",
      "2. Sprint directory format: `sprint-xxx`.",
      "3. Task file format: `TK-xxx.md`.",
      "4. Review file format: `review_<slug>.md`, `verified_review_<slug>.md`, `resolved_review_<slug>.md`.",
      "",
      "## Default Workflow",
      "",
      "1. Load `.repo-ai-governor/governor.yaml` and validate it against schema v1.",
      "2. Read enabled slot and adapter definitions before running workflow steps.",
      "3. Update sprint task records after implementation and self-check.",
      "4. Append verify results into the same CR file and rename it to the next review status."
    ].join("\n");
  },
  sprintIndex(context) {
    return [
      `# ${context.currentProject.toUpperCase()} ${context.currentSprint} Index`,
      "",
      "- Status: active",
      `- Date: ${context.dateStamp}`,
      `- Project: \`${context.currentProject}\``,
      `- Sprint: \`${context.currentSprint}\``,
      "",
      "## Scope",
      "",
      `This directory stores execution artifacts for project \`${context.currentProject}\` in \`${context.currentSprint}\`.`,
      "",
      "## Files",
      "",
      `- [${context.planFileName}](${context.planRelativePath}): Sprint plan and task breakdown.`,
      `- [${context.tasksDirectoryName}/${context.checklistFileName}](${context.checklistRelativePath}): Execution checklist.`,
      `- [${context.tasksDirectoryName}/${context.taskCsvFileName}](${context.taskCsvRelativePath}): Execution ledger in CSV format.`,
      `- \`${context.codeReviewDirectoryName}/\`: Directory for stateful code review records.`,
      "",
      "## Notes",
      "",
      "1. Add new work to `plan.md` first, then sync task cards, checklist, and CSV records.",
      "2. Write CR results under `code-review/` and use the filename prefix to indicate review status."
    ].join("\n");
  },
  sprintPlan(context) {
    return [
      `# ${context.currentProject.toUpperCase()} ${context.currentSprint} Plan`,
      "",
      "- Status: active",
      `- Date: ${context.dateStamp}`,
      "",
      "## Goal",
      "",
      "Bootstrap repository governance and prepare the standard execution structure for the current project and sprint.",
      "",
      "## Bootstrap Scope",
      "",
      `1. Generate the main config file \`${context.configFilePath}\` and the AI entry file \`${context.agentEntryPath}\`.`,
      `2. Initialize task and code review directories for project \`${context.currentProject}\` and sprint \`${context.currentSprint}\`.`,
      `3. Pre-create enabled adapter definitions: ${context.enabledAdaptersMarkdown}.`,
      "",
      "## Next Actions",
      "",
      "1. Extend this file with sprint goals, scope, and task breakdown.",
      "2. Append task entries and execution logs to `tasks/checklist.md`.",
      "3. Append one CSV row per execution update in `tasks/tasks.csv`.",
      "4. Write CR results into `code-review/` using stateful filenames."
    ].join("\n");
  },
  checklist(context) {
    return [
      `# ${titleizeSprint(context.currentSprint)} Checklist`,
      "",
      "- [ ] **TK-001** Add the first real task to this sprint (Owner: TBD | Priority: P0 | Due: TBD | Status: todo)",
      "  - Execution log: plan=add the first real task after bootstrap;result=pending;verify=pending"
    ].join("\n");
  },
  tasksCsv(context) {
    return [
      renderCsvRow(context.csvColumns),
      renderCsvRow([
        "TK-001-01",
        "TK-001",
        "Bootstrap initial sprint records",
        "TBD",
        "P0",
        context.dateStamp,
        "todo",
        context.currentProject,
        context.currentSprint,
        "Add the first real task after bootstrap",
        "Pending",
        "Pending",
        "",
        context.dateStamp
      ])
    ].join("\n");
  }
};

const INIT_DOCUMENT_TEMPLATES = {
  "zh-CN": ZH_CN_TEMPLATES,
  "en-US": EN_US_TEMPLATES
};

export function resolveInitTemplateLocale(locale) {
  return INIT_DOCUMENT_TEMPLATES[locale] ? locale : "zh-CN";
}

export function renderInitDocument(documentId, context) {
  const locale = resolveInitTemplateLocale(context.locale);
  const templateSet = INIT_DOCUMENT_TEMPLATES[locale];
  const render = templateSet[documentId];

  if (!render) {
    throw new TypeError(`Unknown init document template: ${documentId}`);
  }

  return ensureTrailingNewline(render(context));
}
