# sprint-003-release-smoke-and-mvp-closeout 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint Goal: 补齐 desktop release smoke、window lifecycle / notification / restart guards，并在 artifact query gate 约束下完成 MVP closeout。

## 1. Task Package

1. `TK-545` freeze desktop release smoke baseline packaging ownership and artifact-pane gate
2. `TK-546` implement notification window-lifecycle restart guards and conditional artifact-query integration seam
3. `TK-547` add desktop release-smoke regression evidence and project closeout acceptance

## 2. Exit Criteria

1. Desktop release smoke baseline、packaging ownership 与 utility-process restart contract 已冻结为 closeout 标准。
2. notification / window wake / restart guard 进入 shell runtime，而不是停留在口头约束。
3. `review / artifact pane` 只在 service-owned artifact query contract ready 时进入 closeout；否则必须在审计里显式记录 gate 未开启。
4. 项目 closeout 前需补齐 `pnpm run build`、desktop smoke 与 release verification evidence。

## 3. Milestones

1. 2026-04-04：创建 `sprint-003-release-smoke-and-mvp-closeout`，作为 desktop MVP foundation 的收尾 sprint。
2. 2026-04-04：完成 `TK-545`、`TK-546`、`TK-547` 任务卡拆解，并将 release smoke 与 artifact gate 收口条件写入 closeout 计划。
3. 2026-04-04：完成 desktop lifecycle / restart guard、package/runtime distribution truthfulness、release smoke closeout 与项目级 completion audit，并通过 `pnpm run release:verify-local` 验证。
