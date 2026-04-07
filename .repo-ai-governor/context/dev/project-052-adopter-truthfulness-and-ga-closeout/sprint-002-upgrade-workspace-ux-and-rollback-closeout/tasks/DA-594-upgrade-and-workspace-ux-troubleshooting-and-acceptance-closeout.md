# DA-594 upgrade and workspace UX troubleshooting and acceptance closeout

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Artifact ID: `DA-594`
- Produced By: `TK-594`
- Scope: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. Summary

1. `TK-592 ~ TK-594` 已把 `upgrade` 与 `workspace` adopter UX 的 contract、repo-external rehearsal evidence、troubleshooting guidance 收口到同一条 truth surface。
2. `docs/local-adoption-playbook*.md` 现在承载正式 troubleshooting guidance，`docs/support-matrix*.md` 记录 formal contract snapshot 与 acceptance snapshot，`README*` 只保留最小命令入口。
3. `sprint-002` 的实现边界现已完成，后续只剩 scoped CR loop、sprint closeout 与 `sprint-003` 激活。

## 2. Acceptance Evidence

1. Formal evidence file:
   - `.tmp/project-052-sprint-002-command-rehearsal-summary.json`
2. Upgrade acceptance result:
   - preview recorded `schema_upgrade_analyze`
   - apply recorded `schema_upgrade_apply` with `apply_status=applied` and `verify_status=passed`
   - rollback recorded `schema_upgrade_rollback` with `verify_status=passed`
3. Workspace acceptance result:
   - dry-run recorded `workspace_migration_plan`
   - execute recorded `workspace_migration_execute`
   - rollback recorded `workspace_migration_rollback` and `scratch_cleanup_status=removed`

## 3. Troubleshooting Truth Shipped In This Window

1. Upgrade troubleshooting:
   - preview blocking items must be resolved before `apply`
   - supported rollback requires saved `report_path` plus `apply_receipt_path` or `rollback_snapshot_path`
2. Workspace troubleshooting:
   - `plan_path` remains the only supported rollback hand-off input
   - `doctor` should be rerun after `execute` or `rollback` to confirm `workspaceRoot`
3. Rehearsal environment guardrail:
   - workspace migration drills should run in target repos or isolated external temp dirs rather than inside the governor source repository

## 4. Canonical Adopter Surfaces

1. `docs/local-adoption-playbook.md` / `docs/local-adoption-playbook.zh-CN.md`
2. `docs/support-matrix.md` / `docs/support-matrix.zh-CN.md`
3. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`

## 5. Validation

1. `pnpm run check`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run build`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-code-review-status-sync.js`
8. `node ./scripts/governance/check-worktree-review-target.js`

## 6. Next Boundary

1. 启动 `sprint-002-upgrade-workspace-ux-and-rollback-closeout` 的 scoped CR loop。
2. 若 fresh reviewer 发现 actionable finding，则主 agent 修复并重跑当前边界验证。
3. clean review 后立即创建 sprint closeout 任务，并切换到 `sprint-003-ga-support-truthfulness-and-closeout-evidence`。
