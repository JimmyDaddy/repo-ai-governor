# Code Review: sprint-001 deliver capability and requirement brief baseline round 18

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-018`
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

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
6. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`

## 2. Findings
### 2.1 [P2] Help-style deliver guidance prompts still escape the explainer boundary and can start the workflow
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:93`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:100`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:32`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:49`
- 问题描述: `How do I deliver this requirement through the governed path?`、`What steps should we follow to deliver this requirement through the governed path?`、`Could you show me how to deliver this requirement through the governed path?` 这类 guidance/how-to asks 仍然会越过 explainer，落到 Deliver execution 路径并创建新的 `deliveryWorkflowState`。根因是 fallback execution matcher 仍能匹配这类 direct-object English phrasing，而 capability explainer 的 example/detail classifiers 尚未覆盖 `how do I`、`show me how`、`what steps` 等 guidance-style 句式。
- 影响: 用户在 asking how-to guidance 时仍会意外启动 Deliver workflow，explain-vs-execute 边界继续漂移。
- 建议: 把 `how do I`、`show me how`、`what steps`、`walk me through` 等 help-style governed-path deliver prompts 接入 example path，并让 deliver-side suppressor 同步识别这些 guidance 句式。

## 3. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）

## 复核结论（2026-04-17）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：这些 prompts 都是在询问 governed-path Deliver 的 how-to guidance / steps，不应直接创建新的 `deliveryWorkflowState`。
   - 处理：已把 `how do I`、`show me how`、`what steps`、`walk me through` 这组 guidance-style English prompts 接入 capability explainer example path，并让 deliver-side suppressor 同步识别这些句式。

## 风险与后续
1. round-18 的 accepted finding 已完成代码层修复；仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，sprint-001 才能进入 closeout。
