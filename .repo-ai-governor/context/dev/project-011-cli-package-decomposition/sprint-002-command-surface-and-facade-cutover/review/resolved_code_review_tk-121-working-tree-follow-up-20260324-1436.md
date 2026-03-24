# Code Review: TK-121 working tree follow-up

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `TK-121`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
  - `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-116-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
  - `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/DA-118-command-executor-extraction-and-entry-registry-baseline.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope

1. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/plan.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-121-run-review-command-executor-extraction-and-thin-facade-cutover.md`
4. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/checklist.md`
5. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/tasks.csv`
6. `apps/cli/src/cli-governance-runtime.ts`
7. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
8. `apps/cli/src/commands/review-command.ts`
9. `apps/cli/src/commands/review-verify-command.ts`
10. `apps/cli/test/commands/cli-command-registry.test.ts`

## 2. Findings

未发现需要修复的点。当前增量把 `review/review-verify` 命令链迁入 `commands/*`，同时通过 `CliCommandRegistry` 和共享 command context 接回 facade；现有 `review` 链路语义、registry 注册契约和台账状态没有出现新的回归。

## 3. Notes

1. `TK-121` 目前仍是 `in_progress`，而这次 working tree 也只覆盖了 `review/review-verify` 抽离，没有宣称 `run/replay` 或 `DA-119` 已完成；按当前增量来评审，这个状态与代码一致。
2. 现有 `review/review-verify` integration tests 已经通过 `runtime.execute()` 走到了新的 registry 分发路径，因此这轮不仅是静态搬移，也具备 facade 级回归覆盖。

## 4. Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
