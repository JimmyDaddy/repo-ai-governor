# TK-1054 fix empty-repo self-host bootstrap transaction and managed apply boundary

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-001-bootstrap-transaction-and-self-host-baseline`

## 1. 任务目标

修复 bootstrap/apply 事务冲突，确保 empty repo self-host path 不再因 repo_local governor.yaml seed 与 managed apply 互相打架而失败

## 2. Depends On

1. approved solution review

## 3. 预期产物

1. runtime/bootstrap artifact for TK-1054
2. task card update for TK-1054
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
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 6. 实施计划

1. 复核 empty-repo self-host bootstrap 失败链路，明确 `init` 写出的 repo_local `governor.yaml` 与后续 managed apply 冲突的事务边界。
2. 在 adoption bootstrap/apply runtime 中固定 self-host-complete + repo_local 的 config seed/apply 一致性，不再要求 operator 通过未声明的覆盖路径绕过冲突。
3. 用空仓库 first-run 演练与定向验证确认该修复不会破坏现有 adoption-pack install boundary，再回写 ledger 与产出。

## 7. Development Verification

1. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts -t "bootstraps the explicit self-host profile with a transaction-consistent governor baseline"`
2. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts -t "bootstraps self-host repo-local surfaces and sqlite registries"`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/tasks" --task-id TK-1054

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/tasks" --task-id TK-1054
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/tasks" --task-id TK-1054
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`
6. `pnpm run build`

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-14：定位 `adopt bootstrap --adoption-profile self-host-complete --workspace-mode repo_local` 的 first-run 事务边界，把 bootstrap init 与 self-host managed apply 的 `.repo-ai-governor/governor.yaml` seed 收敛到同一份 canonical config builder。
3. 2026-05-14：新增 explicit self-host bootstrap 回归测试，确认 receipt 记录的 `governor.yaml` checksum 与磁盘实写内容一致，不再出现同事务 seed/apply truth 分叉。

## 10. 产出

1. `packages/standards/src/self-host-governor-config.ts`
2. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
3. `packages/standards/src/built-in-adoption-pack-catalog.ts`
4. `apps/cli/test/adopt-command.integration.test.ts`
