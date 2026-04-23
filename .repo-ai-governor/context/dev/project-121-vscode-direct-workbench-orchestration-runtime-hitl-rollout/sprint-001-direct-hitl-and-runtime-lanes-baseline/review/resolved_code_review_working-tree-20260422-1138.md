# Code Review: working-tree-20260422-1138

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-002`
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

## 1. Review Scope
1. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
4. `packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts`
5. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-002.md`

## 2. Findings
### 2.1 [P1] HITL query fallback 仍会在 producer 未给出真实 state 时伪造通用策略语义
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-shell.ts:829`
- 问题描述: 第二轮 reviewer 发现 `HITL_REQUIRED` 事件、降级后重入和 recovery 路径仍可能给 execution 自动合成默认 `confirm/L2/block` packet，使 `queryHitlDecisionPacket()` 在 producer 没有显式提供 `hitlDecisionState` 时暴露 fabricated truth。
- 影响: 这会破坏 `fail-closed` 约束，让 VS Code HITL cockpit 继续消费 extension/service 自造的 shadow policy 语义，而不是 producer 明确上送的 canonical state。
- 建议: 仅在 `publishEvent()` 收到真实 `hitlDecisionState` 时持久化该 state；`submitHitlDecision()` 和 recovery 路径只能保留既有 state，不能再兜底生成默认 packet。

### 2.2 [P2] review routing 仍只识别 `Review records`，与当前工作区 `Review` 真值字段脱节
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts:50`
- 问题描述: live `current-context.md` 现在在 `Primary Stream` 中使用 `- Review: ...`，但 review routing runtime 仍只读取 `Review records`，导致 runtime lane / HITL backlink 在真实 workspace truth 下可能无法解析 review 目录。
- 影响: direct-workbench workbench surface 会在真实仓库上下文中丢失 review 文档 handoff/backlink，形成 service-owned routing 与 workspace truth 的 drift。
- 建议: 同时兼容 `Review records` 与 `Review` 字段，并补测试覆盖 `Primary Stream` 与 `Worktree Review Target` 两种 alias 场景。

## 3. Notes
1. 本轮 findings 只集中在 `fail-closed` HITL packet 语义和 review routing 对 live current-context 字段的兼容性。
2. 修复完成后，`queryHitlDecisionPacket()` 在缺少 producer-owned state 时会返回 `undefined`，符合 reviewer 要求的保守收口。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check:ide-entry-smoke`（通过）
6. `node ./scripts/governance/sync-task-ledger.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
7. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
8. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`publishEvent()`、`submitHitlDecision()` 与 `applyRecoveredExecution()` 已改为只保留 producer 提供或既有的 `hitlDecisionState`，不再生成默认 `confirm/L2/block` 语义。
   - 处理：补充 shell-level regression test，明确断言未 seed `hitlDecisionState` 的 execution 会让 `queryHitlDecisionPacket()` 返回 `undefined`。
2. `2.2`
   - 判定：**认可**
   - 证据：review routing runtime 现在通过字段别名同时读取 `Review records` / `Review`，并新增了 `Primary Stream` 与 `Worktree Review Target` 的 live-format alias 覆盖测试。
   - 处理：保留旧字段兼容，同时对接 live `current-context.md` 的 `Review` 真值字段。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：默认 HITL packet 合成辅助逻辑已移除；未提供真实 `hitlDecisionState` 时改为 fail-closed。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-review-routing-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-review-routing-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-artifact-pane-query-runtime.unit.test.ts`（通过）
   - 说明：review routing 同时兼容 `Review records` 与 `Review` 字段，并覆盖了 primary / worktree review target 两类 live current-context 场景。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复并复验。
2. sprint-001 仍需继续发起 fresh delegated reviewer round，只有最新 round 无 actionable findings 后才能进入 sprint closeout。
