# Code Review: sprint-003-github-copilot-boundary-and-local-model-positioning delegated review loop round 1

- Status: resolved
- Date: 2026-04-07
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
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

1. `packages/adapters/github-copilot/**`
2. `packages/adapters/local-model/**`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
5. `test/first-batch-adapters-route.integration.test.ts`
6. `docs/support-matrix.md`
7. `docs/support-matrix.zh-CN.md`
8. `docs/local-adoption-playbook.md`
9. `docs/local-adoption-playbook.zh-CN.md`
10. `tasks/TK-604.md` / `TK-605.md` / `TK-606.md` / `tasks.csv` / `checklist.md`

## 2. Findings

### 2.1 [P2] Baseline Copilot probe reports cancellation as unsupported

- 位置: `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts:292`
- 问题描述: `probe()` 新增的 `requestCancellationMode` 目前对所有 execution mode 都固定写成 `not_supported`，但同一个 adapter 的 baseline capability matrix 仍对外声明 `supportsCancel=true`，并且 `cancel()` 在 baseline path 下会返回 `acknowledged=true`。
- 影响: 任何消费 health-check payload 的上层诊断或后续 routing 逻辑，都会在 baseline GitHub Copilot 路径上读到自相矛盾的 cancellation truth，进而给出错误的 readiness 或 downgrade guidance。
- 建议: 让 baseline probe 的 `requestCancellationMode` 与 capability matrix / `cancel()` 行为一致，并补一条 baseline regression test 固定该契约。

### 2.2 [P2] TK-606 closeout claim uses mixed-scope gate evidence

- 位置: `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/TK-606-close-real-adapter-invocation-rollout-with-support-matrix-and-verify-evidence-refresh.md:64`
- 问题描述: `TK-606` 目前把 `pnpm run check` 直接写成 sprint-003 closeout 证据，但同一条执行记录又说明这次 gate 同时包含了 shared helper-script lint 修复，导致记录下来的验证事实不是纯 sprint-003 boundary。
- 影响: 这会削弱 task-level verification provenance，违反 delivery evidence 应该可回放到当前 boundary 的要求，容易把 workspace-wide hygiene 误写成 sprint-only closeout proof。
- 建议: 把 `TK-606` 的证据叙述改成分层表达，明确 sprint-003 的 canonical evidence 仍是 targeted tests / build / verify / dry-run / governance checks，而 `pnpm run check` 只是同窗口的额外 workspace gate。

## 3. Notes

1. restricted-network `local-model` fallback 的更宽 CLI integration coverage 本轮没有重跑；当前信心主要来自 local-model smoke 和既有 CLI coverage。
2. 当前 boundary 需要一条显式的 baseline GitHub Copilot cancellation regression test，避免相同 truth drift 再次出现。

## 4. 复核结论（2026-04-07）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Baseline Copilot probe reports cancellation as unsupported`
   - 判定：**认可**
   - 证据：`packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts` 的 baseline capability matrix 仍声明 `supportsCancel=true`，原先新增的 `requestCancellationMode=not_supported` 与该契约不一致。
   - 处理：已把 baseline health-check truth 改为 `local_abort_only`，仅保留 `cli_exec` 为 `not_supported`，并在 smoke test 中补齐 baseline regression assertion。

2. `2.2 [P2] TK-606 closeout claim uses mixed-scope gate evidence`
   - 判定：**认可**
   - 证据：`TK-606` 原执行记录把 `pnpm run check` 直接写成 sprint-003 closeout proof，同时又说明该次 gate 包含 shared helper-script hygiene 修复，违反当前 boundary evidence 的可回放性。
   - 处理：已把 `TK-606` 的 closeout 证据改为分层表述，明确 sprint-003 canonical proof 仍是 targeted tests / build / verify / dry-run / governance checks，而 workspace-wide `pnpm run check` 只作为同窗口附加 gate 背景。

### 验证命令

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`（通过，non-blocking warn）
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `pnpm run check`（通过；workspace-wide artifact lifecycle maintenance 已在同窗口完成，且不再被表述成 sprint-003 单独 closeout proof）

## 5. 修复执行记录（2026-04-07）

1. `2.1 [P2] Baseline Copilot probe reports cancellation as unsupported`：已完成
   - 变更文件：`packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`、`packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
   - 验证：`pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`
   - 说明：baseline probe 现在与 capability matrix / `cancel()` truth 对齐；`cli_exec` 仍保持 `not_supported`。

2. `2.2 [P2] TK-606 closeout claim uses mixed-scope gate evidence`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/sprint-003-github-copilot-boundary-and-local-model-positioning/tasks/TK-606-close-real-adapter-invocation-rollout-with-support-matrix-and-verify-evidence-refresh.md`
   - 验证：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`pnpm run check`
   - 说明：`TK-606` 现在把 sprint-boundary canonical evidence 与 workspace-wide gate 背景分层记录，不再把 mixed-scope gate pass 误写成单独 sprint proof。

## 6. Verification

1. `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `node ./dist/bin/repo-ai-governor.js --output json --adapters verify`（通过，non-blocking warn）
4. `node ./dist/bin/repo-ai-governor.js --output json --adapters --dry-run --trace run`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `pnpm run check`（通过）
