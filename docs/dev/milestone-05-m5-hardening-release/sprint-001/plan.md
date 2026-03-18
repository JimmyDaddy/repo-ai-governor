# M5 质量硬化与发布就绪 SPRINT-001 Plan

- Status: planned
- Date: 2026-03-18
- Milestone: `M5`
- Sprint: `sprint-001`
- Start: 2026-07-22
- End: 2026-08-04

## Goal

完成核心测试矩阵、边界门禁和发布流程固化。

## Task Breakdown

1. `TK-501` tests/contract 全量覆盖关键契约
2. `TK-502` tests/integration 与 tests/e2e 主链路
3. `TK-503` 依赖边界检查切换为 blocking gate
4. `TK-504` lockstep/independent 版本策略门禁
5. `TK-505` canary -> rc -> ga 发布流程固化
6. `TK-506` 审计回放报告链路
7. `TK-507` 依赖产物完整性切换为 blocking gate

## Exit Criteria

1. 7 个任务均在 checklist 与 CSV 台账登记。
2. 所有任务卡具备 Traceability 字段（PRD Priority/Phase/Step）。
3. code-review 目录已具备标准状态流转模板。
