# Code Review: sprint-002 runtime resolution and doctor diagnostics round 2

- Status: resolved
- Date: 2026-04-12
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated fresh review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/local-user-config-defaults-and-secret-backed-credential-resolution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/local-user-config-and-secret-command-contract.md`

## 1. Review Scope

1. `apps/cli/src/**`
2. `apps/cli/test/**`
3. `packages/adapter-sdk/**`
4. `packages/adapters/codex/**`
5. `packages/adapters/claude-code/**`
6. `packages/shared/src/**`

## 2. Findings

### 2.1 [P1] doctor 把 `unsafe-local-file` 当成 healthy default backend

- 位置: `apps/cli/src/commands/doctor-command.ts:226`、`apps/cli/src/runtime/adapter-verification-runtime.ts:461`、`apps/cli/src/runtime/secrets/unsafe-local-file-secret-backend.ts:31`
- 问题描述: default backend 判定只看 `available=true`，没有把 warning-bearing backend 视为 risky-but-usable truth。`unsafe-local-file` 因此会被 doctor 记成绿色 default backend，并把 next action 从“显式 opt-in”误导成“直接 create/import secret”。
- 影响: 会削弱 sprint-002 对 unsafe fallback truthfulness 的约束，让 operator 误以为 plaintext fallback 已经满足默认 secure backend 门槛。
- 建议: default backend / per-backend doctor check 都要把 warning-bearing backend 降为 `warn`，并在 detail 中显式保留 warning 文案；`hasDefaultSecretBackend()` 也要要求 warning-free backend 才算 healthy default。

### 2.2 [P2] 成功解析的 `credentialRef` 在 verification diagnostics 中丢失 selector 细节

- 位置: `apps/cli/src/runtime/adapter-verification-runtime.ts:425`、`packages/adapters/codex/src/codex-agent-adapter.ts:389`、`packages/adapters/claude-code/src/claude-code-agent-adapter.ts:356`
- 问题描述: remote-api probe 在 `credentialRef` 成功解析时没有保留 selector-level success diagnostic；同时 verification runtime 重建 tool snapshot health-check 时也没有透传 probe 原始 diagnostics。
- 影响: `credentialReferences[]` 无法记录已成功解析的 `secret://...` selector 与 backend id，导致 doctor/diagnostics artifact 在成功路径上失去 secret-backed resolution evidence。
- 建议: adapter probe 在 `credentialRef` 成功解析时补一条 auth success diagnostic，verification runtime 在聚合 tool snapshot 时保留 probe diagnostics，并优先从该 success diagnostic 提取 selector detail。

## 3. Verification

1. `pnpm run build`（通过）
2. `pnpm vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/cli-secret-service.test.ts apps/cli/test/runtime/cli-user-config-projection-service.test.ts apps/cli/test/runtime/cli-user-config-service.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/commands/workspace-command.test.ts apps/cli/test/commands/doctor-command.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`（通过）

## 复核结论（2026-04-12）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`unsafe-local-file` backend 的 warning 已明确声明其 plaintext/local-only 风险；继续把它算作 healthy default backend，会直接违背 sprint-002 的 truthfulness boundary。
   - 处理：doctor 现在会把 warning-bearing backend 降为 `warn`，default backend check 只有在 backend `available=true` 且无 warning 时才记为 `pass`；backend detail 也会显式带出 warning 文案。
2. `2.2`
   - 判定：**认可**
   - 证据：若成功路径不保留 selector detail，`credentialRef` 只能在失败时出现在 diagnostics 中，成功时反而失去 evidence，无法证明 secret-backed resolution 真正经过哪条 canonical selector。
   - 处理：codex/claude remote-api probe 在 `credentialRef` 成功解析时都会补一条 `auth.credential_reference_resolved` diagnostic；verification runtime 聚合 snapshot 时保留 probe diagnostics，并优先用该 success diagnostic 生成 `credentialReferences[]`。

## 修复执行记录（2026-04-12）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/adapter-verification-runtime.ts`、`apps/cli/src/commands/doctor-command.ts`、`apps/cli/test/runtime/adapter-verification-runtime.test.ts`、`apps/cli/test/commands/doctor-command.test.ts`
   - 验证：`pnpm run build`（通过）；focused vitest suite（通过）
   - 说明：warning-bearing default backend 不再被 green-light 为 secure default，doctor detail 会保留 backend warning，secret fallback guidance 也重新回到 truth-first 路径。
2. `2.2`：已完成
   - 变更文件：`apps/cli/src/runtime/adapter-verification-runtime.ts`、`packages/adapters/codex/src/codex-agent-adapter.ts`、`packages/adapters/claude-code/src/claude-code-agent-adapter.ts`、`packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`、`packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
   - 验证：`pnpm run build`（通过）；focused vitest suite（通过）
   - 说明：`credentialRef` 成功解析现在会在 adapter health-check 和 CLI verification artifact 中保留 selector detail，并记录解析到的 backend id。

## 处置结果与剩余风险

1. 本轮 2 条 accepted finding 已修复，并通过 build 与 sprint-002 focused verification suite。
2. `CR-002` 已满足 `resolved` 条件；下一步需要启动 fresh reviewer clean recheck，确认 sprint-002 当前边界已无新增 actionable findings。
