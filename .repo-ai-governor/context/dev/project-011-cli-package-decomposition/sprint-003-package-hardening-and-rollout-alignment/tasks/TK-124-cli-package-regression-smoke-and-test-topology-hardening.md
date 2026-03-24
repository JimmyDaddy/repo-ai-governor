# TK-124 cli package 回归、smoke 与 test topology 加固

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-003-package-hardening-and-rollout-alignment`

## 1. 任务目标

为拆分后的 CLI package 建立稳定的 package test、integration、smoke 与 topology 证据，确保重构不是只换文件位置。

## 2. Depends On

1. `TK-122`
2. `TK-123`

## 3. 预期产物

1. `DA-122` CLI package 回归、smoke 与 test topology 加固产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/TK-123-shared-and-package-local-boundary-hardening-and-exports-cleanup.md`

## 5. 实施计划

1. 复核 package-scoped tests、integration tests 与 smoke coverage 的归属。
2. 为拆分后的模块补齐 package-level tests 与关键 smoke。
3. 回写 `DA-122`，并确保 `CS-024` 拓扑基线可通过。
4. 优先固定现有 topology 与 public entry smoke 证据，再按缺口决定是否新增测试。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run test:packages -- @repo-ai-governor/cli --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：切换为 `in_progress`，已建立 CLI package test topology 基线并执行第一轮 package/integration smoke 验证。
3. 2026-03-24：已确认高复杂度 `run/review/review-verify/replay` 路径在 package-scoped integration 中已有稳定覆盖，`DA-122` 更新为最终基线，任务状态更新为 `completed`。

## 8. 产出

1. `DA-122` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-122-cli-package-regression-smoke-and-test-topology-hardening.md`
