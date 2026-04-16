# Code Review: sprint-001 deliver capability and requirement brief baseline round 1

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: delegated sprint review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`

## 2. Findings
### 2.1 [P1] deliver capability is advertised but not routable from conversation
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
- 问题描述: `deliver` 已经进入 capability catalog、explainer 与 discoverability 帮助文案，但 `resolvePlan()` 没有任何 deliver conversational intent 分支，导致 sprint-001 官方 prompt 会落回 generic supervisor/fallback，而不是进入 parent governed workflow。
- 影响: 新增的 `deliver` primary entry 是 direct chat request，但实际执行面不可达，session.main 的 runtime truth 与用户可发现文案失配。
- 建议: 为 `deliver` 增加 chat-first intent routing，并在 dispatcher 层把命中结果接到 orchestration-owned shared-session `deliveryWorkflow` state，同时补足 skill-registry / dispatcher 回归测试；保持 `/deliver` 仅作为保留 alias，不进入 public slash discoverability。

## 3. Notes
1. 本轮 fresh reviewer 明确认定 `/deliver` 仍应保持 chat-first alias，不应通过“改成公开 slash command”来规避会话路由缺口。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`deliver` 已在 capability catalog / explainer / help 中暴露为 chat-first parent capability，但修复前 `resolvePlan()` 缺少 deliver conversational matcher，dispatcher 也没有任何 deliver routing coverage，因此官方 prompt 会落回 generic supervisor/fallback。
   - 处理：按 sprint-001 baseline 补上 deliver intent routing，并让 dispatcher 在命中 deliver 时初始化 shared-session `deliveryWorkflow` state；同时新增 skill-registry 与 dispatcher 的 deliver routing / explain-plus-execute 回归测试，且保持 `/deliver` 非 public slash discoverability alias。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 风险与后续
1. accepted finding 的代码修复已完成，但 sprint-001 是否可以进入 closeout 仍需新的 fresh reviewer clean round 再确认。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`（均通过）
   - 说明：新增 deliver chat-first intent matcher，并让 dispatcher 在命中 deliver 或 explain-plus-execute deliver 时初始化 shared-session `deliveryWorkflow` state；同时保留 `/deliver` 为非 public discoverability alias。

## 处置结果与剩余风险
1. 当前 round 的 accepted finding 已全部修复并完成同窗口验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
