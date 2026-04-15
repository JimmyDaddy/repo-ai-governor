# Code Review: project-098-cli-exec-runtime-rollout final round 2

- Status: resolved
- Date: 2026-04-13
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: project scoped review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `packages/adapter-sdk/src/native-cli-exec-process-runtime.ts`
2. `packages/adapter-sdk/src/native-cli-exec-internal-acp-extension-seam.ts`
3. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`
4. `packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts`
5. `packages/adapters/codex/src/codex-agent-adapter.ts`
6. `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
7. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
8. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
9. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
10. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
11. `packages/config/test/config.unit.test.ts`

## 2. Findings

### 2.1 [P2] Codex malformed-output parse-failure branch dropped launch-aware error truth

- 位置:
  - `packages/adapters/codex/src/codex-agent-adapter.ts`
  - `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
- 问题描述: `Codex` 先前仍在 raw `JSON.parse()` 失败时直接抛出 parse error，且 `no completed agent_message` 分支也没有带上 `launchDiagnostics`，导致 `probe()` 无法恢复 `selectedEntrypoint` / `processTreePolicy`，`invokeStage()` 也可能泄露未标准化的 parse failure。
- 影响: project-final boundary 仍会在 Codex parse-failure path 上丢失 launch truth，削弱 shared native `cli_exec` runtime rollout 的支持诊断与标准化错误边界。
- 建议: 为 Codex parse-failure 统一包裹 launch-aware `RuntimeError`，并补充 malformed-output smoke regression 覆盖 probe + invoke。

### 2.2 [P2] GitHub Copilot malformed JSON fallback path still dropped fallback launch truth

- 位置:
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
  - `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
- 问题描述: `GitHub Copilot` 已经修复了 empty-response 等 failure branch，但 malformed JSON 行仍会绕过 launch-aware helper，导致 fallback 到 `gh` 后的 parse error 不能恢复真实 launch diagnostics。
- 影响: fallback-launched `gh copilot --` 在 malformed output 时仍可能让 `probe()` 丢失实际 entrypoint / process-tree truth，并让 `invokeStage()` 暴露未标准化 parse failure，项目 closeout 仍不干净。
- 建议: 用已有 helper 包裹 malformed JSON branch，并补上 fallback malformed-output regression。

## 3. Notes

1. reviewer 同时确认 ACP seam / public-surface guardrail 仍然 clean，没有新增 public transport truth、support wording 或 schema-authoring uplift。
2. `Claude Code` / `GitHub Copilot` / `Codex` 现在都对 parse-failure branch 保持 launch-aware diagnostics truth；project-final 轮次未再识别新的 actionable issue。

## 4. Verification

1. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）
4. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/native-cli-exec-internal-acp-extension-seam.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/config/test/config.unit.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/connect-phase2.integration.test.ts`（通过，final round 前）
5. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，final round 前）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
10. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 复核结论（2026-04-13）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Codex malformed-output parse-failure branch dropped launch-aware error truth`
   - 判定：**认可**
   - 证据：`CodexAgentAdapter` 现已把 malformed JSON 与 `no completed agent_message` 两条 parse-failure branch 都包装成带 `launchDiagnostics` 的标准化 `RuntimeError`，且 smoke test 已覆盖 malformed probe + invoke 两条路径。
   - 处理：保留为 accepted finding，已完成修复并进入验证。
2. `2.2 [P2] GitHub Copilot malformed JSON fallback path still dropped fallback launch truth`
   - 判定：**认可**
   - 证据：`GithubCopilotAgentAdapter` 现已把 malformed JSON branch 接入 `createGithubCopilotCliFailureDetails(...)`，fallback 到 `gh` 后的 malformed parse error 会继续保留实际 launch diagnostics，且 smoke test 已覆盖 fallback malformed probe + invoke。
   - 处理：保留为 accepted finding，已完成修复并进入验证。

### 验证命令

1. `pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run check`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
8. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）

## 修复执行记录（2026-04-13）

1. `2.1 [P2] Codex malformed-output parse-failure branch dropped launch-aware error truth`：已完成
   - 变更文件：
     - `packages/adapters/codex/src/codex-agent-adapter.ts`
     - `packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts`
   - 验证：`pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`、`pnpm run build`、`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
   - 说明：Codex parse-failure 分支现在统一保留 launch-aware diagnostics truth，不再泄露未标准化 parse error。
2. `2.2 [P2] GitHub Copilot malformed JSON fallback path still dropped fallback launch truth`：已完成
   - 变更文件：
     - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
     - `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
   - 验证：`pnpm exec vitest run packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`、`pnpm run build`、`pnpm run check`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
   - 说明：GitHub Copilot fallback malformed-output branch 现在也会保留真实 `gh` launch diagnostics，并以标准化 runtime error 对外暴露。
