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

1. 在执行任务时，如果有必要，AI 代理可以搜索互联网获取信息，以辅助任务分析、实现、调试、验证和交付。
2. 当仓库内规范文档、上下文台账或本地代码无法独立支撑当前任务时，AI 代理可以进行必要的网络搜索，以补充外部事实、官方文档、生态方案或兼容性信息。
3. 网络搜索只作为辅助输入，不得覆盖 `.repo-ai-governor/**` 下的结构化配置、规范文档和上下文台账这些仓库内事实来源。
4. 若任务结论显著依赖外部搜索结果，AI 代理应在输出中明确说明这一点，并优先引用官方文档、主项目文档或一手资料。

## Skill 入口

1. 项目内 repository-local skills 位于 `.codex/skills/**/SKILL.md`。
2. skill 不是默认启动集合；只有当任务明显命中对应工作流时，才按需读取相应 `SKILL.md`，避免上下文重复膨胀。
3. 当前项目内可直接引用的 skill：
   - 技术方案草案生成 / 按模板起草 / draft 初始化：`.codex/skills/technical-solution-drafting/SKILL.md`
   - 技术方案提升 / draft 转正式：`.codex/skills/technical-solution-promotion/SKILL.md`
   - 技术方案评审 / draft 评审 / 审批前复核：`.codex/skills/technical-solution-review/SKILL.md`
   - 当前工作区 code review / CR 复核 / CR 修复：`.codex/skills/workspace-code-review-workflow/SKILL.md`
   - 当前工作区 task/sprint/project 执行 + 子 agent 循环 CR：`.codex/skills/workspace-scoped-cr-loop/SKILL.md`
   - 当前工作区收尾 / 提交 / 推送：`.codex/skills/workspace-delivery-finisher/SKILL.md`
4. 命中 skill 后，先遵循本文件和仓库规范入口，再读取对应 `SKILL.md` 执行其细化流程；若 `SKILL.md` 与仓库规范冲突，仍以 `.repo-ai-governor/**` 下结构化真值和本文件约束为准。

## 工作规则

1. 新的规划或执行工作应遵循 `.repo-ai-governor/context/current-context.md` 中声明的活跃执行流路径。
2. 新建 `.repo-ai-governor/draft/**` 下的 technical solution 草案时，默认遵循 `.repo-ai-governor/normative_knowledge_sources/governance/technical-solution-draft-template.md`，并优先通过 `.codex/skills/technical-solution-drafting/SKILL.md` 执行。
3. 主执行流必须维护对应的 `plan.md`、canonical task-ledger sqlite、rendered `tasks/checklist.md`、rendered `tasks/tasks.csv` 与任务卡；实现任务使用 `tasks/TK-xxx.md`，code review 管理任务使用 `tasks/CR-xxx.md`。
4. 代码评审输出必须写入 `current-context.md` 解析出的默认 `review/` 目录：默认使用 active primary stream；若存在 `Worktree Review Target`，则优先写入其 `review/` 目录，并使用有意义的状态前缀文件名。
5. 默认 CR 生命周期：
   - `code_review_<slug>.md`
   - `verified_code_review_<slug>.md`
   - `resolved_code_review_<slug>.md`
6. 实施进度必须先写 canonical task-ledger sqlite，再重渲染 `checklist.md` 与 `tasks.csv`。
7. 新建 `TK-xxx` 时，默认遵循 `task-card-template.md`。
8. 新建 `CR-xxx` 时，默认也遵循 `task-card-template.md`，但状态流转使用 `review_pending -> verified -> resolved`，且不得复用实现任务 `TK-xxx` 的编号空间。
9. `TK` 与 `CR` 共同构成任务语义主写入面；task-ledger sqlite 是任务账面 canonical truth；`checklist.md` 与 `tasks.csv` 为 rendered/derived views，修复漂移时先修语义文档或 canonical sqlite，再重渲染派生面。
10. 当某 sprint 下所有 `TK` 最新状态均为 `completed` 且所有 `CR` 最新状态均为 `resolved` 时，必须立即创建并推进该 sprint 的 closeout 任务；不得让 active sprint 长时间停留在“全部任务已终态但仍未 closeout”的状态。
11. `code_review_`、`verified_code_review_`、`resolved_code_review_` 的文件名前缀与顶部 `Status` 必须同步推进；若该评审已纳入任务台账，则对应 `CR-xxx` 状态也必须同步推进。
12. 每个 `project-xxx` 在收尾为 `completed` 前，必须产出项目级完成态审计摘要（推荐命名 `project-xxx-completion-audit-summary.md`），并在项目 `plan.md` 中新增“里程碑记录”入口回链该文档。

## 命名规则

1. 项目目录格式：`.repo-ai-governor/context/dev/<project-xxx>/`,其中 `xxx` 是项目有意义的名字，例如 `project-001-demo`、`project-002-core-features` 等
2. 迭代目录格式：`sprint-xxx`，其中 `xxx` 是迭代有意义的名字，例如 `sprint-001-initial-setup`、`sprint-002-core-features` 等
3. 实现任务文件格式：`tasks/TK-xxx.md`
4. 评审任务文件格式：`tasks/CR-xxx.md`
5. CSV 任务登记文件：`tasks.csv`
6. 检查清单文件：`checklist.md`
7. CR 文件格式：`code_review_<slug>.md`、`verified_code_review_<slug>.md`、`resolved_code_review_<slug>.md`
8. `<slug>` 应包含任务 ID 或变更范围，例如 `tk-001-initialize-sprint-templates`
9. `tasks/checklist.md` 使用扁平任务列表，并在每个任务下追加多条执行记录
10. `tasks/tasks.csv` 每行存储一条执行记录，字段为 `execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at`

## 默认工作流

1. 更新或创建计划。
2. 拆分任务并同步任务卡与 canonical task-ledger sqlite，再重渲染 `checklist.md` 与 `tasks.csv`：实现任务使用 `TK-xxx.md`，review 管理任务使用 `CR-xxx.md`。
3. 执行实现。
4. 运行自检。
5. 产出或更新评审文档；若评审生命周期纳入台账，则同步推进 `CR-xxx`。
6. 同步 canonical task-ledger sqlite、rendered checklist/CSV 与 review 生命周期状态。
7. 当 sprint 下实现任务与 CR 任务全部进入终态时，立即创建并推进 sprint closeout 任务。
8. project 收尾时生成 `project-xxx-completion-audit-summary.md`。
9. 在项目 `plan.md` 的“里程碑记录”中登记该审计摘要入口并保留历史记录。
