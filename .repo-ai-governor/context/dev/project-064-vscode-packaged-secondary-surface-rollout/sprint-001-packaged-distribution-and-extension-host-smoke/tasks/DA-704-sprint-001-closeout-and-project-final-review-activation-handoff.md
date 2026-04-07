# DA-704 sprint-001 closeout and project-final review activation handoff

- Status: completed
- Date: 2026-04-08
- Project: `project-064-vscode-packaged-secondary-surface-rollout`
- Sprint: `sprint-001-packaged-distribution-and-extension-host-smoke`
- Task: `TK-704`

## 1. Summary

1. `sprint-001-packaged-distribution-and-extension-host-smoke` 已完成 sprint-level closeout。
2. 当前 primary stream 继续保持 `project-064 / sprint-001`，但该 surface 现在专供 `project-064` 的 project-final CR loop 与最终项目收口复用。
3. `TK-670 ~ TK-672` 与 `CR-001` 的实现、验证与治理写回证据已经齐备，可以直接进入 `project-064` 的 project-final fresh reviewer loop。

## 2. Closed Evidence

1. `TK-670`：已冻结 VS Code packaged distribution 的正式 contract truth，明确支持边界为 built source checkout + extension-development host / locally generated VSIX。
2. `TK-671`：已补齐 `release:pack-vscode-extension`、`release:verify-vscode-extension-distribution`、packaged root/VSIX 物料与对应测试面。
3. `TK-672`：已完成 README、support matrix、local adoption / maintainer playbook 与 local distribution truthfulness refresh。
4. `CR-001`：delegated sprint CR loop 已 clean 收口，未返回新的 actionable finding。

## 3. Project-Final Activation Result

1. `project-064` plan 继续保持 `active`，并新增 `TK-704` closeout handoff 记录。
2. `sprint-001` plan 已恢复为当前阶段的 `completed` 真值；同一组 `tasks/` 与 `review/` 目录继续作为后续 `project-064` project-final review 的默认 surface。
3. 当前 sprint 的 `tasks/` 与 `review/` 目录继续作为 `project-064` project-final review 的默认 surface。

## 4. Verification Note

1. 本 closeout / project-final activation handoff 复用 `CR-001` clean recheck 与当前 sprint implementation 的同窗口验证证据：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-064-vscode-extension-distribution-report.json`、`node ./scripts/release/verify-local-distribution.js --output .tmp/project-064-local-distribution-report.json`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` 与 `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`。
2. closeout 阶段补跑治理同步检查：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js` 与 `pnpm run check`。
