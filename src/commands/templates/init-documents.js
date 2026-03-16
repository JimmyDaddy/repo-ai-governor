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
      `1. Read \`${context.contextFilePath}\` before acting.`,
      "2. Treat that file as the mutable source for the primary execution stream and any parallel streams.",
      "3. Update the context file instead of editing `AGENTS.md` when project, sprint, or stream ownership changes.",
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
      `2. Read the primary stream paths from \`${context.contextFilePath}\` and write execution artifacts there.`,
      "3. Add concurrent work as additional stream entries in the context file instead of rewriting the entrypoint file.",
      "4. Keep code review output under each stream's `code-review/` directory with status-prefixed file names.",
      "5. Prefer the configured workflow order: plan -> breakdown -> implement -> self-check -> review -> review-verify -> task-sync.",
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
  currentContext(context) {
    return [
      "# Workspace Current Context",
      "",
      "## Primary Stream",
      "",
      "- Status: active",
      `- Project: \`${context.currentProject}\``,
      `- Sprint: \`${context.currentSprint}\``,
      `- Docs root: \`${context.docsRoot}/\``,
      `- Task records: \`${context.docsRoot}/tasks/\``,
      `- Code review records: \`${context.docsRoot}/code-review/\``,
      "",
      "## Active Streams",
      "",
      `- \`primary\`: project=\`${context.currentProject}\`, sprint=\`${context.currentSprint}\`, docs=\`${context.docsRoot}/\`, status=\`active\``,
      "",
      "## Update Rules",
      "",
      "1. Switch project or sprint by updating this file instead of editing `AGENTS.md`.",
      "2. For concurrent work, append a new stream entry and keep exactly one `primary` stream.",
      "3. Sync task, checklist, CSV, and code-review paths here before execution starts."
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
  },
  adaptersReadme() {
    return [
      "# Adapters Directory",
      "",
      "存放 adapter 配置文件（例如 `codex.yaml`、`github-copilot.yaml`、`claude-code.yaml`）。",
      "",
      "1. `init --adapter <name>` 会自动生成对应适配器文件。",
      "2. 你也可以按项目需要手工新增或覆盖这些文件。",
      "3. `doctor` 会校验已启用 adapter 的配置是否可用。"
    ].join("\n");
  },
  slotsReadme() {
    return [
      "# Slots Directory",
      "",
      "存放项目自定义 slot 定义文件，用于扩展治理流程规则。",
      "",
      "1. 新增 slot 后，请在 `governor.yaml` 的 `slots.enabled` 中启用。",
      "2. `check/review/report` 会按当前阶段解析并应用命中的 slot。",
      "3. script extension 仅做声明，不会在默认模式下直接执行。"
    ].join("\n");
  },
  templatesReadme() {
    return [
      "# Templates Directory",
      "",
      "存放仓库本地可复用的文档或提示词模板。",
      "",
      "1. 可用于 `plan/review/report` 的项目特化模板。",
      "2. 建议和 `skills/*/templates` 协同使用，避免重复维护。"
    ].join("\n");
  },
  reportsReadme() {
    return [
      "# Reports Directory",
      "",
      "存放 `check/review/review-verify/report` 生成的结构化报告和渲染结果。",
      "",
      "1. `check --write-report` 会生成或更新最新报告。",
      "2. `report` 可以将 JSON 或 CR 记录渲染成 markdown/json/summary。"
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
      `1. Read \`${context.contextFilePath}\` before acting.`,
      "2. Treat that file as the mutable source for the primary execution stream and any parallel streams.",
      "3. Update the context file instead of editing `AGENTS.md` when project, sprint, or stream ownership changes.",
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
      `2. Read the primary stream paths from \`${context.contextFilePath}\` and write execution artifacts there.`,
      "3. Add concurrent work as additional stream entries in the context file instead of rewriting the entrypoint file.",
      "4. Keep code review output under each stream's `code-review/` directory with status-prefixed file names.",
      "5. Prefer the configured workflow order: plan -> breakdown -> implement -> self-check -> review -> review-verify -> task-sync.",
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
  currentContext(context) {
    return [
      "# Workspace Current Context",
      "",
      "## Primary Stream",
      "",
      "- Status: active",
      `- Project: \`${context.currentProject}\``,
      `- Sprint: \`${context.currentSprint}\``,
      `- Docs root: \`${context.docsRoot}/\``,
      `- Task records: \`${context.docsRoot}/tasks/\``,
      `- Code review records: \`${context.docsRoot}/code-review/\``,
      "",
      "## Active Streams",
      "",
      `- \`primary\`: project=\`${context.currentProject}\`, sprint=\`${context.currentSprint}\`, docs=\`${context.docsRoot}/\`, status=\`active\``,
      "",
      "## Update Rules",
      "",
      "1. Update this file instead of `AGENTS.md` when the active project or sprint changes.",
      "2. Append a new stream entry for concurrent work and keep exactly one `primary` stream.",
      "3. Sync task, checklist, CSV, and code-review paths here before execution begins."
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
  },
  adaptersReadme() {
    return [
      "# Adapters Directory",
      "",
      "Stores adapter configuration files such as `codex.yaml`, `github-copilot.yaml`, and `claude-code.yaml`.",
      "",
      "1. `init --adapter <name>` generates adapter files automatically.",
      "2. You can still add or override adapter files for project-specific behavior.",
      "3. `doctor` validates enabled adapter definitions."
    ].join("\n");
  },
  slotsReadme() {
    return [
      "# Slots Directory",
      "",
      "Stores project-local slot definitions used to extend governance behavior.",
      "",
      "1. Add new slot files and enable them in `governor.yaml` under `slots.enabled`.",
      "2. `check/review/report` resolve and apply matching slots by stage.",
      "3. Script extensions are declarative by default and are not executed automatically."
    ].join("\n");
  },
  templatesReadme() {
    return [
      "# Templates Directory",
      "",
      "Stores reusable repository-local prompt and document templates.",
      "",
      "1. Use this directory for project-specific `plan/review/report` template variants.",
      "2. Prefer sharing logic with `skills/*/templates` to avoid drift."
    ].join("\n");
  },
  reportsReadme() {
    return [
      "# Reports Directory",
      "",
      "Stores generated governance reports from `check/review/review-verify/report`.",
      "",
      "1. `check --write-report` updates latest report artifacts.",
      "2. `report` renders JSON or review records into markdown/json/summary."
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
