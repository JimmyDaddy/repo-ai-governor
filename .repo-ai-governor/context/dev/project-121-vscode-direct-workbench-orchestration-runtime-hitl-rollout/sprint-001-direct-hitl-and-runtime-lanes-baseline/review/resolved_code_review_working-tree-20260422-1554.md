# Code Review: working-tree-20260422-1554

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-014`
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
2. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
3. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
4. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-014.md`

## 2. Findings
### 2.1 [P3] Session-mismatch HITL validation still bypassed the locale bridge
- 位置: `packages/core-orchestration-service/src/local-orchestration-service-shell.ts:552`
- 问题描述: 第 14 轮 reviewer 指出，`submitHitlDecision()` 最前面的 `executionSessionId` mismatch guard 仍直接抛英文错误，而后续 validation 分支已经接入 `localizeText(request.locale, ...)`。
- 影响: VS Code command controller 会直接展示 `standardizedError.message`，因此 `zh-CN` 用户在 stale/mismatched session id 路径上仍会收到英文提示，继续违反 `CS-033`。
- 建议: 把 session-mismatch guard 也接到同一 locale bridge，并补回归同时覆盖 mismatched-session 与 disallowed-decision 两条 HITL validation 错误路径。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，属于上一轮 i18n 收口时遗漏的最前置 guard。
2. reviewer 提到 desktop 新增 disabled-reason case 目前仍主要由 `typecheck/build` 间接覆盖；这属于 residual risk，不构成当前 round blocker。

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
   - 证据：session mismatch branch 确实仍是硬编码英文，且 VS Code error rendering 会直接透传该消息。
   - 处理：session-mismatch guard 已切到 `localizeText(request.locale, ...)`；shell regression 现在同时断言 `zh-CN` 下的 mismatched-session 与 disallowed-decision 两条中文错误消息。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-shell.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts`、`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：现在 `submitHitlDecision()` 的所有本轮新增 validation error 分支都走 locale bridge，不再留下 stale session id 的英文漏口。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
