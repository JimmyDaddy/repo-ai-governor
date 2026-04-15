# Code Review: sprint-002 verification profiles trigger matrix and closeout delegated recheck round 5

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-005`
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

## 1. Review Scope
1. `scripts/ci/run-cli-exec-compatibility-profile.js`
2. `test/cli-exec-compatibility-profile.integration.test.ts`
3. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
4. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/CR-005.md`

## 2. Findings
### 2.1 [P2] Adapter-slice still includes non-runtime contract files
- 位置: `scripts/ci/run-cli-exec-compatibility-profile.js:22`
- 问题描述: adapter-slice 触发面仍包含每个 adapter 的 `src/constants/*.ts` 与 `src/types/interfaces/*.ts`，例如 `packages/adapters/codex/src/types/interfaces/codex-agent-adapter.interface.ts` 仍会被路由到 `cli_exec_compatibility_adapter_slice`，与当前 sprint 已写明的 runtime/parser-only 边界不一致。
- 影响: `TK-864` 与 `DA-865` 中记录的 closeout guidance 会和实际 trigger matrix 漂移，后续 runtime window 可能因为 contract-only 变更误跑 adapter-slice profile。
- 建议: 把 adapter-slice 触发面收窄到各 adapter 的真实 runtime entry 与 smoke test，并补齐 constants/interface false-positive regression coverage。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 adapter-slice boundary drift；shared runtime、runtime-foundation 与 evidence artifact 之外没有新的 actionable finding。

## 4. Verification
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `17` tests）
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/constants/codex-agent-adapter.constant.ts --output json`（通过，返回 `profileId: null`）
3. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/types/interfaces/codex-agent-adapter.interface.ts --output json`（通过，返回 `profileId: null`）
4. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/codex-agent-adapter.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_adapter_slice`）
5. `pnpm run build`（通过）
6. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`9` files / `149` tests）
7. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：adapter `constants / interfaces` 当前会触发 `cli_exec_compatibility_adapter_slice`，确实与 sprint 已宣告的 runtime/parser-only 边界不一致。
   - 处理：删去这些 contract-only trigger paths，并补 constants/interface false-positive regression coverage。

### 验证命令
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`scripts/ci/run-cli-exec-compatibility-profile.js`
   - 验证：`node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapters/codex/src/types/interfaces/codex-agent-adapter.interface.ts --output json`（通过）
   - 说明：adapter-slice 触发面已收窄到每个 adapter 的真实 runtime entry 与 smoke test，不再把 contract-only `constants / interfaces` 计入 compatibility routing。
2. `2.1`：已完成
   - 变更文件：`test/cli-exec-compatibility-profile.integration.test.ts`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增 constants/interface false-positive regression coverage，锁住 adapter-slice boundary。
3. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
   - 验证：`pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
   - 说明：刷新 handoff artifact，使 adapter-slice runtime/parser-only guidance 与当前 routing 行为重新对齐。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 1 条 accepted finding 已完成修复；adapter-slice boundary 现在只覆盖各 adapter 的真实 runtime entry 与 smoke test。
2. sprint 仍需再开一轮 fresh reviewer clean recheck；只有最新 reviewer round 无 actionable finding 时，才能进入 closeout。
