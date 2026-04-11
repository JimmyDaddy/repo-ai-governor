# TK-765 improve default session-shell readability without host-level font scaling

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-082-session-shell-readability-and-workspace-discoverability`
- Sprint: `sprint-001-readability-tuning-and-workspace-subcommand-hints`

## 1. 任务目标

在不新增 host-level font-size 控制的前提下，提升 session shell 默认阅读面的可见度，并把弱化样式约束回真正的低优先级噪音信息。

## 2. Depends On

1. `apps/cli/src/react-cli/views/session-shell-app.tsx`
2. `apps/cli/src/react-cli/views/transcript-pane.tsx`
3. `apps/cli/src/react-cli/views/composer-input.tsx`
4. `apps/cli/src/react-cli/views/slash-command-palette.tsx`

## 3. 预期产物

1. session shell presenter 的默认可读性增强实现
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
2. `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/sprint-001-readability-tuning-and-workspace-subcommand-hints/plan.md`
3. `apps/cli/src/react-cli/views/prompt-bar.tsx`

## 6. 实施计划

1. 调整 session shell 关键阅读面的 dim/visibility 策略，优先改善 transcript、composer 与 recap chrome 的可见度。
2. 调整 slash palette 的可见条目数与摘要截断宽度，确保 `/workspace` 全量子动作在 palette 中可直接阅读。
3. 保持 presenter-only 边界，不新增新的 host/font/theme 配置项。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-765 --tasks-dir ".repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/sprint-001-readability-tuning-and-workspace-subcommand-hints/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为“presenter-level 可读性增强，不新增 host-level font-size 控制能力”。
2. 2026-04-11：完成 session shell presenter-level readability tuning，减少 transcript title、recap label 与 composer placeholder 的 dim 依赖，并把 slash palette 默认可见条目提升到 8、摘要截断宽度放宽到 36 列。
3. 2026-04-11：同步 CLI README、本地采用手册与 session-shell contract/module docs，明确“真实字体大小仍由宿主终端/IDE 控制，本次只做 presenter-level 可读性增强”。
4. 2026-04-11：执行指定 vitest 回归集与 `pnpm run build`，验证通过。

## 10. 产出

1. 已完成：session shell readability tuning implementation -> `apps/cli/src/react-cli/views/slash-command-palette.tsx`、`apps/cli/src/react-cli/views/session-shell-live-app.tsx`、`apps/cli/src/react-cli/views/transcript-pane.tsx`、`apps/cli/src/react-cli/views/composer-input.tsx`
2. 已完成：readability regression verification evidence -> `apps/cli/test/runtime/session-shell-live-app.test.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`、`apps/cli/test/runtime/react-cli-runner.test.ts`
3. 已完成：presenter-only readability docs/spec sync -> `apps/cli/README.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`、`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
