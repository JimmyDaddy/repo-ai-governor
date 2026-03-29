# TK-334 `set-ui-theme` 主题可发现性与 selector 入口

- Status: completed
- Date: 2026-03-30
- Owner: AI-Agent
- Priority: P1
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-003-react-cli-shell-default-cutover`

## 1. 任务目标

补齐 `set-ui-theme` 的主题可发现性与交互式 selector 入口，让用户既能直接查看可用主题，也能在交互式 pretty 模式下不带参数完成选择。

## 2. Depends On

1. `TK-329`
2. `TK-330`
3. `TK-333`

## 3. 预期产物

1. `set-ui-theme --help` / `workspace --help` 中的可用主题列表
2. 交互式 TTY + pretty 模式下省略 `[theme]` 即可打开 selector 的能力
3. 非交互模式下缺少主题参数时的明确错误提示
4. docs / tests / task ledger 同步更新

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-003-react-cli-shell-default-cutover/plan.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
5. `apps/cli/src/main.ts`
6. `apps/cli/src/commands/workspace-command.ts`
7. `apps/cli/src/runtime/interactive-shell/`
8. `packages/shared/src/i18n/locales/en-us.ts`
9. `packages/shared/src/i18n/locales/zh-cn.ts`
10. `apps/cli/test/commands/workspace-command.test.ts`
11. `apps/cli/test/cli-output-contract.integration.test.ts`

## 5. Traceback References

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`

## 6. 实施计划

1. 将顶层 `set-ui-theme` 的主题参数改为可选，并在帮助面追加可用主题清单与 selector 提示。
2. 复用现有 React shell prompt adapter，实现缺少显式主题参数时的 live selector。
3. 在非交互路径返回清晰的“可选主题 + selector 提示”错误信息，避免 silent failure。
4. 同步更新中英文文档、定向测试与任务台账。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts`

## 8. Delivery Verification

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `pnpm run build`

## 9. 执行记录

1. 2026-03-30：任务创建，状态初始化为 `planned`。
2. 2026-03-30：根据用户反馈补充“用户如何查看可用 theme，以及是否能做成 selector”的收口项。
3. 2026-03-30：实现完成，`set-ui-theme --help` / `workspace --help` 已增加可用主题清单与 selector 提示；交互式 TTY + pretty 模式下省略 `[theme]` 会打开 React shell selector。
4. 2026-03-30：同步补齐非交互缺参错误提示、README / playbook 中英双语说明，以及定向测试覆盖。

## 10. 产出

1. 已完成：`set-ui-theme` / `workspace` 帮助面中的主题发现入口。
2. 已完成：省略 `[theme]` 时的 React shell selector 入口。
3. 已完成：非交互缺参时的明确可选主题提示。
4. 已完成：docs / tests / task ledger 同步收口。
