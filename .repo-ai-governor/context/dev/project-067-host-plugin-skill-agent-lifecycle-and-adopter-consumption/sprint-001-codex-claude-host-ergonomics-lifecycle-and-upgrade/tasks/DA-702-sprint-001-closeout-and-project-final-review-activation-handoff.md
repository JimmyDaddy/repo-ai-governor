# DA-702 sprint-001 closeout and project-final review activation handoff

- Status: completed
- Date: 2026-04-08
- Project: `project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption`
- Sprint: `sprint-001-codex-claude-host-ergonomics-lifecycle-and-upgrade`
- Task: `TK-702`

## 1. Summary

1. `sprint-001-codex-claude-host-ergonomics-lifecycle-and-upgrade` 已完成 sprint-level closeout。
2. 当前 primary stream 继续保持 `project-067 / sprint-001`，但该 surface 现在专供 `project-067` 的 project-final CR loop 与最终项目收口复用。
3. `TK-679 ~ TK-681` 与 `CR-001 ~ CR-004` 的实现、验证与治理写回证据已经齐备，可以直接进入 `project-067` 的 project-final fresh reviewer loop。

## 2. Closed Evidence

1. `TK-679`：已冻结 Codex / Claude Code host-native lifecycle、upgrade 与 support-truth contract。
2. `TK-680`：已补齐 `host export` / `host pack` / `host verify` follow-up 闭环，并将 host-native refresh 语义限定为“重渲染 + 重校验”。
3. `TK-681`：已完成 README、support matrix、local adoption / maintainer playbook 与 release evidence refresh。
4. `CR-001 ~ CR-004`：delegated sprint CR loop 已 clean 收口，最后一轮 `CR-004` 未返回新的 actionable finding。

## 3. Project-Final Activation Result

1. `project-067` plan 继续保持 `active`，并新增 `TK-702` closeout handoff 记录。
2. `sprint-001` plan 继续保持 `active`，等待后续 `project-final` CR round 打开并收口后再恢复最终 `completed` 真值。
3. 当前 sprint 的 `tasks/` 与 `review/` 目录继续作为 `project-067` project-final review 的默认 surface。

## 4. Verification Note

1. 本 closeout / project-final activation handoff 复用 `CR-004` clean recheck 与当前 sprint implementation 的同窗口验证证据：`pnpm run build`、`pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-host-distribution.js --output .tmp/project-067-sprint-001-host-distribution-report.json`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run release:check` 与 `pnpm run release:notes -- --output .tmp/project-067-release-notes.md`。
2. closeout 阶段补跑治理同步检查：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js` 与 `pnpm run check`。
