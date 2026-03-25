# Code Review: TK-140 跨 provider adapter 运维契约与 route-runner truthfulness hardening

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-140`
- Review Type: implementation and truthfulness review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`
2. `packages/adapter-sdk/src/constants/agent-cli-exec.constant.ts`
3. `packages/adapter-sdk/src/types/interfaces/agent-cli-exec.interface.ts`
4. `packages/adapters/codex/src/codex-agent-adapter.ts`
5. `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
6. `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
7. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
8. `packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts`
9. `packages/adapters/*/test/*.smoke.test.ts`

## 2. Findings

本轮未发现需要继续修复的问题。共享 CLI exec operations runtime 已将跨 provider 的 retry/backoff、error detail、redaction 与 diagnostics truthfulness 收敛到统一契约。

## 3. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run packages/adapter-sdk/test/agent-cli-exec-operations-runtime.unit.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts apps/cli/test/runtime/adapter-diagnostics-runtime.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:packages -- @repo-ai-governor/adapter-sdk @repo-ai-governor/adapter-codex @repo-ai-governor/adapter-github-copilot @repo-ai-governor/adapter-claude-code @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check`

## 4. Resolution

1. Codex / GitHub Copilot / Claude Code 已共享同一套 CLI exec 运维基础设施，而不是继续各自复制 retry/redaction/detail 逻辑。
2. rate-limit / quota / timeout 等跨 provider 故障的 diagnostics 现在具备统一 truthfulness，不再依赖 provider 私有文案。
3. 共享基础契约已经上提到 `adapter-sdk`，为 `TK-141` 的 sprint-001 出口验收提供正式收口证据。
