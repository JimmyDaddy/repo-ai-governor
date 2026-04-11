# TK-766 add workspace nested slash-command discoverability and palette coverage

- Status: completed
- Date: 2026-04-11
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-082-session-shell-readability-and-workspace-discoverability`
- Sprint: `sprint-001-readability-tuning-and-workspace-subcommand-hints`

## 1. 任务目标

补齐 `/workspace` 前缀下的 nested slash-command discoverability，让用户可以直接看到并选择 `dry-run / execute / rollback / clear-config / switch-branch / set-ui-theme`，同时保持 bare `/` launcher shortlist 稳定。

## 2. Depends On

1. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`
3. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
4. `apps/cli/test/runtime/session-shell-ink-controller.test.ts`

## 3. 预期产物

1. `/workspace` nested slash discoverability registry 实现
2. 相关 palette/controller/runner 回归测试
3. 同步后的 session shell/CLI 文档说明

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
5. `apps/cli/src/constants/cli-workspace.constant.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/plan.md`
2. `.repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/sprint-001-readability-tuning-and-workspace-subcommand-hints/plan.md`
3. `packages/shared/src/i18n/locales/en-us.ts`
4. `packages/shared/src/i18n/locales/zh-cn.ts`

## 6. 实施计划

1. 为 slash registry 显式注册 `/workspace` nested entries，并复用现有 workspace action i18n summary 真值。
2. 保持 `/workspace` 执行语义继续回落到现有 bridge argv，不引入新的 parser family 或 capability source。
3. 补齐 registry、controller、runner 与 frame render 的回归覆盖，并同步说明文档。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-766 --tasks-dir ".repo-ai-governor/context/dev/project-082-session-shell-readability-and-workspace-discoverability/sprint-001-readability-tuning-and-workspace-subcommand-hints/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为“`/workspace` nested slash discoverability + palette coverage”，不改 workspace command runtime 语义。
2. 2026-04-11：完成 `/workspace` nested slash discoverability registry 扩展，显式补齐 `dry-run / execute / rollback / clear-config / switch-branch / set-ui-theme`，并继续复用既有 workspace bridge argv 语义。
3. 2026-04-11：补齐 registry/controller/runner/render 回归覆盖，确认 bare `/` launcher shortlist 保持不变，而 `/workspace` 前缀可直接展示 nested action hints。
4. 2026-04-11：执行指定 vitest 回归集与 `pnpm run build`，验证通过。

## 10. 产出

1. 已完成：workspace nested slash discoverability implementation -> `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. 已完成：palette/controller/runner regression evidence -> `apps/cli/test/runtime/session-slash-command-registry.test.ts`、`apps/cli/test/runtime/session-shell-ink-controller.test.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`、`apps/cli/test/runtime/react-cli-runner.test.ts`
3. 已完成：discoverability docs sync -> `apps/cli/README.md`、`docs/local-adoption-playbook.md`、`docs/local-adoption-playbook.zh-CN.md`、`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`、`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
