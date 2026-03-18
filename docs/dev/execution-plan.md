# Dev Program Execution Plan

- Status: active
- Date: 2026-03-18
- Program: `docs/dev`
- Total Milestones: 6
- Total Sprints: 11
- Total Tasks: 66

## Objectives

1. 将 Master Plan 拆解为可执行里程碑、迭代 sprint 与任务台账。
2. 保持 Priority -> Phase -> Step 的全链路可追踪。
3. 统一 CR 生命周期和 `tasks.csv` 字段标准。

## Milestone Roadmap

| Milestone | Focus | Sprint Count | Task Range |
|---|---|---|---|
| M0 | 基线治理与重构起跑 | 1 | TK-001~TK-006 |
| M1 | 核心包抽离 | 2 | TK-101~TK-116 |
| M2 | Workspace + Memory + Session 稳定化 | 2 | TK-201~TK-216 |
| M3 | 编排引擎与 HITL 闭环 | 2 | TK-301~TK-316 |
| M4 | 适配器模块化与 CLI 瘦身 | 2 | TK-401~TK-416 |
| M5 | 质量硬化与发布就绪 | 2 | TK-501~TK-516 |

## Governance Checks

1. `tasks/checklist.md` 与 `tasks/tasks.csv` 同步更新。
2. 每个任务卡必须记录 Priority、Phase、Step。
3. CR 状态流转固定：`review` -> `verified_review` -> `resolved_review`。
4. 每个里程碑至少执行一次 `code_standards.md` 验证命令集合。
