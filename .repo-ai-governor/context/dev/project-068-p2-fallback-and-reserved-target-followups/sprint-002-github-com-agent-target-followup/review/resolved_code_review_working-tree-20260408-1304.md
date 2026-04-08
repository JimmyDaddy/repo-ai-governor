# Code Review: project-068 final closeout surface

- Status: resolved
- Date: 2026-04-08
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: project final scope review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope
1. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/`
2. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-001-local-model-capability-ceiling-and-promoted-use-case/`
3. `.repo-ai-governor/context/dev/project-068-p2-fallback-and-reserved-target-followups/sprint-002-github-com-agent-target-followup/`
4. `scripts/release/verify-github-com-agent-reserved-target.mjs`

## 2. Findings
### 2.1 [P2] `verify-blocked` can pass on stale verification summary
- 位置: `scripts/release/verify-github-com-agent-reserved-target.mjs:448`
- 问题描述: `runVerifyBlockedScenario()` 直接读取 staged export 场景已经生成过的 `host-verification.summary.json`，但没有证明 `host verify` 本次真的重写了该 summary。若后续回归导致 `host verify` 继续返回预期的 CLI error payload，却不再刷新 summary 文件，这条 reserved-target fail-closed gate 仍可能误判为绿色。
- 影响: `project-068` 的 project-final reserved-target replay evidence 可能建立在陈旧 summary 上，削弱 `github-com-agent` blocked verify contract 的可信度。
- 建议: 在执行 `host verify` 前删除旧 summary，或显式断言 `verifiedAt`/mtime 发生变化，只接受本次 verify 重新生成的结果。

## 3. Notes
1. reviewer 复核的 project-final ledger surfaces 当前保持一致：`CR-002` task card、`checklist.md`、`tasks.csv`、sprint plan 与 `current-context.md` 都已对齐 `review_pending` 真值。
2. 除上述脚本问题外，本轮未发现新的 `P2 deferred` 范围扩张或 project-final governance blocker。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run build`（通过）
3. `pnpm run release:verify-github-com-agent-reserved-target -- --output .tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run check`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 复核结论（2026-04-08）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`runVerifyBlockedScenario()` 在读取 `verificationSummaryPath` 前没有排除 staged export 场景留下的旧 summary，确实可能让 `verify-blocked` 在 summary 未刷新时继续复用陈旧证据。
   - 处理：接受该 finding；通过在 `host verify` 前删除旧 summary，强制当前场景只消费本次 verify 重新生成的 evidence。

### 验证命令
1. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-08）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-github-com-agent-reserved-target.mjs`
   - 验证：`pnpm exec vitest run apps/cli/test/commands/host-command.test.ts apps/cli/test/host-command.integration.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`pnpm run release:verify-github-com-agent-reserved-target -- --output .tmp/project-068-sprint-002-github-com-agent-reserved-target-report.json`、`pnpm run check`
   - 说明：在 `host verify` 前删除旧的 verification summary，强制 `verify-blocked` 场景只接受本次 verify 重新生成的 summary evidence，避免复用 staged export 遗留文件。

## 处置结果与剩余风险

1. `verify-blocked` 场景现在会在命令执行前清理旧 summary，因此若后续 `host verify` 不再写回 `host-verification.summary.json`，该 verifier 会直接失败，不会出现复用陈旧 summary 的 false green。
2. 除已修复 finding 外，本轮未发现新的 `P2 deferred` contract drift、project-final ledger drift 或 closeout blocker；`project-068` 可以进入最终 closeout。
