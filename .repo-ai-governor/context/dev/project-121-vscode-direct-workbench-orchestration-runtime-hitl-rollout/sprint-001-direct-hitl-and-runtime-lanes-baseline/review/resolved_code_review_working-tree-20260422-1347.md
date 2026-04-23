# Code Review: working-tree-20260422-1347

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-009`
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
1. `packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-shell.ts`
5. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
6. `apps/cli/test/cli-governance-runtime.integration.test.ts`
7. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-009.md`

## 2. Findings
### 2.1 [P1] HITL allowed decisions were advisory instead of service-enforced
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-shell.ts:545`
- 问题描述: 第九轮 reviewer 发现 `queryHitlDecisionPacket()` 已经暴露 `allowedDecisions`，但 `submitHitlDecision()` 仍然只检查 `pendingHitl`，不会校验请求的 `decision/resumeAction` 是否属于 service-owned policy surface；同时 execution-board / HITL inbox affordance 仍然总是返回默认三选项，而不是 execution 当前真实允许的 decision set。
- 影响: 窄化后的 policy gate 可以被绕过，不同 workbench surface 还会对“当前到底允许哪些 HITL 决策”给出不一致答案，直接破坏 sprint-001 要求的 direct workbench trust/policy gate。
- 建议: 让 shell 按当前 execution 的 service-owned `allowedDecisions` 真正执行校验，并把 execution-board / HITL inbox / queue overview 的 affordance 统一切到同一份 state；同时补回归测试覆盖非法决策拒绝、合法决策通过，以及旧 CLI `revise -> degrade` 的兼容别名。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，属于 HITL gate enforcement 与 affordance truth 的一致性缺口。
2. 修复仍保持 service 作为唯一 truth owner，没有把 allowed-decision policy 下沉到 extension 侧自行判断。

## 4. Verification
1. `pnpm run typecheck`（通过）
2. `pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/cli-governance-runtime.integration.test.ts -t "keeps run in HITL follow-up when a revise decision degrades execution"`（通过）
3. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`（通过）
4. `pnpm run build`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `pnpm run check:ide-entry-smoke`（通过）
7. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
8. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：reviewer 指出的断点成立。此前 shell 会接受任意 `decision/resumeAction` 对，只要 execution 仍在 `pendingHitl`；与此同时 execution-board / inbox / queue overview 的 submit affordance 也没有消费当前 execution 上的真实 `allowedDecisions`。
   - 处理：让 shell 以 service-owned `allowedDecisions` 为唯一准入 gate，对非法 pair 返回 `POLICY_GATE_HITL_FEEDBACK_INVALID`；execution-board / HITL inbox / queue overview 全部改为消费当前 execution 的 decision state；同时兼容旧 CLI 的 `revise` 别名并增加回归测试。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-governance-affordance-builder.ts`、`packages/core-orchestration-service/src/local-orchestration-service-governance-query-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-queue-overview-query-runtime.ts`、`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run typecheck`、`pnpm exec vitest run --config vitest.packages.config.ts apps/cli/test/cli-governance-runtime.integration.test.ts -t "keeps run in HITL follow-up when a revise decision degrades execution"`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-governance-query-runtime.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-sidecar-client.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：service 现在会按 execution 当前允许的 decision set 真正执行 gate，并把 execution-board / HITL inbox / queue overview 的决策 affordance 收敛到同一份 service-owned state；旧 CLI 的 `revise` 仍作为 `request_changes` 兼容别名被接受。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
