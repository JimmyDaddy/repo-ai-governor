# Code Review: sprint-002 verification profiles trigger matrix and closeout

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: working tree review
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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`

## 1. Review Scope
1. `scripts/ci/run-cli-exec-compatibility-profile.js`
2. `test/cli-exec-compatibility-profile.integration.test.ts`
3. `package.json`
4. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/plan.md`
5. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/TK-864-wire-focused-compatibility-verification-profiles-and-trigger-matrix-routing-without-promoting-them-to-governance-gates.md`
6. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/TK-865-capture-compatibility-baseline-evidence-pack-and-closeout-guidance-for-future-runtime-windows.md`
7. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`

## 2. Findings
### 2.1 [P2] adapter-slice routing is too broad for the sprint-002 trigger matrix
- 位置: `scripts/ci/run-cli-exec-compatibility-profile.js:22`
- 问题描述: 初版实现把 `packages/adapters/<adapter>/` 整个目录都视为 compatibility trigger surface，导致 `README.md`、host renderer 等非 `cli_exec` runtime/parser 变更也会错误命中 `cli_exec_compatibility_adapter_slice` 或 `cli_exec_compatibility_runtime_foundation`。
- 影响: evidence 中记录的 `profileId / reason` 会与 ADR 定义的 trigger matrix 不一致，后续 closeout 可能对错误的变更面宣称 compatibility slice 结论。
- 建议: 将 adapter 命中面收窄到真实的 `cli_exec` parser/runtime 相关源文件与对应 smoke tests，并补 false-positive regression tests。

## 3. Notes
1. 本轮 review 发现 1 条 actionable finding；main agent 已逐条复核并决定 `accepted`。

## 4. Verification
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`9` files / `149` tests）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：ADR 把 adapter-slice 明确限定为单 adapter parser / malformed-output branch 变更；初版实现确实把整个 adapter 包目录都视为触发面。
   - 处理：收窄 adapter 触发面到真实的 `cli_exec` runtime/parser 文件与对应 smoke test，并增加 false-positive regression tests。

### 验证命令
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`scripts/ci/run-cli-exec-compatibility-profile.js`、`test/cli-exec-compatibility-profile.integration.test.ts`、`.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/README.md --output json`、`node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/codex-host-renderer.ts --output json`、`pnpm run build`、`pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：adapter-slice 现在只匹配每个 adapter 的 `cli_exec` runtime/parser 相关源文件与对应 smoke tests，非 runtime 的 adapter-local 变更会返回 `profileId: null`。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 1 条 accepted finding 已完成修复，并通过同窗口 `pnpm run build`、full compatibility profile、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 targeted false-positive recheck 重验。
2. sprint 仍需再开一轮 fresh reviewer recheck；只有最新 reviewer round 无 actionable finding 时，才能进入 closeout。
