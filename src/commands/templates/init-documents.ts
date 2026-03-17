type TemplateLocale = "zh-CN" | "en-US";
type InitTemplateContext = {
  locale?: string;
  contextFilePath: string;
  currentProject: string;
  currentSprint: string;
  docsRoot: string;
  dateStamp: string;
  planFileName: string;
  planRelativePath: string;
  tasksDirectoryName: string;
  checklistFileName: string;
  checklistRelativePath: string;
  taskCsvFileName: string;
  taskCsvRelativePath: string;
  codeReviewDirectoryName: string;
  configFilePath: string;
  agentEntryPath: string;
  enabledAdaptersMarkdown: string;
  csvColumns: string[];
};
type TemplateRenderer = (context: InitTemplateContext) => string;
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

const ZH_CN_TEMPLATES: TemplateMap = {
  agents(context) {
    return [
      "# Repo AI Governor 工作区规则",
      "",
      "## 当前上下文",
      "",
      `1. 执行前先阅读 \`${context.contextFilePath}\`。`,
      "2. 将该文件视为主执行流与并行执行流的可变事实来源。",
      "3. 项目、sprint 或 stream 归属发生变化时，请更新上下文文件，而不是直接修改 `AGENTS.md`。",
      "",
      "## 事实来源",
      "",
      "1. 结构化配置与规范文档是唯一事实来源。",
      "2. `AGENTS.md` 是仓库级 AI 执行入口，供 IDE 与 agent 使用。",
      "3. 若 docs 与 `AGENTS.md` 规则不一致，应以结构化文档为准并回写 `AGENTS.md`。",
      "",
      "## 工作规则",
      "",
      "1. 仓库治理配置应统一维护在 governor 根目录下。",
      `2. 从 \`${context.contextFilePath}\` 读取主 stream 路径，并将执行产物写入对应位置。`,
      "3. 并发工作请在上下文文件中追加 stream 条目，不要改写入口文件。",
      "4. code review 产出应写入各 stream 的 `code-review/` 目录，并使用状态前缀命名。",
      "5. 默认遵循流程顺序：plan -> breakdown -> implement -> self-check -> review -> review-verify -> task-sync。",
      "",
      "## 命名规则",
      "",
      "1. 项目目录格式：`docs/<project>/`。",
      "2. Sprint 目录格式：`sprint-xxx`。",
      "3. 任务文件格式：`TK-xxx.md`。",
      "4. 评审文件格式：`review_<slug>.md`、`verified_review_<slug>.md`、`resolved_review_<slug>.md`。",
      "",
      "## 默认流程",
      "",
      "1. 读取 `.repo-ai-governor/governor.yaml` 并基于 schema v1 完成校验。",
      "2. 在执行流程前先加载已启用的 slot 与 adapter 定义。",
      "3. 实现与自检完成后，回写 sprint 任务记录。",
      "4. 复核结果追加到同一个 CR 文件，并将文件重命名为下一状态。",
    ].join("\n");
  },
  currentContext(context) {
    return [
      "# 工作区当前上下文",
      "",
      "## 主执行流",
      "",
      "- 状态：active",
      `- 项目：\`${context.currentProject}\``,
      `- Sprint：\`${context.currentSprint}\``,
      `- 文档根目录：\`${context.docsRoot}/\``,
      `- 任务记录目录：\`${context.docsRoot}/tasks/\``,
      `- 代码评审目录：\`${context.docsRoot}/code-review/\``,
      "",
      "## 活跃执行流",
      "",
      `- \`primary\`: project=\`${context.currentProject}\`, sprint=\`${context.currentSprint}\`, docs=\`${context.docsRoot}/\`, status=\`active\``,
      "",
      "## 更新规则",
      "",
      "1. 切换 project 或 sprint 时，请更新本文件，不要直接编辑 `AGENTS.md`。",
      "2. 并发工作时请追加新 stream 条目，并保持且仅保持一个 `primary`。",
      "3. 开始执行前请先在此同步 task、checklist、CSV 和 code-review 路径。",
    ].join("\n");
  },
  sprintIndex(context) {
    return [
      `# ${context.currentProject.toUpperCase()} ${context.currentSprint} 索引`,
      "",
      "- 状态：active",
      `- 日期：${context.dateStamp}`,
      `- 项目：\`${context.currentProject}\``,
      `- Sprint：\`${context.currentSprint}\``,
      "",
      "## 范围",
      "",
      `本目录用于沉淀当前 \`${context.currentProject}\` 项目的 \`${context.currentSprint}\` 执行资料。`,
      "",
      "## 文件",
      "",
      `- [${context.planFileName}](${context.planRelativePath}): 当前 sprint 的方案与任务拆解。`,
      `- [${context.tasksDirectoryName}/${context.checklistFileName}](${context.checklistRelativePath}): 任务执行 checklist。`,
      `- [${context.tasksDirectoryName}/${context.taskCsvFileName}](${context.taskCsvRelativePath}): 任务执行 CSV 台账。`,
      `- \`${context.codeReviewDirectoryName}/\`: 状态化 code review 记录目录。`,
      "",
      "## 说明",
      "",
      "1. 新任务应先写入 `plan.md`，再同步任务卡、checklist 与 CSV 台账。",
      "2. CR 结果统一写入 `code-review/`，并通过文件名前缀体现评审状态。",
    ].join("\n");
  },
  sprintPlan(context) {
    return [
      `# ${context.currentProject.toUpperCase()} ${context.currentSprint} 计划`,
      "",
      "- 状态：active",
      `- 日期：${context.dateStamp}`,
      "",
      "## 目标",
      "",
      "完成仓库治理基础设施的初始化，并为当前项目与 sprint 准备标准执行目录。",
      "",
      "## 初始化范围",
      "",
      `1. 生成主配置文件 \`${context.configFilePath}\` 与 AI 入口文件 \`${context.agentEntryPath}\`。`,
      `2. 初始化当前项目 \`${context.currentProject}\` 与 \`${context.currentSprint}\` 的任务和 code review 目录。`,
      `3. 预置已启用的 adapter 定义：${context.enabledAdaptersMarkdown}。`,
      "",
      "## 后续动作",
      "",
      "1. 在本文件补充当前 sprint 的目标、范围和任务拆解。",
      "2. 在 `tasks/checklist.md` 中追加任务条目与执行记录。",
      "3. 在 `tasks/tasks.csv` 中按执行记录逐行追加台账。",
      "4. 在 `code-review/` 目录中按状态化命名规则写入 CR 结果。",
    ].join("\n");
  },
  checklist(context) {
    return [
      `# ${titleizeSprint(context.currentSprint)} 任务清单`,
      "",
      "- [ ] **TK-001** 在当前 sprint 中补充首个真实任务（负责人：TBD｜优先级：P0｜截止：TBD｜状态：todo）",
      "  - 执行记录：plan=初始化完成后补充首个真实任务;result=待补充;verify=待补充",
    ].join("\n");
  },
  tasksCsv(context) {
    return [
      renderCsvRow(context.csvColumns),
      renderCsvRow([
        "TK-001-01",
        "TK-001",
        "初始化首批 sprint 记录",
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
        context.dateStamp,
      ]),
    ].join("\n");
  },
  adaptersReadme() {
    return [
      "# 适配器目录",
      "",
      "存放 adapter 配置文件（例如 `codex.yaml`、`github-copilot.yaml`、`claude-code.yaml`）。",
      "",
      "1. `init --adapter <name>` 会自动生成对应适配器文件。",
      "2. 你也可以按项目需要手工新增或覆盖这些文件。",
      "3. `doctor` 会校验已启用 adapter 的配置是否可用。",
    ].join("\n");
  },
  slotsReadme() {
    return [
      "# 插槽目录",
      "",
      "存放项目自定义 slot 定义文件，用于扩展治理流程规则。",
      "",
      "1. 新增 slot 后，请在 `governor.yaml` 的 `slots.enabled` 中启用。",
      "2. `check/review/report` 会按当前阶段解析并应用命中的 slot。",
      "3. script extension 仅做声明，不会在默认模式下直接执行。",
    ].join("\n");
  },
  templatesReadme() {
    return [
      "# 模板目录",
      "",
      "存放仓库本地可复用的文档或提示词模板。",
      "",
      "1. 可用于 `plan/review/report` 的项目特化模板。",
      "2. 建议和 `skills/*/templates` 协同使用，避免重复维护。",
    ].join("\n");
  },
  reportsReadme() {
    return [
      "# 报告目录",
      "",
      "存放 `check/review/review-verify/report` 生成的结构化报告和渲染结果。",
      "",
      "1. `check --write-report` 会生成或更新最新报告。",
      "2. `report` 可以将 JSON 或 CR 记录渲染成 markdown/json/summary。",
    ].join("\n");
  },
};

