# Code Review: sprint-003 clean-room verify and support truth closeout clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-002`
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
1. `scripts/release/verify-cleanroom-local-install.js`
2. `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`
3. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
4. `docs/support-matrix.md`
5. `docs/support-matrix.zh-CN.md`
6. `docs/local-adoption-playbook.md`
7. `docs/local-adoption-playbook.zh-CN.md`

## 2. Findings
### 2.1 [P2] Failed clean-room runs still publish ACP evidence that looks consumer-ready
- 位置: `scripts/release/verify-cleanroom-local-install.js:1956`
- 问题描述: clean-room script 在写完主 report 后，会无条件生成 `acp-cleanroom-verification.summary.json`。如果 `--acp-host-verify` 子场景已通过，但同一轮 clean-room run 的其他部分失败，summary 仍会像 pass 一样被写出，而 reader 之前没有任何 overall run-status guard。
- 影响: `doctor` / `verify` 可能在 source clean-room report 已失败的情况下，继续把 ACP 投影为 `runtime_service_and_distribution_cleanroom_verified`，从而夸大 evidence-backed readiness。
- 建议: 将 full-run `overallStatus` 编码进 summary，并让 consumer 只在 `overallStatus=passed` 时信任 clean-room verified uplift；同时补一个 failed-run summary 的回归测试。

## 3. Notes
1. fresh reviewer round 2 只返回以上 1 条 actionable finding；除此之外，这轮 clean recheck 没有再发现新的 sprint-003 问题。

## 4. Verification
1. fresh reviewer round 2 只执行了规范与代码复核，未重跑 handoff 中列出的验证命令。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：clean-room script 之前会在 full-run report 写回后无条件发布 ACP summary，而 runtime reader 仅消费 summary 自身的 surface facts，没有任何 overall run-status guard，因此 failed run 的 pass-shaped summary 的确可能被误读为 clean-room verified evidence。
   - 处理：已接受该修复方向，并在同一 change window 中把 full-run `overallStatus` 写入 ACP summary，同时要求 runtime consumer 仅在 `overallStatus=passed` 时才投影 clean-room verified uplift，并补入 failed-run summary regression fixture。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`、`apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
   - 说明：ACP clean-room summary 现在会显式带出 full-run `overallStatus`，而 runtime reader 只有在 `overallStatus=passed`、`default distribution`、`path/link/tgz` 全覆盖且双侧 receipts 齐全时，才允许投影 `runtime_service_and_distribution_cleanroom_verified`。

## 处置结果与剩余风险（2026-04-15）

1. `2.1` 已完成修复，并通过 focused vitest、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 ACP clean-room verify 复验。
2. 当前 `CR-002` 作为第二轮“发现并修复” round 已收口；下一步仍需再开 fresh clean recheck，确认 sprint-003 boundary 不再有新的 actionable finding。
