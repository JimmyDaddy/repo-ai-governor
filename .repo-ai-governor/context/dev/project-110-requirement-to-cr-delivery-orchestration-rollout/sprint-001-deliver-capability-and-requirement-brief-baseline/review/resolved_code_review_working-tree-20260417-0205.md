# Code Review: sprint-001 deliver capability and requirement brief baseline round 17

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-017`
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
### 2.1 [P2] English governed-path deliver paraphrases still start the workflow and mutate session state
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:32`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:200`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:93`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:491`
- 问题描述: 除了 `tell me about` / `what does` 之外，`What can deliver in the governed path do?`、`When should I use deliver in the governed path?`、`Why should I use deliver in the governed path?`、`Tell me what deliver in the governed path does.`、`How should I use deliver in the governed path?` 这类常见 help/detail paraphrase 仍会落到 deliver fallback execution matcher，创建新的 `deliveryWorkflowState`。根因是 capability explainer 与 deliver-side explanation suppressor 共享的 detail/explanation phrasing 仍过窄，只覆盖了少数句式。
- 影响: sprint-001 的 explain-vs-execute 边界仍可被自然英语帮助问法重新打开，discoverability ask 会继续越权污染 shared-session deliver truth。
- 建议: 把 governed-path deliver 的常见 English help/detail paraphrases 成组纳入 detail/explanation patterns，并用成组回归覆盖 `what can`、`when/why should I use`、`tell me what ... does`、`how should I use` 等问法。

## 3. Notes
1. round-17 补的是 guided/detail paraphrase family，而不是新的 runtime path；修复目标仍然是让 governed-path Deliver discoverability 全部停留在 capability explainer。
2. 本轮未发现 approved durable brief gate、review lifecycle、task-ledger、delivery registry 或 CLI discoverability surface 的新增漂移。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：这些 `what can` / `when should I use` / `why should I use` / `tell me what ... does` / `how should I use` prompts 都是在询问 Deliver capability 的使用与边界，不应创建新的 `deliveryWorkflowState`；当前 fallback execution 行为属于明确的 explain-vs-execute 越权。
   - 处理：已把 governed-path Deliver 的常见 English help/detail paraphrases 成组补进 capability explainer 与 deliver-side explanation suppressor，并把对应 paraphrase family 写进 registry/explainer/dispatcher 三组回归覆盖。

## 风险与后续
1. round-17 的 accepted finding 已完成代码层修复；仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，sprint-001 才能进入 closeout。

## 修复执行记录（2026-04-17）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：English governed-path help/detail paraphrase family 现已稳定回到 Deliver capability explainer，不再启动 Deliver parent workflow，也不会创建新的 `deliveryWorkflowState`。

## 处置结果与剩余风险
1. round-17 的 accepted finding 已完成代码面修复。
2. 当前仍需新的 fresh reviewer clean round 证明 sprint-001 已无 actionable finding，之后才能推进 `TK-925` 完成与 `TK-926` closeout。
