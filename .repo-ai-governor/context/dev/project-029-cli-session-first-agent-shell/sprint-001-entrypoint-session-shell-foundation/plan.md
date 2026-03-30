# sprint-001-entrypoint-session-shell-foundation 计划

- Status: completed
- Date: 2026-03-30
- Project: `project-029-cli-session-first-agent-shell`

## 1. Sprint Goal

完成默认入口分流、transcript shell 骨架、slash command palette skeleton 与退出语义基线。

## 2. Task Package

1. `TK-401` 无子命令入口分流与 session-shell runner 基线。
2. `TK-402` transcript / composer / prompt-bar React 组件。
3. `TK-403` slash command registry 与推荐过滤器。
4. `TK-404` `stderr-only` / fallback / non-interactive contract 回归，并固定 `/exit`、`Ctrl+C`、`Ctrl+D` 的退出语义。

## 3. Exit Criteria

1. `repo-ai-governor` 在 `TTY + pretty + interactive + no subcommand` 下可进入 session shell。
2. session shell 已具备 transcript、composer 与 slash palette 的最小可用展示面。
3. 退出语义与非交互回退 contract 已明确收口。

## 4. Execution Notes

1. 本 sprint 只建立 entrypoint / shell foundation，不在本轮承诺主 agent 多轮对话能力。
2. 当前 sprint 继续复用新号段 `TK-401 ~ TK-404`，避免与仓库内既有任务编号冲突。
3. 2026-03-30：已实现 `apps/cli/src/main.ts` 的 no-subcommand 入口分流、`CliSessionShellRunner` / readline prompt adapter / stderr renderer，以及 presenter-only transcript/composer/prompt-bar/slash palette React 组件骨架。
4. 2026-03-30：已完成定向验证：`pnpm run typecheck`、`pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts`、`pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts`。
