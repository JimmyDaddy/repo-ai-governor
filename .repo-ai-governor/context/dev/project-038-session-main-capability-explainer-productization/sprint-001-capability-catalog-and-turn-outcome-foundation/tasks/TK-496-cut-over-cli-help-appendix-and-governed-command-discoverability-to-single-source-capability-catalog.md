# TK-496 cut over CLI help appendix and governed command discoverability to single-source capability catalog

- Status: completed
- Date: 2026-04-03
- Owner: AI-Agent
- Priority: P1
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-001-capability-catalog-and-turn-outcome-foundation`

## 1. 任务目标

将 CLI help appendix 与 governed command discoverability metadata 切到 single-source capability catalog，同时保留 shell-local builtins 继续由 CLI registry 自治。

## 2. Depends On

1. `TK-495`
2. `apps/cli/src/main.ts`
3. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 3. 预期产物

1. CLI help appendix 对 governed capability 的说明改由 canonical catalog 渲染
2. governed discoverability metadata 与 shell-local builtin metadata 的分层实现
3. help/discoverability contract 的回归测试与边界说明

## 4. 实施计划

1. 让 governed capabilities 从 catalog 复用 summary / example / action guide，而不是再从 `main.ts` 内联拼文案。
2. 保持 `/confirm`、`/cancel`、`/clear`、`/exit` 等 shell-local builtin 仍由 CLI slash registry 自治。
3. 为后续 desktop / transcript consumer 保留统一的 capability discoverability metadata。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；等待 `TK-495` 完成后执行。
2. 2026-04-03：状态切换为 `active`；开始将 CLI help appendix 与 session-shell governed discoverability metadata 切到 canonical capability catalog，同时保留 shell-local builtins 继续由 CLI registry 自治。
3. 2026-04-03：完成 catalog-backed discoverability runtime、slash registry governed/builtin 分层、top-level/command help appendix cutover 与相关 CLI/i18n 回归；验证通过 `vitest apps/cli/test`、`check-i18n-parity-fallback`、`check-task-ledger-sync`、`check-sprint-plan-status-sync`、`pnpm run build` 与 `pnpm run check`。
