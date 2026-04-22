# Code Review: sprint-002 workflow draft-session authoring baseline fresh recheck round 13

- Status: resolved
- Date: 2026-04-23
- Reviewer: AI-Agent
- Task: `CR-013`
- Review Type: delegated sprint recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/orchestration-service-client`
2. `packages/core-orchestration-service`
3. `apps/vscode-extension/src/runtime`
4. `apps/vscode-extension/src/types`
5. `apps/vscode-extension/test`
6. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline`

## 2. Findings
### 2.1 [P2] Native Error usage breaks standardized-error governance
- 位置: `packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts:219`
- 问题描述: 我在新增回归测试的守卫里用了 `new Error(...)`，直接命中 `CS-022`；reviewer 也复现了 `node ./scripts/governance/check-standardized-error-usage.js` 会在这行失败。
- 影响: 即使 build/test 基线都绿，这个 change window 仍无法满足 repo 的 standardized-error gate，不能作为 clean closeout 继续推进。
- 建议: 改成断言式失败路径或 standardized repo error，而不是 native `Error`。

## 3. Notes
1. fresh delegated reviewer round 13 只留下这一个 `CS-022` 直接规则违规；除它之外，本轮 reviewer 未再发现新的 actionable finding。
2. 这是一个纯治理修补，不改变 runtime 行为，只修正测试守卫的错误模型。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `node ./scripts/governance/check-standardized-error-usage.js`（通过）
3. `pnpm run build`（通过）
4. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-002-workflow-authoring-draft-session-baseline/tasks`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-23）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：测试新增的 `new Error(...)` 直接违反 `CS-022`，且 standardized-error gate 确实能稳定复现该失败。
   - 处理：accepted，改成断言式失败路径，并补跑 standardized-error gate + build + focused vitest。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `node ./scripts/governance/check-standardized-error-usage.js`（通过）
3. `pnpm run build`（通过）
4. `pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-23）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts`
   - 验证：`pnpm run typecheck`、`node ./scripts/governance/check-standardized-error-usage.js`、`pnpm run build`、`pnpm exec vitest run --config vitest.packages.config.ts packages/core-orchestration-service/test/local-orchestration-service-workflow-draft-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`
   - 说明：测试守卫已改为断言式失败路径，不再引入 native `Error`。

## 风险与后续（2026-04-23）

1. `CR-013` 的 accepted finding 已修复并完成同窗治理/构建/定向测试验证。
2. sprint-002 仍需 fresh `CR-014` reviewer round；只有最新 round 明确返回“无 actionable findings”，`TK-1040` 才能进入 closeout。
