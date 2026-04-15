# TK-903 implement adopt bootstrap orchestrator and default built-in resolution

- Status: planned
- Date: 2026-04-15
- Owner: AI-Agent
- Priority: P1
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough`

## 1. 任务目标

在 `apps/cli` 落 `adopt bootstrap` orchestrator、default built-in selector behavior 与 fail-closed resolver baseline。

## 2. Depends On

1. `TK-901`
2. `TK-902`

## 3. 预期产物

1. bootstrap orchestrator runtime
2. default built-in selector behavior
3. fail-closed ambiguous resolution baseline

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/tasks/DA-900-adopter-quickstart-bootstrap-promotion-and-rollout-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
4. `apps/cli/src/commands/adopt-command.ts`
5. `apps/cli/src/runtime/adoption-pack-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/plan.md`
2. `.repo-ai-governor/draft/adopter-quickstart-bootstrap-command-technical-solution.md`
3. `.repo-ai-governor/draft/approved_solution_review_adopter-quickstart-bootstrap-command.md`

## 6. 实施计划

1. 实现 convenience runtime orchestration seam。
2. 对齐 omitted selector 与 explicit selector 的 resolver behavior。
3. 将 ambiguity、drift 与 mismatch 继续保持为 fail-closed redirect path。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-15：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：bootstrap orchestrator runtime
2. 待执行：default built-in selector behavior
3. 待执行：fail-closed ambiguous resolution baseline
