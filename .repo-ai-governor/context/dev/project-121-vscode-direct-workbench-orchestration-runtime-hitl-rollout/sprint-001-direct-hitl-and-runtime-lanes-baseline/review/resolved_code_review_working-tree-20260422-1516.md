# Code Review: working-tree-20260422-1516

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-013`
- Review Type: sprint delegated recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/vscode-governance-workbench-surface-contract.md`

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
5. `apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`
6. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
7. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
9. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
10. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-013.md`

## 2. Findings
### 2.1 [P2] Enabled HITL submit action could be emitted with zero legal decisions
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts:127`
- 问题描述: delegated reviewer 发现 `SUBMIT_HITL_DECISION` 只看 `pendingHitl` 就会被标记为 `enabled=true`，即使 service-owned `allowedDecisions` 为空，导致 DTO 暴露出“可点但无合法选项”的 fail-open 状态。
- 影响: execution board / HITL inbox / queue overview 会向消费端传播无效动作 truth，VS Code tree 与 command flow 也会出现静默降级甚至无反馈。
- 建议: `allowedDecisions` 为空时必须 fail-closed，输出 disabled action + 明确 reason，并在 service 与 VS Code 渲染层补回归。

### 2.2 [P2] Legacy `revise` alias leaked back into persisted HITL receipts
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-shell.ts:1412`
- 问题描述: `submitHitlDecision()` 已经把 legacy `revise` 归一化为 `request_changes` 做校验，但 `persistHitlDecisionReceipt()` 仍写入原始 request 值，导致 canonical receipt 重新泄漏旧词汇。
- 影响: service-owned receipt artifact 与 workbench/runtime 展示词汇发生漂移，legacy caller 会把非 canonical 值继续传播到后续消费面。
- 建议: 在 receipt persistence 前使用 canonicalized decision request，并新增 regression 覆盖 `revise -> request_changes`。

### 2.3 [P3] New `submitHitlDecision` validation errors bypassed repo i18n rules
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-shell.ts:563`
- 问题描述: 本轮新增的 `RuntimeError` 消息是硬编码英文字符串，没有经过仓库要求的 i18n/localize bridge。
- 影响: `packages/**` 的新用户可见错误路径违反 `CS-033`，中英文消费端拿到的提示不一致。
- 建议: 为 `submitHitlDecision` 新增 locale-aware `localizeText` bridge，并让 VS Code command seam 传入当前 UI locale。

## 3. Notes
1. delegated reviewer 额外指出 VS Code presentation / command flow 对“enabled 但空 options”也缺少 defensive handling，本轮修复一并收口。
2. 为了兼容新增 disabled-reason 枚举，`apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts` 同步补了对应本地化文案，避免新枚举破坏 full-repo `typecheck`。

## 4. Verification
1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
2. `pnpm run typecheck`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check:ide-entry-smoke`（通过）
6. `node ./scripts/governance/sync-task-ledger.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
7. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
10. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：reviewer 的 built-JS reproduction 成立；`pendingHitl=true` 且 `allowedDecisions=[]` 时，service affordance 仍会输出 enabled action。
   - 处理：service affordance 现在对空 decision set fail-closed；VS Code tree/html/command flow 同时改为把空 options 当作 disabled path 处理，并补 service + presentation regression。
2. `2.2`
   - 判定：**认可**
   - 证据：legacy `revise` 仅在 validation 阶段 canonicalize，receipt 持久化仍写 raw request。
   - 处理：receipt persistence 改为使用 canonical request；新增 regression 断言 receipt 中始终落 `request_changes`。
3. `2.3`
   - 判定：**认可**
   - 证据：`submitHitlDecision` 的新增 validation error 确实是硬编码英文，违反 `CS-033`。
   - 处理：shell 新增 locale-aware `localizeText` helper，VS Code command seam 传入 `vscode.env.language`，并补中文错误断言。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`（通过）
   - 说明：service/VS Code 现在都会把“空 allowedDecisions”视为 disabled HITL action，不再暴露 fail-open affordance。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`pnpm run build`（通过）
   - 说明：service-owned receipt artifact 只会落 canonical `request_changes`，不会再把 legacy `revise` 写回持久化产物。
3. `2.3`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`、`apps/desktop/src/runtime/desktop-governance-console-view-model-builder.ts`、`packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`pnpm run typecheck`、`pnpm run build`（通过）
   - 说明：新 validation error 现在经过 locale-aware bridge，新增 disabled-reason 也已同步到 desktop localization switch。

## 处置结果与剩余风险

1. 本轮 3 条 accepted finding 已全部修复并完成 full sprint-001 baseline 复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
