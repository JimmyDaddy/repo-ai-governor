# Code Review: TK-116 working tree follow-up

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-116`
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
2. `apps/cli/src/runtime/local-model-probe-runtime.ts`
3. `apps/cli/src/runtime/adapter-verification-runtime.ts`
4. `apps/cli/src/types/interfaces/cli-adapter-verification.interface.ts`
5. `apps/cli/src/types/interfaces/index.ts`
6. `apps/cli/src/types/index.ts`
7. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
8. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/plan.md`
9. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/TK-116-adapter-verification-and-local-probe-extraction.md`
10. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/checklist.md`
11. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/tasks.csv`
12. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

未发现需要修复的点。`adapter verification` / `local probe` 的 package-local runtime 抽离保持了既有 CLI 行为，类型导出、task/plan/registry 同步和新单测接线也都一致。

## 3. Notes

1. `DA-114` 对边界的描述与当前代码一致：`CliGovernanceRuntime` 只保留接线与 presentation helper，`route/fallback/diagnostics` 的进一步拆分留给 `TK-117`。
2. 这轮没有发现新的 contract drift，也没有看到 `project-011` 当前 working tree 与 `project-010` 既有 restricted-network / adapter diagnostics 语义发生偏移。

## 4. Verification

1. `git status --short`（通过）
2. `git diff --name-only --diff-filter=ACMR`（通过）
3. `git diff --stat`（通过）
4. `git diff -- apps/cli/src/cli-governance-runtime.ts apps/cli/src/runtime apps/cli/src/types/index.ts apps/cli/src/types/interfaces/index.ts apps/cli/src/types/interfaces/cli-adapter-verification.interface.ts`（通过）
5. `git diff -- .repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/plan.md .repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/TK-116-adapter-verification-and-local-probe-extraction.md .repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/checklist.md .repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/tasks.csv .repo-ai-governor/context/artifact-registry/artifacts.csv`（通过）
6. `pnpm -s vitest run apps/cli/test/runtime/adapter-verification-runtime.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
7. `pnpm -s vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
