# Code Review: project-105 final closeout portability recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-008`
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
4. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
5. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**`

## 2. Findings
### 2.1 [P1] ACP evidence summary remained machine-bound because it serialized absolute durable receipt paths
- 位置: `scripts/release/verify-cleanroom-local-install.js:1571`
- 问题描述: durable receipt copy 已经解决了 temp-path 丢失，但 summary 仍把 receipt path 写成当前机器的绝对路径；runtime 也按原字符串直接读取。换一个 checkout root 后，即使同一仓库里的 receipt 还在，clean-room verified uplift 也会回退。
- 影响: project-final support truth 会依赖当前机器路径，而不是依赖仓库内的 portable evidence。
- 建议: 把 receipt path 改成 summary-relative portable path，并让 runtime 在读取时按 summary 位置重新解析。

### 2.2 [P1] Durable receipt evidence was not yet part of the tracked change set
- 位置: `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
- 问题描述: summary 现在依赖 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**`，而 runtime 也要求这些 receipt 可读；但本轮 reviewer 复核时，该目录仍是未跟踪状态。如果直接把 summary 提交出去而不把 receipts 一起交付，clean checkout 会立即失去 clean-room verified uplift。
- 影响: project-final closeout 可能把“需要随交付一起存在”的 ACP evidence 只交付了一半。
- 建议: 在当前 change window 内把 durable receipt 目录纳入同一 tracked change set。

### 2.3 [P2] Repo JSON auto-format guard still used a POSIX-only path-prefix check
- 位置: `scripts/release/verify-cleanroom-local-install.js:1863`
- 问题描述: current guard 用 `startsWith(\"<root>/\")` 判断 repo-governed JSON；在 Windows 路径上会失效，导致 `.repo-ai-governor/**` 下 regenerated summary 再次绕过 Biome formatting。
- 影响: round-7 刚修掉的 formatting gate blocker 会在 Windows 上复发。
- 建议: 用 cross-platform 的相对路径判断来识别 governed JSON，而不是硬编码 `/` 前缀。

## 3. Notes
1. fresh reviewer round 8 没有报告直接的 rule-backed violation；以上三条都属于会影响最终 closeout 稳定性的高风险实现问题。
2. 除了 portable receipt / tracked evidence / cross-platform formatting 这三个点，本轮没有新增 ACP routing correctness regression。

## 4. Verification
1. fresh reviewer round 8 已执行 working-tree 复核并返回以上 3 条 actionable finding。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：summary 当前确实会持久化绝对 receipt 路径，而 runtime 读取时也没有基于 summary 位置重解析 relative path。
   - 处理：已接受该修复方向，并改成输出 portable summary-relative receipt path，同时让 runtime 用 summary 文件位置解析 receipt。
2. `2.2`
   - 判定：**认可**
   - 证据：reviewer round 8 复核时 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**` 仍为 `??`，而 runtime 已把它们当成 clean-room verified uplift 的必需输入。
   - 处理：已接受该修复方向，并在同一 change window 内把 `.repo-ai-governor/generated/acp/**` 纳入当前 tracked change set。
3. `2.3`
   - 判定：**认可**
   - 证据：current guard 使用 POSIX-only prefix check，不能正确判断 Windows 风格路径是否位于 `.repo-ai-governor/**` 下面。
   - 处理：已接受该修复方向，并改成 `relative(...) + isAbsolute(...)` 的 cross-platform root test。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
5. `git add .repo-ai-governor/generated/acp && git status --short .repo-ai-governor/generated/acp`（通过；receipt evidence 已纳入当前 change set）
6. `pnpm run check`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`、`apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`、`.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
   - 说明：summary 现在写入 portable relative receipt paths，runtime 也会基于 summary 位置重新解析这些 receipts，不再把 clean-room verified uplift 绑死在当前机器的绝对路径上。
2. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**`
   - 验证：`git add .repo-ai-governor/generated/acp && git status --short .repo-ai-governor/generated/acp`（通过）
   - 说明：durable receipts 已与 tracked summary 一起纳入当前 change set，clean checkout 不会再因为 evidence 缺件而立刻失去 uplift。
3. `2.3`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`
   - 验证：`pnpm run check`（通过）
   - 说明：repo-governed JSON 判断现在改为 cross-platform relative-path test，Windows 路径不再绕过自动格式化。

## 处置结果与剩余风险（2026-04-15）

1. `CR-008` 的 3 条 accepted finding 都已完成修复，并通过 focused vitest、`pnpm run build`、`pnpm run test:packages`、ACP clean-room verify 与 `pnpm run check` 复验。
2. 由于本轮继续修改了 runtime / script / test / evidence surfaces，仍需再开一轮 fresh project-final clean recheck，确认 `project-105` 在最新代码面上不存在新的 actionable finding 后，才能推进 `TK-890`。
