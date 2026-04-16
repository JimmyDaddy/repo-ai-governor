# Code Review: sprint-001 deliver capability and requirement brief baseline round 6

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-006`
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
### 2.1 [P2] Deliver matcher still captures generic repo/workflow asks
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:74`
- 问题描述: round-5 只去掉了最宽泛的 `help me deliver ...` 误伤，但 English deliver patterns 里仍保留 `repo/repository/generic workflow` 语义，导致像 “deliver the repository cleanup” 或 “deliver the repo migration” 这类请求仍会落到 `deliver.requirement_to_cr`。
- 影响: requirement-to-CR parent capability 仍可能被普通 repo/workflow deliver ask 误触发，并把 `deliveryWorkflow` session truth 用在不属于该主路径的工作上。
- 建议: English matcher 只保留 requirement / governed-path / delivery-workflow 语义，不再接受 generic repo/repository/workflow 作为 deliver 触发条件，并补 repo/workflow 负向回归测试。

## 3. Notes
1. 本轮 reviewer 未再发现新的 ledger 或 review lifecycle 结构性问题。

## 4. Verification
1. `pnpm run build`（通过，来自 round-6 修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过，来自 round-6 修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自 round-6 修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自 round-6 修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自 round-6 修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自 round-6 修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自 round-6 修复前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，来自 round-6 修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：round-5 之后 English deliver matcher 仍保留了 `repo/repository/generic workflow` 语义，generic repo cleanup / migration ask 依然会误触 requirement-to-CR deliver workflow。
   - 处理：已移除 English matcher 中 generic repo/repository/workflow 触发词，只保留 requirement/governed-path/delivery-workflow 语境，并补 repo/workflow 负向回归测试。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）

## 风险与后续
1. round-6 的 accepted finding 已完成修复，但 sprint-001 是否可进入 closeout 仍需新的 fresh reviewer clean round 最终确认。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
   - 说明：deliver English matcher 现在只接受 requirement/governed-path/delivery-workflow 语义，不再把 generic repo cleanup / migration 这类请求当成 requirement-to-CR parent workflow。

## 处置结果与剩余风险
1. round-6 的 accepted finding 已全部修复并完成代码层验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
