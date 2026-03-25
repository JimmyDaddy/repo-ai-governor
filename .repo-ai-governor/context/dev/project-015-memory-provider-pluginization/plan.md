# project-015-memory-provider-pluginization 计划

- Status: active
- Date: 2026-03-26
- Stage Mapping: Post-Stage-9 runtime packaging modularization
- Phase Mapping: Runtime Modularity / Optional Plugin Resolution

## 1. 目标

1. 将 memory provider 从 CLI 全量内置依赖改造成 `built-in registry + optional plugin` 模式。
2. 冻结 registry、plugin resolution、distribution 与安全治理边界，避免 memory provider 继续硬耦合在默认 bundle 中。
3. 为后续 CLI、desktop 与 service-backed runtime 共享 memory seam 提供稳定的模块化落点。

## 2. Sprint 细化

## 2.1 sprint-001-registry-and-plugin-resolution-baseline

- Sprint Goal: 建立 `project-015` 主执行流，完成 memory provider pluginization 的 bootstrap、边界重排与后续拆解输入冻结。
- 任务包：`TK-159`、`TK-160`。
- Exit Criteria:
  1. `current-context.md` 已从 completed 的 `project-014 / sprint-003` 切换到 `project-015 / sprint-001`。
  2. `project-015` 的 project/sprint/task skeleton 已建立并通过治理同步 gate。
  3. `TK-159` 已完成 project-015 bootstrap；`TK-160` 已补齐 LangGraph full productization 残余 gap register 和 `project-016` planned follow-up skeleton。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-159 | sprint-001 | project-015 启动与 memory provider pluginization 重排 | bootstrap/plan | project-014 completion | in_progress |
| TK-160 | sprint-001 | LangGraph runtime productization gap register 与 project-016 planned follow-up 拆解 | baseline/plan | project-014 completion,TK-159 | completed |

## 4. 依赖产物策略

1. `project-015` 启动默认消费：
   - `project-014-langgraph-orchestration-runtime-adoption-completion-audit-summary.md`
   - `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`
   - `DA-160`
2. 后续 `DA-*` 仅在形成可复用基线、约束或正式方案后进入 artifact registry。

## 5. DoD（project-015）

1. memory provider 的 registry、plugin resolution 与发布边界具备正式基线。
2. CLI 默认 bundle 与 optional plugin 的责任边界清晰，且不引入新的 canonical source。
3. 项目级执行流、台账与后续 rollout 输入约束保持同步。

## 6. 里程碑记录

1. 2026-03-26：创建 `project-015`，将 `project-014 / sprint-003` 从 active surface 迁入 completed history，并切换到 memory provider pluginization follow-up 主线。
2. 2026-03-26：通过 `TK-160 / DA-160` 正式登记 “project-014 仅完成 first-phase” 的残余 gap，并拆解 planned `project-016-langgraph-runtime-productization` 作为后续收口项目。
