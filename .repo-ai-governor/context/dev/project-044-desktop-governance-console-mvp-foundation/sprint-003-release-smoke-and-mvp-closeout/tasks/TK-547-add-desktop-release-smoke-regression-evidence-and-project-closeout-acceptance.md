# TK-547 add desktop release-smoke regression evidence and project closeout acceptance

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-003-release-smoke-and-mvp-closeout`

## 1. 任务目标

为 desktop governance console MVP foundation 补齐 release-smoke regression evidence、project closeout acceptance 与 completion audit 所需证据。

## 2. Depends On

1. `TK-545`
2. `TK-546`

## 3. 预期产物

1. desktop release-smoke evidence
2. project closeout acceptance record
3. project-level completion audit inputs

## 4. Required Inputs

1. `TK-545`
2. `TK-546`
3. `docs/support-matrix.md`
4. project-044 sprint ledgers

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-003-release-smoke-and-mvp-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-003-release-smoke-and-mvp-closeout/tasks/tasks.csv`

## 6. 实施计划

1. 汇总 desktop entry smoke、release verification、lifecycle/restart regression 与 build evidence。
2. 生成 project closeout 所需的 checklist、tasks.csv 与 completion audit 输入。
3. 若 artifact-pane gate 未开启，必须在 closeout 中显式记录 deferred reason。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run check:desktop-entry-smoke`
3. `pnpm run release:verify-local`
4. project closeout 前的定向 regression suites

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run check:desktop-entry-smoke`
3. `pnpm run release:verify-local`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 desktop release-smoke evidence 与 project closeout acceptance。
2. 2026-04-04：通过 `pnpm run build`、`pnpm run check:desktop-entry-smoke`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run release:verify-local` 收集 project closeout evidence。
3. 2026-04-04：产出 project completion audit summary、resolved review artifact 与 current-context closeout note，完成 `project-044` 的受审计收口。

## 10. 产出

1. 已完成：desktop release-smoke evidence -> `pnpm run release:verify-local`
2. 已完成：project closeout acceptance record -> `sprint-003/review/resolved_review_tk-539-tk-547-desktop-governance-console-mvp-foundation.md`
3. 已完成：project-level completion audit inputs -> `project-044-desktop-governance-console-mvp-foundation-completion-audit-summary.md`
