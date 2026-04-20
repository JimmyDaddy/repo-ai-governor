# Code Review: sprint-001 deliver capability and requirement brief baseline round 9

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-009`
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
1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
2. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
3. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`
4. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P2] Chinese deliver explainer still over-captures generic `交付` prompts
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:74`
- 问题描述: explainer 侧对 deliver 的中文直匹配仍使用裸 `/交付/`，像 “说说交付演练” 和 “解释一下交付到团队” 这类 generic delivery noun/detail ask 也会被解释成 governed requirement-to-CR deliver capability。
- 影响: presenter surface 比实际 orchestration-owned delivery intent 更宽，用户查询其它 delivery-oriented 概念时也会被误导到 deliver 帮助面。
- 建议: 把中文 deliver explainer 触发词收窄到能力说明/入口类表达，或要求 requirement-to-CR / governed-path 语义后再优先选中 deliver，并补中文负向回归测试。

## 3. Notes
1. 本轮 reviewer 未再发现 `/deliver` public slash 暴露、task ledger、delivery registry 或 CR lifecycle 漂移。

## 4. Verification
1. `pnpm run build`（通过，来自 round-9 修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过，来自 round-9 修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自 round-9 修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自 round-9 修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自 round-9 修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自 round-9 修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自 round-9 修复前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，来自 round-9 修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：explainer 侧的中文 deliver 直匹配仍接受裸 `交付`，而 skill router 已不再用同样宽度的语义匹配 requirement-to-CR parent workflow，导致 presenter/runtime drift。
   - 处理：已把中文 deliver explainer 匹配收窄到能力说明/入口语境，并补中文正向与负向回归测试，保证 `说说交付是做什么的` 仍能命中 deliver，而 `交付演练 / 交付到团队` 会回落。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）

## 风险与后续
1. round-9 的 finding 已被认可并完成修复验证，但 sprint-001 是否可进入 closeout 仍需新的 fresh reviewer clean round 最终确认。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
   - 说明：Chinese deliver explainer 现在只在能力说明/入口语境下匹配 `交付`，generic `交付演练 / 交付到团队` 不再被错误映射为 governed deliver capability。

## 处置结果与剩余风险
1. round-9 的 accepted finding 已全部修复并完成代码层验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
