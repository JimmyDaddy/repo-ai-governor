# Code Review: TK-139 Claude Code 远端 provider 真实调用与 fallback/degrade 收口

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-139`
- Review Type: implementation and route-truthfulness review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/adapters/claude-code/src/`
2. `packages/adapters/claude-code/test/`
3. `apps/cli/src/main.ts`
4. `apps/cli/src/runtime/adapter-routing-runtime.ts`
5. `apps/cli/src/runtime/claude-code-exec-fixture-runtime.ts`
6. `apps/cli/test/**`
7. `scripts/examples/check-examples-runtime.js`
8. `scripts/ci/stage9-blackbox-ga-lib.js`
9. `test/e2e/blackbox-governance-flow.e2e.test.ts`

## 2. Findings

本轮未发现需要继续修复的问题。Claude Code 已具备真实 CLI-backed `probe/invoke` 路径，route runner 与 diagnostics 也不再把 baseline stub 当成生产候选面。

## 3. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts apps/cli/test/runtime/claude-code-exec-fixture-runtime.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/examples/check-examples-runtime.js`
4. `pnpm -s vitest run test/e2e/blackbox-governance-flow.e2e.test.ts --config vitest.e2e.config.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 4. Resolution

1. Claude Code adapter 已从 baseline `echoedInput` stub 升级为真实 CLI-backed provider 路径。
2. `claude` 现作为默认入口，缺失时可回退到 `claude-code`，与本地 probe 顺序保持一致。
3. `CLI_EXEC` 的 capability、confirmation 与 cancellation 声明已经与真实行为对齐，不再夸大 provider 能力。
4. route/integration/gate fixtures 已补齐 Claude 注入面，避免 blackbox/runtime smoke 继续依赖本机真实 Claude 会话。
