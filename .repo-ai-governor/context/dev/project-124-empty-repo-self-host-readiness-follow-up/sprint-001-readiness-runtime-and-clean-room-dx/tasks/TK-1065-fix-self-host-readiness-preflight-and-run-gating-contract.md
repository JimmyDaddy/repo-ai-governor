# TK-1065 fix self-host readiness preflight and run gating contract

- Status: completed
- Date: 2026-05-14
- Owner: AI-Agent
- Priority: P0
- Project: `project-124-empty-repo-self-host-readiness-follow-up`
- Sprint: `sprint-001-readiness-runtime-and-clean-room-dx`

## 1. 任务目标

让 self-host verify blocked truth、run preflight behavior 与 execution-policy semantics 收口一致

## 2. Depends On

1. project-123 follow-up

## 3. 预期产物

1. runtime/gating artifact for TK-1065
2. task card update for TK-1065
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/sprint-001-readiness-runtime-and-clean-room-dx/plan.md
3. .repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/project-123-empty-repo-self-host-adoption-rollout-field-retrospective.md
4. .repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/tasks/DA-1063-empty-repo-self-host-clean-room-evidence-and-operator-path-truth.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md
3. docs/local-adoption-playbook.md
4. docs/support-matrix.md

## 6. 实施计划

1. 定位 self-host `adopt verify` canonical blocked truth 与 `run` baseline assembly 之间未衔接的代码路径。
2. 在不误伤非 self-host adopter path 的前提下，让 run preflight 正确消费 canonical verify summary，并对 blocked self-host execution fail-closed 或显式降级到一致语义。
3. 补齐 targeted runtime/integration coverage，覆盖 `verify blocked -> run blocked` 与允许路径的对照场景。

## 7. Development Verification

1. pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1
2. pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1
2. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/sprint-001-readiness-runtime-and-clean-room-dx/tasks" --task-id TK-1065

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/sprint-001-readiness-runtime-and-clean-room-dx/tasks" --task-id TK-1065
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-124-empty-repo-self-host-readiness-follow-up/sprint-001-readiness-runtime-and-clean-room-dx/tasks" --task-id TK-1065
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-05-14：任务创建，状态初始化为 `planned`。
2. 2026-05-14：状态切换为 `in_progress`，开始修复 self-host `execution_preflight_signal=blocked` 与 `run --dry-run --trace` baseline allow 的运行时冲突。
3. 2026-05-14：已将 `run` 接入 canonical self-host `adopt verify` summary，新增显式 self-host run preflight gate；当前 contract 为“task-driven / 非 diagnostic dry-run fail-closed，baseline `run --dry-run --trace` 保留为 exploratory diagnostics exception”。
4. 2026-05-14：已补充 targeted integration coverage，验证 canonical self-host preflight blocked 时的 `baseline dry-run warn+allow` 与 `task-driven fail-closed` 对照行为，并为 self-host preflight blocked 新增专用 structured error guidance。
5. 2026-05-14：已补充 legacy self-host verify summary fallback path 的兼容回归覆盖，并完成第 3 轮 fresh reviewer clean recheck；`TK-1065` 当前边界进入 `completed`。

## 10. 产出

1. `apps/cli/src/runtime/adoption-pack-runtime.ts`：新增 canonical self-host execution-preflight resolver，并把 blocked groups / placeholder paths / signal 写回 verification summary。
2. `apps/cli/src/cli-governance-runtime.ts`：`run` 正式消费 canonical self-host verify summary，区分 `diagnostic_dry_run` 与 `fail_closed` gate；`main.ts`、interactive shell 与 i18n next-action 文案同步接入 self-host readiness guidance。
3. `apps/cli/test/cli-governance-runtime.integration.test.ts`：新增 self-host blocked preflight 下 baseline dry-run 与 task-driven run 的 contract coverage。
4. 验证证据：`pnpm exec vitest run apps/cli/test/adopt-command.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm exec vitest run apps/cli/test/cli-governance-runtime.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run build`。
