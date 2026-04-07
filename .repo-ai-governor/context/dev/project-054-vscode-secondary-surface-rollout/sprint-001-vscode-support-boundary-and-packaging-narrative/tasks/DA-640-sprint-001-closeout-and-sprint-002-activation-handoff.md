# DA-640 sprint-001 closeout and sprint-002 activation handoff

- Status: completed
- Date: 2026-04-07
- Project: `project-054-vscode-secondary-surface-rollout`
- Sprint: `sprint-001-vscode-support-boundary-and-packaging-narrative`
- Task: `TK-640`

## 1. 出口结论

`accept`

`project-054 / sprint-001-vscode-support-boundary-and-packaging-narrative` 已满足当前 sprint 的退出条件。VS Code secondary-surface 的正式支持边界、packaging narrative、support matrix / playbook / README truth，以及对应的 targeted verification 与 scoped CR loop 都已形成可回放事实链，可以作为 `sprint-002` 的正式输入。

本次 closeout 写回窗口只涉及 review artifact、治理台账、plan/context/history 与下一 sprint 激活，不新增 `apps/**`、`packages/**`、`bin/**` 或 `test/**` 下的 executable surface 变更；同窗口所需 build evidence 已由 `CR-002` 的修复验证链提供，因此 closeout 本身不要求再额外补跑一次 `pnpm run build`。

## 2. 验收范围

1. VS Code secondary-surface support truth：
   - source-checkout + extension-development host 继续是唯一正式支持的 VS Code 路径。
2. packaging / docs truth：
   - `docs/support-matrix*.md`、`docs/local-adoption-playbook*.md`、`docs/maintainer-validation-playbook*.md`、`README*` 与 `apps/vscode-extension/README.md` 已统一产品口径。
3. review closure：
   - `CR-001` 已完成 accepted finding 修复并收口为 `resolved`。
   - `CR-002` 已完成 accepted docs-parity-truthfulness finding 修复并 clean resolved。
4. closeout 与切换：
   - `current-context.md` 已切到 `sprint-002`。
   - `stream-project-054-sprint-001` 已迁入 `.repo-ai-governor/context/completed-streams-history.md`。
   - `TK-610` 已激活为下一条 primary task。

## 3. 出口判定

1. Exit Criteria 1：通过
   - VS Code secondary-surface boundary 与 packaging matrix 已冻结，public support truth 不再把 packaged distribution 误述为正式支持。
2. Exit Criteria 2：通过
   - 安装说明、support matrix 与 maintainer evidence narrative 已完成同步，public docs 不再 overclaim `check:ide-docs-parity` 的覆盖范围。
3. Exit Criteria 3：通过
   - targeted vitest、`pnpm run build`、`pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` 与 Biome 已在同一 repair window 中通过。
4. Review Closure：通过
   - `CR-001`、`CR-002` 均已 `resolved`，最新 round 未留下新的 actionable finding。

## 4. sprint-002 激活约束

1. `sprint-002` 只收口 VS Code MVP gap list、trust-sensitive diagnostics follow-through 与 desktop foundation non-goal guardrails，不重新打开 `sprint-001` 的 packaging truth。
2. `TK-610` 先冻结 MVP gap list 与 desktop foundation non-goal guardrails，再进入 `TK-611` 的 hardening 实装面。
3. 若后续发现 `sprint-002` 新事实与 `sprint-001` 的支持边界冲突，应先回写 public truth，再继续实现，不直接跳过到 `TK-611` / `TK-612`。

## 5. 关键产物

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-001-vscode-support-boundary-and-packaging-narrative/review/resolved_code_review_working-tree-20260407-1001.md`
2. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-001-vscode-support-boundary-and-packaging-narrative/review/resolved_code_review_working-tree-20260407-1023.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/context/completed-streams-history.md`
5. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/tasks/TK-610-freeze-vs-code-mvp-gap-list-and-desktop-foundation-non-goal-guardrails.md`

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. `pnpm run check`
