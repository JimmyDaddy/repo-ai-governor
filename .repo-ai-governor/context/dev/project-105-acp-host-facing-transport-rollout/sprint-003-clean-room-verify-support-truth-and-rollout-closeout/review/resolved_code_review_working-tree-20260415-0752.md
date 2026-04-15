# Code Review: sprint-003 clean-room verify and support truth closeout

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
1. `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`
2. `scripts/release/verify-cleanroom-local-install.js`
3. `apps/cli/src/runtime/adapter-verification-runtime.ts`
4. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
5. `docs/support-matrix.md`
6. `docs/support-matrix.zh-CN.md`
7. `docs/local-adoption-playbook.md`
8. `docs/local-adoption-playbook.zh-CN.md`

## 2. Findings
### 2.1 [P2] ACP clean-room projection accepts partial or mismatched evidence scope
- 位置: `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts:221`, `scripts/release/verify-cleanroom-local-install.js:1543`
- 问题描述: 当前 ACP clean-room reader 只要求 `status=pass` 且 `verifiedModes` 非空，就会把 `acp_host_companion` 提升为 `runtime_service_and_distribution_cleanroom_verified`。但是 clean-room writer 同时还会写入 `distributionMode` 以及 runtime-service / packaged-distribution verification receipt 路径；这些 scope facts 现在没有被 reader 校验。
- 影响: 若后续只跑了局部 mode，或把 `plugin-enabled` rehearsal 的 summary 覆盖到了默认 summary 路径，`doctor` / `verify` 就可能把 ACP readiness 误投影成 fully clean-room verified，并过早支撑 adopter-facing support uplift。
- 建议: 只有在 summary 明确匹配 `default` distribution、完整覆盖 `path/link/tgz`，且 runtime-service / packaged-distribution receipts 都齐全时，才允许投影 clean-room verified；同时补一个 partial/plugin-enabled summary 的回归测试。

## 3. Notes
1. fresh reviewer round 1 仅返回以上 1 条 actionable finding；当前未发现会把 `acp_exec` 回写成 `cli_exec` success 的问题。
2. host renderer 的 `serviceHostPackageExport` coverage 仍有一点残余空白，但 reviewer 未将其提升为本轮必须修复的问题。

## 4. Verification
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（fresh reviewer evidence: 通过）
2. `pnpm run build`（fresh reviewer evidence: 通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（fresh reviewer evidence: 通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（fresh reviewer evidence: 通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`CliAcpHostEvidenceRuntime` 的 clean-room reader 之前只消费 `status=pass` 与非空 `verifiedModes`，确实丢掉了 writer 已持久化的 `distributionMode` 与 runtime/distribution receipt scope，因此 partial 或 plugin-enabled rehearsal 可能误支撑 support uplift。
   - 处理：已接受该修复方向，并在同一 change window 中把 reader 收紧为 `default distribution + path/link/tgz 全覆盖 + runtime/distribution receipts 齐全` 才能投影 clean-room verified，同时补了 partial/plugin-enabled summary 的 regression fixture。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
   - 说明：ACP clean-room reader 现在只会在 `default` distribution summary 同时覆盖 `path/link/tgz` 且 runtime-service / packaged-distribution verification receipts 都齐全时，才投影 `runtime_service_and_distribution_cleanroom_verified`；partial 或 plugin-enabled summary 会保持非 clean-room posture。

## 处置结果与剩余风险（2026-04-15）

1. `2.1` 已完成修复，并通过 focused vitest、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 ACP clean-room verify 复验。
2. 当前 `CR-001` 作为“发现并修复”轮次已经收口；下一步仍需按 `workspace-scoped-cr-loop` 再开 fresh reviewer round，确认 sprint-003 boundary 已 clean。
3. host renderer 的 `serviceHostPackageExport` contract coverage 仍属于低优先级残余观察，不阻塞当前 round 收口。
