# TK-1061 align doctor and check additive readiness diagnostics and next actions

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-003-activation-and-readiness-ux`

## 1. 任务目标

让 doctor 与 check 消费 canonical phase truth，并补齐 actionable next-actions、blocked signal owner split 与 clearer diagnostics wording

## 2. Depends On

1. implement canonical self-host activation phase and verification summary

## 3. 预期产物

1. doctor/check-diagnostics artifact for TK-1061
2. task card update for TK-1061
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 6. 实施计划

1. 让 doctor 与 check 只消费 canonical verify phase truth，而不再各自产出 competing readiness verdict。
2. 收口 additive diagnostics、operator next-actions 与 blocked signal owner split，提升 self-host first-run path 的 explainability。
3. 完成验证、ledger sync 与 sprint-003 closeout 输入整理。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run build`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/tasks" --task-id TK-1061

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/tasks" --task-id TK-1061
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/tasks" --task-id TK-1061
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-14：完成 `doctor` / `check` 对 canonical verify phase truth 的 additive reflection，补齐 `reflected_from=adopt_verify`、`consumed_from=adopt_verify` 与 operator next-actions 覆盖，避免 competing readiness verdict。

## 10. 产出

1. `apps/cli/src/commands/check-command.ts`
2. `apps/cli/test/adopt-command.integration.test.ts`
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`
