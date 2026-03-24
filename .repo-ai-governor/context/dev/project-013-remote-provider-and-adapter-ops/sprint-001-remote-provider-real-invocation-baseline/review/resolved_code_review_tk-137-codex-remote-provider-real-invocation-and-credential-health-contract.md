# Code Review: TK-137 Codex 远端 provider 真实调用与凭据/health 契约

- Status: resolved
- Date: 2026-03-25
- Reviewer: AI-Agent
- Task: `TK-137`
- Review Type: implementation and gate-stability review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/context/dev/project-013-remote-provider-and-adapter-ops/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. Review Scope

1. `packages/adapters/codex/src/`
2. `apps/cli/src/main.ts`
3. `apps/cli/src/runtime/adapter-routing-runtime.ts`
4. `apps/cli/src/runtime/adapter-verification-runtime.ts`
5. `apps/cli/src/runtime/adapter-diagnostics-runtime.ts`
6. `apps/cli/src/runtime/codex-exec-fixture-runtime.ts`
7. `apps/cli/test/**`
8. `scripts/examples/check-examples-runtime.js`
9. `scripts/ci/stage9-blackbox-ga-lib.js`
10. `test/e2e/blackbox-governance-flow.e2e.test.ts`

## 2. Findings

本轮未发现需要继续修复的问题。Codex 真实 `probe/invoke` 路径、诊断映射和 gate 稳定性注入面已经形成一致闭环。

## 3. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm -s vitest run apps/cli/test/runtime/codex-exec-fixture-runtime.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts packages/adapters/codex/test/codex-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/examples/check-examples-runtime.js`
4. `pnpm -s vitest run test/e2e/blackbox-governance-flow.e2e.test.ts --config vitest.e2e.config.ts --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 4. Resolution

1. Codex adapter 已具备真实 `codex exec --json` 驱动的 `probe/invoke` 路径，不再只返回 baseline `echoedInput`。
2. credential / health failure 已转换成稳定 unavailable reasons，并贯通到 CLI diagnostics 与 next actions。
3. repo 级 examples/runtime smoke、blackbox e2e 和 `dist/bin` gate 路径都已通过内部 fixture 注入面去除对真实 Codex 登录态的偶然依赖。
