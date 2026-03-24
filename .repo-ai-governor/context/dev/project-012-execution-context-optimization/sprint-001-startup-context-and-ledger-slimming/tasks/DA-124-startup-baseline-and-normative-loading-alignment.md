# DA-124 启动基线与规范加载分层对齐

- Status: active
- Date: 2026-03-24
- Source Task: `TK-126`
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-001-startup-context-and-ledger-slimming`

## 1. 结论

已将仓库级 agent 启动基线从“默认重读 triad 关键文档”收敛为“manifest 驱动的 `L0 默认加载 + L1 按需补载`”。

本轮对齐后：

1. 默认启动集合与 `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml` 保持一致。
2. `AGENTS.md` 不再要求所有任务默认加载 `overall technical solution` 与 `architecture`。
3. `long-term-maintenance-guide.md` 明确把 manifest 作为 startup baseline 的加载来源，而不是手写另一套默认集合。

## 2. 本轮调整

### 2.1 `AGENTS.md`

1. 新增 manifest 作为规范加载分层的唯一事实来源。
2. 明确默认启动只读取 `L0 + default_load=true` 与 `external_required_inputs`。
3. 将以下文档改为按 trigger 补载：
   - `repo-ai-governor-overall-technical-solution.md`
   - `repo-ai-governor-architecture-and-repo-layering.md`
   - `product-requirements.md`
4. 保留 `product-requirements-brief.md` 作为默认执行目标。

### 2.2 `long-term-maintenance-guide.md`

1. 将 Agent Startup Baseline 改为：
   - 先读 `AGENTS.md`
   - 再读 `normative-loading-manifest.yaml`
   - 再读 `current-context.md`
   - 然后补全所有 `L0 + default_load=true`
   - 仅在命中 `load_trigger` 时升级到 `L1/L2`
2. 显式列出当前默认启动集合，作为人工校验和后续回归的稳定基线。

## 3. 当前默认启动集合

按当前 manifest 解析，默认启动集合为：

1. `AGENTS.md`
2. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 4. 不再默认加载的文档

以下文档仍然是有效规范来源，但不再作为所有任务的默认启动集合：

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. 补载触发边界

1. `overall technical solution`
   - `architecture_change`
   - `runtime_contract_change`
   - `governance_engine_change`
2. `architecture and repo layering`
   - `layering_boundary_change`
   - `module_dependency_change`
   - `monorepo_migration_decision`
3. `product requirements full`
   - `scope_change`
   - `major_priority_decision`
   - `product_capability_alignment`
4. `master execution plan`
   - `project_sprint_planning`
   - `cross_stage_roadmap_update`

## 6. 约束与后续输入

1. 本轮只对齐启动语义，不改变 triad、manifest 与任务台账的事实来源关系。
2. `TK-127` 应继续处理 `current-context` 的 active/history 分层，避免 completed streams 长期留在默认入口。
3. `TK-128` 应继续处理 `TK/checklist/tasks.csv` 与任务模板的重复任务语义，避免任务级上下文继续膨胀。
4. 后续若 manifest 的 `L0` 集合发生变化，必须同步回看 `AGENTS.md` 与 `long-term-maintenance-guide.md`，避免再次出现双重启动基线。

## 7. 验证

1. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `pnpm run check`
