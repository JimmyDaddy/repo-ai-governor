# Code Review: sprint-001 deliver capability and requirement brief baseline round 16

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-016`
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
### 2.1 [P2] English `what does ... do` governed-path deliver prompts still start the workflow
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:100`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:490`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:32`
- 问题描述: `What does deliver in the governed path do?`、`What does the deliver governed path capability do?`、`What does deliver requirement-to-cr do?` 这类 explain-only English prompts 仍然会绕过 Deliver explainer，命中 deliver fallback execution matcher，并创建新的 `deliveryWorkflowState`。根因是 Deliver-side explanation suppressor 与 capability explainer 的 detail phrasing 都只覆盖了 `tell me about`、`what is`、`explain`、`how does`，尚未覆盖常见的 `what does ... do` 说明句式。
- 影响: sprint-001 已经多次收紧的 explain-vs-execute 边界仍可被常见英文解释话术重新打开，导致 discoverability 查询继续污染 shared-session deliver truth。
- 建议: 把 `what does` 纳入 Deliver explanation suppressor 与 capability explainer 的 detail phrasing，并补回归测试锁定 `what does ... do` governed-path prompts 只走 capability explainer。

## 3. Notes
1. round-16 继续是 Deliver explain-vs-execute English phrasing 的边角修补，本轮没有引入新的运行时路径，只是补齐 detail-style 话术覆盖。
2. 本轮未发现 approved durable brief gate、review lifecycle、task-ledger、delivery registry 或 CLI discoverability surface 的新增漂移。

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
   - 证据：`what does ... do` 明显是 capability detail ask，不应创建新的 `deliveryWorkflowState`；当前 fallback matcher 会把它重新当成 governed-path execution request，属于 explain-vs-execute 边界回退。
   - 处理：已把 `what does` 同时补进 Deliver explanation suppressor 与 capability explainer detail patterns，并在 registry/explainer/dispatcher 三组回归里覆盖 governed-path `what does ... do` English prompts。

## 风险与后续
1. round-16 的 accepted finding 已完成代码层修复；仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，sprint-001 才能进入 closeout。

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：English governed-path `what does ... do` prompts 现已稳定回到 Deliver capability explainer，不再启动 Deliver parent workflow，也不会创建新的 `deliveryWorkflowState`。

## 处置结果与剩余风险
1. round-16 的 accepted finding 已完成代码面修复。
2. 当前仍需新的 fresh reviewer clean round 证明 sprint-001 已无 actionable finding，之后才能推进 `TK-925` 完成与 `TK-926` closeout。
