# sprint-004-migration-verification-and-cutover-governance 计划

- Status: planned
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint Goal: 收口 migration、doctor/verify、rebuild/render 与 cutover governance，确保 durable storage 多 surface 升级可验证、可回滚、可审计。

## 1. Task Package

1. `TK-479` deliver migration, verification, rebuild and cutover governance for durable storage surfaces

## 2. Exit Criteria

1. 新旧工作区都有明确 migration 路径。
2. doctor/verify 能识别 sqlite-fs default truth、registry canonical truth 与 ledger projection 状态。
3. rebuild/render/reconcile/cutover governance 有明确 gate 与回归验证。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-004`，冻结 `TK-479` 作为 migration and governance closeout package。
