# TK-1058 align drift upgrade remove and gitignore recommendation semantics

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-002-ownership-and-generated-artifact-policy`

## 1. 任务目标

重构 self-host drift/upgrade/remove 语义，并生成 generated artifacts 的最小 gitignore recommendation 且保持 opt-in append boundary

## 2. Depends On

1. implement self-host ownership classes and receipt metadata baseline

## 3. 预期产物

1. drift/git-policy artifact for TK-1058
2. task card update for TK-1058
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 6. 实施计划

1. 把 drift/upgrade/remove 语义与 ownership class 一起收口，明确哪些 path 仍归 installer lifecycle，哪些 path 只保留 provenance 与 migration ability。
2. 生成 generated diagnostics/reports/replay/sqlite sidecar 的 `.gitignore` opt-in recommendation，并保持不静默改写 adopter 仓库根配置的边界。
3. 完成验证、ledger sync 与 sprint-002 handoff 所需的输入整理。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/tasks" --task-id TK-1058

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/tasks" --task-id TK-1058
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/tasks" --task-id TK-1058
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-14：将 `adopt diff` 限定为仅对 `managed_locked + enforce_checksum` surface 产生 install drift fail signal，`starter_editable` 与 `canonical_runtime_writable` 改动不再被误报为 managed drift。
3. 2026-05-14：重构 `adopt upgrade/remove` 语义：strict managed drift 继续 fail-closed，starter-editable 仅在 untouched seed 时可 auto-remove，canonical runtime truth 则显式阻止 remove。
4. 2026-05-14：为 self-host installation 写出 opt-in `.gitignore` recommendation artifact，并新增集成测试覆盖 ownership metadata、editable/canonical non-drift 与 canonical remove block。

## 10. 产出

1. `apps/cli/src/runtime/adoption-pack-runtime.ts`
2. `apps/cli/test/adopt-command.integration.test.ts`
