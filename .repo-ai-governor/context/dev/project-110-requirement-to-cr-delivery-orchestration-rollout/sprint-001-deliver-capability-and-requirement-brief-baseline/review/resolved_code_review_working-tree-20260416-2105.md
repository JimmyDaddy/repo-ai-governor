# Code Review: sprint-001 deliver capability and requirement brief baseline round 2

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated sprint recheck
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
5. `packages/shared/src/i18n/locales/en-us.ts`
6. `packages/shared/src/i18n/locales/zh-cn.ts`

## 2. Findings
### 2.1 [P1] deliver matcher hijacks review and plan prompts that only mention requirement-to-cr
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
- 问题描述: round-1 修复后新增的 deliver matcher 同时匹配裸 `requirement-to-cr` / `delivery orchestration`，而该分支位于 review/plan 之前，导致 `Review the requirement-to-cr design.` 这类 prompt 被误判为 `deliver.requirement_to_cr`。
- 影响: `deliver` 虽然可达，但会抢走围绕同一能力域展开的 review / planning 请求，破坏相邻 governed workflow 的意图边界。
- 建议: 将 deliver matcher 收窄到 imperative / start-style phrasing，并补 review / plan 负向测试，确保仅在明确“启动 deliver workflow”时命中。

### 2.2 [P2] resumed deliver workflow reply drifts away from the shared-session phase truth
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
- 问题描述: `resolveDeliverWorkflowState()` 会复用非终态 deliver state，但 `createDeliverWorkflowOutcome()` 始终返回 fresh-start 文案，继续提示“分享需求 / 回到 requirement capture”。
- 影响: resumed session 的 state truth 与 assistant guidance 不一致，容易把用户从 `solution_review_pending` 等后续 phase 错引回初始阶段。
- 建议: 当 dispatcher 复用已有 deliver state 时，回复文案必须切到 phase-aware resume 语义，并补充 resume 测试覆盖。

## 3. Notes
1. 本轮 recheck 复现确认 deliver 保持 chat-first 方向是对的，问题在 matcher 边界和 resumed 文案，而不是 slash discoverability。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：deliver matcher 包含裸 `requirement-to-cr` / `delivery orchestration` 模式，且分支在 review / plan 之前，确实会误伤相邻 governed workflow。
   - 处理：已把 deliver matcher 收窄到 start-style phrasing，并新增 review / plan 负向测试，确保只有明确“启动 deliver”时命中。

2. `2.2`
   - 判定：**认可**
   - 证据：dispatcher 复用非终态 deliver state 时保持了 phase truth，但回复文案仍使用 fresh-start copy，和共享会话真值不一致。
   - 处理：已把 deliver reply 切成 fresh-start / resumed 两类文案；当复用已有 state 时，回复会显式带出当前 `phase` 与 `pendingAction`，并补了 resumed regression test。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 风险与后续
1. round-2 findings 的代码修复已完成，但 sprint-001 进入 closeout 前仍需下一轮 fresh reviewer clean round 返回“无 actionable finding”。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
   - 说明：删除裸 `requirement-to-cr` / `delivery orchestration` 模式，补上 review / plan 负向测试，确保 deliver 仅在 start-style phrasing 下命中。

2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`packages/shared/src/i18n/locales/en-us.ts`、`packages/shared/src/i18n/locales/zh-cn.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`（均通过）
   - 说明：deliver workflow reply 现在会根据是否复用现有 shared-session state 切换 fresh-start / resumed 文案；恢复态会明确带出当前 `phase` 与 `pendingAction`。

## 处置结果与剩余风险
1. round-2 的 accepted findings 已全部修复并完成同窗口验证。
2. sprint-001 仍需下一轮 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
