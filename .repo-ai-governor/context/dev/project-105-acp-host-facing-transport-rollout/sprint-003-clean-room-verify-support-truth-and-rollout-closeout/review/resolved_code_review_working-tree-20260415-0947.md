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
1. `apps/cli/src/runtime/cli-acp-host-evidence-runtime.ts`
2. `apps/cli/src/runtime/adapter-verification-runtime.ts`
3. `scripts/release/verify-cleanroom-local-install.js`
4. `packages/shared/src/constants/service-host-package.constant.ts`
5. `packages/adapters/codex/src/codex-host-renderer.ts`
6. `packages/adapters/claude-code/src/claude-code-host-renderer.ts`
7. `packages/adapters/github-copilot/src/github-copilot-host-renderer.ts`
8. `packages/adapters/codex/test/codex-host-renderer.test.ts`
9. `packages/adapters/claude-code/test/claude-code-host-renderer.test.ts`
10. `packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`
11. `docs/support-matrix.md`
12. `docs/support-matrix.zh-CN.md`
13. `docs/local-adoption-playbook.md`
14. `docs/local-adoption-playbook.zh-CN.md`
15. `README.md`
16. `README.zh-CN.md`
17. `apps/cli/README.md`
18. `integrations/desktop/README.md`
19. `integrations/desktop/examples/README.md`

## 2. Findings
1. 未发现需要修复的点。

## 3. Notes
1. ACP clean-room projection 现在只会在 summary 明确匹配 `distributionMode=default`、完整覆盖 `path/link/tgz`，且 runtime-service / packaged-distribution verification receipts 都齐全时，才投影 `runtime_service_and_distribution_cleanroom_verified`。
2. host renderer tests 现在会直接断言 `serviceHostPackageExport` 与 MCP `packageExport` 指向 `repo-ai-governor/service-host`，覆盖 clean-room/service-host 公开根导出的 contract truth。
3. 本轮复核未发现会把 `acp_exec` 误投影成 `cli_exec` success 的路径；ACP blocked invoke/stream/confirm 仍保持 fail-closed 语义。

## 4. Verification
1. `pnpm vitest run apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/host-command.integration.test.ts apps/cli/test/commands/host-command.test.ts packages/adapters/codex/test/codex-host-renderer.test.ts packages/adapters/claude-code/test/claude-code-host-renderer.test.ts packages/adapters/github-copilot/test/github-copilot-host-renderer.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/release/verify-cleanroom-local-install.js --modes path,link,tgz --iterations 1 --acp-host-verify --emit-acp-evidence .repo-ai-governor/generated/acp/acp-cleanroom-verification.summary.json --output .tmp/project-105-sprint-003-acp-cleanroom-report.json`（通过）
