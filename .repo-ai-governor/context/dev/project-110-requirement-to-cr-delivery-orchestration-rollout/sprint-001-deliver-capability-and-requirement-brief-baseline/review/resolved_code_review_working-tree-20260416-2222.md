# Code Review: sprint-001 deliver capability and requirement brief baseline round 7

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-007`
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
1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
5. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P2] Generic requirement wording still triggers deliver workflow
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:73`
- 问题描述: English deliver matcher 仍把 bare `requirement` 当成充分触发条件，像 “Help me deliver the requirement brief to the team.” 和 “Can you deliver this requirement summary by email?” 这样的普通 artifact delivery ask 仍会落到 `deliver.requirement_to_cr`。
- 影响: requirement-to-CR governed parent workflow 仍可能被 generic requirement document delivery 误触发，进而污染 shared-session `deliveryWorkflowState`。
- 建议: English matcher 只接受 requirement-to-CR、governed path、delivery workflow 这类显式主路径语义，不再让 bare `requirement` 单独触发；同时补 requirement brief / summary 等负向回归测试。

### 2.2 [P2] Default-locale deliver turn poisons explicit en-US translation cache
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts:717`
- 问题描述: `resolveTranslate()` 在 `requestedLocale` 为空时使用 `DEFAULT_I18N_FALLBACK_LOCALE` 作为 cache key，但 shared i18n runtime 的默认 locale 实际是 `zh-CN`。这样一次无 locale 的 deliver turn 会把中文 runtime 缓存在 `en-US` 槽位，后续显式 `locale: 'en-US'` 的 deliver turn 仍可能返回中文。
- 影响: deliver workflow 的 user-facing transcript 无法稳定遵循显式 locale，和 shared i18n baseline 不一致。
- 建议: cache key 与 runtime initialize 入参都改为一致的 resolved/default locale 语义，并补“先无 locale，再显式 en-US” 的 dispatcher 回归测试。

## 3. Notes
1. 本轮 reviewer 未再发现新的 ledger、delivery registry 或 CR lifecycle 结构性漂移。
2. sprint closeout 前仍应补跑 `apps/cli/test/cli-skeleton.integration.test.ts` 与 `apps/cli/test/cli-output-contract.integration.test.ts`，以覆盖 TK-925 已声明的 CLI help integration baseline。

## 4. Verification
1. `pnpm run build`（通过，来自 round-7 修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过，来自 round-7 修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自 round-7 修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自 round-7 修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自 round-7 修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自 round-7 修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自 round-7 修复前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，来自 round-7 修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：English deliver matcher 仍接受 bare `requirement` 作为触发条件，generic requirement brief / summary delivery ask 仍会误触 requirement-to-CR parent workflow。
   - 处理：已收窄 English matcher，只接受 requirement-to-CR、governed path、delivery workflow 等显式主路径语义，并补 requirement document delivery 负向回归测试。
2. `2.2`
   - 判定：**认可**
   - 证据：dispatcher 的 deliver translate cache 在 `requestedLocale` 为空时沿用 fallback-locale key，而 shared runtime 默认 locale 为 `zh-CN`，导致后续显式 `en-US` turn 可能复用到中文 runtime。
   - 处理：已把 cache key 与 initialize 入参统一到 default locale 语义，并补“先无 locale、再显式 en-US” 的 dispatcher 回归测试。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）

## 风险与后续
1. round-7 的 findings 已被认可并完成修复验证，但 sprint-001 是否可进入 closeout 仍需新的 fresh reviewer clean round 最终确认。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：English deliver matcher 不再把 bare `requirement` 当成 governed parent workflow 的触发条件，generic requirement brief / summary delivery phrasing 会回落到正常协作路径。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：deliver translate runtime cache 已改为按 default locale / explicit locale 一致建键，不再让无 locale 的中文 runtime 污染后续显式 `en-US` turn。

## 处置结果与剩余风险
1. round-7 的 accepted findings 已全部修复并完成代码层验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
