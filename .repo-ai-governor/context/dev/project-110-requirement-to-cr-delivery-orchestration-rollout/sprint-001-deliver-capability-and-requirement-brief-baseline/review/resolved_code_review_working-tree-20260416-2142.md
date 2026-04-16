# Code Review: sprint-001 deliver capability and requirement brief baseline round 4

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-004`
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
1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
5. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks`
6. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 2. Findings
### 2.1 [P2] Explain-plus-execute deliver remains availability-gated while direct chat does not
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts:432`
- 问题描述: direct chat path 会无条件启动 orchestration-owned `deliver` workflow，但 explain-plus-execute bridge 仍要求 `availability=status=available`；同时 explainer 在 `setup_required` 时会把 deliver suggested action 和提示文案改写成 `/connect`。
- 影响: 同一个 chat-first parent capability 会因为“先问说明再执行”而出现与 direct chat 不一致的进入语义，形成 presenter-side 第二套 gating truth。
- 建议: 让 deliver bridge/explainer 与 canonical chat-first contract 对齐，不再用 availability overlay 阻断或改写 deliver 的 conversational entry，并补 non-available overlay regression tests。

## 3. Notes
1. 本轮 reviewer 未再发现 task ledger、review lifecycle 或 delivery registry 的同步问题。

## 4. Verification
1. `pnpm run build`（通过，来自 round-4 修复前基线）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过，来自 round-4 修复前基线）
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir ./.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks --task-id TK-925`（通过，来自 round-4 修复前基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，来自 round-4 修复前基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，来自 round-4 修复前基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，来自 round-4 修复前基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，来自 round-4 修复前基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，来自 round-4 修复前基线）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：dispatcher 的 direct chat deliver path 不看 availability overlay，而 explain-plus-execute bridge 仍在 `available` 之外直接放弃；explainer 也会在 `setup_required` 时把 deliver 建议改写成 `/connect`。
   - 处理：deliver bridge 改为直接复用 chat-first workflow 语义，不再被 availability overlay 阻断；explainer 对 deliver 也不再把 suggested action 或 availability suffix 改写成 `/connect`，并补上 non-available overlay regression tests。

### 验证命令
1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）

## 风险与后续
1. round-4 的 accepted finding 已完成修复，但 sprint-001 是否可进入 closeout 仍需新的 fresh reviewer clean round 最终确认。

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`、`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts`（通过）
   - 说明：deliver 的 explain-plus-execute bridge 与 explainer surface 现在都对齐到同一个 chat-first orchestration-owned entry，不再因为 availability overlay 漂到 `/connect`。

## 处置结果与剩余风险
1. round-4 的 accepted finding 已全部修复并完成代码层验证。
2. sprint-001 仍需新的 fresh reviewer clean round 返回“无 actionable finding”后，才可推进 closeout。
