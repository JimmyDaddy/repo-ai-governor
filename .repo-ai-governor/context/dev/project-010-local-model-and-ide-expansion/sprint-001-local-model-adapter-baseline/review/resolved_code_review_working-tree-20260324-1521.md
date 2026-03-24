# Code Review: Working Tree Follow-Up (Run Command Extraction And Project-011 Handoff)

- Status: resolved
- Date: 2026-03-24
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-099-task-driven-dag-and-run-mainchain-assembly.md`
5. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/project-011-cli-package-decomposition-completion-audit-summary.md`
6. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/DA-119-run-review-command-executor-extraction-and-thin-facade-cutover.md`
7. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-121-shared-and-package-local-boundary-hardening-and-exports-cleanup.md`
8. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-122-cli-package-regression-smoke-and-test-topology-hardening.md`
9. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-123-project-011-exit-acceptance-and-project-010-rollout-input-constraints.md`
10. `apps/cli/src/cli-governance-runtime.ts`
11. `apps/cli/src/commands/run-command.ts`
12. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
13. `apps/cli/test/cli-governance-runtime.integration.test.ts`
14. `apps/cli/test/commands/cli-command-registry.test.ts`

## 2. Findings

未发现需要修复的点。

## 3. Notes
1. `CliRunCommand` 本轮只负责把 `RUN` 纳入 registry dispatch，`run` 编排仍保留在 runtime；代码路径、`DA-119` 与 project-011 completion audit summary 的描述彼此一致。
2. `DA-121`~`DA-123` 文档头部和 artifact registry 继续使用 `active` 生命周期状态，属于当前仓库 artifact governance 约定；`check-artifact-registry-lifecycle` 通过，未见本轮新增漂移。
3. `project-010` primary stream 仍指向 sprint-001，与 `TK-098` 仍未收尾的现状一致；本轮没有发现错误提前切换到 sprint-002 的上下文问题。

## 4. Verification
1. `pnpm -s tsc -p tsconfig.json --noEmit`（通过）
2. `pnpm -s vitest run apps/cli/test/commands/cli-command-registry.test.ts apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
6. `pnpm run check`（未执行）
