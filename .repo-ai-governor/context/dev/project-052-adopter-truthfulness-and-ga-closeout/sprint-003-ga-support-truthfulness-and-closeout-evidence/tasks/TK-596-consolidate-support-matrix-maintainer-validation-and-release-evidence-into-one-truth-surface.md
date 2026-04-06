# TK-596 consolidate support matrix maintainer validation and release evidence into one truth surface

- Status: planned
- Date: 2026-04-06
- Task ID: `TK-596`
- Owner: `AI-Agent`
- Priority: `P0`
- Sprint: `sprint-003-ga-support-truthfulness-and-closeout-evidence`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. 任务目标

把 support matrix、maintainer validation 与 release / clean-room evidence 汇总为统一 truth surface，让 adopter-facing GA support 口径与 maintainer-facing 证据可以通过同一 surface 回链并验证。

## 2. Depends On

1. `TK-595`

## 3. 预期产物

1. 更新后的 unified GA truth surface 文档
2. maintainer validation / release evidence consolidation 结果
3. `DA-596` handoff artifact 或等价 task output
4. 已同步的 sprint ledger 记录

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/plan.md`
4. `README.md`
5. `README.zh-CN.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-003-ga-support-truthfulness-and-closeout-evidence/tasks/TK-595-freeze-ga-support-truthfulness-evidence-schema-and-maintainer-cross-link-contract.md`
2. `docs/local-adoption-playbook.md`
3. `docs/local-adoption-playbook.zh-CN.md`
4. `docs/support-matrix.md`
5. `docs/support-matrix.zh-CN.md`

## 6. 实施计划

1. 基于 `TK-595` 的 evidence schema，对齐现有 support / validation / release 证据字段。
2. 更新 adopter-facing 与 maintainer-facing truth surface，消除重复或冲突叙事。
3. 写回 task artifact 与 ledger，为 `TK-597` closeout 提供统一证据面。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-04-06：任务创建，状态初始化为 `planned`，等待 `TK-595` 完成。

## 10. 产出

1. 待执行：unified GA truth surface
2. 待执行：maintainer validation / release evidence consolidation
