# Code Review: sprint-003-review-workflow-and-verify-removal working tree round 3

- Status: resolved
- Date: 2026-04-10
- Reviewer: AI-Agent
- Task: `CR-003`
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

### 2.1 [P2] Prompt-first slash workflows 未写入 shell history

- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:983`
- 问题描述: AI-workflow slash 分支调用 `handlePlainTextTurn()` 时把 `historyEntry` 显式传成 `null`，虽然 `displayUserMessage` 会让 transcript 展示 `/plan`、`/review`、`/review verify`，但这些输入不会进入 `runtimeState.inputHistory`。因此 `/history`、依赖 history 的 `/search`，以及基于 history 的再次召回都看不到这些 prompt-first slash command。
- 影响: 这是新 command-model 的用户可见回归；slash 看起来像执行过，但 shell history 实际缺失，违背交互心智。
- 建议: 在 AI-workflow 分支把原始 `query` 作为 `historyEntry` 写回，并补一条真正断言 `/history` 输出包含 `/plan ...` 的回归测试，而不只检查 transcript。

## 3. Notes

1. 本轮 fresh reviewer 没有再发现别的 actionable item；当前问题集中在 session-shell history persistence。

## 4. Verification

1. `pnpm run build`（通过，进入本轮 recheck 前的同窗口基线）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，进入本轮 recheck 前的同窗口基线）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过，进入本轮 recheck 前的同窗口基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，进入本轮 recheck 前的同窗口基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，进入本轮 recheck 前的同窗口基线）

## 5. 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts` 的 AI-workflow slash 分支现在把原始 `query` 作为 `historyEntry` 传给 `handlePlainTextTurn()`，不再让 `/plan`、`/review`、`/review verify` 绕过 `runtimeState.inputHistory`。`apps/cli/test/runtime/session-shell-runner.test.ts` 也从“只看 transcript”升级为真正断言 `/history` 输出里出现 `/plan ship a tetris clone`。
   - 处理：prompt-first slash workflows 现在会同时保留 transcript-facing display message 和 shell history persistence。

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
   - 说明：prompt-first slash workflows 重新回写到 shell history，`/history` 和基于 history 的搜索/召回不再丢失这些输入。

## 7. 处置结果与剩余风险

1. 本轮发现已修复，并通过同窗口 `build + packages/integration tests + governance gates` 验证。
2. 还需要一轮 final fresh reviewer 来确认当前 working tree 已无新的 actionable finding，然后才能结束 sprint-003 的 CR loop。
