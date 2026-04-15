# Code Review: sprint-002 verification profiles trigger matrix and closeout delegated recheck round 4

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-004`
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
4. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/CR-004.md`

## 2. Findings
### 2.1 [P2] shared adapter-sdk trigger surfaces are still directory-wide
- 位置: `scripts/ci/run-cli-exec-compatibility-profile.js:51`
- 问题描述: shared `adapter-sdk` source/test trigger surfaces 仍按目录匹配，导致 `packages/adapter-sdk/src/agent-capability-evaluator.ts`、`packages/adapter-sdk/src/agent-route-runner.ts`、`packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts` 与 `packages/adapter-sdk/test/layered-health-check-runtime.unit.test.ts` 这类非 native `cli_exec` surface 会被误路由到 compatibility profile。
- 影响: trigger matrix 会超出 ADR 与 `DA-865` 声明的 native `cli_exec` owner/foundation 边界，导致 closeout guidance 与实际 routing 行为漂移。
- 建议: 将 shared trigger 面收窄到真实 native `cli_exec` owner/foundation 文件，并补齐这些 shared false-positive regression assertions。

## 3. Notes
1. reviewer finding 聚焦 shared `adapter-sdk` trigger 面；其余 sprint-002 implementation 与验证链在本轮没有新增问题。

## 4. Verification
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `15` tests）
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/agent-capability-evaluator.ts --output json`（通过，返回 `profileId: null`）
3. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/test/agent-capability-evaluator.unit.test.ts --output json`（通过，返回 `profileId: null`）
4. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
5. `pnpm run build`（通过）
6. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`9` files / `149` tests）
7. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：directory-wide shared trigger matching 会把非 native `cli_exec` 的 shared `adapter-sdk` source/test 错误归类到 compatibility profiles，确实超出当前 ADR 的 owner/foundation 边界。
   - 处理：将 shared trigger 面收窄到真实 native `cli_exec` owner/foundation 文件，并补 shared false-positive regression coverage。

### 验证命令
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`scripts/ci/run-cli-exec-compatibility-profile.js`
   - 验证：`node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/agent-capability-evaluator.ts --output json`（通过）
   - 说明：将 shared source/test trigger 面从目录级匹配收窄为真实 native `cli_exec` owner/foundation 文件。
2. `2.1`：已完成
   - 变更文件：`test/cli-exec-compatibility-profile.integration.test.ts`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：补充 shared false-positive regression coverage，锁住 `agent-capability-evaluator`、`agent-route-runner` 与 `layered-health-check-runtime` 等非 native `cli_exec` surface。
3. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
   - 验证：`pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
   - 说明：刷新 handoff artifact，使 trigger matrix 证据与当前 shared false-positive guardrail 保持一致。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 1 条 accepted finding 已完成修复；shared `adapter-sdk` trigger 面已回到 native `cli_exec` owner/foundation 的显式边界。
2. sprint 仍需再开一轮 fresh reviewer clean recheck；只有最新 reviewer round 无 actionable finding 时，才能进入 closeout。
