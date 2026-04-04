# project-044-desktop-governance-console-mvp-foundation 计划

- Status: planned
- Date: 2026-04-04
- Stage Mapping: Desktop governance console MVP foundation rollout
- Phase Mapping: Electron shell bootstrap / session bridge and shared projection seam / governance console core panels / release smoke and MVP closeout
- Upstream:
  - `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`
  - `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
  - `integrations/desktop/README.md`
  - `docs/support-matrix.md`
  - `apps/cli/src/runtime/presentation/agent-projection-panel-view-model-builder.ts`
  - `apps/cli/src/react-cli/views/agent-projection-panel.tsx`

## 1. 目标

1. 将 `project-041` 的桌面端选型结论落成首条真实 implementation stream，但范围只覆盖 `Phase 0 + Phase 1` 的 governance console MVP foundation。
2. 在不破坏 `shared local orchestration service` runtime ownership 的前提下，补齐 Electron control shell、typed preload bridge、utility-process service host 与 session bridge。
3. 将 workspace home、session lane、execution timeline、HITL decision center 与 agent projection panel 落成首批 desktop MVP surfaces。
4. 为 desktop entry 补齐 release/smoke baseline，并保持 `review / artifact pane` 仍受 service-owned query contract gate 约束。

## 2. Sprint 细化

## 2.1 sprint-001-shell-bootstrap-and-session-bridge-foundation

- Status: planned
- Sprint Goal: 建立 Electron shell、typed preload、utility-process sidecar 与 session bridge 的 Phase 0 foundation。
- Task Package: `TK-539`、`TK-540`、`TK-541`。

## 2.2 sprint-002-governance-console-core-panels

- Status: planned
- Sprint Goal: 落地 desktop governance console 的核心面板，并让 renderer 严格消费 service-owned DTO / event seam。
- Task Package: `TK-542`、`TK-543`、`TK-544`。

## 2.3 sprint-003-release-smoke-and-mvp-closeout

- Status: planned
- Sprint Goal: 补齐 desktop release smoke、window lifecycle / notification / restart guards，并在 artifact query gate 约束下完成 MVP closeout。
- Task Package: `TK-545`、`TK-546`、`TK-547`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-539 | sprint-001 | freeze electron desktop shell package layout preload contract and phase-0 gate baseline | desktop/shell-contract | project-041 activation handoff + desktop baseline docs | planned |
| TK-540 | sprint-001 | implement utility-process desktop host bootstrap typed preload bridge and shared agent projection seam extraction | desktop/shell-bootstrap | TK-539 | planned |
| TK-541 | sprint-001 | add shell bootstrap smoke session bridge validation and sprint-001 closeout evidence | desktop/smoke-and-closeout | TK-539、TK-540 | planned |
| TK-542 | sprint-002 | freeze governance console mvp panel contract and service-owned query boundary | desktop/panel-contract | project-041 activation handoff + sprint-001 outputs | planned |
| TK-543 | sprint-002 | implement workspace home session lane execution timeline hitl center and agent projection panel | desktop/mvp-panels | TK-542 | planned |
| TK-544 | sprint-002 | add governance console integration i18n and regression acceptance | desktop/panel-closeout | TK-542、TK-543 | planned |
| TK-545 | sprint-003 | freeze desktop release smoke baseline packaging ownership and artifact-pane gate | desktop/release-contract | project-041 activation handoff + support matrix | planned |
| TK-546 | sprint-003 | implement notification window-lifecycle restart guards and conditional artifact-query integration seam | desktop/runtime-and-release | TK-545 | planned |
| TK-547 | sprint-003 | add desktop release-smoke regression evidence and project closeout acceptance | desktop/closeout-and-rollout | TK-545、TK-546 | planned |

## 4. 依赖产物策略

1. `project-044` 直接消费 `project-041` handoff 与 `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`，但不把 draft 误报为已 formalized technical solution。
2. 全项目只覆盖 `Phase 0 + Phase 1` 的 governance console MVP foundation；`Phase 2+` 明确留在 follow-up 窗口。
3. Desktop renderer 只能消费 service-owned DTO / event / query contracts，不得拥有 runtime truth，也不得通过文件系统旁路 artifact / review / transcript contract。
4. `AgentProjectionPanelViewModel` 必须先抽离为 shared package seam，再允许 desktop renderer 正式消费。
5. 所有 sprint 都必须遵守 `CS-021 / CS-033 / CS-034`：ledger 同步、用户可见文案走 i18n、代码窗口 closeout 需要真实 build evidence。

## 5. DoD（project-044）

1. Electron control shell 已能通过 utility-process sidecar 启动并连接既有 local orchestration service。
2. Desktop 已具备 `start / send / append / resume / list / subscribe session` 的正式 bridge，而不是 renderer-local continuity。
3. Governance console MVP 已至少包含 workspace home、session lane、execution timeline、HITL decision center 与 shared agent projection panel。
4. Desktop release smoke baseline 已包含 entry smoke、restart/lifecycle guards 与 closeout evidence。
5. `review / artifact pane` 若未满足 service-owned query gate，不得以 filesystem bypass 方式进入 MVP。

## 6. 里程碑记录

1. 2026-04-04：`project-041` 已完成桌面端选型与设计 planning closeout，并通过 activation handoff 推荐 `project-044` 作为首条实现型 stream。
2. 2026-04-04：已将 `project-044` 拆分为 `sprint-001 ~ sprint-003` 与 `TK-539 ~ TK-547`，范围固定为 `Phase 0 + Phase 1` governance console MVP foundation。
