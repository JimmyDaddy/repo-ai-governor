# Code Review: sprint-001 deliver capability and requirement brief baseline round 8

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-008`
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/requirement-to-cr-governed-delivery-orchestration.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
3. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P2] Delivery workflow persistence/resume lacks shell-level coverage
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts:295`
- 问题描述: `sendSessionTurn()` 已开始从 shared-session context 读取 `deliveryWorkflowState` 并在 dispatch 后回写 overlay，但当前测试只覆盖 dispatcher/runtime 级别，缺少一条真正经过 shell/session persistence seam 的回归测试。
- 影响: 如果 session runtime 的读写桥接回归，`/deliver` 仍可能在 discoverability 和 dispatcher 层看起来正常，但 resumed turn 会静默丢失 orchestration-owned phase truth。
- 建议: 参考现有 provider continuation 的 shell-level persistence/resume 测试，补一条 `deliveryWorkflowState` 的 end-to-end round-trip 覆盖，至少验证首次 turn 写入、resume 后重新注入、以及后续 turn 更新回写。

## 3. Notes
1. 本轮 reviewer 未再发现新的 matcher、locale、ledger 或 review lifecycle drift。
2. CLI help spot check 未发现 `/deliver` public slash 暴露问题，但这轮 actionable finding 的重点是 shared-session delivery seam 的 end-to-end coverage 缺口。

## 4. Verification
1. `pnpm run build`（通过，来自 round-8 修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过，来自 round-8 修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自 round-8 修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自 round-8 修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自 round-8 修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自 round-8 修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自 round-8 修复前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，来自 round-8 修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 `sendSessionTurn()` 已把 `deliveryWorkflowState` 读写接到 shared-session context，但 shell 层只有 provider continuation 的 persistence/resume 覆盖，没有 delivery workflow 的等价 round-trip 测试。
   - 处理：已补一条 `LocalOrchestrationServiceShell` 回归测试，覆盖首次 deliver turn 写入、resume 后重新注入，以及后续 generic supervisor turn 更新 overlay 并写回 session context。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）

## 风险与后续
1. round-8 的 finding 已被认可并完成修复验证，但 sprint-001 是否可进入 closeout 仍需新的 fresh reviewer clean round 最终确认。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：新增 shell-level round-trip 覆盖，验证首次 deliver turn 会把 `deliveryWorkflowState` 写入 session context，resume 后会重新注入到 supervisor turn，并允许后续 turn 把更新后的 overlay 再写回 shared-session truth。

## 处置结果与剩余风险
1. round-8 的 accepted finding 已全部修复并完成代码层验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
