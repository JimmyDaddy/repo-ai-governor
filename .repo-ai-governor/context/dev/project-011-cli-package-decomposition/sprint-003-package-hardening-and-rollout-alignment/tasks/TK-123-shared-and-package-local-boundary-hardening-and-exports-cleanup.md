# TK-123 shared 与 package-local 边界收敛及 exports 清理

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-003-package-hardening-and-rollout-alignment`

## 1. 任务目标

根据拆分结果收敛 shared 与 package-local 的最终归属规则，并完成 CLI package exports 清理。

## 2. Depends On

1. `TK-122`

## 3. 预期产物

1. `DA-121` shared/package-local 边界收敛与 exports 清理产物文档。

## 4. Input References

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-122-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`

## 5. 实施计划

1. 清点拆分后模块的归属面。
2. 将稳定跨包复用能力上提到 shared，其余保留为 package-local。
3. 清理 exports/barrel 与依赖方向，并回写 `DA-121`。
4. 基于 `DA-120` 冻结稿先完成边界审计与 exports 基线，待 `TK-122` 最终 `accept` 后再确认是否需要额外 promotion/cleanup。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-package-dependency-boundary.js --mode warn`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：切换为 `in_progress`，基于 `DA-120` 冻结稿启动 shared/package-local 边界审计与 exports 基线收敛；最终收口仍消费 `TK-122` 的最终 `accept` 结论。
3. 2026-03-24：`TK-122` 已形成最终 `accept` 结论，`DA-121` 已更新为正式边界基线，任务状态更新为 `completed`。

## 8. 产出

1. `DA-121` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-121-shared-and-package-local-boundary-hardening-and-exports-cleanup.md`
