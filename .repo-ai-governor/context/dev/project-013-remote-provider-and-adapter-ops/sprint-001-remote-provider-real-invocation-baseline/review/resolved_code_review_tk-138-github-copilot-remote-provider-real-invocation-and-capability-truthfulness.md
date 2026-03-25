# Code Review: TK-138 GitHub Copilot 远端 provider 真实调用与 capability truthfulness 收口

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-138`
- Review Type: implementation and gate-stability review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/adapters/github-copilot/src/`
2. `apps/cli/src/main.ts`
3. `apps/cli/src/runtime/adapter-routing-runtime.ts`
4. `apps/cli/src/runtime/local-model-probe-runtime.ts`
5. `apps/cli/src/runtime/github-copilot-exec-fixture-runtime.ts`
6. `apps/cli/test/**`
7. `scripts/examples/check-examples-runtime.js`
8. `scripts/ci/stage9-blackbox-ga-lib.js`
9. `test/e2e/blackbox-governance-flow.e2e.test.ts`

## 2. Findings

本轮未发现需要继续修复的问题。GitHub Copilot 真实 `probe/invoke` 路径、`copilot` 直连优先与 `gh copilot --` 回退、capability truthfulness 和 gate 稳定性注入面已经形成一致闭环。

## 3. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts apps/cli/test/runtime/github-copilot-exec-fixture-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/examples/check-examples-runtime.js`
4. `pnpm -s vitest run test/e2e/blackbox-governance-flow.e2e.test.ts --config vitest.e2e.config.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 4. Resolution

1. GitHub Copilot adapter 已具备真实 CLI 驱动的 `probe/invoke` 路径，不再只返回 baseline `echoedInput`。
2. CLI runtime、local probe 和 route runner 已统一到“`copilot` 直连优先、`gh copilot --` 兼容回退”的入口语义。
3. `CLI_EXEC` 的 capability、confirmation 与 cancellation 声明已经与真实行为对齐，不再夸大 provider 能力。
4. repo 级 examples/runtime smoke、blackbox e2e 和 `dist/bin` gate 路径都已通过内部 fixture 注入面去除对真实 GitHub Copilot 登录态的偶然依赖。
