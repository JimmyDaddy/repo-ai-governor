# Code Review: TK-1066 clean recheck

- Status: resolved
- Date: 2026-05-14
- Reviewer: AI-Agent
- Task: `CR-005`
- Review Type: delegated fresh reviewer round
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`

## 1. Review Scope
1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `apps/cli/test/adopt-command.integration.test.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
6. `docs/support-matrix.md`
7. `docs/support-matrix.zh-CN.md`

## 2. Findings
1. 未发现需要修复的点。

## 3. Notes
1. 当前 self-host operator guidance、canonical preflight replay 与 docs truth 已收口一致；legacy summary fallback 仍保留覆盖。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run build`（通过）
4. `node /Users/jimmydaddy/study/ai-governor/dist/bin/repo-ai-governor.js doctor --adapters --output json`（在 `/Users/jimmydaddy/study/deepseekian` 下通过）
