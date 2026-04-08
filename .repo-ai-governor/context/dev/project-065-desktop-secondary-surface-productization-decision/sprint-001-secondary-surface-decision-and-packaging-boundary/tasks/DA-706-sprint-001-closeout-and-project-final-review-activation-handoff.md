# DA-706 sprint-001 closeout and project-final review activation handoff

- Status: completed
- Date: 2026-04-08
- Project: `project-065-desktop-secondary-surface-productization-decision`
- Sprint: `sprint-001-secondary-surface-decision-and-packaging-boundary`
- Task: `TK-706`

## 1. Summary

1. `sprint-001-secondary-surface-decision-and-packaging-boundary` 已完成 sprint-level closeout。
2. 当前 primary stream 继续保持 `project-065 / sprint-001`，但该 surface 现在专供 `project-065` 的 project-final CR loop 与最终项目收口复用。
3. `TK-673 ~ TK-675` 与 `CR-001 / CR-002` 的实现、验证与治理写回证据已经齐备，可以直接进入 `project-065` 的 project-final fresh reviewer loop。

## 2. Closed Evidence

1. `TK-673`：已冻结 desktop secondary surface 的正式决策为 built-source `foundation-only`，并明确排除了 standalone desktop installer、published desktop bundle 与 preferred secondary-surface claim。
2. `TK-674`：已用 README、playbook、integration docs 与 `verify-local-distribution` 断言强化 foundation-only guardrails。
3. `TK-675`：已把 support matrix、README、local adoption playbook、maintainer validation playbook 与 desktop integration docs 的口径统一到同一条 support-truth。
4. `CR-001`：已修复 ledger projection drift，并把 sprint review lifecycle 与 canonical ledger 同步回 `resolved` 真值。
5. `CR-002`：已修复 adopter playbook 对 desktop foundation proof chain 的 contract drift，并将 fresh reviewer recheck 收口为 clean。

## 3. Project-Final Activation Result

1. `project-065` plan 继续保持 `active`，并新增 `TK-706` closeout handoff 记录。
2. `sprint-001` plan 已恢复为当前阶段的 `completed` 真值；同一组 `tasks/` 与 `review/` 目录继续作为后续 `project-065` project-final review 的默认 surface。
3. 当前 sprint 的 `tasks/` 与 `review/` 目录继续作为 `project-065` project-final review 的默认 surface。

## 4. Verification Note

1. 本 closeout / project-final activation handoff 复用 `CR-002` clean recheck 与当前 sprint implementation 的同窗口验证证据：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:desktop-entry-smoke`、`node ./scripts/release/verify-local-distribution.js --output .tmp/project-065-sprint-001-desktop-foundation-report.json` 与 `pnpm run check`。
2. closeout 阶段补跑治理同步检查：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js` 与 `node ./scripts/governance/check-worktree-review-target.js`。
