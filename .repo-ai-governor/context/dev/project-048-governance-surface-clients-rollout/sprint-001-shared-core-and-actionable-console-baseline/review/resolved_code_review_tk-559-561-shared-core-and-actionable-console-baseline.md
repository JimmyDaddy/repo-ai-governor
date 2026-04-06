# Code Review: TK-559 TK-560 TK-561 shared core and actionable console baseline

- Status: resolved
- Date: 2026-04-05
- Reviewer: AI-Agent
- Task: `TK-559/TK-560/TK-561`
- Scope: `project-048-governance-surface-clients-rollout / sprint-001-shared-core-and-actionable-console-baseline`
- Review Type: sprint-owned scope code review
- Normative References:
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`

## 1. Review Scope

1. sprint-001 ledger files under `.repo-ai-governor/context/dev/project-048-governance-surface-clients-rollout/sprint-001-shared-core-and-actionable-console-baseline/`
2. desktop governance console / preload / runtime changes under `apps/desktop/**`
3. orchestration service client and local orchestration service governance query / handoff routing changes
4. desktop smoke/docs/examples and sprint-001 targeted tests

## 2. Findings

### 2.1 [P1] Review handoff truth is globally routed instead of execution-scoped

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:134`
- 问题描述: `buildHandoffTargets()` currently binds every execution to `resolveLatestReviewDocumentPath()`, which just picks the newest markdown file in the routed review directory.
- 影响: 当同一 sprint review 目录下同时存在多个 review 生命周期文件时，desktop / sidecar 会把错误的 review 文档绑定到不相干的 execution，破坏 sprint-001 要求的 service-owned handoff target truth。
- 建议: 基于 execution-owned facts（至少 `taskId` / `projectId` / `sprintId`）解析 review 文档，并补一个 multi-review regression test 证明不同 execution 会拿到各自的 review document。

### 2.2 [P2] Execution board aggregate status prefers warning over error

- 位置: `apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts:84`
- 问题描述: `executionBoard.statusVariant` 先判断 `WARNING` 再判断 `ERROR`，导致同时存在 failed execution 与 running/HITL execution 时，board 总体状态会被降成 warning。
- 影响: command center 外层监督面会弱化真正的失败信号，用户可能错过需要优先处理的 execution failure。
- 建议: 将聚合优先级调整为 `ERROR > WARNING > SUCCESS > INFO`，并补 mixed failed + running/HITL 的 view-model regression test。

## 3. Notes

1. 首轮 reviewer 子 agent 仅返回以上两条 actionable finding，未给出其他阻断项。

## 4. Verification

1. `pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts test/desktop-entry-smoke.integration.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run check:desktop-entry-smoke`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-05）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 `review-document` handoff 只取 routed review 目录里“最新”的 markdown 文件，确实会在多 review 文件并存时把错误文档绑定给无关 execution。
   - 处理：按 execution-owned `taskId/projectId/sprintId` 解析 review 生命周期文件，并补 multi-review routing regression test。
2. `2.2`
   - 判定：**认可**
   - 证据：`executionBoard.statusVariant` 先判断 `WARNING` 再判断 `ERROR`，混合 failed + running/HITL board 会被错误降级成 warning。
   - 处理：将 aggregate precedence 调整为 `ERROR > WARNING > SUCCESS > INFO`，并补 mixed board regression test。

### 验证命令
1. `pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`

## 修复执行记录（2026-04-05）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
   - 说明：review handoff 改为按 execution-owned `taskId/projectId/sprintId` 匹配 routed review directory 中的生命周期文件；多候选时使用“匹配得分优先、更新时间次之”，歧义时 fail-closed。
2. `2.2`：已完成
   - 变更文件：`apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`、`apps/desktop/test/desktop-governance-console-view-model-builder.test.ts`
   - 验证：`pnpm exec vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-preload-bridge.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts test/desktop-entry-smoke.integration.test.ts`（通过）
   - 说明：execution board 聚合状态调整为 `ERROR > WARNING > SUCCESS > INFO`，并新增 failed + running/HITL mixed board regression test。
3. `build-and-closeout`：已完成
   - 变更文件：`apps/desktop/**`、`packages/core-orchestration-service/**`、review lifecycle artifact
   - 验证：`pnpm run build`、`pnpm run check:desktop-entry-smoke`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`（通过）
   - 说明：本轮 code-affecting 修复已补齐 build、desktop smoke 与 sprint ledger / review gate evidence，可进入 reviewer 复审。

## 复核结论（2026-04-05）

- 整体结论：**部分认可**

### 逐条复核
1. `follow-up-1`
   - 判定：**认可**
   - 证据：二轮 reviewer 发现 `resolveExecutionReviewDocumentPath()` 在 routed review 目录只剩 1 个 markdown 文件时仍会无条件返回该文件，因此当 sole candidate 属于其他 task 时，review-document handoff 仍可能误绑。
   - 处理：移除单文件无条件回退；当 execution 自身携带 `taskId` 时，候选 review 文件必须先命中该 `taskId` 才允许进入 project/sprint 打分，并补 lone mismatched review regression tests。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`

## 修复执行记录（2026-04-05）

1. `follow-up-1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`、`pnpm run build`、`pnpm run check:desktop-entry-smoke`（通过）
   - 说明：single-file review routing 现在也遵守 execution-scoped fail-closed 规则；若 sole candidate 未命中 execution `taskId`，则 review-document handoff 为空而不是误绑到无关 CR 文件。

## 阶段复审结论（2026-04-05）

1. reviewer 子 agent 最终结论：`No actionable findings.`
2. sprint-001 reviewer loop 已达到关闭条件，可切换 sprint 状态与 primary stream。

## 复核结论（2026-04-05）

- 整体结论：**部分认可**

### 逐条复核
1. `follow-up-2`
   - 判定：**认可**
   - 证据：review router 已有 equal-score candidate fail-closed 分支，但原有新增回归只覆盖了“唯一匹配”和“单文件不匹配”，未覆盖“多个同分候选都只命中 project/sprint”的危险歧义分支。
   - 处理：为 shell unit 与 sidecar integration 同时补充 equal-score ambiguity regression，确保 `review_document` handoff 在 tie 情况下保持 unavailable。

### 验证命令
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`

## 修复执行记录（2026-04-05）

1. `follow-up-2`：已完成
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`、`pnpm run build`（通过）
   - 说明：新增 equal-score ambiguity regression 后，review router 的 fail-closed 危险分支已具备覆盖，后续 refactor 不会无声退化为任意挑选 review document。

## 最终复审结论（2026-04-05）

1. reviewer 子 agent 最终结论：`No actionable findings.`
2. sprint-001 全部已接受修复项与后续 coverage finding 均已收口，review loop 正式关闭。
