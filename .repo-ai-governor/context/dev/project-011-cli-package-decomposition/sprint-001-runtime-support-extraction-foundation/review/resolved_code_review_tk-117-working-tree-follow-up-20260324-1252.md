# Code Review: TK-117 working tree follow-up

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-117`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `apps/cli/src/cli-governance-runtime.ts`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `apps/cli/src/runtime/adapter-verification-runtime.ts`
4. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
5. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/plan.md`
6. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/TK-117-route-fallback-and-diagnostics-artifact-builder-extraction.md`
7. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/checklist.md`
8. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/tasks.csv`

## 2. Findings

未发现需要修复的点。`route selection / restricted fallback` 已按 package-local runtime 边界抽离到 `CliAdapterRoutingRuntime`，并保留了 restricted-network 本地 fallback 的 probe/capability gate；`CliGovernanceRuntime` 当前只保留接线职责，没有看到新的行为漂移。

## 3. Notes

1. 这轮变更仍处于 `TK-117 in_progress` 阶段，当前 working tree 主要覆盖 route/fallback 侧抽离；`diagnostics artifact builder` 的进一步拆分仍可在后续提交继续推进。
2. runtime unit 与 CLI integration 都通过，说明抽离后至少在现有覆盖面内保持了对外行为一致。

## 4. Verification

1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --stat`（通过）
4. `git diff -- apps/cli/src/cli-governance-runtime.ts apps/cli/src/runtime/adapter-verification-runtime.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts`（通过）
5. `nl -ba apps/cli/src/runtime/adapter-routing-runtime.ts`（通过）
6. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
7. `pnpm -s vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
8. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
