# TK-1064 refresh self-host docs truth and finalize rollout closeout

- Status: active
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-004-clean-room-evidence-and-docs-truthfulness`

## 1. 任务目标

同步 README、local-adoption playbook、support matrix 与 real self-host operator path，完成 delivery evidence、completion audit 与 project closeout

## 2. Depends On

1. run empty-repo self-host clean-room rehearsal and capture rollout evidence

## 3. 预期产物

1. docs/closeout artifact for TK-1064
2. task card update for TK-1064
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-122-empty-repo-self-host-adoption-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-1052-empty-repo-self-host-adoption-promotion-and-rollout-decomposition-handoff.md`
2. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/empty-repo-self-host-adoption-follow-up.md`
4. `.repo-ai-governor/draft/approved_solution_review_empty-repo-self-host-adoption-follow-up.md`

## 5. Traceback References

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adoption-pack-installer-and-self-host-template-bootstrap.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/built-in-adoption-pack-parity-and-self-host-readiness-sync.md`
4. `.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`

## 6. 实施计划

1. 基于 clean-room evidence 校准 README、local-adoption playbook 与 support matrix 的 public truth，避免继续保留与真实 operator path 不一致的引导。
2. 先产出 sprint-004 exit acceptance 与 project-final review handoff，确保 sprint boundary 在 fresh reviewer loop 前形成可回放的 closeout packet。
3. 在 project-final clean round 后，完成 completion audit、delivery registry completed write-back、current-context idle 恢复与 final closeout artifact。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1064

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1064
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1064
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-14：任务启动，开始基于 `DA-1063` clean-room evidence 对齐 README、playbook 与 support matrix 中的 self-host operator path truth。
3. 2026-05-14：已完成第一轮 public docs truth sync，当前文档已明确要求 `connect apply --latest` 与 connect 后续 `adopt verify`，并把 `run --dry-run --trace` 的 `lockfile_delta` / `POLICY_GATE_HITL_FEEDBACK_INVALID` 定位为 execution-policy checkpoint，而非 bootstrap failure。
4. 2026-05-14：下一步将先写入 sprint-004 exit acceptance packet、串行 canonical ledger sync 与 boundary gate，再进入 sprint-004 fresh reviewer loop。
5. 2026-05-14：project-final fresh reviewer clean 后，本任务将负责 completion audit summary、`DA-1065` final closeout artifact、delivery registry completed truth 与 `current-context` idle 恢复，并最终切换为 `completed`。
6. 2026-05-14：`DA-1064` 已固定 sprint-004 exit acceptance 与 project-final review handoff，latest fresh reviewer clean `CR-002` 也已确认当前 boundary 无新增 actionable finding；同窗口 `pnpm run build`、`pnpm run check` 与 ledger/status gates 已通过，当前仅保留 project-final delegated CR loop 与 final closeout write-back。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/README.md`
2. `/Users/jimmydaddy/study/ai-governor/README.zh-CN.md`
3. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.md`
4. `/Users/jimmydaddy/study/ai-governor/docs/local-adoption-playbook.zh-CN.md`
5. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.md`
6. `/Users/jimmydaddy/study/ai-governor/docs/support-matrix.zh-CN.md`
7. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/DA-1064-sprint-004-exit-acceptance-and-project-final-review-handoff.md`
8. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/project-123-empty-repo-self-host-adoption-rollout-completion-audit-summary.md`
9. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/DA-1065-project-123-final-closeout-and-idle-primary-stream-handoff.md`
