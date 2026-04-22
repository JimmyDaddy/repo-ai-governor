# Code Review: working-tree-20260422-1644

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-017`
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
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-017.md`

## 2. Findings
### 2.1 [P2] executionId-only continuity fallback dropped older-sidecar compatibility
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts:430`
- 问题描述: 第 17 轮 reviewer 指出，`querySessionContinuity()` 在 sidecar continuity seam 抛错后，只会对显式 `sessionId` 继续 fallback；若调用方仅提供 `executionId`，会过早返回 `undefined`。
- 影响: mixed-version 或较老 sidecar 场景下，Workflow Studio/Runtime workbench 通过 executionId 查询 continuity 时会丢失降级兼容路径，违背当前 runtime 已有的 `getExecution()` + `getSession()` 兼容策略。
- 建议: 在 continuity query 失败后，通过 `executionId -> getExecution() -> executionSessionId -> getSession()` 补齐同等 fallback，并加回归测试。

### 2.2 [P3][CS-016] New sidecar query entry points lacked JSDoc
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts:217`
- 问题描述: 新增的公开 query wrapper 扩展了 sidecar transport contract，但没有补上方法级 JSDoc。
- 影响: 这违反了 `CS-016` 对新增 exported class/function surface 的文档要求，也增加后续 transport contract 漂移的风险。
- 建议: 为新公开的 query seam 方法补上 purpose / params / returns 说明，和 shell 公开方法保持一致。

## 3. Notes
1. 本轮 reviewer 返回 2 条 actionable finding，分别是 continuity fallback 兼容性 P2 和 sidecar client 文档规则 P3。
2. reviewer 没有再指出 sprint-001 closeout/gov 面的新 blocker。

## 4. Verification
1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`（通过）
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
   - 证据：旧逻辑确实只对 `sessionId` 继续 fallback，executionId-only caller 在 older-sidecar continuity seam 失败时会直接失去 continuity 数据。
   - 处理：continuity fallback 现在会先通过 executionId 解析 execution summary，再用得到的 executionSessionId 调 `getSession()`；service-runtime test 直接覆盖 executionId-only 的兼容路径。
2. `2.2`
   - 判定：**认可**
   - 证据：新 sidecar query seam 方法是公开 transport surface，按 `CS-016` 需要补足 JSDoc。
   - 处理：为 `queryRoleLaneStatus`、`querySessionContinuity`、`queryHitlDecisionPacket` 补充 purpose / params / returns 级别文档。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/src/runtime/vscode-extension-service-runtime.ts`、`apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-service-runtime.test.ts`、`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：executionId-only continuity request 现在能在 older-sidecar 场景下平滑回落到 legacy getExecution/getSession seam。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-sidecar-client.ts`
   - 验证：同上（通过）
   - 说明：sidecar client 新公开 query seam 现在满足 `CS-016` 文档要求。

## 处置结果与剩余风险

1. 本轮 accepted findings 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
