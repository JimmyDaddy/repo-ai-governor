# sprint-002-governance-console-core-panels 计划

- Status: completed
- Date: 2026-04-04
- Project: `project-044-desktop-governance-console-mvp-foundation`
- Sprint Goal: 落地 desktop governance console 的核心面板，并让 renderer 严格消费 service-owned DTO / event seam。

## 1. Task Package

1. `TK-542` freeze governance console mvp panel contract and service-owned query boundary
2. `TK-543` implement workspace home session lane execution timeline hitl center and agent projection panel
3. `TK-544` add governance console integration i18n and regression acceptance

## 2. Exit Criteria

1. workspace home、session lane、execution timeline、HITL decision center 与 agent projection panel 的 panel/view-model contract 已冻结。
2. Desktop renderer 只消费 service-owned DTO / event / query seam，不新增 filesystem bypass。
3. 核心治理面板具备 i18n、integration regression 与 shared presentation seam 复用证据。
4. `review / artifact pane` 若 query gate 尚未满足，仍保持 gated，不在本 sprint 抢跑。

## 3. Milestones

1. 2026-04-04：创建 `sprint-002-governance-console-core-panels`，承接 `Phase 1` 的 governance console MVP panels。
2. 2026-04-04：完成 `TK-542`、`TK-543`、`TK-544` 任务卡拆解，并把 artifact query gate 作为显式边界写入任务说明。
3. 2026-04-04：完成 workspace home、session lane、execution timeline、HITL center 与 shared agent projection panel 的 transport-neutral view-model builder，并补齐 bilingual copy 与 regression evidence。
