# TK-541 add shell bootstrap smoke session bridge validation and sprint-001 closeout evidence

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-001-shell-bootstrap-and-session-bridge-foundation`

## 1. 任务目标

为 sprint-001 补齐 desktop shell bootstrap smoke、session bridge validation 与 closeout evidence，使 `Phase 0` foundation 以真实验证而不是结构声明收口。

## 2. Depends On

1. `TK-539`
2. `TK-540`

## 3. 预期产物

1. shell bootstrap smoke evidence
2. session bridge validation evidence
3. sprint-001 closeout ledger / checklist evidence

## 4. Required Inputs

1. `integrations/desktop/README.md`
2. `docs/support-matrix.md`
3. `TK-539`
4. `TK-540`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-001-shell-bootstrap-and-session-bridge-foundation/tasks/tasks.csv`

## 6. 实施计划

1. 为 desktop entry、session bridge 与 utility-process lifecycle 补齐 smoke / integration evidence。
2. 确认 shared agent projection seam 已能被 desktop surface 消费。
3. 回写 sprint-001 的 checklist、tasks.csv 与 closeout 记录。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run check:desktop-entry-smoke`
3. 定向 desktop shell / session bridge 回归测试

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run check:desktop-entry-smoke`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 sprint-001 的 smoke、session bridge validation 与 closeout evidence。

## 10. 产出

1. 待执行：desktop shell smoke evidence
2. 待执行：session bridge validation record
3. 待执行：sprint-001 closeout entry
