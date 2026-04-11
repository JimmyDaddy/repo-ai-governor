# TK-771 fix session-shell live theme apply after workspace set-ui-theme succeeds

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-084-session-shell-theme-apply-followup`
- Sprint: `sprint-001-live-theme-apply-fix`

## 1. 任务目标

修复 `workspace set-ui-theme <preset>` 成功后当前 session shell 没有立即应用新主题的问题，并补齐对应回归测试。

## 2. Depends On

1. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
2. `apps/cli/test/runtime/session-shell-runner.test.ts`
3. `project-083-session-shell-theme-choice-and-readability-followup`

## 3. 预期产物

1. session shell live theme apply 修复
2. session-shell runner regression test
3. 同步后的任务台账

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
5. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/plan.md`
2. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/project-083-session-shell-theme-choice-and-readability-followup-completion-audit-summary.md`
3. `.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/plan.md`

## 6. 实施计划

1. 检查 `workspace set-ui-theme` 在 session shell 中的 direct bridge argv 与执行结果回灌路径。
2. 在成功执行后把新 theme preset 回写到当前前台 shell view-model。
3. 增加 runner 回归测试，覆盖成功执行后即时切换主题的行为。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-771 --tasks-dir ".repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/sprint-001-live-theme-apply-fix/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为 session shell live theme apply 修复与回归测试补齐。
2. 2026-04-11：确认根因是 direct command 成功后前台 session shell 没有把 `set-ui-theme` 的目标 preset 回写到当前 `viewModel.themePreset`。
3. 2026-04-11：完成 runtime 修复，在 direct `workspace set-ui-theme` 成功后即时同步当前前台 shell 的 theme preset。
4. 2026-04-11：补充 runner 回归测试，验证 `/workspace set-ui-theme calm` 后同一 shell 生命周期内的 `/status` 已显示 `theme=calm`。
5. 2026-04-11：执行指定 vitest 回归集与 `pnpm run build`，验证通过。

## 10. 产出

1. 已完成：session shell live theme apply fix -> `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
2. 已完成：runner regression coverage -> `apps/cli/test/runtime/session-shell-runner.test.ts`
3. 已完成：task ledger sync
