# Code Review: tk-252 tk-254 promotion reporting rollout and project closeout

- Status: resolved
- Date: 2026-03-27
- Reviewer: AI-Agent
- Task: `TK-252/TK-253/TK-254`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `packages/reporting/src/types/interfaces/reporting.interface.ts`
2. `packages/reporting/src/report-builder.ts`
3. `packages/reporting/test/report-builder.unit.test.ts`
4. `apps/cli/src/cli-governance-runtime.ts`
5. `apps/cli/test/cli-governance-runtime.integration.test.ts`
6. `.repo-ai-governor/context/dev/project-021-memory-semantics-runtime-implementation/**`
7. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
8. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
9. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 2. Findings

未发现需要修复的点。

## 3. Notes
1. `execution_report` 现在通过 `memorySemantics` 消费 promotion output / session-summary projection，未回退到底层 `layeredSnapshot`。
2. `project-021` 的 sprint/task/artifact/delivery/master-plan truth 在本轮范围内保持同步。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm exec vitest run packages/reporting/test/report-builder.unit.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
4. `pnpm run check`（通过）