const EN_US_TEMPLATES: TemplateMap = {
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
      "4. Append verify results into the same CR file and rename it to the next review status.",
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
      "3. Sync task, checklist, CSV, and code-review paths here before execution begins.",
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
      "2. Write CR results under `code-review/` and use the filename prefix to indicate review status.",
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
      "4. Write CR results into `code-review/` using stateful filenames.",
    ].join("\n");
  },
  checklist(context) {
    return [
      `# ${titleizeSprint(context.currentSprint)} Checklist`,
      "",
      "- [ ] **TK-001** Add the first real task to this sprint (Owner: TBD | Priority: P0 | Due: TBD | Status: todo)",
      "  - Execution log: plan=add the first real task after bootstrap;result=pending;verify=pending",
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
        context.dateStamp,
      ]),
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
      "3. `doctor` validates enabled adapter definitions.",
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
      "3. Script extensions are declarative by default and are not executed automatically.",
    ].join("\n");
  },
  templatesReadme() {
    return [
      "# Templates Directory",
      "",
      "Stores reusable repository-local prompt and document templates.",
      "",
      "1. Use this directory for project-specific `plan/review/report` template variants.",
      "2. Prefer sharing logic with `skills/*/templates` to avoid drift.",
    ].join("\n");
  },
  reportsReadme() {
    return [
      "# Reports Directory",
      "",
      "Stores generated governance reports from `check/review/review-verify/report`.",
      "",
      "1. `check --write-report` updates latest report artifacts.",
      "2. `report` renders JSON or review records into markdown/json/summary.",
    ].join("\n");
  },
};

const INIT_DOCUMENT_TEMPLATES: Record<TemplateLocale, TemplateMap> = {
  "zh-CN": ZH_CN_TEMPLATES,
  "en-US": EN_US_TEMPLATES,
};

export function resolveInitTemplateLocale(locale: unknown): TemplateLocale {
  return locale === "zh-CN" || locale === "en-US" ? locale : "zh-CN";
}

export function renderInitDocument(documentId: string, context: InitTemplateContext): string {
  const locale = resolveInitTemplateLocale(context.locale);
  const templateSet = INIT_DOCUMENT_TEMPLATES[locale];
  const render = templateSet[documentId];

  if (!render) {
    throw new TypeError(`Unknown init document template: ${documentId}`);
  }

  return ensureTrailingNewline(render(context));
}
