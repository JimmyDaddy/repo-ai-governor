# TK-1017 review rollout claim parity and remaining cli compatibility wording

- Status: completed
- Date: 2026-04-21
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-005-clean-room-validation-and-rollout-closeout`

## 1. 任务目标

Ensure direct-key plugin truth and CLI compatibility wording stay aligned.

## 2. Depends On

1. run zero-env-var clean-room rehearsal and failure-path validation

## 3. 预期产物

1. support truth review artifact for TK-1017
2. task card update for TK-1017
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/current-context.md
2. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm pack --json --dry-run`
2. `pnpm run check:ide-entry-smoke`
3. `pnpm run check:ide-docs-parity`
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/tasks" --task-id TK-1017

## 8. Delivery Verification

1. `pnpm pack --json --dry-run`
2. `pnpm run check:ide-entry-smoke`
3. `pnpm run check:ide-docs-parity`
4. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/tasks" --task-id TK-1017
5. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/tasks" --task-id TK-1017
6. node ./scripts/governance/check-task-ledger-sync.js
7. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `planned`。
2. 2026-04-21：`TK-1016` 已完成 zero-env-var clean-room evidence window；当前任务切换为 `in_progress`，用于把 public support wording 从“sprint-005 defer”收口到最终 claim-parity truth。
3. 2026-04-21：已完成 README / playbook / support-matrix 的 sprint-005 文案收口，新增 `project-116-sprint-005-rollout-claim-parity-summary.md`，并通过 `pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` 后将当前任务切换为 `completed`；下一步激活 `TK-1018` 进入 project-final closeout 与 delegated CR loop。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-005-clean-room-validation-and-rollout-closeout/project-116-sprint-005-rollout-claim-parity-summary.md`
2. `docs/support-matrix.md`
3. `docs/support-matrix.zh-CN.md`
4. `apps/vscode-extension/README.md`
