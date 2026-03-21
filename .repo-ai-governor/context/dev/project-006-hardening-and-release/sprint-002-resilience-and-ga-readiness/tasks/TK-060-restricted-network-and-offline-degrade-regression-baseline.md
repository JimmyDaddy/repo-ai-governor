# TK-060 受限网络与离线降级稳定性回归基线

- Status: planned
- Date: 2026-03-22
- Owner: TBD
- Priority: P0
- Project: `project-006-hardening-and-release`
- Sprint: `sprint-002-resilience-and-ga-readiness`

## 1. 任务目标

建立受限网络模式与离线降级链路的稳定性回归基线，确保外部依赖不可达时治理主链路可持续执行。

## 2. Depends On

1. `TK-059`
2. `DA-071`

## 3. 预期产物

1. `DA-072` 受限网络与离线降级回归基线文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-006-hardening-and-release/plan.md`
2. `.repo-ai-governor/context/dev/project-006-hardening-and-release/sprint-001-contract-and-release-governance-baseline/tasks/TK-059-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.8`）

## 5. 实施计划

1. 定义 restricted-network 与 offline-degrade 场景矩阵。
2. 固化关键治理路径（规则检查、流程推进、台账回写）在降级场景下的通过标准。
3. 输出回归执行入口与失败处置策略。

## 6. 验证

1. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run check`

## 7. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
