# project-006-hardening-and-release 计划

- Status: planned
- Date: 2026-03-22
- Stage Mapping: Stage 7
- Phase Mapping: Phase E

## 1. 目标

1. 完成契约测试、集成测试、E2E 测试与性能稳定性加固。
2. 完成发布治理（lockstep + independent，canary -> rc -> ga）。
3. 补齐受限网络与离线降级链路回归。

## 2. 退出标准

1. 契约测试与发布门禁全通过。
2. 发布与回滚流程可重复执行。

## 3. 输入基线（来自 project-005）

1. `DA-065`：`.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-053-project-005-exit-acceptance-and-project-006-input-constraints.md`
2. `DA-066`：`.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-053-project-006-input-constraints-checklist.md`
3. 启动前建议先执行：
   - `pnpm run typecheck`
   - `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
   - `node ./scripts/governance/reconcile-artifact-dependencies.js`
   - `node ./scripts/governance/check-task-ledger-sync.js`
   - `node ./scripts/governance/check-sprint-plan-status-sync.js`
   - `node ./scripts/governance/check-artifact-registry-lifecycle.js`
   - `pnpm run check`
