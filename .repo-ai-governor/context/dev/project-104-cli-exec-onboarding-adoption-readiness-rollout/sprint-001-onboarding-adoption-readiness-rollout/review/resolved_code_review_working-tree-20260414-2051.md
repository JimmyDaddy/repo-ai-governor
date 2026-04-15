# Code Review: sprint-001 onboarding adoption readiness rollout

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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `apps/cli/src/commands/connect-command.ts`
3. `apps/cli/src/commands/doctor-command.ts`
4. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
5. `apps/cli/test/commands/connect-command.test.ts`
6. `apps/cli/test/commands/doctor-command.test.ts`

## 2. Findings
### 2.1 [P2] `doctor` 在未开启 `--fix` 时也会把 `safe_local_fix=0` 写进 readiness summary
- 位置: `apps/cli/src/commands/doctor-command.ts:285`、`apps/cli/src/runtime/agent-onboarding-runtime.ts:334`
- 问题描述: round-1 implementation 把 `safeLocalFixCount` 统一传给 `doctor` readiness composition，而 runtime 只要看到该值“已定义”就会追加 `safe_local_fix=${count}`。这会让 `repair_scope=manual_only` 的普通 `doctor --adapters` 结果带上并未发生的 safe-local 修复信号。
- 影响: machine-readable `diagnostic_summary` 不再保持 truthful readiness posture，consumer 会把未开启 fix 的诊断结果误读成 safe-local repair-aware output。
- 规范依据:
  - `agent-onboarding-contract.md` §4.18
  - `agent-onboarding-contract.md` §5.1
- 建议: 仅在 `--fix` 路径中向 readiness composition 传递 `safeLocalFixCount`，并让 `manual_only` 路径完全省略该 additive summary segment。

### 2.2 [P3] `doctor` 的 readiness 投影没有真实命令边界覆盖
- 位置: `apps/cli/test/commands/doctor-command.test.ts:59`
- 问题描述: 原有 `doctor-command` 单测把 `createOnboardingContractPayload()` 与 `createVerifyMatrixPayload()` 整体 stub 成占位对象，只断言占位 payload 被落盘，而没有验证本次新增的 `verification_status / diagnostic_summary / next_action(s)` 真实内容。
- 影响: 命令边界 wiring regression 无法被 focused suite 捕获，正是 `safe_local_fix=0` 回归能漏过首轮测试的直接原因。
- 规范依据:
  - `.codex/skills/workspace-code-review-workflow/SKILL.md` 4.1
- 建议: 在 `doctor-command` 测试中引入真实 onboarding runtime，补上 `fix=false` 与 `fix=true` 的 artifact-level readiness assertions。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 1；main agent 已逐条复核并接受两条 finding。
2. 本文件只记录 round-1 finding 修复与验证结果；sprint 是否可以 closeout 仍取决于下一轮 fresh recheck 是否 clean。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-14）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`doctor` 当前把 `safeLocalFixCount=0` 也视为“已定义”并传入 readiness composition，导致 `manual_only` 路径错误追加 `safe_local_fix=0`。这会污染 machine-readable readiness summary。
   - 处理：已接受，修复为仅在 `runtimeDebugOptions.fix === true` 时才向 onboarding runtime 传递 `safeLocalFixCount`。
2. `2.2`
   - 判定：**认可**
   - 证据：`doctor-command` 测试原先只验证 stub payload 被写入 artifact，没有覆盖真实 readiness fields，无法守住 `diagnostic_summary` 的命令边界 truth。
   - 处理：已接受，补充真实 onboarding runtime 的命令级断言，并覆盖 `fix=false` 与 `fix=true` 两条 artifact-level readiness summary 分支。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-14）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/commands/doctor-command.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：`doctor` 仅在 `--fix` 路径中传递 `safeLocalFixCount`，普通 `manual_only` 诊断结果不再带出虚假的 `safe_local_fix=0`。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/commands/doctor-command.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/commands/connect-command.test.ts apps/cli/test/commands/doctor-command.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：新增真实 onboarding runtime 的命令边界断言，覆盖 `doctor` readiness payload 在 `fix=false` 与 `fix=true` 两条分支下的 artifact 输出。

## 处置结果与剩余风险（2026-04-14）

1. 当前 round 的 accepted findings 已全部修复，并通过同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-001` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
