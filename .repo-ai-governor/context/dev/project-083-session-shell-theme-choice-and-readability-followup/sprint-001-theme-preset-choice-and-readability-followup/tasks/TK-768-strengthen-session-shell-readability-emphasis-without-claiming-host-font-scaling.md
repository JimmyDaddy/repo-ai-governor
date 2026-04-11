# TK-768 strengthen session-shell readability emphasis without claiming host font scaling

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-083-session-shell-theme-choice-and-readability-followup`
- Sprint: `sprint-001-theme-preset-choice-and-readability-followup`

## 1. 任务目标

基于 `project-082` 已完成的第一轮可读性增强，继续提升 session shell 默认阅读面的强调和对比度，让关键 chrome 不再给人“字体还很小”的体感，同时不宣称真实宿主字号控制。

## 2. Depends On

1. `apps/cli/src/react-cli/views/session-shell-app.tsx`
2. `apps/cli/src/react-cli/views/prompt-bar.tsx`
3. `apps/cli/src/react-cli/views/slash-command-palette.tsx`
4. `apps/cli/src/react-cli/views/transcript-pane.tsx`
5. `apps/cli/src/react-cli/theme/react-cli-theme-registry.ts`

## 3. 预期产物

1. session shell presenter follow-up readability uplift
2. 相关视图/runner 回归测试
3. 同步后的 session shell 规范与用户说明

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/plan.md`
2. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/plan.md`
3. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/sprint-001-theme-preset-choice-and-readability-followup/plan.md`

## 6. 实施计划

1. 继续减少 session shell 关键 chrome 的 dim 依赖，并提升 divider、prompt bar、palette 摘要等弱对比区域的可见度。
2. 视需要微调默认 theme token 的对比度，使默认 governor/catppuccin/calm 在 session shell 中更易读。
3. 保持 presenter-only 边界，不新增 font flag、host integration 或持久化字号偏好。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-768 --tasks-dir ".repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/sprint-001-theme-preset-choice-and-readability-followup/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为“presenter-level readability follow-up，不新增宿主级字号控制能力”。
2. 2026-04-11：完成 session shell readability follow-up，进一步提亮 prompt bar、command preview、divider 与 slash palette 摘要，使关键 chrome 不再依赖 dim 呈现。
3. 2026-04-11：同步 CLI README、本地采用手册与 session-shell contract/module docs，明确“真实字体大小仍由宿主终端/IDE 控制，本次只做 presenter-level 强调/对比度增强”。
4. 2026-04-11：执行指定 vitest 回归集与 `pnpm run build`，验证通过。

## 10. 产出

1. 已完成：session shell readability follow-up implementation -> `apps/cli/src/react-cli/views/prompt-bar.tsx`、`apps/cli/src/react-cli/views/session-shell-app.tsx`、`apps/cli/src/react-cli/views/slash-command-palette.tsx`
2. 已完成：readability regression verification evidence -> `apps/cli/test/runtime/session-shell-live-app.test.ts`、`apps/cli/test/runtime/session-shell-ink-controller.test.ts`、`apps/cli/test/runtime/session-slash-command-registry.test.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`、`apps/cli/test/runtime/react-cli-runner.test.ts`
3. 已完成：presenter-only readability docs/spec sync -> `apps/cli/README.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`、`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
