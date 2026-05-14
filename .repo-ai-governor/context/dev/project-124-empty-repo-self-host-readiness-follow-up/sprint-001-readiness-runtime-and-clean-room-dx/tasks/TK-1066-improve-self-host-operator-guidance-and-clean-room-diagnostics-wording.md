# TK-1066 improve self-host operator guidance and clean-room diagnostics wording

- Status: completed
- Date: 2026-05-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-124-empty-repo-self-host-readiness-follow-up`
- Sprint: `sprint-001-readiness-runtime-and-clean-room-dx`

## 1. 任务目标

补齐 connect/apply/verify/run next-actions、baseline warning explainability 与 clean-room guidance truth

## 2. Depends On

1. fix self-host readiness preflight and run gating contract

## 3. 预期产物

1. cli/docs artifact for TK-1066
2. task card update for TK-1066
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/sprint-001-readiness-runtime-and-clean-room-dx/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 收紧 self-host `operatorNextActions` 的输出层次，保留 canonical placeholder inventory，同时把 operator-facing next actions 改成短 happy path。
2. 补齐 runtime / integration coverage，确保 canonical verify summary 回放与真实 `adopt verify` 输出都遵循新的 guidance 形态。
3. 同步中英文 adopter-facing docs truth，明确 self-host canonical path、blocked semantics 与 clean-room reset/preserve/ignore guidance。

## 7. Development Verification

1. pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1
2. pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1
3. pnpm run build
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/sprint-001-readiness-runtime-and-clean-room-dx/tasks" --task-id TK-1066

## 8. Delivery Verification

1. pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1
2. pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1
3. pnpm run build
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/sprint-001-readiness-runtime-and-clean-room-dx/tasks" --task-id TK-1066
5. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/sprint-001-readiness-runtime-and-clean-room-dx/tasks" --task-id TK-1066
6. node ./scripts/governance/check-task-ledger-sync.js
7. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-14：任务创建，状态初始化为 `planned`。
2. 2026-05-14：状态切换为 `in_progress`，开始收口 self-host connect/apply/verify/run next-actions、baseline warning explainability 与 clean-room operator guidance truth。
3. 2026-05-14：已把 self-host runtime guidance 改成“短版 `operatorNextActions` + 完整 `activationPhaseRecords[].placeholderPaths`”的分层输出，避免把全部 placeholder path 平铺进同一条 operator next action。
4. 2026-05-14：已同步 `adopt verify` / canonical summary fallback 测试，并刷新中英文 playbook/support truth，补充 self-host happy path、blocked semantics 与 clean-room reset/preserve/ignore guidance。
5. 2026-05-14：已在 `/Users/jimmydaddy/study/deepseekian` 上重跑真实 self-host `adopt verify` 与 `doctor --adapters`，确认当前 summary 只保留 3 条短版 next actions，完整 placeholder inventory 回落到 phase records。
6. 2026-05-14：已修复 `doctor --adapters` canonical self-host preflight 回放仍退化为旧式 blocked 摘要的问题，并完成第 5 轮 fresh reviewer clean recheck；`TK-1066` 当前边界进入 `completed`。

## 10. 产出

1. `apps/cli/src/runtime/adoption-pack-runtime.ts`：self-host operator guidance 改为“短 happy path + anchor files + canonical placeholder inventory 回链”的分层输出，并明确 `doctor --adapters` / `run --dry-run --trace` 的 blocked-phase 角色边界。
2. `apps/cli/test/adopt-command.integration.test.ts`、`apps/cli/test/cli-governance-runtime.integration.test.ts`：补齐真实 verify 输出与 canonical summary fallback 的 guidance regression coverage。
3. `docs/local-adoption-playbook*.md`：新增 self-host 短职责表、warn 读取顺序，以及 clean-room reset/preserve/ignore guidance。
4. `docs/support-matrix*.md`：补充 self-host operator-facing next-action layering truth。
5. `apps/cli/src/runtime/adoption-pack-runtime.ts`：`doctor --adapters` 现在优先回放 canonical `executionPreflightBlockedGroups / executionPreflightPlaceholderPaths`，不再退化成仅 `currentPhase` 的旧式 self-host preflight 摘要。
6. 验证证据：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`、`/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/adoption/installations/repo-ai-governor-adoption-pack/adoption-verification.summary.json`、`/Users/jimmydaddy/study/deepseekian/.repo-ai-governor/context/diagnostics/doctor/doctor-1778747842097.json`
