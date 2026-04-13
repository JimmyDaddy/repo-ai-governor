# Code Review: sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence round 1

- Status: resolved
- Date: 2026-04-13
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: sprint scoped review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
2. `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
3. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
4. `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
5. `packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts`

## 2. Findings

### 2.1 [P2] Claude probe parse-failure path dropped fallback launch diagnostics

- 位置:
  - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
- 问题描述: `Claude Code` 在 fallback 到 `claude-code` 之后，如果 probe 因空输出等 parse-failure 路径报错，先前构造的 `RuntimeError.details` 不包含 `selectedEntrypoint`、`shellWrapped` 与 `processTreePolicy`，导致 `executeHealthProbe()` 无法保留实际 launch truth。
- 影响: unavailable probe 可能把实际已经启动的 fallback entrypoint 错报回配置项 `claude`，同时丢失 additive process-tree diagnostics，削弱 sprint-002 要求的 cross-adapter launch diagnostics evidence。
- 建议: 在 adapter parse-failure runtime error details 中保留 `launchDiagnostics`，并用 regression smoke test 锁定 fallback + parse-failure 场景。

### 2.2 [P2] GitHub Copilot probe parse-failure path dropped fallback launch diagnostics

- 位置:
  - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
- 问题描述: `GitHub Copilot` 在 direct `copilot` 缺失并 fallback 到 `gh copilot --` 后，若 probe 因无 assistant response 等 parse-failure 路径失败，先前 error details 同样没有保留 fallback launch diagnostics。
- 影响: probe unavailable 结果会把 `selectedEntrypoint` 回退成配置项 `copilot`，并丢失 `process_group_best_effort` diagnostics，使失败定位指向错误的 executable/path。
- 建议: 与 Claude 路径一致，在 parse-failure runtime error details 中透传 fallback launch diagnostics，并补充 smoke regression。

## 3. Notes

1. 本轮第 1 次 fresh reviewer 等待满 20 分钟仍未产出可消费结论，因此主 agent 按方案保留 timeout 事实后发起了第 2 次 fresh reviewer；本文件记录的是第 2 次 reviewer 返回并经主 agent 复核后的最终结论。
2. reviewer 提到 abort-driven hard-termination coverage 仍可继续加强，但未形成当前 sprint-002 边界下的独立 actionable finding，本轮先保留为 residual risk，不阻塞 sprint-002 收口。
3. accepted 修复保持在 sprint-002 cross-adapter runtime boundary 内完成，没有新增 public ACP transport、support wording 或 canonical transport truth。

## 4. Verification

1. `pnpm run build`（通过，reviewer round 前后各 1 次）
2. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过，reviewer round 前后各 1 次）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，fix 后）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过，fix 前已清除 artifact dependency drift）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 复核结论（2026-04-13）

- 整体结论：**认可**

### 逐条复核

1. `2.1 [P2] Claude probe parse-failure path dropped fallback launch diagnostics`
   - 判定：**认可**
   - 证据：`ClaudeCodeAgentAdapter` 现已在 CLI parse-failure runtime error details 中保留 `selectedEntrypoint`、`shellWrapped` 与 `processTreePolicy`，因此 fallback 到 `claude-code` 后即使 probe 返回空输出，health check 仍会暴露真实 entrypoint 与 additive diagnostics。
   - 处理：保留为 accepted finding，已完成修复并进入验证。
2. `2.2 [P2] GitHub Copilot probe parse-failure path dropped fallback launch diagnostics`
   - 判定：**认可**
   - 证据：`GithubCopilotAgentAdapter` 现已在 session-error / result-exit / no-assistant-response 这些 parse-failure-adjacent runtime error details 中保留 launch diagnostics，fallback 到 `gh` 后的 unavailable probe 不再回退成 `copilot`。
   - 处理：保留为 accepted finding，已完成修复并进入验证。

### 验证命令

1. `pnpm run build`（通过）
2. `pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 修复执行记录（2026-04-13）

1. `2.1 [P2] Claude probe parse-failure path dropped fallback launch diagnostics`：已完成
   - 变更文件：
     - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
     - `packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
   - 说明：fallback parse-failure path 现在会继续保留实际 `claude-code` launch truth，probe unavailable 结果不再错报回 `claude`。
2. `2.2 [P2] GitHub Copilot probe parse-failure path dropped fallback launch diagnostics`：已完成
   - 变更文件：
     - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
     - `packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`
   - 验证：`pnpm run build`、`pnpm exec vitest run packages/adapter-sdk/test/native-cli-exec-process-runtime.unit.test.ts packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-code-review-status-sync.js`、`node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
   - 说明：fallback 到 `gh copilot --` 后的 parse-failure 现在会保留真实 launch diagnostics，health check 不再把入口误报为 direct `copilot` binary。
