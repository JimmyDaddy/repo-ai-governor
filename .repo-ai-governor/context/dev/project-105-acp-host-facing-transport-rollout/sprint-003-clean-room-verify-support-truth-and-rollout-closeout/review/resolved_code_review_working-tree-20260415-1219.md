# Code Review: project-105 final portable evidence sanitization recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-009`
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
2. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`
3. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**`

## 2. Findings
### 2.1 [P1] Tracked ACP receipt payloads still embedded machine-bound temp-root paths after the portable summary cutover
- 位置: `scripts/release/verify-cleanroom-local-install.js:1724`
- 问题描述: `CR-008` 已把 summary 顶层 `sourceReportPath` 和 receipt references 改成 portable path，但 copied receipt JSON 的内部字段仍然保留 clean-room temp-root 绝对路径。round-9 reviewer 看到的 payload 甚至出现了 `target-repo.repo-ai-governor/...` 这样的错误字符串，说明 sanitizer 只去掉了 `/.repo-ai-governor/` 前面的一个斜杠，没有真正把 evidence 裁到仓库内可搬运的 `.repo-ai-governor/...`。
- 影响: project-final tracked ACP evidence 仍然依赖当前机器的 temp-root，换一个 checkout root 或 clean clone 后会失去可复用性，也会让 clean-room verified uplift 继续带着 machine-bound drift。
- 建议: 把 sanitizer 改成直接保留 `.repo-ai-governor/...` suffix，重新生成 tracked receipts，并用显式 grep 证明 temp-root 与错误的 `target-repo.repo-ai-governor` 字符串已经消失。

## 3. Notes
1. fresh reviewer round 9 只返回这一条 portability finding，没有新增 ACP routing 或 support/docs truth regression。
2. 本轮修复只收窄到 tracked evidence sanitization 与 regenerated receipts；`CR-008` 已落地的 runtime relative-receipt resolution 继续保留。

## 4. Verification
1. fresh reviewer round 9 已执行 working-tree 复核并返回以上 1 条 actionable finding。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：fresh reviewer round 9 观察到 regenerated receipt payload 里仍含有 `/private/.../target-repo/.repo-ai-governor/...` 的 temp-root 绝对路径，并被错误改写成 `target-repo.repo-ai-governor/...`；这说明当前 sanitizer 的裁剪边界不对。
   - 处理：已接受该修复方向，并把 sanitizer 改成直接保留 `.repo-ai-governor/...` suffix，随后重新生成 tracked ACP receipts 并加一条无 temp-root 残留的显式验证。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
5. `if rg -n '/private/|/var/folders|target-repo\\.repo-ai-governor|target-repo/\\.repo-ai-governor' .repo-ai-governor/generated/acp -S; then exit 1; fi`（通过）
6. `git add .repo-ai-governor/generated/acp && git status --short .repo-ai-governor/generated/acp`（通过；regenerated ACP evidence 已纳入当前 change set）
7. `pnpm run check`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`、`.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`、`.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`、`if rg -n '/private/|/var/folders|target-repo\\.repo-ai-governor|target-repo/\\.repo-ai-governor' .repo-ai-governor/generated/acp -S; then exit 1; fi`（通过）
   - 说明：tracked ACP receipt payload 现在统一落成 `.repo-ai-governor/...` portable strings，不再携带 temp-root，也不再生成错误的 `target-repo.repo-ai-governor/...` 拼接值。

## 处置结果与剩余风险（2026-04-15）

1. `CR-009` 的 accepted portability finding 已完成修复，并通过 focused vitest、`pnpm run build`、`pnpm run test:packages`、ACP clean-room verify、显式 portable-evidence grep 与 `pnpm run check` 复验。
2. 由于本轮继续修改了 script 与 tracked ACP evidence，仍需再开一轮 fresh project-final clean recheck，只有最新 round 无 actionable finding 后，才允许完成 `TK-890` 与 `project-105` final closeout。
