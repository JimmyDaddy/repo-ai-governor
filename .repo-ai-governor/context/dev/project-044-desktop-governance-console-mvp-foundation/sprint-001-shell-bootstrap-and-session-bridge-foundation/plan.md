# sprint-001-shell-bootstrap-and-session-bridge-foundation 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint Goal: 建立 Electron shell、typed preload、utility-process sidecar 与 session bridge 的 Phase 0 foundation。

## 1. Task Package

1. `TK-539` freeze electron desktop shell package layout preload contract and phase-0 gate baseline
2. `TK-540` implement utility-process desktop host bootstrap typed preload bridge and shared agent projection seam extraction
3. `TK-541` add shell bootstrap smoke session bridge validation and sprint-001 closeout evidence

## 2. Exit Criteria

1. Electron shell package layout、preload contract 与 utility-process ownership 已冻结为统一实现输入。
2. Desktop 能通过 typed bridge 消费 session health/list/subscribe 基线，而不是在 renderer 内本地拼接 runtime truth。
3. `AgentProjectionPanelViewModel` shared seam 抽离路径已被正式纳入 sprint 实施边界。
4. `project-044 / sprint-001` 的 planned stream 台账与 `current-context.md` 保持同步。

## 3. Milestones

1. 2026-04-04：创建 `sprint-001-shell-bootstrap-and-session-bridge-foundation`，作为 `project-044` 的首个 planned execution sprint。
2. 2026-04-04：完成 `TK-539`、`TK-540`、`TK-541` 任务卡拆解，并将 `project-044 / sprint-001` 登记到 `current-context.md` planned follow-up streams。
3. 2026-04-04：根据用户指令将 `project-044 / sprint-001` 激活为当前 primary execution surface，并将 `TK-539` 作为当前 in-flight 任务。
4. 2026-04-04：完成 `apps/desktop` 正式 package baseline、typed preload bridge、desktop session bridge 与 shared `@repo-ai-governor/reporting` seam extraction，并通过 build + desktop smoke + package/integration suites 证据收口。
