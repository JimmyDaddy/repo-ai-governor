# Code Review: TK-076 local debug trace replay and diagnostics baseline

- Status: resolved
- Date: 2026-03-22
- Reviewer: AI-Agent
- Task: `TK-076`
- Review Type: targeted implementation review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `apps/cli/src/main.ts`
2. `apps/cli/src/cli-governance-runtime.ts`
3. `apps/cli/src/constants/cli-governance-runtime.constant.ts`
4. `apps/cli/src/constants/cli-output.constant.ts`
5. `apps/cli/src/types/interfaces/cli-runtime-debug.interface.ts`
6. `apps/cli/src/types/interfaces/index.ts`
7. `apps/cli/src/types/index.ts`
8. `apps/cli/test/cli-governance-runtime.integration.test.ts`
9. `apps/cli/README.md`
10. `packages/shared/src/i18n/locales/en-us.ts`
11. `packages/shared/src/i18n/locales/zh-cn.ts`
12. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-076-local-debug-trace-replay-and-diagnostics-baseline.md`
13. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/DA-088-local-debug-trace-replay-and-diagnostics-baseline.md`
14. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
15. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
16. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
17. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
18. `.repo-ai-governor/context/artifact-registry/artifacts.csv`

## 2. Findings

1. 未发现阻断交付的剩余问题。

## 3. Notes

1. `run` 新增 `--dry-run/--trace/--replay <path>`，并将 replay 模式映射为独立 operation：`governance_run_replay`。
2. 诊断 trace 产物新增分层字段（summary/keyEvents/stageTimings/policyDecision/adapterInvocationSummary/errorContext/nextActions）。
3. `review -> review-verify -> ledger-backfill` 增加 `correlationId` 与链路归因字段，`review-verify` 输出新增 `review_ledger_backfill` artifact。

## 4. Verification

1. `pnpm vitest run --config vitest.packages.config.ts apps/cli/test --maxWorkers=1 --maxConcurrency=1`（通过）
2. `pnpm run typecheck`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `pnpm run check`（通过）
