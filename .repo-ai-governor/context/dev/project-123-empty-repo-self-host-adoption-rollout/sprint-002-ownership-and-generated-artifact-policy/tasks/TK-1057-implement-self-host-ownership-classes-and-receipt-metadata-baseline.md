# TK-1057 implement self-host ownership classes and receipt metadata baseline

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-002-ownership-and-generated-artifact-policy`

## 1. 任务目标

将 managed_locked、starter_editable、canonical_runtime_writable、generated_ephemeral ownership taxonomy 落入 receipt schema 与 provenance metadata

## 2. Depends On

1. close sprint-001 and hand off ownership policy implementation

## 3. 预期产物

1. receipt/ownership artifact for TK-1057
2. task card update for TK-1057
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 6. 实施计划

1. 将 four-class ownership taxonomy 映射到 receipt schema、seed provenance 与 self-host writable surface lifecycle。
2. 固定 starter_editable 与 canonical_runtime_writable 的非 destructive 演进语义，避免后续正常 authoring/runtime writes 再次被误判成 install drift。
3. 完成 targeted verification、ledger sync 与 sprint-002 后续任务的输入回链。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/tasks" --task-id TK-1057

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/tasks" --task-id TK-1057
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/tasks" --task-id TK-1057
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-14：将 ownership/drift/git taxonomy 正式落入 adoption-pack constants、source catalog 与 install receipt schema，新增 `managed_locked / starter_editable / canonical_runtime_writable / generated_ephemeral` 以及对应 drift/git policy。
3. 2026-05-14：为 self-host receipt 增加兼容 backfill 逻辑，使历史仅有 `managed=true` 的记录在读取时可回填为新的 ownership taxonomy，而不会继续沿用错误 drift 行为。

## 10. 产出

1. `packages/standards/src/constants/adoption-pack.constant.ts`
2. `packages/standards/src/types/interfaces/adoption-pack.interface.ts`
3. `packages/standards/src/built-in-adoption-pack-catalog.ts`
4. `packages/standards/src/adoption-pack-registry.ts`
5. `apps/cli/src/runtime/adoption-pack-runtime.ts`
