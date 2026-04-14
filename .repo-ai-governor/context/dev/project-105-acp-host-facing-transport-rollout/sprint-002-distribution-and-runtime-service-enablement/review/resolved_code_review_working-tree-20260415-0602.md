# Code Review: sprint-002 distribution and runtime-service enablement

- Status: resolved
- Date: 2026-04-15
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
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`
3. `apps/cli/src/runtime/cli-acp-host-companion-runtime.ts`
4. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
5. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
6. `apps/cli/src/runtime/adapter-verification-runtime.ts`
7. `apps/cli/src/runtime/adapter-routing-runtime.ts`
8. `apps/cli/src/cli-governance-runtime.ts`
9. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
10. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
11. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
12. `apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts`
13. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`

## 2. Findings
### 2.1 [P1] ACP evidence lookup used workspace-root semantics that miss real repo-local host verification artifacts
- 位置: `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts:103`, `apps/cli/src/cli-governance-runtime.ts:219`, `apps/cli/src/cli-governance-runtime.ts:2570`, `apps/cli/src/runtime/session-main-supervisor-runtime.ts:193`
- 问题描述: 当前 ACP evidence runtime 把输入根路径继续当成 repo root 来拼接 `.repo-ai-governor/generated`，但真实 repo-local 运行时传入的是 `workspaceRoot=<repo>/.repo-ai-governor`。这会把 evidence 查找落到 `<repo>/.repo-ai-governor/.repo-ai-governor/generated`，与 host distribution/verify 实际写入的 `<repo>/.repo-ai-governor/generated/**` 不一致。
- 影响: `connect / doctor / verify` 即使已有 runtime-service 或 packaged-distribution evidence，也会持续投影 baseline ACP companion 状态，导致 sprint-002 的 readiness projection 在真实 repo-local 场景下失效。
- 建议: 改为显式按 repo/current-working-directory root 解析 ACP evidence search root，并让回归测试使用真实 repo-local `workspaceRoot` 形状，避免用“把 repo root 假装成 workspace root”的夹具掩盖问题。

## 3. Notes
1. 除上述路径语义问题外，本轮 fresh reviewer 未发现其他需要在 sprint-002 边界内立即处理的 actionable finding。
2. 风险提示：`runAcpCleanRoomVerify` 目前只表达“runtime-service 与 packaged-distribution evidence 已具备，下一步应执行 clean-room verify”；该 completion signal 仍需在 `sprint-003` 明确收口。

## 4. Verification
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：repo-local `workspaceRoot` 的真实形状是 `<repo>/.repo-ai-governor`，而 host distribution/verify artifacts 仍落在 `<repo>/.repo-ai-governor/generated/**`。因此 ACP evidence search root 必须显式按 repo/current-working-directory root 解析，不能继续把 `workspaceRoot` 当 repo root 使用。
   - 处理：已接受该修复方向，并在同一 change window 中把 runtime wiring 改为传入 `currentWorkingDirectory`，同时把 routing regression fixture 调整为真实 repo-local 布局。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adapter-routing-runtime.ts`、`apps/cli/src/runtime/cli-acp-host-protocol.ts`、`apps/cli/src/cli-governance-runtime.ts`、`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：ACP evidence wiring 已改为显式消费 repo/current-working-directory root，routing regression fixture 也改成真实 repo-local `workspaceRoot=<repo>/.repo-ai-governor` 布局，避免同类路径漂移再次被测试夹具掩盖。

## 处置结果与剩余风险（2026-04-15）

1. `2.1` 已完成修复，并通过 focused vitest、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 复验。
2. 当前 sprint-002 boundary 内无剩余阻止 closeout 的 actionable finding。
3. `runAcpCleanRoomVerify` 的 completion signal 仍属于 `sprint-003` 范围，不阻塞当前 sprint-002 收口。
