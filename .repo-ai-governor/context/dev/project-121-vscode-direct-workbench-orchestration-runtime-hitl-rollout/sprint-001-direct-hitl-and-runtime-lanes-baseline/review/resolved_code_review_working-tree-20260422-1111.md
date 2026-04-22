# Code Review: working-tree-20260422-1111

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint delegated review
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
  - `.repo-ai-governor/normative_knowledge_sources/governance/risk-facts-and-hitl-sla-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/direct-workbench-orchestration-runtime-hitl-contract.md`

## 1. Review Scope
1. `packages/orchestration-service-client/src/index.ts`
2. `packages/orchestration-service-client/src/types/index.ts`
3. `packages/orchestration-service-client/src/types/interfaces/index.ts`
4. `packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`
5. `packages/core-orchestration-service/src/constants/index.ts`
6. `packages/core-orchestration-service/src/constants/local-orchestration-service-governance-query.constant.ts`
7. `packages/core-orchestration-service/src/constants/local-orchestration-service-sidecar.constant.ts`
8. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
9. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
10. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
11. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-host.ts`
12. `packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-sidecar.interface.ts`
13. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
14. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
15. `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts`
16. `apps/vscode-extension/src/types/interfaces/index.ts`
17. `apps/vscode-extension/src/types/interfaces/vscode-extension-surface.interface.ts`
18. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
19. `apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`
20. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/**`

## 2. Findings
### 2.1 [P1] `querySessionContinuity()` 会在只读查询里写入 `SESSION_RESUMED` 事件
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:163`
- 问题描述: 当前实现为了填充 `resumeSelector` 调用了 `tryResumeSession()`，而 `resumeSession()` 会真实追加 `SESSION_RESUMED` 事件、推进 `latestEventSequence` 与 `nextCursor`。这使得打开或刷新 Workflow Studio 的只读查询路径会直接污染 canonical session 审计轨迹。
- 影响: direct-workbench 的 query seam 不再是只读投影，session continuity 与审计事件会因为 UI 刷新而漂移，违反新 contract 要求的 query-vs-mutation owner split。
- 建议: 改成纯读取 `session summary` 或只读 latest-session 解析来生成 `resumeSelector`，不要在 query 路径调用 `resumeSession()`。

### 2.2 [P1] HITL decision packet 目前是查询时临时拼装，SLA 与 policy 无法稳定回放
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:228`
- 问题描述: `riskFacts / policyAction / slaDeadlineAt` 目前由 `pendingHitl + nowProvider()` 临时推导，导致相同 execution 的查询结果会随着读取时间变化，且没有 canonical persisted state 可回放。高风险 `escalate/block` 语义也无法通过稳定真值 surface 暴露。
- 影响: VS Code HITL cockpit 拿到的是 presenter-time synthesis，而不是 service-owned replayable contract；这违反 direct-workbench runtime contract 与 risk-facts/SLA contract 的回放要求。
- 建议: 将 HITL packet 的 canonical risk/policy/SLA state 持久化到 execution-owned truth，并在 query 路径只做回放和补充 backlinks/review 路由。

### 2.3 [P2] continuity / HITL 新增 payload 仍有 English-only 文案泄漏到 VS Code UI
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:171`
- 问题描述: `degradedReason`、`impactSummary` 和固定 backlink label 当前直接写成英文，而 presentation builder 又直接渲染这些值，导致 zh-CN 工作台会出现混合语言。
- 影响: 违反 `CS-033`，并让 sprint-001 新增的 runtime lanes / HITL cockpit 在中文环境下体验退化。
- 建议: 通过 repo 既有 i18n/locale bridge 输出本地化文案，或在 service payload 内改成 machine-readable key 后由 consumer 本地化。

### 2.4 [P3] 新增错误路径重新引入了 `instanceof Error`
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts:612`
- 问题描述: `readErrorMessage()` 使用 `error instanceof Error`，直接回到了 native error pattern。
- 影响: 违反 `CS-022`，并让新增 runtime query 代码绕开仓库统一的 standardized error model。
- 建议: 使用 `standardizeError(error).message` 统一收敛错误消息。

## 3. Notes
1. 首轮 delegated reviewer 未发现 sprint-001 task-ledger、checklist、tasks.csv 与 review lifecycle 的漂移问题。
2. 本轮 findings 全部集中在 `querySessionContinuity / queryHitlDecisionPacket` 的 owner split、回放语义与 i18n/error model 收口，不影响已通过的 build/test baseline 作为修复前证据。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）
5. `node ./scripts/governance/sync-task-ledger.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
9. `node ./scripts/governance/check-code-review-status-sync.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`querySessionContinuity()` 原实现调用 `resumeSession()` 只为取 `resumeSelector`，与 direct-workbench query seam 的只读约束冲突。
   - 处理：改为只读 latest-session/session-summary 解析，不再在 query 路径写 `SESSION_RESUMED` 事件。
2. `2.2`
   - 判定：**认可**
   - 证据：原 HITL packet 由 `pendingHitl + nowProvider()` 即时推导，`slaDeadlineAt` 无法稳定回放。
   - 处理：将 canonical HITL state 持久化到 execution-owned record，并在 query 路径只做回放与 backlink/review 补充。
3. `2.3`
   - 判定：**认可**
   - 证据：新增 `degradedReason / impactSummary / backlink label` 中存在 English-only 文案，直接进入 VS Code workbench。
   - 处理：为 continuity / HITL packet query 接入 locale，并清理固定英文 label。
4. `2.4`
   - 判定：**认可**
   - 证据：`readErrorMessage()` 使用了 `instanceof Error`，与 `CS-022` 不一致。
   - 处理：移除该 native-error 分支，并继续使用标准化错误模型。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/vscode-extension/test/vscode-extension-service-runtime.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
   - 验证：`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`（通过）
   - 说明：`querySessionContinuity()` 现在通过只读 session lookup / latest-session 解析生成 `resumeSelector`，不再调用 `resumeSession()`。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/src/types/interfaces/local-orchestration-service-shell.interface.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增 execution-owned canonical HITL decision state 持久化与回放，SLA 与 risk facts 不再在 query 时间漂移。
3. `2.3`：已完成
   - 变更文件：`packages/orchestration-service-client/src/types/interfaces/orchestration-service-client.interface.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
   - 验证：`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`（通过）
   - 说明：continuity / HITL packet query 现在携带 locale，并清理了固定英文 label 与 degraded reason。
4. `2.4`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
   - 验证：`pnpm run typecheck`（通过）
   - 说明：移除了新增路径中的 `instanceof Error` 分支，保持 standardized error model 一致。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复并复验。
2. canonical HITL packet 目前已具备稳定回放语义；后续若有更高风险 `escalate/block` producer 接入，可通过已补齐的 execution-owned state seed 继续上送真实 policy/SLA。
