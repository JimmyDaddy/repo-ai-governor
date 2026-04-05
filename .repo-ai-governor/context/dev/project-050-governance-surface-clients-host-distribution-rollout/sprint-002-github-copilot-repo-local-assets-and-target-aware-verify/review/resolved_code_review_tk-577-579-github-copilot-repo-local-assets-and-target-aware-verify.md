# Code Review: sprint-002 GitHub Copilot repo-local assets and target-aware verify

- Status: resolved
- Date: 2026-04-06
- Reviewer: AI-Agent
- Task: `TK-577/TK-578/TK-579`
- Review Type: sprint owned scope review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/host-native-distribution-and-target-specific-consumption.md`

## 1. Review Scope
1. `packages/adapters/github-copilot/src/**`
2. `packages/adapters/github-copilot/test/**`
3. `packages/standards/src/**`
4. `apps/cli/src/commands/host-command.ts`
5. `apps/cli/src/runtime/host-distribution-runtime.ts`
6. `project-050 / sprint-002` ledger docs

## 2. Findings

未发现需要修复的点。

## 3. Notes
1. 本轮 closeout synthesis 重点确认 `github_copilot.repo_local` 与 reserved `github_copilot.github_com_agent` 已进入显式 target contract，且 verify 不再把 reserved target 误报为成功。
2. reserved target 的 blocking repair history 已记录在 `sprint-001/review/resolved_code_review_host-command-blocking-verification.md`，本 sprint 范围内未发现新的 repo-local target drift。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./dist/bin/repo-ai-governor.js host export --host github-copilot --mode project-local --copilot-target repo-local --output-dir .repo-ai-governor/generated/hosts-final/github-copilot-repo-local --apply-to-repo .repo-ai-governor/generated/applied-final/github-copilot-repo-local`（通过）
5. `node ./dist/bin/repo-ai-governor.js host verify --manifest .repo-ai-governor/generated/hosts-final/github-copilot-repo-local/host-export.manifest.json`（通过）
6. `node ./dist/bin/repo-ai-governor.js host export --host github-copilot --mode project-local --copilot-target github-com-agent --output-dir .repo-ai-governor/generated/hosts-final/github-com-agent-apply-blocked --apply-to-repo .repo-ai-governor/generated/applied-final/github-com-agent-apply-blocked`（预期失败，blocking semantics 生效）
7. `node ./dist/bin/repo-ai-governor.js host verify --manifest .repo-ai-governor/generated/hosts-final/github-com-agent-verify-blocked/host-export.manifest.json`（预期失败，reserved target verify fail-closed 生效）
