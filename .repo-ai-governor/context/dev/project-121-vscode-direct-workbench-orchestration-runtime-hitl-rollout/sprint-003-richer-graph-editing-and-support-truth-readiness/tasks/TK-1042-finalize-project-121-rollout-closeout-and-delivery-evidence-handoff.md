# TK-1042 finalize project-121 rollout closeout and delivery evidence handoff

- Status: completed
- Date: 2026-04-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout`
- Sprint: `sprint-003-richer-graph-editing-and-support-truth-readiness`

## 1. 任务目标

在 readiness 结论明确后完成 `project-121` closeout、delivery evidence handoff 与 current-context write-back，并把仍然保留的 `CS-027` focused extraction debt 明确写回当前 project-121 的 closeout 台账。

## 2. Depends On

1. `TK-1041`

## 3. 预期产物

1. project completion audit
2. delivery evidence handoff
3. aligned checklist/tasks.csv ledger views
4. refreshed `CS-027` exception ownership and explicit follow-up note for legacy workbench/controller extraction debt

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/TK-1041-verify-direct-workbench-evidence-boundary-and-support-truth-readiness.md`
4. `.repo-ai-governor/context/current-context.md`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 5. Traceback References

1. `.repo-ai-governor/context/completed-streams-history.md`
2. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/DA-1041-direct-workbench-support-truth-readiness-disposition.md`
3. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/DA-1050-direct-workbench-evidence-and-readiness-package.md`

## 6. 实施计划

1. 基于 `TK-1041` 的 readiness 结论与 `TK-1050` 的 evidence package，写回 `project-121` 的 closeout / delivery evidence / current-context terminal truth。
2. 形成 project-level completion audit summary。
3. 将 `vscode-extension-presentation-builder.ts` 与 `vscode-extension-command-controller.ts` 的 legacy `CS-027` exception 重新挂接到当前 `project-121` closeout 责任，并在 closeout/audit 中明确后续 focused extraction 仍是保留债务而非已完成工作。
4. 收口 lifecycle delivery handoff 与 milestone entry。

## 7. Development Verification

1. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks"`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check:ide-entry-smoke`
4. `pnpm run check:desktop-entry-smoke`
5. `pnpm run release:verify-vscode-extension-distribution`
6. `pnpm run release:verify-host-distribution`
7. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks"`
8. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks"`
9. `node ./scripts/governance/check-task-ledger-sync.js`
10. `node ./scripts/governance/check-sprint-plan-status-sync.js`
11. `node ./scripts/governance/check-code-review-status-sync.js`
12. `node ./scripts/governance/check-worktree-review-target.js`
13. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
14. `pnpm run check`

## 9. 执行记录

1. 2026-04-22：任务创建，状态初始化为 `planned`。
2. 2026-04-23：`CR-005` 已 clean `resolved`，确认 project-final delegated review loop 的最新 round 不再存在阻止 closeout 的 actionable findings。
3. 2026-04-23：已写入 `project-121` completion audit summary、`DA-1042` final closeout handoff，并将 project/sprint plan、delivery registry、`current-context.md` 与 completed history 同步到最终 `completed / idle` 真值。
4. 2026-04-23：closeout 明确保留 `apps/vscode-extension/src/runtime/vscode-extension-presentation-builder.ts` 与 `apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts` 的 `CS-027` focused extraction debt 作为 follow-up，不把这项 legacy split 债务表述为已完成。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout-completion-audit-summary.md`
2. `.repo-ai-governor/context/dev/project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout/sprint-003-richer-graph-editing-and-support-truth-readiness/tasks/DA-1042-project-121-final-closeout-and-idle-primary-stream-handoff.md`
3. `.repo-ai-governor/context/current-context.md`
4. `.repo-ai-governor/context/completed-streams-history.md`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
