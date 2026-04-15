# Code Review: project-105 final ACP provenance snapshot recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-010`
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
4. `.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/**`

## 2. Findings
### 2.1 [P1] Portable ACP receipts still pointed at repo-relative paths that do not survive clean-room temp cleanup
- 位置: `scripts/release/verify-cleanroom-local-install.js:1633`
- 问题描述: round-10 reviewer 观察到上一轮虽然把 tracked receipt payload 从 temp-root 绝对路径改成了 repo-relative string，但这些 string 仍然指向 `generated/hosts/**` 或 `generated/bundles/**` 之类并不包含 clean-room fixture 快照的路径。receipt 内部继续引用 `sample-host-skill`、`host-apply.report.json` 等 clean-room 来源文件时，temp-root 清理后这些 repo-relative 路径会直接失效。
- 影响: project-final ACP tracked evidence 仍然不是可搬运的 durable provenance，后续 host/readiness consumer 一旦依赖 receipt internals，就会读到不存在的 repo-owned path，无法把 clean-room verify 作为稳定的 support truth。
- 建议: 在 receipt 持久化阶段同步复制 clean-room source provenance 到 workspace-owned durable tree，并把 receipt JSON 内部路径全部重写到这个快照，再显式校验所有 repo-relative path 都存在。

## 3. Notes
1. fresh reviewer round 10 只返回了这一条 portability / provenance finding，没有新增 `acp_exec` routing、support wording 或 `cli_exec` truth 混淆问题。
2. 本轮修复继续限制在 tracked ACP evidence durability，不扩 scope 到新的 transport contract 或 runtime behavior 改写。

## 4. Verification
1. fresh reviewer round 10 已执行 working-tree 复核并返回以上 1 条 actionable finding。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：fresh reviewer round 10 指出 regenerated receipt payload 虽然不再暴露 temp-root，但内部字段仍引用 repo-owned `generated/hosts/**` / `generated/bundles/**` 路径；这些路径并没有持久化 clean-room fixture provenance，temp-root 清理后会形成 dead reference。
   - 处理：已接受该修复方向，并把 tracked ACP receipt 持久化改成先复制 clean-room provenance 到 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/**`，再把 receipt JSON 内部路径全部重写到这个 durable snapshot，并增加 repo-relative existence assertion。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
5. `if rg -n '/private/|/var/folders|target-repo\\.repo-ai-governor|target-repo/\\.repo-ai-governor' .repo-ai-governor/generated/acp -S; then exit 1; fi`（通过）
6. `node (repo-relative provenance sweep across .repo-ai-governor/generated/acp/**/*.json)`（通过）
7. `git add .repo-ai-governor/generated/acp`（通过）
8. `git status --short .repo-ai-governor/generated/acp`（通过；regenerated ACP evidence 已纳入当前 change set）
9. `pnpm run check`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`、`.repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json`、`.repo-ai-governor/generated/acp/acp-cleanroom-verification.receipts/**`、`.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/**`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`、`if rg -n '/private/|/var/folders|target-repo\\.repo-ai-governor|target-repo/\\.repo-ai-governor' .repo-ai-governor/generated/acp -S; then exit 1; fi`、`node (repo-relative provenance sweep across .repo-ai-governor/generated/acp/**/*.json)`、`git add .repo-ai-governor/generated/acp`、`git status --short .repo-ai-governor/generated/acp`、`pnpm run check`（通过）
   - 说明：tracked ACP receipt payload 现在统一指向 workspace-owned provenance snapshot；summary/receipt 顶层引用与 receipt 内部 provenance path 都是 portable repo-relative path，并且已显式校验在当前 worktree 中存在。

## 处置结果与剩余风险（2026-04-15）

1. `CR-010` 的 accepted portability finding 已完成修复，tracked ACP evidence 现在通过 `.repo-ai-governor/generated/acp/acp-cleanroom-verification.provenance/**` 持久化 clean-room source provenance，而不是引用清理后会失效的 repo-relative dead path。
2. 同窗证据已覆盖 focused vitest、`pnpm run build`、`pnpm run test:packages`、ACP clean-room verify、portable temp-root grep、repo-relative provenance sweep、staged ACP evidence status 与 `pnpm run check`。
3. 因为 project-final boundary 在本轮仍发生了代码与 tracked evidence 变更，下一步仍需新的 fresh `CR-011` clean recheck；只有 latest round clean 后，才允许完成 `TK-890` 与 `project-105` final closeout。
