# Repo AI Governor 工作区规则

## 当前上下文

1. 执行任何操作前，先阅读 `.repo-ai-governor/context/current-context.md`。
2. 将该文件视为主执行流及所有并行流的可变信息源。
3. 当项目、迭代或执行流归属发生变更时，更新上下文文件而非编辑 `AGENTS.md`。

## 唯一事实来源

1. 结构化配置和标准文档是唯一事实来源。
2. `AGENTS.md` 是仓库级 AI 执行入口，供 IDE 和 AI 代理使用。
3. 当文档与 `AGENTS.md` 中的规则出现分歧时，以结构化文档为准更新 `AGENTS.md`。
4. 根目录 `GEMINI.md` 与 `CLAUDE.md` 应仅作为薄引用入口，默认指向并复用 `AGENTS.md`，不再分别维护独立的长篇规则副本。

## 产品入口

1. 在规划或执行之前，AI 代理必须阅读 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`，并将其视为规范加载分层与触发条件的唯一事实来源。
2. 默认启动只读取 manifest 中 `L0 + default_load=true` 的文档与 `external_required_inputs`；当前默认集合包括：
   - `.repo-ai-governor/context/current-context.md`
   - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
   - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
3. 仅当任务命中 manifest 中的 `load_trigger` 时，才补载 `L1/L2` 文档，避免默认上下文持续膨胀。
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md` 是工具级架构与运行时契约的北极星文档，仅在 `architecture_change`、`runtime_contract_change`、`governance_engine_change` 等场景下补载。
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md` 用于架构边界和仓库分层，仅在 `layering_boundary_change`、`module_dependency_change`、`monorepo_migration_decision` 等场景下补载。
6. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md` 是默认执行目标，用于防止实现过程中的范围偏移。
7. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md` 是完整的产品参考文档，仅在 `scope_change`、`major_priority_decision`、`product_capability_alignment` 等场景下补载。
8. 对 `.repo-ai-governor/normative_knowledge_sources/product-requirements.md` 的任何更新，必须在同一变更集中同步更新 `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`。
9. 功能实现必须优先服务产品目标：治理采用本工具的仓库中的 AI 开发工作流。
10. 本仓库自身的治理工作流用作自托管验证路径，而非主要产品目标。

## 标准入口

1. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` 与 `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md` 属于默认 `L0` 启动集合。
2. 所有实现和评审输出必须遵循 `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md` 中的不可协商规则和验证命令。
3. 若 manifest 与本文件的加载说明出现分歧，以 manifest 为准并在同一变更窗口更新本文件。

## 外部信息补充

1. 当仓库内规范文档、上下文台账或本地代码无法独立支撑当前任务时，AI 代理可以进行必要的网络搜索，以补充外部事实、官方文档、生态方案或兼容性信息。
2. 网络搜索只作为辅助输入，不得覆盖 `.repo-ai-governor/**` 下的结构化配置、规范文档和上下文台账这些仓库内事实来源。
3. 若任务结论显著依赖外部搜索结果，AI 代理应在输出中明确说明这一点，并优先引用官方文档、主项目文档或一手资料。

## Skill 入口

1. 项目内 repository-local skills 位于 `.codex/skills/**/SKILL.md`。
2. skill 不是默认启动集合；只有当任务明显命中对应工作流时，才按需读取相应 `SKILL.md`，避免上下文重复膨胀。
3. 当前项目内可直接引用的 skill：
   - 技术方案提升 / draft 转正式：`.codex/skills/technical-solution-promotion/SKILL.md`
   - 当前工作区 code review / CR 复核 / CR 修复：`.codex/skills/workspace-code-review-workflow/SKILL.md`
   - 当前工作区收尾 / 提交 / 推送：`.codex/skills/workspace-delivery-finisher/SKILL.md`
4. 命中 skill 后，先遵循本文件和仓库规范入口，再读取对应 `SKILL.md` 执行其细化流程；若 `SKILL.md` 与仓库规范冲突，仍以 `.repo-ai-governor/**` 下结构化真值和本文件约束为准。

## 工作规则

1. 新的规划或执行工作应遵循 `.repo-ai-governor/context/current-context.md` 中声明的活跃执行流路径。
2. 主执行流的任务分解必须更新上下文文件中声明的执行流专属 `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv` 和 `tasks/TK-xxx.md` 路径。
3. 代码评审输出必须写入 `current-context.md` 解析出的默认 `review/` 目录：默认使用 active primary stream；若存在 `Worktree Review Target`，则优先写入其 `review/` 目录，并使用有意义的状态前缀文件名。
4. 默认 CR 生命周期：
   - `code_review_<slug>.md`：评审已生成，待验证
   - `verified_code_review_<slug>.md`：验证已完成
   - `resolved_code_review_<slug>.md`：已接受的发现已解决
5. 评审复查必须将结果追加到同一 CR 文件中，然后将文件重命名为下一状态。
6. 迭代执行进度必须维护在主执行流的检查清单中，每个任务条目应追加执行记录。
7. 每个 `project-xxx` 在收尾为 `completed` 前，必须产出项目级完成态审计摘要（推荐命名 `project-xxx-completion-audit-summary.md`），并在项目 `plan.md` 中新增“里程碑记录”入口回链该文档。

## 命名规则

1. 项目目录格式：`.repo-ai-governor/context/dev/<project-xxx>/`,其中 `xxx` 是项目有意义的名字，例如 `project-001-demo`、`project-002-core-features` 等
2. 迭代目录格式：`sprint-xxx`，其中 `xxx` 是迭代有意义的名字，例如 `sprint-001-initial-setup`、`sprint-002-core-features` 等
3. 任务文件格式：`TK-xxx.md`
4. CSV 任务登记文件：`tasks.csv`
5. 检查清单文件：`checklist.md`
6. CR 文件格式：`code_review_<slug>.md`、`verified_code_review_<slug>.md`、`resolved_code_review_<slug>.md`
7. `<slug>` 应包含任务 ID 或变更范围，例如 `tk-001-initialize-sprint-templates`
8. `tasks/checklist.md` 使用扁平任务列表，并在每个任务下追加多条执行记录
9. `tasks/tasks.csv` 每行存储一条执行记录，字段为 `execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at`

## 默认工作流

1. 更新或创建计划。
2. 拆分任务并同步检查清单和 CSV。
3. 执行实现。
4. 运行自检。
5. 编写 `review_<slug>.md`。
6. 将验证结果追加到同一 review 文件中，并将其重命名为 `verified_review_<slug>.md`。
7. 已接受的问题修复后，将其重命名为 `resolved_review_<slug>.md`。
8. 将执行记录追加到 `tasks/checklist.md` 和 `tasks/tasks.csv`。
9. project 收尾时生成 `project-xxx-completion-audit-summary.md`。
10. 在项目 `plan.md` 的“里程碑记录”中登记该审计摘要入口并保留历史记录。
