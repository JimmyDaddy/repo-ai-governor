# TK-305 shell runner、UI mode resolver 与 stderr/SIGINT baseline

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-001-react-cli-shell-foundation`

## 1. 任务目标

建立 React shell 的最小运行骨架，固化 `ui_mode` 解析优先级、`stderr` 渲染边界与 `SIGINT` 清理语义。

## 2. Depends On

1. `TK-304`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`

## 3. 预期产物

1. shell runner / mode resolver baseline
2. `stderr` 输出通道约束
3. `SIGINT` / fallback 处理骨架

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/tasks/TK-304-project-027-activation-and-react-shell-implementation-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/commands/init-command.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/plan.md`
2. `.repo-ai-governor/context/dev/project-027-cli-interactive-shell-implementation/sprint-001-react-cli-shell-foundation/plan.md`

## 6. 实施计划

1. 建立 `--ui <mode>` 解析、`ui_mode` resolver 与 fallback reason 表达。
2. 固化 stderr-only renderer 与 shell mount/unmount 生命周期边界。
3. 让 `--no-interactive`、非 TTY、`plain/json` 统一收敛到 `ui_mode=none`。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts apps/cli/test/runtime/init-react-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts`

## 8. Delivery Verification

1. `apps/cli/test/cli-output-contract.integration.test.ts` 持续覆盖 machine output 与 non-interactive fallback contract。
2. `--ui react` 仅写 `stderr`，不污染 `plain/json` 自动化输出面。

## 9. 执行记录

1. 2026-03-28：任务创建，状态切换为 `in_progress`，开始搭建 shell runner 与输出边界。
2. 2026-03-28：新增 `apps/cli/src/constants/cli-interactive-shell.constant.ts`、`interactive-shell-ui-mode-resolver.ts` 与 `interactive-shell-stderr-renderer.ts`，建立 `ui_mode`、fallback 行为和 stderr-only renderer 基线。
3. 2026-03-28：`apps/cli/src/main.ts` 增加 `--ui <mode>` 解析，`CliRuntimeDebugOptions` 与 `CliNormalizedRuntimeDebugOptions` 扩展 `requestedUiMode/uiMode/uiFallbackBehavior`，并把 `--no-interactive`、非 TTY、`plain/json` 收敛到 `ui_mode=none`。
4. 2026-03-28：`init` React shell lifecycle 增加 `SIGINT` cancel + unmount 路径；非 `SIGINT` 初始化异常会回退 classic path 并记录 fallback check。

## 10. 产出

1. `apps/cli/src/constants/cli-interactive-shell.constant.ts`
2. `apps/cli/src/runtime/interactive-shell-ui-mode-resolver.ts`
3. `apps/cli/src/runtime/interactive-shell-stderr-renderer.ts`
4. `apps/cli/src/main.ts`
5. `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`
