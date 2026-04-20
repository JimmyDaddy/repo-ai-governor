# Code Review: sprint-001 deliver capability and requirement brief baseline round 15

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-015`
- Review Type: delegated sprint clean recheck
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
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
6. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`

## 2. Findings
### 2.1 [P2] Explain-style `deliver + governed path` English prompts still start the Deliver workflow
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:86`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:490`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:74`
- 问题描述: `Tell me about deliver in the governed path.`、`Tell me about the deliver governed path capability.`、`Show me examples for the deliver governed path capability.` 这类 explain/example 请求仍会命中 deliver router 的 fallback English matcher，随后 dispatcher 创建 `deliveryWorkflowState` 并启动 `deliver.requirement_to_cr`。与此同时，explainer 对 Deliver 的英文 direct reference 还没有覆盖 `deliver + governed path` 这种能力说明话术，因此 explain path 没有机会先接住请求。
- 影响: 纯 discoverability / explainer 查询会越权污染 shared-session deliver truth，把帮助语义误推进到 `requirement_capture`，与本 sprint 持续收紧的 explain-vs-execute 边界不一致。
- 建议: 同时修正两层边界：让 explainer 能识别 `deliver + governed path` 的英文解释类提示词，并让 skill registry 对 explain/example phrasing 不再走 fallback execution matcher。

## 3. Notes
1. round-15 不是新增 capability，而是继续收紧 Deliver chat-first entry 的解释面与执行面分界，确保 governed-path 术语既能用于 discoverability，又不会把 explain prompt 误当执行请求。
2. 本轮未发现 approved durable brief gate、review lifecycle、task-ledger、delivery registry 或 CLI alias-only help contract 的新增漂移。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
4. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：explain/example wording 只是在询问 Deliver capability 的 governed-path discoverability，却仍会直接创建 `deliveryWorkflowState`；这属于明确的 execution mutation 越权，不符合 Deliver chat-first explainer contract。
   - 处理：已把 Deliver English matcher 拆成 explicit execution 与 fallback execution 两层，并给 fallback 层补 explain/example exclusion；同时扩展 Deliver explainer direct-reference 以覆盖 `deliver + governed path` 解释类提示词，再用 registry/explainer/dispatcher 三组回归测试锁定边界。

## 风险与后续
1. round-15 的 accepted finding 已完成代码层修复；仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，sprint-001 才能进入 closeout。

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：governed-path explain/example prompts 现会稳定落到 Deliver capability explainer，不再启动 Deliver parent workflow，也不会创建新的 `deliveryWorkflowState`。

## 处置结果与剩余风险
1. round-15 的 accepted finding 已完成代码面修复。
2. 当前仍需新的 fresh reviewer clean round 证明 sprint-001 已无 actionable finding，之后才能推进 `TK-925` 完成与 `TK-926` closeout。
