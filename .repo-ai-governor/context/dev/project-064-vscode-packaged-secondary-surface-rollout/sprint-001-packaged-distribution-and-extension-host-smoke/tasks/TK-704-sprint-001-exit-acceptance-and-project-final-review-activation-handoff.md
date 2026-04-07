# TK-704 sprint-001 exit acceptance and project-final review activation handoff

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-064-vscode-packaged-secondary-surface-rollout`
- Sprint: `sprint-001-packaged-distribution-and-extension-host-smoke`

## 1. 任务目标

在 `TK-670`、`TK-671`、`TK-672` 与 `CR-001` 全部进入终态后，完成 `sprint-001` 的出口验收、closeout write-back，并把当前 sprint surface 固定为 `project-064` project-final CR loop 的默认 `tasks/` / `review/` 面。

## 2. Depends On

1. `TK-670`
2. `TK-671`
3. `TK-672`
4. `CR-001`

## 3. 预期产物

1. `DA-704-sprint-001-closeout-and-project-final-review-activation-handoff.md`
2. 更新后的 `project-064` / `sprint-001` plan
3. 更新后的 `current-context.md`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/plan.md`
4. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/tasks.csv`
5. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/review/resolved_code_review_working-tree-20260408-0731.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/TK-670-freeze-vs-code-packaged-distribution-contract-and-smoke-gate.md`
2. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/TK-671-implement-vsix-build-release-path-and-extension-host-smoke-followup.md`
3. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/TK-672-close-vs-code-packaged-secondary-surface-support-declaration.md`
4. `.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/CR-001.md`

## 6. 实施计划

1. 汇总 `sprint-001` 当前所有已终态 task / review evidence，确认出口验收输入完整。
2. 形成 sprint-001 closeout summary 与 project-final review activation handoff 所需输入。
3. 在 closeout 完成后同步 project / sprint plan、`current-context.md` 与 task ledger，同时继续保留当前 sprint surface 供 `project-064` project-final CR loop 使用。

## 7. Development Verification

1. 校对 `tasks.csv` 最新终态是否已覆盖 `TK-670`、`TK-671`、`TK-672` 与 `CR-001`。
2. 校对 `project-064 / sprint-001` 在 project-final CR round 打开前继续保持同一 active sprint surface。

## 8. Delivery Verification

1. 复用 `CR-001` 同窗口验证证据：`pnpm run build`
2. 复用 `CR-001` 同窗口 package/integration/release verification：`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run release:verify-vscode-extension-distribution -- --output .tmp/project-064-vscode-extension-distribution-report.json`、`node ./scripts/release/verify-local-distribution.js --output .tmp/project-064-local-distribution-report.json`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity`、`pnpm exec biome check apps/vscode-extension/src apps/vscode-extension/test apps/vscode-extension/package.json apps/vscode-extension/README.md`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-704 --tasks-dir ".repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`
7. `node ./scripts/governance/check-worktree-review-target.js`
8. `pnpm run check`

## 9. 执行记录

1. 2026-04-08：任务在 `TK-670`、`TK-671`、`TK-672` 与 `CR-001` 全部进入终态后创建。
2. 2026-04-08：已写入 `DA-704`、project/sprint closeout handoff 与 `current-context` note；当前 sprint surface 保留给后续 `project-064` project-final CR loop。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/tasks/DA-704-sprint-001-closeout-and-project-final-review-activation-handoff.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/plan.md`
3. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-064-vscode-packaged-secondary-surface-rollout/sprint-001-packaged-distribution-and-extension-host-smoke/plan.md`
4. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/current-context.md`
