# TK-311 `workflow preview` 只读摘要与 M2 回归 gate

- Status: completed
- Date: 2026-03-29
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-002-react-cli-shell-surface-expansion`

## 1. 任务目标

提供 `workflow preview` 的只读模板/流程摘要/compiled IR 预览，并把它与 M2 回归 gate 一起收口，确保共享壳层扩展不破坏 M1 contract。

## 2. Depends On

1. `TK-309`
2. `TK-310`

## 3. 预期产物

1. `workflow preview` 只读 React shell
2. 流程摘要与 compiled IR 预览
3. M2 regression suite / gate

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
4. `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
5. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-309-connect-workspace-shared-shell-and-help-error-footer-unification.md`
6. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-002-react-cli-shell-surface-expansion/tasks/TK-310-init-default-react-routing-and-classic-fallback-ux-policy.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-307-m1-regression-testing-fallback-and-non-interactive-contract-gate.md`
3. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/review/resolved_code_review_working-tree-20260328-1829.md`

## 6. 实施计划

1. 以显式入口提供基于 `Ink` 的 `workflow preview` 只读壳层，展示模板选择、流程摘要与 compiled IR 预览。
2. 保证 `workflow preview` 不写文件，并在 contract 错误场景下保留可回退的只读摘要。
3. 将 `stderr-only`、fallback、non-interactive、`pretty/plain/json` 与 stdout 污染检查收敛为 M2 gate。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. 补齐并运行 `workflow preview`、stdio spawn 校验与 M2 定向 vitest / integration 覆盖。

## 8. Delivery Verification

1. `pnpm run check`
2. `workflow preview` 必须证明“不写文件、可回退、可预览 compiled IR”，且 M2 扩展不会退回到破坏 M1 contract 的状态。

## 9. 执行记录

1. 2026-03-28：任务创建，状态初始化为 `planned`。
2. 2026-03-28：依据技术方案 draft 的 M2 清单，改为收口 `workflow preview` 与 M2 regression gate。
3. 2026-03-29：任务切换为 `in_progress`，按 contract 要求补齐显式 `workflow preview` 子命令树、只读模板预览与 M2 回归门禁。
4. 2026-03-29：实现完成，已落地显式 `workflow preview` Commander 子命令、只读模板/compiled IR 预览、React shell 摘要与 stdout/stderr contract 回归覆盖。
5. 2026-03-29：验证通过 `pnpm -s tsc -p tsconfig.json --noEmit`、定向 vitest 与 `pnpm run check`，任务状态切换为 `completed`。

## 10. 产出

1. 已完成：显式 `workflow preview` Commander 子命令、模板选择、流程摘要与 compiled IR 只读预览。
2. 已完成：M2 regression suite / gate，覆盖 `stderr-only`、`pretty/plain/json`、`--no-interactive` 与“不写 workflow/compiled-ir 文件”约束。
3. 已完成：验证证据
   - `pnpm -s tsc -p tsconfig.json --noEmit`
   - `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/commands/workflow-command.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`
   - `pnpm -s vitest run --config vitest.packages.config.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/init-command.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`
   - `pnpm run check`
