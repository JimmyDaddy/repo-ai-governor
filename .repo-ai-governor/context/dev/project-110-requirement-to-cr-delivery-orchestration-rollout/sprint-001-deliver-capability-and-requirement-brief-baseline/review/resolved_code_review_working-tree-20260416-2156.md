# Code Review: sprint-001 deliver capability and requirement brief baseline round 5

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-005`
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
1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
4. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P2] Generic deliver phrasing still routes into the requirement-to-CR workflow
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:74`
- 问题描述: 目前 English deliver matcher 仍会把泛化的 `help me deliver ...` 语句直接映射到 `deliver.requirement_to_cr`，例如 “deliver the review fixes” 或 “deliver the release notes” 这类无关请求。
- 影响: 用户普通的 deliver 动词语义会误触 requirement-to-CR parent workflow，并在 shared-session 中错误启动/持久化 `deliveryWorkflow` overlay。
- 建议: 把 English matcher 收窄到 requirement / governed-path / workflow 语境，并补负向回归测试，确保非 requirement deliver phrasing 不会误路由到 governed deliver workflow。

## 3. Notes
1. 本轮 reviewer 未再发现 ledger、review lifecycle 或 delivery registry 的新问题。

## 4. Verification
1. `pnpm run build`（通过，来自 round-5 修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过，来自 round-5 修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自 round-5 修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自 round-5 修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自 round-5 修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自 round-5 修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自 round-5 修复前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，来自 round-5 修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：English deliver matcher 的 `help me deliver ...` 仍会把非 requirement deliver ask 路由进 `deliver.requirement_to_cr`，例如 review fixes / release notes 这类普通 deliver 语义。
   - 处理：已把 matcher 收窄到 requirement / governed-path / workflow 语境，并补 skill-registry + dispatcher 的 non-requirement deliver regression tests，确保 generic deliver phrasing 不会误启动 governed requirement-to-CR workflow。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）

## 风险与后续
1. round-5 的 accepted finding 已完成修复，但 sprint-001 进入 closeout 前仍需新的 fresh reviewer clean round 最终确认。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
   - 说明：generic English `deliver` phrasing 现在不再被当成 requirement-to-CR parent orchestration capability，只有 requirement/governed-path/workflow 语境才会触发 deliver workflow。

## 处置结果与剩余风险
1. round-5 的 accepted finding 已全部修复并完成代码层验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
