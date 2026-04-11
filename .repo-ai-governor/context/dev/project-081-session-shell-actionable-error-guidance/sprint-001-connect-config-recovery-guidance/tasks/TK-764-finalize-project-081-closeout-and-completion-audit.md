# TK-764 finalize project-081 closeout and completion audit

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-081-session-shell-actionable-error-guidance`
- Sprint: `sprint-001-connect-config-recovery-guidance`

## 1. 任务目标

在 `TK-763` 完成后，把 `project-081` 的 project/sprint plan、task ledger、completion audit、`current-context.md` 与 completed history 一次性收口到最终 `completed / idle` 真值。

## 2. Depends On

1. `TK-763`

## 3. 预期产物

1. `project-081-session-shell-actionable-error-guidance-completion-audit-summary.md`
2. `DA-764-project-081-final-closeout-and-idle-context-writeback.md`
3. 更新后的 `current-context.md` 与 `completed-streams-history.md`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/plan.md`
4. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/sprint-001-connect-config-recovery-guidance/plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/sprint-001-connect-config-recovery-guidance/tasks/TK-763-add-actionable-session-shell-recovery-guidance-for-structured-connect-errors.md`
2. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/plan.md`

## 6. 实施计划

1. 写入 `DA-764` 与 project completion audit summary，补齐 final closeout 的书面证据。
2. 将 project/sprint 计划、task ledger、`current-context.md` 与 completed history 同步为最终 completed / idle 真值。
3. 复跑同窗口 build/test 与 ledger 相关治理检查，确保 closeout claim 有完整证据支撑。

## 7. Development Verification

1. 已校对 `TK-763` 最新状态为 `completed`。
2. 当前 sprint 未创建 `CR` 任务，closeout 边界不存在待收口 review lifecycle。
3. 同一变更窗口内的代码边界已具备 targeted vitest、i18n parity 与 `pnpm run build` 验证目标。

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-763 --tasks-dir ".repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/sprint-001-connect-config-recovery-guidance/tasks"`
2. `node ./scripts/governance/sync-task-ledger.js --task-id TK-764 --tasks-dir ".repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/sprint-001-connect-config-recovery-guidance/tasks"`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-code-review-status-sync.js`
6. `node ./scripts/governance/check-worktree-review-target.js`
7. `node ./scripts/governance/check-i18n-parity-fallback.js`
8. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
9. `pnpm run build`

## 9. 执行记录

1. 2026-04-11：任务创建并在同一窗口直接推进到 `completed`，用于承接 `TK-763` clean 后的最终 closeout write-back。
2. 2026-04-11：已写入 `DA-764` 与 completion audit summary，并将 `project-081 / sprint-001` plan、`current-context.md` 与 `completed-streams-history.md` 同步到最终 `completed / idle` 真值。
3. 2026-04-11：已完成 `TK-763 / TK-764` canonical task-ledger sync，并复跑 targeted vitest、i18n parity、`pnpm run build` 与治理检查；当前项目已具备完整完成态证据。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/project-081-session-shell-actionable-error-guidance-completion-audit-summary.md`
2. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/sprint-001-connect-config-recovery-guidance/tasks/DA-764-project-081-final-closeout-and-idle-context-writeback.md`
3. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/plan.md`
4. `.repo-ai-governor/context/dev/project-081-session-shell-actionable-error-guidance/sprint-001-connect-config-recovery-guidance/plan.md`
5. `.repo-ai-governor/context/current-context.md`
6. `.repo-ai-governor/context/completed-streams-history.md`
