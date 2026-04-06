# TK-593 implement and document upgrade preview apply rollback plus workspace migration closeout path

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-593`
- Owner: `AI-Agent`
- Priority: `P0`
- Sprint: `sprint-002-upgrade-workspace-ux-and-rollback-closeout`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. 任务目标

实现并文档化 upgrade preview/apply/rollback 与 workspace migration closeout 路径。

## 2. Depends On

1. `TK-592`

## 3. 预期产物

1. `DA-593-upgrade-preview-apply-rollback-and-workspace-migration-closeout-path.md`
2. `upgrade preview/apply/rollback` 的 adopter-facing CLI/runtime 路径
3. `workspace migration` closeout path 与双语 adopter-facing 文档更新

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/TK-592-freeze-upgrade-workspace-migration-rollback-user-path-contract.md`
4. `README.md`
5. `docs/local-adoption-playbook.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/plan.md`
2. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/tasks/DA-230-sprint-003-activation-and-sprint-002-closeout-handoff.md`
3. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-636-sprint-001-closeout-and-sprint-002-activation-handoff.md`

## 6. 实施计划

1. 按 `TK-592` 冻结后的 contract 盘点现有 CLI/runtime 行为与 adopter-facing 文档差异。
2. 实现 `preview / apply / rollback` 与 `workspace migration closeout` 所需的命令、文档和 evidence surface。
3. 为 `TK-594` 留下可直接消费的 troubleshooting 与 acceptance 输入，不在本任务重复完成 sprint closeout。

## 7. Development Verification

1. `pnpm run check`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `pnpm run check`
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
6. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
7. `pnpm run build`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-592` 完成。
2. 2026-04-06：`TK-592` 已完成 contract freeze，任务切换为 `in_progress`，开始推进 preview/apply/rollback 与 workspace migration closeout 的实现面。
3. 2026-04-06：已产出 `DA-593`，并在 repo 外隔离 fixture 中完成 upgrade 与 workspace 全链路 rehearsal，把现有 CLI/runtime 能力收口为正式 adopter path。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/tasks/DA-593-upgrade-preview-apply-rollback-and-workspace-migration-closeout-path.md`
2. `README.md` / `README.zh-CN.md`
3. `docs/local-adoption-playbook.md` / `docs/local-adoption-playbook.zh-CN.md`
4. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`
