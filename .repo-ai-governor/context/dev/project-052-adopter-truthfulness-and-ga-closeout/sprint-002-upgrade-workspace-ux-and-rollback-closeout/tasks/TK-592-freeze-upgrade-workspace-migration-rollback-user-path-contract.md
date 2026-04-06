# TK-592 freeze upgrade workspace migration rollback user-path contract

- Status: in_progress
- Date: 2026-04-06
- Task ID: `TK-592`
- Owner: `AI-Agent`
- Priority: `P0`
- Sprint: `sprint-002-upgrade-workspace-ux-and-rollback-closeout`
- Project: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. 任务目标

冻结 `upgrade`、`workspace migration` 与 `rollback` 的 adopter 用户路径与正式 contract，明确 sprint-002 后续实现只在已声明的支持边界内推进。

## 2. Depends On

1. `TK-591`
2. `TK-636`

## 3. 预期产物

1. `DA-592-upgrade-workspace-migration-rollback-user-path-contract-freeze.md`
2. `upgrade / workspace migration / rollback` 的 adopter 用户路径 contract 冻结结论
3. `TK-593` / `TK-594` 的 scope、acceptance 与非目标输入约束

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-002-upgrade-workspace-ux-and-rollback-closeout/plan.md`
3. `README.md`
4. `docs/local-adoption-playbook.md`
5. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-591-cleanroom-and-dist-binary-install-mode-evidence-refresh.md`
2. `.repo-ai-governor/context/dev/project-052-adopter-truthfulness-and-ga-closeout/sprint-001-install-mode-truth-and-playbook-alignment/tasks/DA-636-sprint-001-closeout-and-sprint-002-activation-handoff.md`
3. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/plan.md`
4. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-003-upgrade-and-workspace-lifecycle-ux-baseline/tasks/DA-230-sprint-003-activation-and-sprint-002-closeout-handoff.md`

## 6. 实施计划

1. 审计当前 `upgrade`、`workspace` 与 `rollback` 的 CLI/runtime/docs surface，整理 adopter 当前真实路径与缺口。
2. 明确推荐路径、支持边界、失败前提、rollback 触发点与不承诺项，冻结为 sprint-002 contract。
3. 将 contract 写回任务卡与后续任务输入，确保 `TK-593` / `TK-594` 不再继续漂移。

## 7. Development Verification

1. `rg -n "upgrade|rollback|workspace" README.md README.zh-CN.md docs/local-adoption-playbook*.md docs/support-matrix*.md`
2. `pnpm run check`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `sprint-001` 收口。
2. 2026-04-06：状态切换为 `in_progress`，开始冻结 `upgrade / workspace migration / rollback` adopter 用户路径 contract。

## 10. 产出

1. 待执行：`DA-592-upgrade-workspace-migration-rollback-user-path-contract-freeze.md`
2. 待执行：`README*` / `docs/local-adoption-playbook*` / `docs/support-matrix*` 的 sprint-002 contract 差异清单
3. 待执行：`TK-593` / `TK-594` 输入约束写回
