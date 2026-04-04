# TK-517 convert selected direction into MVP implementation task package and activation handoff

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-041-desktop-surface-tech-selection-and-design`
- Sprint: `sprint-001-codex-reference-research-and-shell-selection`

## 1. 任务目标

在用户确认本轮选型结论后，把推荐方向转成下一轮实现型 sprint 的 task package、包边界和验证门槛。

## 2. Depends On

1. `TK-516`

## 3. Acceptance

1. 下一轮实现型 stream/sprint 的范围、依赖顺序与退出标准清晰。
2. 明确 desktop host、renderer、service-host bootstrap、release packaging 与 smoke gate 的 ownership。
3. 不在本任务中直接开始工程实现，只输出可激活的 handoff。

## 4. Required Inputs

1. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
2. `integrations/desktop/README.md`
3. `docs/support-matrix.md`

## 5. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-worktree-review-target.js`
4. docs-only handoff；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 6. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-worktree-review-target.js`

## 7. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；待用户确认本轮桌面端选型结论后继续激活。
2. 2026-04-04：当前桌面端 planning stream 继续保持 `active`，本任务作为 handoff/activation work item 挂起，不直接展开桌面端工程实现。
3. 2026-04-04：已将桌面端选型结论收敛为 `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`，明确下一条执行流只覆盖 `Phase 0 + Phase 1`，并把 `review/artifact pane` 保持在 service-owned query gate 之后。
4. 2026-04-04：已创建 planned follow-up stream `project-044-desktop-governance-console-mvp-foundation`，拆分 `sprint-001 ~ sprint-003` 与 `TK-539 ~ TK-547`，并同步 `current-context.md`、completed stream history 与 project-041 closeout audit。

## 8. 产出

1. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-surface-tech-selection-and-design-completion-audit-summary.md`
