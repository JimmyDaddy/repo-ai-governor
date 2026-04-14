# Code Review: sprint-002 verification profiles trigger matrix and closeout delegated recheck round 9

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-009`
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
5. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/CR-009.md`

## 2. Findings
### 2.1 [P2] Explicit invalid base-ref silently falls back to working-tree routing
- 位置: `scripts/ci/run-cli-exec-compatibility-profile.js:320`
- 问题描述: 当调用方显式传入 `--base-ref` 但该 ref 在当前仓库无法解析时，router 之前会跳过 git-range 分支并继续回退到 working-tree changed files。
- 影响: CI 或 automation 若把错误的 base ref 传给 compatibility router，可能在错误输入下误消费本地脏树，而不是 fail-closed 暴露 diff-routing 配置错误。
- 建议: 对显式 invalid `--base-ref` 直接 fail-fast，并用 integration regression 锁住这一行为。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 diff-routing fail-closed 语义问题；其余 sprint-002 compatibility profile boundary 在本轮没有新增 actionable finding。

## 4. Verification
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `23` tests）
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file scripts/ci/run-cli-exec-compatibility-profile.js --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
3. `pnpm run build`（通过）
4. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`10` files / `151` tests）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`resolveChangedFiles()` 在 explicit `baseRef` 不存在时此前会继续回退到 working-tree path，确实无法 fail-closed 暴露 CI diff-routing 错误。
   - 处理：显式 `--base-ref` 无法解析时直接抛错，并补 integration regression 覆盖。

### 验证命令
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`scripts/ci/run-cli-exec-compatibility-profile.js`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：显式 invalid `--base-ref` 已改为 fail-fast，不再静默降级到 working-tree mode。
2. `2.1`：已完成
   - 变更文件：`test/cli-exec-compatibility-profile.integration.test.ts`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增 invalid-base-ref regression，锁住 git-range 输入错误时的 fail-closed 行为。
3. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
   - 验证：`pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
   - 说明：刷新 evidence pack 与 future guidance，使 explicit git-range routing 的 fail-fast 语义成为 closeout truth。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 1 条 accepted finding 已完成修复；compatibility router 现在对 explicit invalid `--base-ref` 采用 fail-closed 语义。
2. sprint 仍需再开一轮 fresh reviewer clean recheck；只有最新 reviewer round 无 actionable finding 时，才能进入 closeout。
