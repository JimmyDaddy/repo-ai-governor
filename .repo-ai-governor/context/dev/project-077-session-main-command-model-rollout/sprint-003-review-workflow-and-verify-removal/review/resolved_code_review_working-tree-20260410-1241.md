# Code Review: sprint-003-review-workflow-and-verify-removal working tree round 4

- Status: resolved
- Date: 2026-04-10
- Reviewer: AI-Agent
- Task: `CR-004`
- Review Type: delegated post-fix recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-scoped-cr-loop/SKILL.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope

1. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
2. `apps/cli/test/runtime/session-shell-runner.test.ts`

## 2. Findings

### 2.1 [P2] AI-workflow slash inputs 会在 shell history 里重复记录

- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:985`
- 问题描述: slash command 提交流程在 `handleSlashCommand()` 开头就已经对原始 `query` 调用了 `recordHistory()`。`CR-003` 的修复又把同一个 `query` 传回 `handlePlainTextTurn()` 作为 `historyEntry`，于是 `/plan`、`/review`、`/review verify` 在 AI-workflow 分支里会被写入 history 两次。
- 影响: `/history` 会出现重复行，基于 history 的召回行为也会变得重复，属于用户可见的交互退化。
- 建议: 保持 slash submit 入口作为唯一 history 写入点，让 AI-workflow 分支只负责 `displayUserMessage`；并把 runner 回归测试收紧为“恰好一条 history 行”，防止以后再次双写。

## 3. Notes

1. 本轮 fresh reviewer 未发现其他新的 actionable finding；当前问题是对上一轮 history 修复的二次纠偏。

## 4. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts`（通过，进入本轮 recheck 前的同窗口基线）
2. `pnpm run build`（通过，进入本轮 recheck 前的同窗口基线）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，进入本轮 recheck 前的同窗口基线）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过，进入本轮 recheck 前的同窗口基线）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，进入本轮 recheck 前的同窗口基线）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过，进入本轮 recheck 前的同窗口基线）

## 5. 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts` 已恢复为“slash submit 入口单点写 history，AI-workflow 分支只传 `displayUserMessage`”；`apps/cli/test/runtime/session-shell-runner.test.ts` 现在断言 `/history` 里恰好只有一条 `/plan ship a tetris clone` 记录，而不是仅验证存在性。
   - 处理：prompt-first slash workflows 既保留了 history 可见性，也避免了重复 history rows。

### 验证命令

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 6. 修复执行记录（2026-04-10）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`、`apps/cli/test/runtime/session-shell-runner.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
   - 说明：AI-workflow slash inputs 现在只保留单条 history 记录，不再重复写入。

## 7. 处置结果与剩余风险

1. 本轮发现已修复，并通过同窗口 `build + packages/integration tests + governance gates` 验证。
2. 还差一轮 final fresh reviewer clean recheck，确认当前 working tree 已无新的 actionable finding。
