# TK-542 freeze governance console mvp panel contract and service-owned query boundary

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-002-governance-console-core-panels`

## 1. 任务目标

冻结 governance console MVP 的 panel/view-model contract 与 service-owned query boundary，使 workspace home、session lane、execution timeline、HITL 与 agent projection panel 有统一输入，而 `review / artifact pane` 继续受 query gate 限制。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`
2. `sprint-001` outputs

## 3. 预期产物

1. panel/view-model contract baseline
2. service-owned query boundary note
3. artifact-pane gate freeze record

## 4. Required Inputs

1. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
2. `integrations/desktop/README.md`
3. `TK-539`
4. `TK-540`
5. `TK-541`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-002-governance-console-core-panels/plan.md`
3. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`

## 6. 实施计划

1. 冻结 workspace/session/execution/HITL/agent projection 的 panel 输入输出边界。
2. 明确 renderer 允许消费的 service-owned query surface 与不允许的 filesystem bypass。
3. 记录 `review / artifact pane` 的 gate 条件与 deferred behavior。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only decomposition；当前阶段未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`、desktop panel integration tests 与 i18n evidence

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 governance console panel contract 与 query boundary 冻结。
2. 2026-04-04：完成 `desktop-governance-console.interface.ts`、`desktop-shell.interface.ts` 与 `desktop.constant.ts` 的 section / lifecycle / artifact gate contract freeze。
3. 2026-04-04：在 `integrations/desktop/README.md` 中固定 renderer 只消费 service-owned DTO/event/query seam，`artifact pane` 继续保持 gated deferred behavior。

## 10. 产出

1. 已完成：governance console panel contract baseline -> `apps/desktop/src/types/interfaces/desktop-governance-console.interface.ts`
2. 已完成：service-owned query boundary note -> `integrations/desktop/README.md`
3. 已完成：artifact-pane gate freeze record -> `apps/desktop/src/constants/desktop.constant.ts`
