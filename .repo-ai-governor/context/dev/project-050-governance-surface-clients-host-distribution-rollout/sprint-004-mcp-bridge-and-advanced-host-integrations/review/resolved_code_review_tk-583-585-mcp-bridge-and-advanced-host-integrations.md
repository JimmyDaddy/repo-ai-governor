# Code Review: sprint-004 MCP bridge and advanced host integrations

- Status: resolved
- Date: 2026-04-06
- Reviewer: AI-Agent
- Task: `TK-583/TK-584/TK-585`
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
1. `packages/standards/src/**`
2. `packages/adapters/codex/src/**`
3. `packages/adapters/claude-code/src/**`
4. `packages/adapters/github-copilot/src/**`
5. `apps/cli/src/runtime/host-distribution-runtime.ts`
6. `project-050 / sprint-004` ledger docs

## 2. Findings

未发现需要修复的点。

## 3. Notes
1. 本轮 closeout synthesis 重点确认 `handoffBridge`、hooks、subagents 与 `.mcp.json` 仍然只是 host-native enhancement baseline，不承载新的 canonical workflow truth。
2. advanced host integration 的产物存在性已通过 staged export artifact 检查覆盖，包括 Codex subagents、Claude hooks、Copilot repo-local `.github/mcp.json` 与 plugin hooks。

## 4. Verification
1. `pnpm run build`（通过）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `test -f .repo-ai-governor/generated/hosts-final/codex/.agents/subagents/workspace-scoped-cr-loop.json && test -f .repo-ai-governor/generated/hosts-final/codex/.mcp.json && test -f .repo-ai-governor/generated/hosts-final/claude-code/.claude/hooks/hooks.json && test -f .repo-ai-governor/generated/hosts-final/claude-code/.mcp.json && test -f .repo-ai-governor/generated/hosts-final/github-copilot-repo-local/.github/mcp.json && test -f .repo-ai-governor/generated/hosts-final/codex-plugin/.codex-plugin/plugin.json && test -f .repo-ai-governor/generated/hosts-final/claude-code-plugin/.claude-plugin/plugin.json && test -f .repo-ai-governor/generated/hosts-final/github-copilot-cli-plugin/hooks/hooks.json`（通过）
