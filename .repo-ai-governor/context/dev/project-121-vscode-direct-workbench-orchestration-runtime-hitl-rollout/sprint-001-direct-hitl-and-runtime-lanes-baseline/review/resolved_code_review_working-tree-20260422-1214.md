# Code Review: working-tree-20260422-1214

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-004`
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
1. `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`
2. `apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-004.md`

## 2. Findings
### 2.1 [P2] session continuity 在 sidecar RPC 抛错时没有继续走旧版 `getSession()` fallback
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:430`
- 问题描述: 第四轮 reviewer 发现 `querySessionContinuity()` 只有在 `client.querySessionContinuity()` 返回 `undefined` 时才回退到 `getSession(sessionId)`，但如果 sidecar RPC 直接抛错，代码会立即退化成 `degradedReason`，导致 continuity panel 被不必要地打空。
- 影响: 新增的 session-continuity query seam 在 transport/request failure 分支上不再 fail-soft，会让 VS Code workbench 比老路径更脆弱，和 sprint-001 想要的 direct-workbench baseline 相悖。
- 建议: 把“query 返回空”和“query 抛错”统一收敛到同一条 `getSession()` fallback 链路，并补一条 sidecar-RPC throw 的回归测试。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，且范围限定在 extension runtime 的 fallback 行为。
2. 修复后，`querySessionContinuity()` 只有在新 RPC 失败且 `getSession()` 也拿不到 session 时，才会返回 degraded continuity payload。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`（通过）
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
   - 证据：`querySessionContinuity()` 现在把 RPC throw 和 `undefined` 都收束到同一个 `getSession()` fallback，上层只在两条路径都失败时才回 degraded continuity payload。
   - 处理：新增 runtime unit test，显式覆盖 `querySessionContinuity()` 抛错但 `getSession()` 仍能成功恢复 continuity snapshot 的分支。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：continuity panel 现在对 session-continuity RPC 的暂时失败保持 fail-soft，不会跳过 legacy `getSession()` 恢复路径。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续发起 fresh delegated reviewer round；只有最新 round 无 actionable findings，closeout 才成立。
