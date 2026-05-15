# TK-1060 implement canonical self-host activation phase and verification summary

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-003-activation-and-readiness-ux`

## 1. 任务目标

将 template_seeded、authoring_started、adapter_connected、execution_ready phase 接入 adopt verify 的 canonical verdict 与 verification summary

## 2. Depends On

1. close sprint-002 and hand off activation readiness work

## 3. 预期产物

1. verify/readiness artifact for TK-1060
2. task card update for TK-1060
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

1. 为 self-host path 固定 template_seeded/authoring_started/adapter_connected/execution_ready 的 canonical phase model。
2. 将 phase truth 接入 adopt verify 的 verification summary 与 blocked signal 语义，确保 install/self-host activation verdict 只由单一 canonical producer 输出。
3. 完成验证、ledger sync 与 sprint-003 后续任务输入回链。

## 7. Development Verification

1. `pnpm exec vitest run packages/standards/test/adoption-pack-registry.unit.test.ts apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts -t "dispatches extracted init/check/plan/upgrade/workspace/run commands through the facade registry" --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run build`
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/tasks" --task-id TK-1060

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/tasks" --task-id TK-1060
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/tasks" --task-id TK-1060
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-14：任务启动，状态切换为 `active`，开始收敛 self-host activation phase、verification summary 与 canonical readiness truth path。
3. 2026-05-14：完成 canonical self-host activation phase model，`adopt verify` 开始产出 `template_seeded / authoring_started / adapter_connected / execution_ready` phase truth、operator next-actions，并把最新 verification summary 回写到 receipt canonical state。

## 10. 产出

1. `packages/standards/src/constants/adoption-pack.constant.ts`
2. `packages/standards/src/types/interfaces/adoption-pack.interface.ts`
3. `packages/standards/src/built-in-adoption-pack-catalog.ts`
4. `apps/cli/src/runtime/adoption-pack-runtime.ts`
