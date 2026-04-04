# TK-520 convert cli borrowing analysis into feasible technical solution draft

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-003-cli-borrowed-capabilities-technical-solution-drafting`

## 1. 任务目标

将现有 `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md` 从 benchmark 分析整理成一份可行的技术方案草案，要求能够直接指导后续 implementation sprint 的模块落点、交付阶段和 deferred bucket。

## 2. Depends On

1. `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`
2. `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
3. `.repo-ai-governor/draft/runtime-cli-run-live-react-session-shell-technical-solution.md`
4. `.repo-ai-governor/draft/runtime-session-durable-memory-and-sqlite-fs-cutover-technical-solution.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/cli-command-capability-maturity-and-baseline-enhancement-priority.md`
8. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
9. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`
10. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`

## 3. 预期产物

1. 一份新的 CLI 技术方案草案，落在 `.repo-ai-governor/draft/`
2. 明确的模块落点、 phased rollout 与 deferred bucket
3. 可供后续 implementation sprint 直接引用的 follow-up task package 建议

## 4. 实施计划

1. 复读 benchmark 分析，抽取真正应转化为技术方案的 borrowable capability 骨架。
2. 对齐 `runtime.cli-interactive-shell`、`runtime.orchestration` 与 `runtime.durable-storage` 的现有 formal 边界，避免方案脱离当前模块图。
3. 将“立即可借鉴 / 条件化引入 / 暂不建议照搬”重写为“方案决策 / phased delivery / deferred bucket”。
4. 将结果写入新的 technical solution draft，并同步 sprint 台账与 current-context。

## 5. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-worktree-review-target.js`
4. docs-only drafting；未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 6. 执行记录

1. 2026-04-04：任务创建，范围限定为 docs-only 技术方案草案沉淀，不引入新的 runtime 或 CLI 行为变更。
2. 2026-04-04：完成对 benchmark 分析、interactive shell formal docs、durable storage formal docs 与当前 session shell 代码接缝的联读。
3. 2026-04-04：已产出 `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`，明确 phased rollout、模块落点与 deferred bucket。
