# Code Review: project-105 final closeout gate recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-007`
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
2. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
3. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`

## 2. Findings
### 2.1 [P1] ACP clean-room summary regeneration was still leaving repo-tracked JSON outside the formatting contract
- 位置: `scripts/release/verify-cleanroom-local-install.js:1852`
- 问题描述: project-final clean-room verify 会重写 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`。在 fresh reviewer round 7 观察到该 repo-tracked JSON 重新生成后没有被稳定格式化，因此 `pnpm run check` 会因为 gate:format 失败而阻断 final closeout。
- 影响: project-final closeout 会在 clean-room evidence 真值正确的情况下，被可重复触发的 formatting drift 阻断。
- 建议: 在报告写回阶段自动格式化 repo-governed JSON 输出，并确保该补救不会误作用到临时 `.tmp` 报告。

### 2.2 [P2] ACP routing regression helper block was left in a non-Biome-compliant shape
- 位置: `apps/cli/test/runtime/adapter-routing-runtime.test.ts:55`
- 问题描述: 新增的 helper signature / fixture block 没有保持 Biome formatting contract，因此即使行为正确，project-final gate 仍会因为格式噪音失败。
- 影响: 这会让当前 round 无法区分真正的 runtime regression 与单纯的 formatting gate failure。
- 建议: 让 helper block 回到 Biome 合规形态，并把同窗生成的 summary JSON 一起按格式门禁重写。

## 3. Notes
1. fresh reviewer round 7 的 actionable findings 仅限以上两条 gate blocker；没有发现新的 ACP routing correctness regression。
2. 本轮修复完成后，`project-105` 自身的 focused vitest、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 ACP clean-room verify 已重新通过。
3. 当前剩余阻塞来自 worktree 外部的 delivery ledger drift：`technical-solution.session-shell-secure-secret-input-and-redacted-command-handoff` 仍被标记为 `execution_status=in_progress` / `rollout_status=in_progress`，但 `current-context.md` 中没有对应 active/planned stream。该问题不属于 `project-105` 本轮变更边界。

## 4. Verification
1. fresh reviewer round 7 已执行规范与代码复核，并确认当前 project-final closeout-ready working tree 的主要阻断是 formatting gate，而不是新的 runtime correctness defect。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：clean-room verify 重新生成 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json` 后，project-final gate 会再次读取该 tracked JSON；如果不在写回时稳定格式化，`pnpm run check` 会反复被 gate:format 阻断。
   - 处理：已接受该修复方向，并把 JSON 自动格式化收紧到 `.repo-ai-governor/**` 这类 repo-governed output，避免误碰 `.tmp` 临时报表。
2. `2.2`
   - 判定：**认可**
   - 证据：`adapter-routing-runtime.test.ts` 的 helper block 在 reviewer round 7 时不满足当前 Biome 规则，会把 project-final gate 噪音和真实 ACP 行为回归混在一起。
   - 处理：已接受该修复方向，并让 helper block 与同窗 summary JSON 一起回到 Biome 合规形态。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
5. `pnpm run check`（失败：仅被 unrelated `technical-solution.session-shell-secure-secret-input-and-redacted-command-handoff` delivery handoff drift 阻断，不是 `project-105` 本轮修复回归）
6. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（失败：与上一条相同，当前只报告 `followup_stream_not_registered`）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`、`.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
   - 说明：write-report hook 现在只格式化 `.repo-ai-governor/**` 下的治理 JSON，repo-tracked ACP summary 会稳定满足 format gate，而 `.tmp` 临时输出不会再触发 Biome “No files were processed” 的自杀式失败。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm exec biome format --write apps/cli/test/runtime/adapter-routing-runtime.test.ts`、`pnpm run check`（仅保留 unrelated delivery-registry drift 失败）
   - 说明：helper signature / fixture block 已回到 Biome 合规形态，本轮残余 gate failure 与该测试文件无关。

## 处置结果与剩余风险（2026-04-15）

1. `CR-007` 的两条 accepted finding 都已完成修复，`project-105` 本身的 project-final boundary 已不再被这两条 gate blocker 阻断，因此本轮可以收口为 `resolved`。
2. 由于 `pnpm run check` 仍被 unrelated `project-092` delivery handoff drift 阻断，下一轮 fresh project-final clean recheck 目前无法在全量 gate 通过的前提下启动；在用户明确是否处理该外部台账漂移之前，`TK-890` 与最终 closeout 仍必须保持未完成。
