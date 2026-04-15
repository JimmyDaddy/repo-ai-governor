# Code Review: project-108 final closeout round 9

- Status: resolved
- Date: 2026-04-16
- Reviewer: AI-Agent
- Task: `CR-009`
- Review Type: project-final working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/`
2. `README.md`
3. `README.zh-CN.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/support-matrix.md`
7. `docs/support-matrix.zh-CN.md`
8. `apps/cli/src/main.ts`
9. `apps/cli/src/commands/adopt-command.ts`
10. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
11. `apps/cli/src/runtime/adoption-pack-runtime.ts`
12. `packages/config/src/workspace-resolver.ts`
13. `packages/config/src/types/interfaces/workspace.interface.ts`
14. `packages/shared/src/i18n/locales/en-us.ts`
15. `packages/shared/src/i18n/locales/zh-cn.ts`
16. `apps/cli/test/adopt-command.integration.test.ts`

## 2. Findings

### 2.1 [P2] Explicit `repo_local` bootstrap still bootstraps an extra generic workspace

- 位置: `apps/cli/src/main.ts:428`, `apps/cli/src/main.ts:1647`, `apps/cli/src/main.ts:716`, `apps/cli/test/adopt-command.integration.test.ts:535`
- 问题描述: 当前 runtime context 已跟随 `--repo`，但还没有正确收口显式 `adopt --workspace-mode repo_local` 的 CLI runtime path。fresh `adopt bootstrap --repo target-repo --workspace-mode repo_local` 仍可能在命令自有 bootstrap 之外，额外触发 generic workspace auto-bootstrap，留下与目标 repo 无关的 workspace state，并让 JSON diagnostics 不能稳定反映显式 repo-local contract。
- 影响: product brief 的 workspace 持久化策略要求 `repo_local` 明确落到目标 repo `.repo-ai-governor`；若运行时还会额外创建 generic workspace，就会破坏 target-repo-only truth，并让 adopter-facing diagnostics 与实际 contract 不一致。
- 建议: 让 runtime context 明确消费显式 `adopt --workspace-mode` override，同时禁止 adopt flows 走 generic CLI workspace auto-bootstrap；并补充隔离 `HOME` 的集成断言，确保 repo-local bootstrap 不再留下额外的 tool-managed workspace。

## 3. Notes

1. 除这条 workspace-mode leak 外，本轮未再发现新的 docs/runtime/i18n actionable finding。
2. `CR-008` 刚修复过的 support-matrix provenance 需要在后续 helper rerun 后继续保持与最新 evidence window 对齐。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./.tmp/project-108-bootstrap-cleanroom.mjs`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-16）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：explicit `repo_local` bootstrap 的 runtime context 需要同时保证 diagnostics truth 和 zero stray generic workspace side effect；仅把 `--repo` 接入 `resolveRuntimeContext()` 还不够，adopt flows 仍需避开 generic auto-bootstrap。
   - 处理：在 `main.ts` 中把显式 adopt workspace-mode override 带入 runtime context，并在 `cli-governance-runtime.ts` 中让 adopt flows 跳过 generic workspace auto-bootstrap；同时补充隔离 `HOME` 的集成测试，确保 repo-local bootstrap 不再创建额外的 tool-managed workspace。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./.tmp/project-108-bootstrap-cleanroom.mjs`（通过）
4. `pnpm run check`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-16）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/main.ts`、`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/test/adopt-command.integration.test.ts`, `docs/support-matrix.md`, `docs/support-matrix.zh-CN.md`
   - 验证：`pnpm run build`、`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./.tmp/project-108-bootstrap-cleanroom.mjs`、`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-worktree-review-target.js`（通过）
   - 说明：runtime context 现在会消费显式 `adopt --workspace-mode repo_local`，而 adopt flows 自身接管目标仓库 workspace 初始化，不再误触 generic CLI workspace auto-bootstrap；隔离 `HOME` 的集成测试确认 repo-local bootstrap 不再创建额外的 tool-managed workspace。由于 clean-room helper 在本轮修复后再次生成了 summary，support matrix 的 installer/self-host bootstrap support row 也同步刷新到 `2026-04-15T20:21:43.691Z` 最新 evidence window。

## 处置结果与剩余风险

1. 当前 round 的 `1` 条 accepted finding 已修复并重新验证。
2. 当前 round 未保留 blocker 或 deferred 项，但按照 `workspace-scoped-cr-loop` 与用户串行 closeout 契约，project-final closeout 仍需先完成 fresh `CR-010` clean recheck。
