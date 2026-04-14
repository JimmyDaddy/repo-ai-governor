# Code Review: sprint-002 verification profiles trigger matrix and closeout delegated recheck round 10

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-010`
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
4. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/TK-864-wire-focused-compatibility-verification-profiles-and-trigger-matrix-routing-without-promoting-them-to-governance-gates.md`
5. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/TK-865-capture-compatibility-baseline-evidence-pack-and-closeout-guidance-for-future-runtime-windows.md`
6. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
7. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
8. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/CR-010.md`

## 2. Findings
### 2.1 [P1] Explicit invalid `--base-ref` can still be replaced by env fallback
- 位置: `scripts/ci/run-cli-exec-compatibility-profile.js:254`
- 问题描述: candidate builder 之前把 explicit `--base-ref` 与 `REPO_AI_GOVERNOR_AFFECTED_BASE_REF/GITHUB_BASE_REF` 混在同一候选列表里，只要 env ref 可解析，invalid explicit ref 仍会被悄悄替换掉。
- 影响: CI diff-routing 会在错误输入下对错误的 git range 产出 false-green compatibility evidence，而不是 fail-closed 暴露调用方配置错误。
- 建议: explicit `--base-ref` 存在时先单独校验；不可解析就直接抛错，并补一条 explicit-invalid-plus-env-valid regression。

### 2.2 [P2] `package.json` verify entrypoint changes still bypass full profile routing
- 位置: `scripts/ci/run-cli-exec-compatibility-profile.js:51`
- 问题描述: full-profile trigger set 之前没有覆盖 `package.json`，导致 `verify:cli-exec-compatibility` 这条 pnpm entrypoint 的改动不会触发任何 compatibility profile。
- 影响: profile command list / entrypoint alias 的变更可能在 closeout 里被记成 execution route 的一部分，但实际没有跑 baseline。
- 建议: 将 `package.json` 中的 verify entrypoint 改动纳入 `cli_exec_compatibility_full`，并补回归探针。

## 3. Notes
1. 除上述两条路由缺口外，本轮没有新增 artifact drift 或 closeout evidence 自相矛盾问题。

## 4. Verification
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `24` tests）
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file package.json --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
3. `pnpm run build`（通过）
4. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`10` files / `151` tests）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：explicit `--base-ref` 与 env base-ref 混用确实会让 invalid explicit ref 被 env fallback 掩盖，仍不满足当前 ADR/DA-865 要求的 fail-fast。
   - 处理：explicit `--base-ref` 存在时只校验 explicit ref；若不可解析则直接抛错，并补 env-fallback regression。
2. `2.2`
   - 判定：**认可**
   - 证据：`package.json` 当前已成为 verify entrypoint 的真实执行面，但此前 `--changed-file package.json` 仍返回 `profileId: null`。
   - 处理：把 `package.json` 纳入 `cli_exec_compatibility_full` 触发面，并补 package-entrypoint probe coverage。

### 验证命令
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file package.json --output json`（通过）
3. `pnpm run build`（通过）
4. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`scripts/ci/run-cli-exec-compatibility-profile.js`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：explicit `--base-ref` 现在优先独立校验，不再被 env base-ref 接管。
2. `2.1`：已完成
   - 变更文件：`test/cli-exec-compatibility-profile.integration.test.ts`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增 explicit-invalid-plus-env-valid regression，锁住 fail-fast 语义。
3. `2.2`：已完成
   - 变更文件：`scripts/ci/run-cli-exec-compatibility-profile.js`
   - 验证：`node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file package.json --output json`（通过）
   - 说明：`package.json` 中的 verify entrypoint 改动已纳入 `cli_exec_compatibility_full` 触发面。
4. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
   - 验证：`pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
   - 说明：刷新 evidence pack 与 future guidance，使 verify entrypoint 改动与 explicit git-range fail-fast 都成为 closeout truth。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 2 条 accepted finding 已完成修复；trigger matrix 现在对 explicit base-ref 优先级与 verify entrypoint 变更都采用 fail-closed 语义。
2. sprint 仍需再开一轮 fresh reviewer clean recheck；只有最新 reviewer round 无 actionable finding 时，才能进入 closeout。
