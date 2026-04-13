# TK-815 clarify theme persistence target feedback for set-ui-theme

- Status: completed
- Date: 2026-04-13
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-095-session-shell-theme-persistence-feedback-clarity`
- Sprint: `sprint-001-persistence-scope-feedback`

## 1. 任务目标

让 `set-ui-theme` / `workspace set-ui-theme` 的成功反馈更明确地点名主题写入目标，避免用户把已持久化的默认主题误解为仅当前命令的一次性切换。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-084-session-shell-theme-apply-followup/plan.md`
2. `.repo-ai-governor/context/dev/project-094-session-shell-theme-pack-expansion/plan.md`

## 3. 预期产物

1. 更明确的 workspace/global theme persistence 成功反馈
2. 配套 i18n 文案与帮助文案更新
3. 回归测试与 build 证据

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
4. `apps/cli/src/commands/workspace-command.ts`
5. `packages/shared/src/i18n/locales/en-us.ts`
6. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. 实施计划

1. 盘点 set-ui-theme 成功消息、status、summary 与帮助文案的现状。
2. 让成功反馈明确区分 `workspace config`、`global user-config` 与双写场景。
3. 补充回归测试并执行聚焦 vitest 与 `pnpm run build`。

## 6. Development Verification

1. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 7. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/commands/workspace-command.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --task-id TK-815 --tasks-dir ".repo-ai-governor/context/dev/project-095-session-shell-theme-persistence-feedback-clarity/sprint-001-persistence-scope-feedback/tasks"`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. 执行记录

1. 2026-04-13：任务创建并直接进入 `in_progress`，范围锁定为 theme persistence 成功反馈澄清，不改变持久化语义本身。
2. 2026-04-13：已为 workspace/global scope 引入更明确的持久化目标描述，并区分 `workspace config`、`global user-config` 与“active workspace config + repo-local selector config”双写场景。
3. 2026-04-13：已同步中英文 i18n、workspace summary/help/status/message 与相关回归断言。
4. 2026-04-13：已执行聚焦 vitest 回归集与 `pnpm run build`，验证通过。

## 9. 产出

1. 已完成：更明确的 set-ui-theme 成功反馈与 i18n 更新
2. 已完成：回归测试与 build 证据
