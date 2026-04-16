# Code Review: sprint-001 deliver capability and requirement brief baseline round 10

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-010`
- Review Type: delegated sprint recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/session-shell-delivery-workflow-presenter-contract.md`

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
5. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P1] Deliver matcher still captures explicit child workflow starts
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:73`
- 问题描述: `deliver` 的 broad start-pattern 仍会在显式 `review / planning / execution flow` child capability 请求前命中，像 “Start the requirement-to-cr review.” 与 “Run the requirement-to-cr planning workflow.” 这类 child start ask 会先被 parent deliver workflow 吞掉。
- 影响: 用户显式点名 child capability 时，runtime 仍会错误落回 parent `deliver.requirement_to_cr`，破坏 interaction-model contract 对 `plan / review / review_verify / run` related child capability 的独立入口约束。
- 建议: 让显式 `plan / review` 请求先于 `deliver` 解析，并把 `cr` 缩窄为 standalone token，同时对 explicit child execution-flow phrasing 补 run-child regression coverage。

### 2.2 [P2] Deliver turn payload omits structured presenter metadata
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts:344`
- 问题描述: runtime 已把 `deliveryWorkflowState` 写回 shared session context，但 `TURN_COMPLETED` payload 仍未投影 `turn_delivery_phase`、`turn_delivery_pending_action`、`turn_delivery_related_artifact_paths`、`turn_delivery_selected_stream` 与 `turn_delivery_result_summary`。
- 影响: session shell 只能忽略 delivery workflow truth，或者退回去解析 assistant prose，本地 presenter 会和 orchestration-owned delivery state 漂移。
- 建议: 从 `dispatchResult.deliveryWorkflowState` 投影 presenter-safe delivery summary 字段到 `TURN_COMPLETED`，并增加 shell-level contract coverage。

## 3. Notes
1. round-10 reviewer 未再发现 `current-context`、delivery registry、task ledger 或 CR lifecycle artifact 的额外漂移。

## 4. Verification
1. `pnpm run build`（通过，来自 round-10 修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过，来自 round-10 修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自 round-10 修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自 round-10 修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自 round-10 修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自 round-10 修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自 round-10 修复前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，来自 round-10 修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`deliver` parent matcher 的命中优先级仍高于显式 `plan / review` child workflow phrasing，且 standalone `cr` alias 会误伤 `requirement-to-cr` compound。
   - 处理：已把显式 `plan / review` 路由放到 `deliver` 前面，`cr` 缩窄为 standalone token，并补上 explicit child planning / review / execution-flow regression coverage。
2. `2.2`
   - 判定：**认可**
   - 证据：`deliveryWorkflowState` 已落 shared session context，但 `TURN_COMPLETED` payload 仍没有 `turn_delivery_*` presenter fields，shell 无法消费 orchestration-owned phase truth。
   - 处理：已从 `dispatchResult.deliveryWorkflowState` 投影 `turn_delivery_phase`、`turn_delivery_pending_action`、`turn_delivery_related_artifact_paths`、`turn_delivery_selected_stream` 与 `turn_delivery_result_summary`，并补 shell-level payload assertions。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）

## 风险与后续
1. round-10 findings 已完成复核与修复；在进入 sprint closeout 之前，仍需新的 fresh reviewer clean recheck 返回“无 actionable finding”。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：deliver matcher 现在会先保留显式 `plan / review` child capability 入口，standalone `cr` 不再误伤 `requirement-to-cr` compound，并新增 explicit child workflow regression coverage。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：`TURN_COMPLETED` 现已投影 `turn_delivery_phase`、`turn_delivery_pending_action`、`turn_delivery_related_artifact_paths`、`turn_delivery_selected_stream` 与 `turn_delivery_result_summary`，shell 可直接消费 orchestration-owned delivery truth。

## 处置结果与剩余风险
1. round-10 的 accepted findings 已全部修复并完成代码层验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
