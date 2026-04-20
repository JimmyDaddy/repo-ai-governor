# Code Review: sprint-001 deliver capability and requirement brief baseline round 3

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-003`
- Review Type: delegated sprint recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/requirement-to-cr-governed-delivery-orchestration.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-session-delivery-workflow-runtime.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
5. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P1] Approved durable-brief gate accepts positive outcomes without a receipt backlink
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-delivery-workflow-runtime.ts:98`
- 问题描述: `canWriteApprovedDeliveryBrief()` 仅检查 outcome，`parseRequirementReviewGate()` 允许 `evidenceArtifactPath=null`，导致 `explicit_approval` 或 `docs_only_review` 仍可在缺少 approval/docs-only artifact backlink 的情况下授权 approved durable brief。
- 影响: sprint-001 要冻结的 approved durable brief gate 与审计边界会被削弱，delivery overlay 可能写出没有 receipt/backlink 的“已批准”状态。
- 建议: 对正向 gate outcome 强制要求非空 `evidenceArtifactPath`，并补 negative tests，确保缺少 receipt/backlink 时既不能写 approved brief，也不能接受持久化状态。

### 2.2 [P2] Deliver explanation matching still absorbs child plan/review intents
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:74`
- 问题描述: deliver 的 `requirement-to-cr` reference rule 仍排在 `plan / review / review_verify` 之前，detail/example 路径总是取首个命中的 capability，导致带有 requirement-to-cr 上下文的 child capability explain ask 仍会落到 `deliver`。
- 影响: parent capability 在 explanation surface 继续吞掉 child workflow intents，和 interaction-model contract 中“deliver 只作为 parent orchestration capability，保留 child workflow 边界”的要求不一致。
- 建议: 在 detail/example 语义下优先 child capability 命中，再回退到 deliver parent-domain 标签，并补 requirement-to-cr 语境下的 `plan / review / review_verify` explainer regression tests。

## 3. Notes
1. `/deliver` 仍然保持 chat-first / alias-only，没有出现 public slash discoverability 漂移。
2. 当前 reviewer 仅把 service round-trip seam 记为 residual risk，不作为本轮 actionable finding。

## 4. Verification
1. `pnpm run build`（通过，来自本轮修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过，来自本轮修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自本轮修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自本轮修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自本轮修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自本轮修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自本轮修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`canWriteApprovedDeliveryBrief()` 只检查 outcome，`parseRequirementReviewGate()` 接受正向 outcome 且 `evidenceArtifactPath=null` 的状态，确实会让 approved durable brief gate 缺少 receipt/backlink。
   - 处理：要求 `explicit_approval` / `docs_only_review` 必须带非空 `evidenceArtifactPath` 才能通过 gate，并补回归测试覆盖无 receipt/backlink 的负例。

2. `2.2`
   - 判定：**认可**
   - 证据：capability explainer 的 deliver parent-domain rule 会在 detail/example 路径上先于 child capability 命中，带 `requirement-to-cr` 语境的 `plan / review / review_verify` explain ask 的确会被 deliver 吸走。
   - 处理：保留显式 `deliver` 直达匹配，但把 requirement-to-cr 这类 parent-domain tag 改为“无 child capability 命中时才优先 deliver”，并补 requirement-to-cr 语境下的 child explain regression tests。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）

## 风险与后续
1. round-3 的 accepted findings 已完成修复，但 sprint-001 进入 closeout 前仍需新的 fresh reviewer clean round。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-delivery-workflow-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
   - 说明：approved durable brief gate 现在要求正向 outcome 同时带 receipt/backlink；缺少 `evidenceArtifactPath` 的正向 gate 不再被接受为合法 shared-session truth。

2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
   - 说明：deliver 仍保留 chat-first / alias-only 语义，但 requirement-to-cr parent-domain tag 不再吞掉 `plan / review / review_verify` 的 explanation surface。

## 处置结果与剩余风险
1. round-3 的 accepted findings 已全部修复并完成代码层验证。
2. sprint-001 仍需下一轮 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
