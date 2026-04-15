# Code Review: sprint-002 verification profiles trigger matrix and closeout delegated recheck round 8

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-008`
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
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
5. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/CR-008.md`

## 2. Findings
### 2.1 [P2] Router self-changes skip compatibility execution
- 位置: `scripts/ci/run-cli-exec-compatibility-profile.js:420`
- 问题描述: compatibility router 自身与 guarding integration suite 当时不在 trigger matrix 里，修改 `scripts/ci/run-cli-exec-compatibility-profile.js` 或 `test/cli-exec-compatibility-profile.integration.test.ts` 仍会返回 `profileId: null`。
- 影响: trigger matrix 或 profile command list 的自举变更可能在 CI 中绕过 native `cli_exec` baseline。
- 建议: 将 router script 与 guarding integration suite 一并路由到 `cli_exec_compatibility_full`，并补对应 regression coverage。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 router self-hosting drift；其余 sprint-002 boundary 在本轮没有新增 actionable finding。

## 4. Verification
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `22` tests）
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file scripts/ci/run-cli-exec-compatibility-profile.js --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
3. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file test/cli-exec-compatibility-profile.integration.test.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
4. `pnpm run build`（通过）
5. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`10` files / `151` tests）
6. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：router 代码和 guarding suite 的改动之前确实不会触发任何 compatibility profile，存在自举 blind spot。
   - 处理：将 router script 与 guarding integration suite 一并路由到 `cli_exec_compatibility_full`，并补回归覆盖。

### 验证命令
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`scripts/ci/run-cli-exec-compatibility-profile.js`
   - 验证：`node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file scripts/ci/run-cli-exec-compatibility-profile.js --output json`（通过）
   - 说明：compatibility router 自身与 guarding integration suite 已纳入 `cli_exec_compatibility_full` 触发面，避免 trigger matrix 自举变更绕过 baseline。
2. `2.1`：已完成
   - 变更文件：`test/cli-exec-compatibility-profile.integration.test.ts`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：补充 router self-hosting regression coverage，锁住 router/test 自改动时的 full-profile 路由行为。
3. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：刷新 handoff guidance，使“谁修改 trigger matrix，谁先跑 full”成为显式 closeout truth。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 1 条 accepted finding 已完成修复；runtime owner、internal seam、router self-hosting 与 CI git-range routing 都已经进入 regression baseline。
2. sprint 仍需再开一轮 fresh reviewer clean recheck；只有最新 reviewer round 无 actionable finding 时，才能进入 closeout。
