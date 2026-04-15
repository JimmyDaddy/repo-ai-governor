# Code Review: project-105 final clean recheck after tracked-receipt portability hardening

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-012`
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
未发现需要修复的点。

## 3. Notes
1. residual risk: provenance portability 仍依赖字符串匹配来发现 repo-owned path，但当前带空格 source-root regression、portable temp-root grep 与 repo-relative provenance sweep 已覆盖本轮变更最关键的风险，因此本轮不把它提升为 actionable finding。
2. ACP clean-room consumer 现在已经把 `overallStatus=passed`、tracked relative receipt path 与 receipt-root containment 一起收紧为 fail-closed 边界；当前没有再看到会重新接受可读绝对 temp receipt 的入口。
3. 如果后续继续调整 tracked receipt schema 或 provenance payload 结构，应保留 `test/release-cleanroom-portability.integration.test.ts` 作为长期 portability 防回退锚点。

## 4. Verification
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts test/release-cleanroom-portability.integration.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
5. `if rg -n '/private/|/var/folders|target-repo\\.repo-ai-governor|target-repo/\\.repo-ai-governor' .repo-ai-governor/generated/acp -S; then exit 1; fi`（通过）
6. `node (repo-relative provenance sweep across .repo-ai-governor/generated/acp/**/*.json)`（通过）
7. `pnpm exec biome format --write apps/cli/test/runtime/adapter-routing-runtime.test.ts test/task-required-input-boundary.integration.test.ts test/artifact-candidate-query.integration.test.ts scripts/governance/query-artifact-candidates.js`（通过）
8. `pnpm run check`（通过）

## 处置结果与剩余风险（2026-04-15）

1. latest fresh project-final clean recheck 未发现新的 actionable finding，`project-105` 当前 closeout-ready state 已重新取得 clean 依据。
2. 当前可以完成 `TK-890`，写回 reopened closeout 的 completion audit、completed-stream history 与 idle `current-context`，而不需要再新开一轮 project-final reviewer。
3. residual portability 风险只剩字符串匹配型 provenance 发现逻辑；本轮 reviewer 明确将其判定为非 actionable note，后续若 schema/path 结构继续演化，再单独补强即可。
