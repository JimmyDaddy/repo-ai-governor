# TK-611 implement targeted VS Code MVP hardening and trust-sensitive diagnostics follow-through

- Status: planned
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

## 10. 产出

1. 待执行：targeted MVP hardening changes
2. 待执行：diagnostics follow-through changes
3. 待执行：verification evidence for `TK-612`
