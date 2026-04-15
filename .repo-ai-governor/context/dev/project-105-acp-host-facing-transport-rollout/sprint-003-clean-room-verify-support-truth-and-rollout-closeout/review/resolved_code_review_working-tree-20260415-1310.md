# Code Review: project-105 final tracked-receipt boundary and whitespace-portability recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-011`
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
2. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
3. `scripts/release/verify-cleanroom-local-install.js`
4. `test/release-cleanroom-portability.integration.test.ts`
5. `.repo-ai-governor/generated/acp/**`

## 2. Findings
### 2.1 [P2] ACP clean-room gating still trusted absolute readable receipt paths outside the tracked receipt boundary
- 位置: `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts:264`
- 问题描述: round-11 reviewer 指出 consumer 侧 `hasRequiredCleanRoomReceipts()` 仍然直接 `resolve(dirname(summaryFilePath), summaryPath)`；对绝对 `/tmp/...` receipt path 来说，这会保留绝对路径，只要目标 receipt 仍然可读且为 `PASS`，runtime 就会把它当成有效 clean-room evidence。
- 影响: 即使 producer 现在会写 durable tracked receipts，只要 summary 被部分回退或手工改写成可读的绝对 temp receipt，ACP companion summary 就可能重新被误抬升到 clean-room verified，tracked-receipt boundary 不是 fail-closed。
- 建议: consumer 必须只接受 summary 同目录下 `acp-cleanroom-verification.receipts/**` 的相对 receipt path，并补一条“绝对 temp receipt 虽然可读但必须拒绝”的回归测试。

### 2.2 [P2] Receipt provenance path extraction still broke on temp/workspace paths containing spaces
- 位置: `scripts/release/verify-cleanroom-local-install.js:1859`
- 问题描述: round-11 reviewer 指出 `collectTrackedReceiptAbsolutePaths()` 之前使用“遇到空白即截断”的正则，所以当 temp/workspace 根路径带空格时，绝对 `.repo-ai-governor/...` source path 会被截断，既不会被复制到 provenance snapshot，也不会被 rewrite 成 portable repo-relative path。
- 影响: 在带空格目录的真实环境里，portable ACP receipts 会重新泄漏绝对 temp-root，并且 provenance snapshot 缺失源文件副本，portable clean-room evidence 会再次退化成 machine-bound output。
- 建议: 把 absolute/workspace path match 改成只以引号、逗号和换行等结构分隔符收口，而不是以空白截断；同时补一条带空格 source root 的 provenance rewrite/copy regression。

## 3. Notes
1. fresh reviewer round 11 只返回了这 2 条 actionable finding，没有新增 `acp_exec` routing、support wording 或 `cli_exec` truth separation 问题。
2. `pnpm run check` 在本轮第一次重跑时被 format/lint gate 暂时阻塞：其中 `apps/cli/test/runtime/adapter-routing-runtime.test.ts` 是本轮 touched file，另外 `test/task-required-input-boundary.integration.test.ts`、`test/artifact-candidate-query.integration.test.ts` 与 `scripts/governance/query-artifact-candidates.js` 是当前 worktree 中已存在的格式漂移；已用 Biome 进行无语义格式化并恢复 gate。
3. 当前 `.repo-ai-governor/generated/acp` 自身已经满足 temp-root grep 与 repo-relative provenance existence sweep；本轮修复聚焦于把 consumer contract 和 whitespace portability 都补齐成 fail-closed。

## 4. Verification
1. fresh reviewer round 11 已执行 working-tree 复核并返回以上 2 条 actionable finding。

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：runtime 之前会直接解析 summary 里给出的 receipt path；绝对 `/tmp/...` path 在 `resolve()` 后仍保持绝对路径，只要目标 receipt 还存在并为 `PASS`，clean-room gating 就会被重新放开。
   - 处理：已把 consumer 改成只接受 summary 同目录 `acp-cleanroom-verification.receipts/**` 下的相对 receipt path，并新增“可读的绝对 temp receipt 也必须拒绝”的回归测试。
2. `2.2`
   - 判定：**认可**
   - 证据：receipt provenance extractor 之前把空白当成路径终止符，带空格 source root 下的绝对 `.repo-ai-governor/...` path 会被截断，导致 snapshot/copy/rewrite 都漏掉该路径。
   - 处理：已把 absolute/workspace path match 改成基于结构分隔符的提取逻辑，不再因空白截断；同时新增带空格 source root 的 provenance rewrite/copy regression，并把 helper 显式导出供测试复用。

### 验证命令
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts test/release-cleanroom-portability.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
5. `if rg -n '/private/|/var/folders|target-repo\\.repo-ai-governor|target-repo/\\.repo-ai-governor' .repo-ai-governor/generated/acp -S; then exit 1; fi`（通过）
6. `node (repo-relative provenance sweep across .repo-ai-governor/generated/acp/**/*.json)`（通过）
7. `git add .repo-ai-governor/generated/acp`（通过）
8. `git status --short .repo-ai-governor/generated/acp`（通过；regenerated ACP evidence 已纳入当前 change set）
9. `pnpm exec biome format --write apps/cli/test/runtime/adapter-routing-runtime.test.ts test/task-required-input-boundary.integration.test.ts test/artifact-candidate-query.integration.test.ts scripts/governance/query-artifact-candidates.js`（通过；恢复 same-window delivery gate）
10. `pnpm run check`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`、`apps/cli/test/runtime/adapter-routing-runtime.test.ts`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts test/release-cleanroom-portability.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`、`pnpm run check`（通过）
   - 说明：ACP runtime 现在只接受 summary 同目录 `acp-cleanroom-verification.receipts/**` 下的 tracked relative receipt path；可读的绝对 temp receipt 不再能把 clean-room verified uplift 重新抬起。
2. `2.2`：已完成
   - 变更文件：`scripts/release/verify-cleanroom-local-install.js`、`test/release-cleanroom-portability.integration.test.ts`、`.repo-ai-governor/generated/acp/**`
   - 验证：`pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts test/release-cleanroom-portability.integration.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`、`node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`、`if rg -n '/private/|/var/folders|target-repo\\.repo-ai-governor|target-repo/\\.repo-ai-governor' .repo-ai-governor/generated/acp -S; then exit 1; fi`、`node (repo-relative provenance sweep across .repo-ai-governor/generated/acp/**/*.json)`、`git add .repo-ai-governor/generated/acp`、`git status --short .repo-ai-governor/generated/acp`、`pnpm run check`（通过）
   - 说明：tracked provenance extractor 现在允许带空格的 absolute/workspace path 正常被 copy/rewrite；portable receipt 内部 path 不再因空白截断而泄漏 temp-root。

## 处置结果与剩余风险（2026-04-15）

1. `CR-011` 的两条 accepted finding 已完成修复：ACP runtime 现在对 tracked receipt boundary fail-closed，clean-room provenance extractor 也已补齐 whitespace portability。
2. 同窗证据已覆盖 targeted vitest（含新的 absolute receipt / whitespace portability regressions）、`pnpm run build`、`pnpm run test:packages`、ACP clean-room verify、portable temp-root grep、repo-relative provenance sweep、staged ACP evidence status 与 `pnpm run check`。
3. 因为 project-final boundary 本轮再次发生了代码、tests 和 tracked evidence 变更，下一步仍需新的 fresh `CR-012` clean recheck；只有 latest round clean 后，才允许完成 `TK-890` 与 `project-105` final closeout。
