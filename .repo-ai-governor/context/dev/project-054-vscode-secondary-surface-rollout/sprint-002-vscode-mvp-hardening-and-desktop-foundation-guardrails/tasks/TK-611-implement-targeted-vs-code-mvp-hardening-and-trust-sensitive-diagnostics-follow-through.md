# TK-611 implement targeted VS Code MVP hardening and trust-sensitive diagnostics follow-through

- Status: completed
- Date: 2026-04-06
- Task ID: `TK-611`
- Owner: `AI-Agent`
- Priority: `P1`
- Sprint: `sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails`
- Project: `project-054-vscode-secondary-surface-rollout`

## 1. 任务目标

实现 targeted VS Code MVP hardening 与 trust-sensitive diagnostics follow-through。

## 2. Depends On

1. `TK-610`

## 3. Expected Outputs

1. targeted MVP hardening
2. trust-sensitive diagnostics follow-through
3. implementation baseline for `TK-612`

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/plan.md`
3. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-002-vscode-mvp-hardening-and-desktop-foundation-guardrails/tasks/TK-610-freeze-vs-code-mvp-gap-list-and-desktop-foundation-non-goal-guardrails.md`
4. `apps/vscode-extension/README.md`
5. `docs/support-matrix.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/sprint-001-vscode-support-boundary-and-packaging-narrative/tasks/DA-640-sprint-001-closeout-and-sprint-002-activation-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 6. 实施计划

1. 按 `TK-610` 冻结出的 MVP gap list 逐项实现当前 sprint 必要 hardening。
2. 对 trust-sensitive diagnostics 路径补齐 runtime / docs / tests 的 follow-through。
3. 为 `TK-612` 留下 closeout summary、verification evidence 与 review-ready surface。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run check:ide-entry-smoke`
3. `pnpm run check:ide-docs-parity`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-06：任务创建，等待 `TK-610` 完成。
2. 2026-04-07：`TK-610 / DA-610` 已完成 contract freeze，任务切换为 `in_progress`，开始推进 trust-sensitive diagnostics 与 targeted VS Code MVP hardening。
3. 2026-04-07：已完成 runtime hardening，把 workspace context / review detail / `@governor` chat 的 service-health 与 trust-sensitive diagnostics 串到同一条 service-owned truth path，并补齐 presentation tests、build、package tests、integration tests 与 IDE smoke/docs parity 证据。

## 10. 产出

1. 已完成：在 `Workspace Context`、`Review Detail` 与 `@governor` chat 中补齐 trust-sensitive action diagnostics 与 local orchestration service lifecycle/topology/checkpoint/memory-provider 事实。
2. 已完成：把 workspace-context snapshot 从 editor-local facts 扩展为 service-health-aware snapshot，并保持所有 UI 面继续复用 service-owned query/command seam。
3. 已完成：为 `TK-612` 留下 `DA-611` 实施摘要与完整验证证据窗口。
