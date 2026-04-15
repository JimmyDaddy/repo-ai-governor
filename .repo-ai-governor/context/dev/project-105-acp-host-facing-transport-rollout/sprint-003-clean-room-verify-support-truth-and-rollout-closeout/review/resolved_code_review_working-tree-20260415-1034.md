# Code Review: sprint-003 clean-room verify and support truth closeout durable receipt recheck

- Status: resolved
- Date: 2026-04-15
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
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`
2. `scripts/release/verify-cleanroom-local-install.js`
3. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
4. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`

## 2. Findings
### 2.1 [P1] ACP clean-room uplift still accepted deleted receipt paths as proof
- 位置: `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts:257`
- 问题描述: runtime 之前只要求 summary 中存在 3 个非空 receipt path 字符串，但 clean-room script 生成 summary 时直接引用 temp worktree 下的 `host-verification.summary.json`。成功 run 结束后 temp root 会被删除，导致 `doctor` / `verify` 仍可能把 ACP 投影成 `runtime_service_and_distribution_cleanroom_verified`，但 summary 里引用的 receipt 已经不存在。
- 影响: ACP host-facing support truth 会建立在不可回放的临时路径上，不满足 `CS-004` 对真实 verification evidence 的要求。
- 建议: 把 ACP clean-room receipt 复制到 workspace-owned durable 目录，并让 runtime 只在 receipt path 真实可读且内容仍是 `pass` summary 时才投影 clean-room verified uplift。

## 3. Notes
1. fresh reviewer round 4 只返回以上 1 条 actionable finding；除此之外，此轮没有新增其他 sprint-003 问题。

## 4. Verification
1. fresh reviewer round 4 已执行规范与代码复核，并在真实 clean-room rerun 中确认 summary 原先引用的是已被清理的 temp receipt path。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：real clean-room rerun 生成的 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json` 原先写入 `/private/var/.../repo-ai-governor-cleanroom-*/.../host-verification.summary.json`；run 结束后这些 receipt path 已不存在，而 runtime 只按 path 字符串数量判定 clean-room evidence 是否充分。
   - 处理：已接受该修复方向，并在同一 change window 中把 ACP receipt 持久化到 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**`，同时要求 runtime 只在 receipt path 可读且内容仍是 `pass` host verification summary 时才投影 `runtime_service_and_distribution_cleanroom_verified`。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
5. `node - <<'NODE' ... existsSync(summary receipt paths) ... NODE`（通过，确认 summary 中所有 durable receipt path 均存在）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`、`apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`、`node - <<'NODE' ... existsSync(summary receipt paths) ... NODE`（通过）
   - 说明：ACP clean-room summary 现在会把 runtime/distribution receipt 复制到 workspace-owned durable 路径，runtime 只有在 `overallStatus=passed`、`default distribution`、`path/link/tgz` 全覆盖且 receipt file 真实可读并仍是 `pass` host verification summary 时，才允许投影 clean-room verified uplift。

## 处置结果与剩余风险（2026-04-15）

1. `2.1` 已完成修复，并通过 focused vitest、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、ACP clean-room verify 与 durable receipt existence check 复验。
2. 当前 `CR-004` 作为第四轮“发现并修复” round 已收口；由于本轮继续发生了代码变更，下一步仍需再开 fresh clean recheck，确认 sprint-003 boundary 不再有新的 actionable finding。
