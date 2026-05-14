# TK-1063 run empty-repo self-host clean-room rehearsal and capture rollout evidence

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-004-clean-room-evidence-and-docs-truthfulness`

## 1. 任务目标

针对 fresh empty repo 重复演练 self-host-complete + repo_local path，固化从 install 到 first dry-run 的 evidence packet

## 2. Depends On

1. close sprint-003 and hand off clean-room truthfulness follow-through

## 3. 预期产物

1. clean-room/evidence artifact for TK-1063
2. task card update for TK-1063
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

1. 在 fresh empty repo 上重新演练 self-host-complete + repo_local path，覆盖 install、bootstrap、connect、connect apply、verify、doctor 与 first dry-run 的真实 operator path。
2. 固化 diagnostics、verification summary、reports 与 supporting evidence packet，作为 docs truthfulness 与 closeout 的直接输入。
3. 完成验证、ledger sync 与 sprint-004 最终任务回链。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1063

## 8. Delivery Verification

1. `pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1063
4. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks" --task-id TK-1063
5. node ./scripts/governance/check-task-ledger-sync.js
6. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-13：任务创建，状态初始化为 `planned`。
2. 2026-05-14：任务启动，状态切换为 `active`；由 `DA-1062` 激活为 sprint-004 primary execution task，开始准备 `/Users/jimmydaddy/study/deepseekian` clean-room reset、bootstrap/apply/verify/doctor/connect/first dry-run rehearsal 与 evidence packet capture。
3. 2026-05-14：在 `/Users/jimmydaddy/study/deepseekian` 上完成 fresh clean-room rehearsal，并复现出 self-host starter `tasks.csv` 已播种但 canonical `task-ledger.sqlite` 为空的回归。
4. 2026-05-14：已在 `apps/cli/src/runtime/adoption-pack-runtime.ts` 中修复 task-ledger canonical seed 缺口，并在 `apps/cli/test/adopt-command.integration.test.ts` 中补齐 regression assertion；重演后 `doctor --adapters` 已恢复 `task_ledger_canonical_truth=pass`，`run --dry-run --trace` 也已能够推进到 policy gate。
5. 2026-05-14：已写入 `DA-1063` clean-room evidence artifact，并将真实 self-host operator path 固定为 `adopt bootstrap -> connect -> connect apply --latest -> adopt verify -> doctor --adapters -> run --dry-run --trace`。

## 10. 产出

1. `DA-1063-empty-repo-self-host-clean-room-evidence-and-operator-path-truth.md`
2. `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/adoption/installations/repo-ai-governor-adoption-pack/adoption-verification.summary.json`
3. `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/doctor/doctor-1778718331816.json`
4. `/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/reports/cli-run-1778718331876.report.json`
