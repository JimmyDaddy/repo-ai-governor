# TK-666 close CLI truthfulness hardening with cross-adapter evidence refresh

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-062-cli-continuity-and-adapter-truthfulness-hardening`
- Sprint: `sprint-002-adapter-probe-verify-truth-source-alignment`

## 1. 任务目标

通过 cross-adapter evidence refresh、truthfulness closeout 结论与 build evidence，完成 `project-062` 的 CLI hardening 收口。

## 2. Depends On

1. `TK-664`
2. `TK-665`

## 3. 预期产物

1. cross-adapter evidence refresh
2. project closeout recommendation
3. next-stream handoff input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/TK-664-freeze-connect-doctor-verify-transcript-truth-source-contract.md`
2. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-002-adapter-probe-verify-truth-source-alignment/tasks/TK-665-implement-adapter-probe-outcome-classification-and-presenter-safe-diagnostics-alignment.md`
3. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/project-053-real-adapter-invocation-productization-completion-audit-summary.md`
2. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/project-058-cli-session-continuity-and-claude-recovery-completion-audit-summary.md`

## 6. 实施计划

1. 执行 cross-adapter evidence refresh。
2. 对 continuity / truth-source 一致性给出 unified closeout judgment。
3. 为 `project-063` 的 adopter distribution truth lane 准备 handoff input。

## 7. Development Verification

1. cross-adapter doctor / verify regression
2. transcript truthfulness spot check

## 8. Delivery Verification

1. `pnpm run build`
2. project closeout evidence review

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：`TK-664 / TK-665` 已完成 truth-source freeze 与 diagnostics alignment，当前任务切换为 `in_progress`，开始收集 cross-adapter evidence refresh、same-window build/package verification 与 project closeout input。
3. 2026-04-08：已完成 `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`、`apps/cli/test/runtime/session-shell-transcript-store.test.ts` 与 `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts` 的定向回归，确认 continuity truth 与 adapter truth-source diagnostics 在同一窗口内保持一致。
4. 2026-04-08：已完成 same-window `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`，当前 sprint 的实现证据齐备，任务切换为 `completed`，下一边界进入 sprint-level delegated CR loop。

## 10. 产出

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. same-window verification: `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
5. same-window verification: `pnpm run build`
6. same-window verification: `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
7. same-window verification: `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
