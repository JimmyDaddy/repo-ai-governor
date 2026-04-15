# Code Review: sprint-002 verification profiles trigger matrix and closeout delegated recheck round 6

- Status: resolved
- Date: 2026-04-14
- Reviewer: AI-Agent
- Task: `CR-006`
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
5. `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/CR-006.md`

## 2. Findings
### 2.1 [P2] Shared cli_exec seam changes skip all compatibility profiles
- 位置: `scripts/ci/run-cli-exec-compatibility-profile.js:45`
- 问题描述: `packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts` 与其 unit test 没有进入 shared profile trigger matrix；当前变更该 seam source 会返回 `profileId: null`，尽管 `NativeCliExecProcessRuntime` 在每次 launch 中都会调用它。
- 影响: live native `cli_exec` lifecycle seam 改动可能完全跳过 compatibility baseline，shared runtime closeout 就会留下盲区。
- 建议: 将 seam source/test 纳入 shared runtime profile 集合，并补充 seam routing regression coverage。

### 2.2 [P2] DA-865 overstates the generic profile invocation
- 位置: `.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md:12`
- 问题描述: `DA-865` 将 `pnpm run verify:cli-exec-compatibility -- --profile <profile-id> --execute` 写成了通用入口，但 `cli_exec_compatibility_adapter_slice` 仍需要 `--adapter <adapter-id>` 或 single-adapter changed-file set；按文档原写法执行会直接失败。
- 影响: handoff artifact 不可回放，后续 runtime/adopter window 会按错误命令拿到非预期失败。
- 建议: 将 adapter-slice 的执行入口改写为显式 `--adapter <adapter-id>` 版本，并补充一条真实执行证据。

## 3. Notes
1. 本轮 reviewer 只发现 2 条 routing/guidance drift；其余 sprint-002 实现面没有新增 actionable finding。

## 4. Verification
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过，`1` file / `20` tests）
2. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_full`）
3. `node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts --output json`（通过，返回 `profileId: cli_exec_compatibility_runtime_foundation`）
4. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_adapter_slice --adapter codex --execute`（通过，`1` file / `32` tests）
5. `pnpm run build`（通过）
6. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过，`10` files / `151` tests）
7. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，`145` files / `972` tests）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：internal ACP seam source/test 的确参与 shared native `cli_exec` runtime 路径，但此前未被任何 compatibility profile 覆盖。
   - 处理：把 seam source/test 纳入 shared profile 路由，并补 seam regression coverage。
2. `2.2`
   - 判定：**认可**
   - 证据：`pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_adapter_slice --execute` 会失败，而带 `--adapter codex` 的版本可正常执行。
   - 处理：将 `DA-865` 文案改为显式 adapter-slice 调用入口，并补真实执行证据。

### 验证命令
1. `pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_adapter_slice --adapter codex --execute`（通过）
3. `pnpm run build`（通过）
4. `pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`scripts/ci/run-cli-exec-compatibility-profile.js`
   - 验证：`node ./scripts/ci/run-cli-exec-compatibility-profile.js --changed-file packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts --output json`（通过）
   - 说明：已将 internal ACP seam source/test 纳入 shared profile routing，并把 seam unit test 加入 full/runtime_foundation profile execution sets。
2. `2.1`：已完成
   - 变更文件：`test/cli-exec-compatibility-profile.integration.test.ts`
   - 验证：`pnpm exec vitest run test/cli-exec-compatibility-profile.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：补充 seam source/test routing 与 explicit adapter-slice invocation regression coverage。
3. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/context/dev/project-106-cli-exec-compatibility-and-stability-rollout/sprint-002-verification-profiles-trigger-matrix-and-closeout/tasks/DA-865-cli-exec-compatibility-baseline-evidence-pack-and-closeout-guidance.md`
   - 验证：`pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_adapter_slice --adapter codex --execute`（通过）
   - 说明：adapter-slice invocation contract 已改写为显式 `--adapter <adapter-id>` 入口，并记录可回放执行证据。
4. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
   - 验证：`pnpm run verify:cli-exec-compatibility -- --profile cli_exec_compatibility_full --execute`（通过）
   - 说明：将 shared internal ACP seam source/test 写回 active runtime guidance，使 formal guidance 与 runner behavior 保持一致。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 2 条 accepted finding 已完成修复；shared seam routing、adapter-slice invocation guidance 与 active runtime guidance 已重新对齐。
2. sprint 仍需再开一轮 fresh reviewer clean recheck；只有最新 reviewer round 无 actionable finding时，才能进入 closeout。
