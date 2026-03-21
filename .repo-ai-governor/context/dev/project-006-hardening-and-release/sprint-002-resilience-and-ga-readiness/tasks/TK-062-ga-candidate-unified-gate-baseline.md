# TK-062 GA 候选联合门禁（契约+稳定性+发布）基线

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-002-resilience-and-ga-readiness`

## 1. 任务目标

建立 GA 候选联合门禁，将契约测试、稳定性回归、发布治理与回滚约束收敛为统一准入检查。

## 2. Depends On

1. `TK-060`
2. `TK-061`

## 3. 预期产物

1. `DA-074` GA 候选联合门禁基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-060-restricted-network-and-offline-degrade-regression-baseline.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-002-resilience-and-ga-readiness/tasks/TK-061-rollback-rehearsal-and-recovery-playbook-baseline.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）

## 5. 实施计划

1. 收敛 GA 前必须通过的契约、稳定性、发布与回滚检查项。
2. 定义统一执行命令与失败阻断语义。
3. 输出可审计、可回放、可复现实验记录模板。

## 6. 验证

1. `pnpm run check`
2. `pnpm run release:ga-check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
