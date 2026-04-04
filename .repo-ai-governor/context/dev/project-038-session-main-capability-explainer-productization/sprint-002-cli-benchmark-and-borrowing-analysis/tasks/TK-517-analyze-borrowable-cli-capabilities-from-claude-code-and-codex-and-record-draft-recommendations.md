# TK-517 analyze borrowable cli capabilities from claude-code and codex and record draft recommendations

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-002-cli-benchmark-and-borrowing-analysis`

## 1. 任务目标

结合本地 `claude-code` 与 `codex` 仓库，对 `repo-ai-governor` 当前 CLI 的入口分层、session shell、capability discoverability、扩展机制、持久化状态与安全交互运行时做一次结构化对标分析，并把“哪些值得借鉴学习、哪些应条件化引入、哪些不应近期照搬”沉淀为 draft。

## 2. Depends On

1. `apps/cli/src/main.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`
4. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
5. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
6. `apps/cli/src/react-cli/views/session-shell-app.tsx`
7. `/Users/jimmydaddy/study/claude-code/src/main.tsx`
8. `/Users/jimmydaddy/study/claude-code/src/commands.ts`
9. `/Users/jimmydaddy/study/claude-code/src/skills/loadSkillsDir.ts`
10. `/Users/jimmydaddy/study/claude-code/src/utils/plugins/loadPluginCommands.ts`
11. `/Users/jimmydaddy/study/claude-code/src/services/SessionMemory/sessionMemory.ts`
12. `/Users/jimmydaddy/study/claude-code/src/remote/RemoteSessionManager.ts`
13. `/Users/jimmydaddy/study/codex/codex-rs/cli/src/main.rs`
14. `/Users/jimmydaddy/study/codex/codex-rs/tui/src/cli.rs`
15. `/Users/jimmydaddy/study/codex/codex-rs/app-server/README.md`
16. `/Users/jimmydaddy/study/codex/codex-rs/tools/src/lib.rs`
17. `/Users/jimmydaddy/study/codex/codex-rs/state/src/lib.rs`
18. `/Users/jimmydaddy/study/codex/docs/tui-request-user-input.md`
19. `/Users/jimmydaddy/study/codex/docs/tui-alternate-screen.md`

## 3. 预期产物

1. 一份位于 `.repo-ai-governor/draft/` 的 CLI benchmark draft
2. 面向 `repo-ai-governor` CLI 的 borrowable capability 分层结论
3. 近期 adoption 顺序与不建议直接照搬项

## 4. 实施计划

1. 梳理 `repo-ai-governor` CLI 当前已具备的 session shell、command bridge、session service 与 governed capability 基线，避免把已有能力误判为缺失。
2. 读取 `claude-code` 与 `codex` 的 CLI 入口、命令系统、skill/plugin、state、app-server、交互运行时与 session lifecycle 关键实现入口。
3. 将 benchmark 结果按“立即可借鉴 / 条件化引入 / 暂不建议照搬”三类收敛，并映射到本仓库当前 CLI 与产品边界。
4. 将结论写入 draft，同时同步 sprint 台账与 current-context。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`
5. docs-only analysis / review fix；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 6. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；范围限定为本地 benchmark 分析与 draft 沉淀，不引入新的 runtime 或 CLI 行为变更。
2. 2026-04-04：完成对 `repo-ai-governor` interactive shell、session client、governed slash discoverability 与 React shell UI 基线的梳理。
3. 2026-04-04：完成对 `claude-code` 的命令注册、skills/plugin 装载、session memory、remote session 管理与启动优化路径的定向阅读。
4. 2026-04-04：完成对 `codex` 的 top-level CLI/TUI 分层、tool registry、app-server、SQLite state 与自适应终端行为文档的定向阅读。
5. 2026-04-04：已将结论写入 `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`，并给出 adoption priority。
6. 2026-04-04：对 draft 执行定向 review，生成 `review/code_review_tk-517-cli-borrowing-analysis-against-claude-code-and-codex.md`，当前识别出 2 条待修复文档问题，分别涉及 benchmark source provenance 与 benchmark reproducibility。
7. 2026-04-04：根据 review 补充 benchmark corpus（含 `claude-code` / `codex` sampled commit 与 sampled date）与 Claude Code 样本来源边界说明，并将对应 CR 收口为 `resolved_code_review_tk-517-cli-borrowing-analysis-against-claude-code-and-codex.md`。
