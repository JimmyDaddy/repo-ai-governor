# TK-1055 seed minimal self-host adapters and storage baseline

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-001-bootstrap-transaction-and-self-host-baseline`

## 1. 任务目标

为 self-host template 补齐最小 adapters baseline 与对齐后的 storage 默认，避免 connect 和 doctor 在 first-run path 上继续 fail-closed 或产生误导诊断

## 2. Depends On

1. fix empty-repo self-host bootstrap transaction and managed apply boundary

## 3. 预期产物

1. runtime/template-baseline artifact for TK-1055
2. task card update for TK-1055
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 6. 实施计划

1. 确认 self-host template 当前缺失的最小 `adapters` scaffold 与 storage default 漂移点。
2. 在 template/bootstrap 路径中补齐 minimum baseline，并确保 `connect`、`doctor` 与 `run --dry-run --trace` 对 fresh self-host path 的默认体验不再 fail-closed 或误报 legacy noise。
3. 用 targeted verification 与 empty-repo first-run evidence 确认 baseline 生效，再回写 ledger 与产出。

## 7. Development Verification

1. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts -t "lets explicit self-host bootstrap flow directly into first-run connect onboarding"`
2. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts -t "bootstraps the explicit self-host profile with a transaction-consistent governor baseline"`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/tasks" --task-id TK-1055

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/tasks" --task-id TK-1055
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/tasks" --task-id TK-1055
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`
6. `pnpm run build`

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-14：将 self-host repo-local `governor.yaml` baseline 扩展为完整 adapters/routing/tools seed，并与当前 runtime 默认 memory config 对齐到 `sqlite_fs + context/memory`。
3. 2026-05-14：新增 bootstrap 后直连 `connect --preset multi-tool-default` 的 first-run 回归测试，确认最小 adapters baseline 已足以支持 onboarding candidate path，不再因 baseline 缺失 fail-closed。

## 10. 产出

1. `packages/standards/src/self-host-governor-config.ts`
2. `packages/standards/src/built-in-adoption-pack-catalog.ts`
3. `apps/cli/test/adopt-command.integration.test.ts`
