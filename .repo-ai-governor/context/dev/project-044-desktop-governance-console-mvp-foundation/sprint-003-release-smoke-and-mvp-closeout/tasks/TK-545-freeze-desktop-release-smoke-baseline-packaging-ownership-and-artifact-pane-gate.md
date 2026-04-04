# TK-545 freeze desktop release smoke baseline packaging ownership and artifact-pane gate

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-003-release-smoke-and-mvp-closeout`

## 1. 任务目标

冻结 desktop release smoke baseline、packaging ownership 与 artifact-pane gate，使 closeout 阶段对 installer/signing/notification/restart 与 query contract 边界有明确标准。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`
2. `docs/support-matrix.md`
3. `integrations/desktop/README.md`

## 3. 预期产物

1. desktop release smoke baseline
2. packaging / ownership note
3. artifact-pane gate freeze record

## 4. Required Inputs

1. `docs/support-matrix.md`
2. `integrations/desktop/README.md`
3. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
4. sprint-001 / sprint-002 outputs

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-003-release-smoke-and-mvp-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`

## 6. 实施计划

1. 冻结 desktop release smoke baseline，包括 desktop entry、utility-process restart、notification ownership 与 window wake。
2. 明确 packaging / signing / installer ownership，不把发布面和 renderer feature 实现混成一个模块。
3. 冻结 artifact-pane gate：只有 service-owned query contract ready 时才允许进入 MVP closeout。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only decomposition；当前阶段未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`、desktop release smoke 与 closeout audit evidence

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 desktop release baseline 与 artifact-pane gate 冻结。

## 10. 产出

1. 待执行：desktop release smoke baseline
2. 待执行：packaging ownership note
3. 待执行：artifact-pane gate freeze record
