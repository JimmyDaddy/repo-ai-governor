# Code Review: sprint-003 clean-room verify and support truth closeout branch-coverage recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-005`
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
1. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
2. `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`
3. `scripts/release/verify-cleanroom-local-install.js`

## 2. Findings
### 2.1 [P2] Negative ACP clean-room tests did not exercise the repaired runtime-service branch
- 位置: `apps/cli/test/runtime/adapter-routing-runtime.test.ts:78`
- 问题描述: shared helper 之前写入 `codex.project-local`，而 production runtime 只把 `codex.project_local` 视作 runtime-service target。这样新补的负向用例虽然会通过，但它们实际上没有让 `runtimeServiceReady` 变成 true，因此并没有真正覆盖到刚修好的 `overallStatus` / durable receipt gating branch。
- 影响: clean recheck 可能在 coverage 看起来正常的情况下漏掉 repaired branch 的回归。
- 建议: 把 helper 对齐到真实 runtime target，并在负向用例中显式断言 `runtime_service_ready + packaged_distribution_ready` 仍不会升级成 `runtime_service_and_distribution_cleanroom_verified`。

## 3. Notes
1. fresh reviewer round 5 只返回以上 1 条 actionable finding；除此之外，此轮没有新增其他 sprint-003 问题。

## 4. Verification
1. fresh reviewer round 5 已执行规范与代码复核，并确认原负向用例因为 helper target 与真实 runtime target 不一致，只覆盖到了 packaged-distribution-only 分支。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：test helper 写入 `codex.project-local`，而 passing runtime-service case 使用 `codex.project_local`；negative cases 全部复用了 helper，因此在修复前不会让 `runtimeServiceReady` 成立。
   - 处理：已接受该修复方向，并在同一 change window 中把 helper target 改为真实 runtime target，同时让负向用例显式断言 `protocol.acp_host_readiness_status=runtime_service_ready` 与 `protocol.acp_distribution_boundary=packaged_distribution_ready` 仍不会 uplift 为 clean-room verified。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
   - 说明：负向用例现在会真实带起 runtime-service + packaged-distribution ready 状态，再断言 clean-room gating 仍然 fail-closed，不再依赖 helper target 偏差而“误绿”。

## 处置结果与剩余风险（2026-04-15）

1. `2.1` 已完成修复，并通过 focused vitest、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 ACP clean-room verify 复验。
2. 当前 `CR-005` 作为第五轮“发现并修复” round 已收口；由于本轮继续发生了测试代码变更，下一步仍需再开 fresh clean recheck，确认 sprint-003 boundary 不再有新的 actionable finding。
