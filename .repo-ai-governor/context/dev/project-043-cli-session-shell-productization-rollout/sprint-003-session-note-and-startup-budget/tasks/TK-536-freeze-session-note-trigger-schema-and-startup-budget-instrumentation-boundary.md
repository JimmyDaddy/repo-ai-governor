# TK-536 freeze session note trigger schema and startup budget instrumentation boundary

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-003-session-note-and-startup-budget`

## 1. 任务目标

冻结 lightweight session note 的 trigger/schema/projection 边界，以及 session-first startup path 的 budget instrumentation 边界，使后续实现不再把 note 与 startup diagnostics 做成分散特性。

## 2. Depends On

1. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`

## 3. 预期产物

1. session note trigger/schema/projection baseline
2. startup budget instrumentation boundary
3. `TK-537 / TK-538` 的统一实现边界

## 4. Required Inputs

1. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-durable-storage/module-overview.md`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`

## 5. Traceback References

1. `.repo-ai-governor/draft/runtime-session-durable-memory-and-sqlite-fs-cutover-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-003-session-note-and-startup-budget/plan.md`

## 6. 实施计划

1. 冻结 session note 的 trigger、summary 字段与 projection consumer 边界。
2. 冻结 startup budget instrumentation 与 lazy-load boundary 的最小诊断面。
3. 明确 note 与 startup diagnostics 的 i18n / presenter / regression 输入。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. docs-only decomposition；当前阶段未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`

## 8. Delivery Verification

1. 当前拆解窗口需通过 `node ./scripts/governance/check-task-ledger-sync.js`
2. 当前拆解窗口需通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`、session note regression 与 startup diagnostics evidence

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 session note / startup budget contract 冻结。

## 10. 产出

1. 待执行：session note trigger/schema/projection baseline
2. 待执行：startup budget instrumentation boundary
3. 待执行：`TK-537 / TK-538` 实施边界冻结记录
