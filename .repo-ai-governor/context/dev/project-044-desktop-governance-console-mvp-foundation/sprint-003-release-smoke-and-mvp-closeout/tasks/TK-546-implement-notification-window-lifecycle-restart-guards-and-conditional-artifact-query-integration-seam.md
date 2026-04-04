# TK-546 implement notification window-lifecycle restart guards and conditional artifact-query integration seam

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P0
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint: `sprint-003-release-smoke-and-mvp-closeout`

## 1. 任务目标

实现 desktop shell 的 notification / window-lifecycle / restart guards，并在不越过 service-owned query gate 的前提下接入 conditional artifact-query seam。

## 2. Depends On

1. `TK-545`

## 3. 预期产物

1. desktop lifecycle / restart guards
2. notification ownership implementation
3. conditional artifact-query integration seam

## 4. Required Inputs

1. `TK-545`
2. `integrations/desktop/README.md`
3. sprint-001 / sprint-002 implementation outputs
4. service-owned query contract inputs when available

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-003-release-smoke-and-mvp-closeout/plan.md`
2. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/sprint-003-release-smoke-and-mvp-closeout/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/project-041-desktop-mvp-implementation-activation-handoff.md`

## 6. 实施计划

1. 实现 desktop shell 的 notification、window wake、utility-process restart 与 recovery guard。
2. 若 service-owned artifact query contract ready，则通过 typed seam 接入；若未 ready，则保留 gated integration seam，不以 filesystem bypass 方式替代。
3. 为 release smoke 与 desktop lifecycle 增加定向验证。

## 7. Development Verification

1. `pnpm run build`
2. desktop lifecycle / restart 定向测试
3. desktop release smoke 验证

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run check:desktop-entry-smoke`
3. `pnpm run release:verify-local`
4. relevant desktop lifecycle / restart regression evidence

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 desktop lifecycle / restart guards 与 conditional artifact-query seam 实现。

## 10. 产出

1. 待执行：desktop lifecycle / restart guard implementation
2. 待执行：notification ownership implementation
3. 待执行：conditional artifact-query integration seam
