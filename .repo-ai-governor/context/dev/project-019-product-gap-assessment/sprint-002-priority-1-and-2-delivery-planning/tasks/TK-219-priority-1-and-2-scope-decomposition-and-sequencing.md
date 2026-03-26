# TK-219 优先级 1/2 范围分解与依赖顺序重排

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-019-product-gap-assessment`
- Sprint: `sprint-002-priority-1-and-2-delivery-planning`

## 1. 任务目标

将“打包分发真值”和“upgrade/workspace lifecycle adopter UX”两条优先级主线拆成可执行 workstream，并明确依赖顺序。

## 2. Depends On

1. `TK-218`
2. `DA-216`

## 3. 预期产物

1. scope 分解。
2. 依赖顺序。
3. 风险 register。
4. `DA-219`

## 4. 实施计划

1. 明确 priority-1 的问题边界、不可跳过的验证门槛与收口标准。
2. 明确 priority-2 对 priority-1 的前置依赖。
3. 将两条主线拆分成建议 sprint。

## 5. 验证

1. `rg -n "第一优先级|第二优先级|tgz|workspace|upgrade" .repo-ai-governor/draft/repo-ai-governor-priority-1-and-2-delivery-plan.md`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始整理两条主线的 scope、先后顺序、验证门槛与风险 register。
3. 2026-03-26：已完成范围分解与依赖顺序重排，形成 `DA-219`。
