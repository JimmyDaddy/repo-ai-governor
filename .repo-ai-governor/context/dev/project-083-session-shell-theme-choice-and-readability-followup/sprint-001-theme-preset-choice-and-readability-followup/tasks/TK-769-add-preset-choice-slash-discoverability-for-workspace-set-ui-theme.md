# TK-769 add preset-choice slash discoverability for workspace set-ui-theme

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-083-session-shell-theme-choice-and-readability-followup`
- Sprint: `sprint-001-theme-preset-choice-and-readability-followup`

## 1. 任务目标

让 `/workspace set-ui-theme` 在 session shell 里直接给出可选 preset，并修正 Enter 接受行为，使用户不需要先手输完整 preset 或先提交一个会失败的半成品命令。

## 2. Depends On

1. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. `apps/cli/src/react-cli/views/session-shell-live-app.tsx`
3. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
4. `apps/cli/test/runtime/session-shell-live-app.test.ts`
5. `packages/shared/src/i18n/locales/en-us.ts`
6. `packages/shared/src/i18n/locales/zh-cn.ts`

## 3. 预期产物

1. `/workspace set-ui-theme` preset-choice slash discoverability 实现
2. 相关 palette/controller/runner 回归测试
3. 同步后的 session shell/CLI 文档说明

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
5. `apps/cli/src/constants/cli-react-theme.constant.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/plan.md`
3. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/plan.md`
4. `.repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/sprint-001-theme-preset-choice-and-readability-followup/plan.md`

## 6. 实施计划

1. 为 `/workspace set-ui-theme` 前缀生成 preset-choice 提示，复用现有 theme preset 与描述文案真值。
2. 修正带空格 slash 前缀下的 Enter 行为，使高亮的更具体子命令优先被接受，而不是直接提交不完整父命令。
3. 保持 `workspace set-ui-theme <preset>` 现有执行语义不变，只增强 session shell discoverability 和输入路径。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-769 --tasks-dir ".repo-ai-governor/context/dev/project-083-session-shell-theme-choice-and-readability-followup/sprint-001-theme-preset-choice-and-readability-followup/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为“theme preset 选项化 discoverability + 带空格 slash 前缀的 Enter 接受修正”。
2. 2026-04-11：完成 `/workspace set-ui-theme` preset-choice discoverability，session shell 现在会直接提示 `governor / catppuccin / calm`，继续复用既有 `workspace set-ui-theme <preset>` 执行语义。
3. 2026-04-11：修正带空格 slash 前缀下的 Enter 接受行为，使高亮的更具体子命令优先被接受，而不是直接提交缺 preset 的父命令。
4. 2026-04-11：执行指定 vitest 回归集与 `pnpm run build`，验证通过。

## 10. 产出

1. 已完成：theme preset choice discoverability implementation -> `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`、`apps/cli/src/react-cli/views/session-shell-live-app.tsx`
2. 已完成：palette/live-app regression verification evidence -> `apps/cli/test/runtime/session-slash-command-registry.test.ts`、`apps/cli/test/runtime/session-shell-live-app.test.ts`、`apps/cli/test/runtime/session-shell-ink-controller.test.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`、`apps/cli/test/runtime/react-cli-runner.test.ts`
3. 已完成：theme-choice docs/spec sync -> `apps/cli/README.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`、`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
