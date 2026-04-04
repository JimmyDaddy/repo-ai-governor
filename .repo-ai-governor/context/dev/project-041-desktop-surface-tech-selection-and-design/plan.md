# project-041-desktop-surface-tech-selection-and-design 计划

- Status: active
- Date: 2026-04-04
- Stage Mapping: Desktop surface planning follow-up
- Phase Mapping: Codex reference research / product-form selection / shell selection / MVP handoff
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-001-runtime-adoption-and-migration-baseline/tasks/TK-144-shared-local-orchestration-service-cli-desktop-contract-baseline.md`
  - `.repo-ai-governor/context/dev/project-014-langgraph-orchestration-runtime-adoption/sprint-003-service-backed-execution-and-desktop-transport/tasks/TK-154-orchestration-service-client-transport-neutral-streaming-and-desktop-ready-dto-hardening.md`
  - `.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-004-shared-loader-and-service-reuse/plan.md`
  - `.repo-ai-governor/context/dev/project-030-runtime-agent-projection-phase-2-productization/sprint-004-ui-consumer-and-rollout-closeout/tasks/TK-428.md`
  - `integrations/desktop/README.md`

## 1. 目标

1. 结合仓库既有 `desktop-ready` contract 与外部参考，确定 Repo AI Governor 桌面端应该先做成什么产品形态，而不是直接跳到某个 UI 框架实现。
2. 重点参考 `openai/codex` 的“shared harness / app server / thin client”模式，同时评估其与本仓库现有 Node service-host 现实之间的差异。
3. 在 `Electron`、`Tauri`、VS Code-family workbench 等候选方向中选出当前最可落地的 desktop shell 路线。
4. 产出一份可直接进入评审的桌面端技术选型与分阶段设计文档，并为后续实现型 sprint 留出 handoff。

## 2. Sprint 细化

## 2.1 sprint-001-codex-reference-research-and-shell-selection

- Status: active
- Sprint Goal: 产出桌面端产品形态与宿主框架的正式选型基线，并明确 MVP 设计边界与下一轮实现输入。
- Task Package: `TK-514`、`TK-515`、`TK-516`、`TK-517`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-514 | sprint-001 | activate project-041 and freeze desktop planning constraints | bootstrap/governance | current-context + desktop baseline docs | completed |
| TK-515 | sprint-001 | benchmark Codex-inspired desktop architecture and shell options | research/selection-matrix | TK-514 | completed |
| TK-516 | sprint-001 | author desktop technical selection and phased design baseline | planning/design-doc | TK-515 | completed |
| TK-517 | sprint-001 | convert selected direction into MVP implementation task package and activation handoff | planning/handoff | TK-516 | active |

## 4. 依赖产物策略

1. 本项目是 planning stream，不直接改写 PRD 或 formal technical solution；当前结论先沉淀为 execution artifact，待用户确认后再决定是否提升为正式方案或实现型 stream。
2. Desktop 运行时 owner 仍以既有 `shared local orchestration service` 为准；本项目不得把 renderer/desktop shell 提升为新的 runtime truth owner。
3. `integrations/desktop/**` 中已冻结的 `sidecar + ipc`、DTO/event contract 与 shared `AgentProjectionPanelViewModel` seam 视为硬约束，不重复发明第二套协议。
4. 外部参考以官方资料和主项目文档为准；若结论显著依赖外部资料，必须在产出文档中显式列出来源与检索日期。
5. 当前 worktree 已有另一个 completed closeout surface 作为 `primary`；因此本项目只作为并行 active stream 挂入 `current-context.md`，不覆盖现有 primary。

## 5. DoD（project-041 当前阶段）

1. 已明确桌面端先做“agent cockpit / governance console”还是“IDE workbench / pure chat shell”。
2. 已在宿主框架层面给出推荐结论，并解释为何当前更适合 `Electron` 或 `Tauri`。
3. 已输出一份包含架构草图、阶段拆分、风险与缓解建议的桌面端选型文档。
4. `current-context.md`、`plan.md`、`tasks/checklist.md` 与 `tasks/tasks.csv` 已同步。
5. 本轮变更仅涉及 docs/ledger/context；closeout 必须明确写明 docs-only，无需 `pnpm run build`。

## 6. 里程碑记录

1. 2026-04-04：用户确认当前项目桌面端尚未正式开始技术选型与设计，需要输出一份结合互联网参考的选型文档，并点名参考 `openai/codex`。
2. 2026-04-04：执行期间发现 `current-context.md` 已被外部工作流切到 `project-040-task-ledger-sqlite-canonical-truth-cutover`；为避免覆盖现有 primary，本项目改为并行 active stream，并顺延编号为 `project-041`。
3. 2026-04-04：完成 `TK-515`，已形成“Codex-like shared app server pattern + repo runtime constraints + desktop shell options”三者对齐的选择矩阵。
4. 2026-04-04：完成 `TK-516`，已产出 `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`，结论为“产品形态参考 Codex agent cockpit，MVP shell 首选 Electron；Tauri 保留为 service host 原生化后的下一阶段备选”。
5. 2026-04-04：将 `TK-517` 维持为 active handoff 任务，用于把当前选型结论转成下一条实现型 sprint 的任务包。
