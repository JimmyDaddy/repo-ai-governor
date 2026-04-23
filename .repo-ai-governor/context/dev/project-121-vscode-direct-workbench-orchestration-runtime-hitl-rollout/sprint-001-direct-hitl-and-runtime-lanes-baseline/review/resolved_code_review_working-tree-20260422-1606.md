# Code Review: working-tree-20260422-1606

- Status: resolved
- Date: 2026-04-22
- Reviewer: AI-Agent
- Task: `CR-015`
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
1. `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts`
2. `apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks/CR-015.md`

## 2. Findings
### 2.1 [P3] VS Code HITL submit seam still lacked direct command-controller coverage
- 位置: `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts:1071`
- 问题描述: 第 15 轮 reviewer 指出，`submitHitlDecision()` 新增的 fail-closed 分支与 `locale: vscode.env.language` 透传虽然已经在 service/presentation 面有覆盖，但命令控制器自身还没有直接回归测试。
- 影响: 如果后续回归破坏 `HITL_DECISION_UNAVAILABLE` 的提示文案，或者丢失 locale 透传，现有测试套件可能直到真实 VS Code 命令路径才暴露问题。
- 建议: 在 VS Code extension command-controller 集成测试里直接覆盖“无合法决策可提交”的提示分支，以及“提交成功时携带 `vscode.env.language`”的分支。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 actionable finding，属于覆盖缺口，不是运行时逻辑缺陷。
2. 除该覆盖缺口外，reviewer 未再发现 `packages/orchestration-service-client`、`packages/core-orchestration-service`、`apps/vscode-extension/src/runtime` 与 sprint-001 governance surface 的新增 blocker。

## 4. Verification
1. `pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
2. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`（通过）
3. `pnpm run typecheck`（通过）
4. `pnpm run build`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `pnpm run check:ide-entry-smoke`（通过）
7. `node ./scripts/governance/sync-task-ledger.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
8. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`（通过）
9. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
10. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
11. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
12. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-22）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当时 `submitHitlDecision()` 的 disabled-reason 提示和 locale 透传都只在相邻层间接覆盖，`apps/vscode-extension/test` 下确实没有 command-controller 直连回归用例。
   - 处理：补充 command-controller 集成测试，直接断言 `HITL_DECISION_UNAVAILABLE` 分支提示文案，以及提交成功时 `locale: vscode.env.language` 被带入 service seam。

### 验证命令
1. `pnpm run typecheck`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run check:ide-entry-smoke`（通过）

## 修复执行记录（2026-04-22）

1. `2.1`：已完成
   - 变更文件：`apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`
   - 验证：`pnpm exec vitest run apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts`、`pnpm run typecheck`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`pnpm run check:ide-entry-smoke`、`node ./scripts/governance/sync-task-ledger.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-001-direct-hitl-and-runtime-lanes-baseline/tasks`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：命令控制器现在直接覆盖了 fail-closed HITL 禁用提示和 locale 透传，避免该 seam 再成为间接覆盖盲区。

## 处置结果与剩余风险

1. 本轮 accepted finding 已全部修复并复验。
2. sprint-001 仍需继续执行 fresh delegated reviewer round；只有最新 round 无 actionable findings 时，closeout 才可进入。
