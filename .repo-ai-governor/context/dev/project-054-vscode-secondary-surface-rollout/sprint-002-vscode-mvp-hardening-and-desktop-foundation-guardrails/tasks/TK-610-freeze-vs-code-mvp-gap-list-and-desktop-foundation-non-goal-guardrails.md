# TK-610 freeze VS Code MVP gap list and desktop foundation non-goal guardrails

- Status: in_progress
- Date: 2026-04-06
- Task ID: `TK-610`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails`
- Project: `project-054-vscode-secondary-surface-rollout`

## 1. 任务目标

冻结 VS Code MVP gap list 与 desktop foundation non-goal guardrails。

## 2. Depends On

1. `TK-609`
2. `TK-640`

## 3. Expected Outputs

1. VS Code MVP gap list
2. desktop foundation non-goal guardrails
3. boundary truth handoff for `TK-611`

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/plan.md`
3. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-001-vscode-support-boundary-and-packaging-narrative/tasks/DA-640-sprint-001-closeout-and-sprint-002-activation-handoff.md`
4. `docs/support-matrix.md`
5. `apps/vscode-extension/README.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-001-vscode-support-boundary-and-packaging-narrative/review/resolved_code_review_working-tree-20260407-1001.md`
2. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-001-vscode-support-boundary-and-packaging-narrative/review/resolved_code_review_working-tree-20260407-1023.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 6. 实施计划

1. 盘点当前 VS Code source-checkout 路径仍缺失的 MVP capability、rehearsal 与 diagnostics truth。
2. 把 desktop 明确固定为 foundation-only surface，不在本 sprint 重新扩张产品壳。
3. 产出 `TK-611` 可直接消费的 MVP gap list、non-goal guardrails 与 acceptance boundary。

## 7. Development Verification

1. `pnpm run check:ide-entry-smoke`
2. `pnpm run check:ide-docs-parity`
3. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `sprint-001` 收口。
2. 2026-04-07：`TK-640` 完成 `sprint-001` closeout 与 activation handoff，任务切换为 `in_progress`，开始冻结 VS Code MVP gap list 与 desktop foundation non-goal guardrails。

## 10. 产出

1. 待执行：VS Code MVP gap list
2. 待执行：desktop foundation non-goal guardrails
3. 待执行：handoff notes for `TK-611`
