# DA-641 sprint-002 exit acceptance and project-final review handoff

- Status: completed
- Date: 2026-04-07
- Project: `project-054-vscode-secondary-surface-rollout`
- Sprint: `sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails`
- Task: `TK-641`

## 1. Exit Acceptance Summary

1. `TK-610`、`TK-611`、`TK-612` 已全部进入 `completed`，对应 VS Code MVP gap freeze、trust-sensitive/service-health diagnostics hardening、以及 secondary surface rollout summary / desktop recommendation 均已落盘。
2. sprint-scoped `CR-001` 已完成 2 个 accepted finding 修复并 clean 收口为 `resolved`；当前 sprint review surface 未留下新的 actionable finding。
3. `sprint-002` 的正式 closeout 真值现已落到 sprint/project plan；下一条执行边界固定为 `project-054` 的 project-final scoped CR loop，并继续使用当前 sprint surface 作为默认 review / ledger 面。

## 2. Verification Baseline For This Handoff

1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-contract.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts apps/vscode-extension/test/vscode-extension-packaging-boundary.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/README.md .repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
3. `pnpm run build`
4. `pnpm run check:ide-entry-smoke`
5. `pnpm run check:ide-docs-parity`
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
7. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
8. `pnpm run check`
9. `node ./scripts/governance/check-task-ledger-sync.js`
10. `node ./scripts/governance/check-sprint-plan-status-sync.js`
11. `node ./scripts/governance/check-code-review-status-sync.js`
12. `node ./scripts/governance/check-worktree-review-target.js`

## 3. Next Boundary

1. `project-054-vscode-secondary-surface-rollout` project-final scoped CR loop
2. first review round: `CR-002` on the current `sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails` tasks / review surface
3. activation timing: immediately after `TK-641` ledger write-back；在 project-final clean 之前不切换到下一个 project
