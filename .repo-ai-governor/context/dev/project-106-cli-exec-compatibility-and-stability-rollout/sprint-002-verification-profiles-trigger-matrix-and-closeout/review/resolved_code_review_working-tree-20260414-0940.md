# Code Review: sprint-002 verification profiles trigger matrix and closeout delegated recheck round 7

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-007`
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
5. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/CR-007.md`

## 2. Findings
### 2.1 [P2] CI-facing git_range branch lacks automated regression coverage
- 位置: `test/cli-exec-compatibility-profile.integration.test.ts:36`
- 问题描述: integration suite 之前只覆盖显式 `--changed-file` 路由，没有锁住 `--base-ref/--head-ref` 和 `REPO_AI_GOVERNOR_AFFECTED_BASE_REF` / `GITHUB_BASE_REF` 所驱动的 `git_range` 分支。
- 影响: PR/CI 环境里的 profile selection 可能静默漂移或失效，而当前 test surface 不会报错。
- 建议: 增加一个 deterministic git-range regression，用临时 git repo 验证 shared runtime 变更会通过 `base...head` diff 路由到 `cli_exec_compatibility_full`。

## 3. Notes
1. 本轮 reviewer 只发现 1 条 coverage gap；这是当前 sprint-002 working tree 剩余的唯一 clean recheck 阻塞项。

## 4. Verification
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `21` tests）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`10` files / `151` tests）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`git_range` 是 CI/PR 环境的真实执行路径，但此前没有自动化覆盖，确实存在 silent drift 风险。
   - 处理：加入临时 git repo 的 deterministic regression，锁住 shared-runtime `base...head` 路由行为。

### 验证命令
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`test/cli-exec-compatibility-profile.integration.test.ts`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：新增临时 git repo 的 deterministic regression，显式覆盖 `--base-ref HEAD~1 --head-ref HEAD` 的 git-range shared-runtime 路由。
2. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：刷新 targeted suite 统计，使 handoff artifact 与最新 regression baseline 保持一致。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 1 条 accepted finding 已完成修复；显式 changed-file 与 CI git-range 两条 routing 主路径现在都有 automated regression coverage。
2. sprint 仍需再开一轮 fresh reviewer clean recheck；只有最新 reviewer round 无 actionable finding 时，才能进入 closeout。
