# TK-543 implement workspace home session lane execution timeline hitl center and agent projection panel

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-002-governance-console-core-panels`

## 1. 任务目标

实现 desktop governance console 的核心 MVP surfaces：workspace home、session lane、execution timeline、HITL decision center 与 agent projection panel，并保持 renderer 只消费 service-owned DTO / event seam。

## 2. Depends On

1. `TK-542`

## 3. 预期产物

1. governance console core panels
2. service-owned panel data flow
3. shared agent projection panel integration

## 4. Required Inputs

1. `TK-542`
2. `TK-540`
3. `.repo-ai-governor/draft/desktop-surface-technical-selection-and-design.md`
4. `integrations/desktop/README.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-002-governance-console-core-panels/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-002-governance-console-core-panels/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`

## 6. 实施计划

1. 搭建 workspace home、session lane、execution timeline 与 HITL center 的 renderer surfaces。
2. 将 shared agent projection seam 接入 desktop panel，而不是重写 CLI 私有 presenter 字符串。
3. 确保 renderer 通过 typed bridge 消费 service-owned DTO / event，不引入 shadow runtime。

## 7. Development Verification

1. `pnpm run build`
2. panel / renderer / preload 定向测试
3. desktop integration / smoke 验证

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run check:desktop-entry-smoke`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 governance console core panels 实现。

## 10. 产出

1. 待执行：workspace home implementation
2. 待执行：session lane / execution timeline / HITL center implementation
3. 待执行：shared agent projection panel integration
