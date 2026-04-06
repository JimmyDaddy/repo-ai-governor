# TK-594 close adopter-facing upgrade and workspace UX with troubleshooting acceptance

- Status: planned
- Date: 2026-04-06
- Task ID: `TK-594`
- Owner: `AI-Agent`
- Priority: `P0`
- Sprint: `sprint-002-upgrade-workspace-ux-and-rollback-closeout`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. 任务目标

以 troubleshooting 与 acceptance evidence 收口 adopter-facing upgrade 和 workspace UX。

## 2. Depends On

1. `TK-592`
2. `TK-593`

## 3. 预期产物

1. `DA-594-upgrade-and-workspace-ux-troubleshooting-and-acceptance-closeout.md`
2. `upgrade / workspace migration / rollback` adopter UX 的 troubleshooting 指南
3. sprint-002 acceptance evidence 与 closeout truth

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/TK-592-freeze-upgrade-workspace-migration-rollback-user-path-contract.md`
4. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/TK-593-implement-and-document-upgrade-preview-apply-rollback-plus-workspace-migration-closeout-path.md`
5. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/plan.md`
2. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/tasks/DA-230-sprint-003-activation-and-sprint-002-closeout-handoff.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-636-sprint-001-closeout-and-sprint-002-activation-handoff.md`

## 6. 实施计划

1. 汇总 `TK-592` / `TK-593` 的 contract 与实现结果，提炼 adopter-facing troubleshooting 和 acceptance 证据。
2. 以真实命令、文档和 evidence 收口 `upgrade / workspace migration / rollback` UX truth。
3. 为 sprint-002 scoped CR loop 与 closeout 生成可回放的最终输入。

## 7. Development Verification

1. `pnpm run check`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
7. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
8. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-592 / TK-593` 完成。

## 10. 产出

1. 待执行：`DA-594-upgrade-and-workspace-ux-troubleshooting-and-acceptance-closeout.md`
2. 待执行：troubleshooting 指南与 acceptance evidence
3. 待执行：供 sprint-002 closeout 与 project-level final CR loop 消费的最终输入
