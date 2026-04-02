# sprint-004-migration-verification-and-cutover-governance 计划

- Status: active
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint Goal: 收口 migration、doctor/verify、rebuild/render、artifact lifecycle automation 与 cutover governance，确保 durable storage 多 surface 升级可验证、可回滚、可审计。

## 1. Task Package

1. `TK-479` deliver migration, verification, rebuild and cutover governance for durable storage surfaces
2. `TK-480` automate artifact lifecycle maintenance and auto-archive from sqlite canonical truth

## 2. Exit Criteria

1. 新旧工作区都有明确 migration 路径。
2. doctor/verify 能识别 sqlite-fs default truth、registry canonical truth 与 ledger projection 状态。
3. rebuild/render/reconcile/cutover governance 有明确 gate 与回归验证。
4. artifact lifecycle 具备基于 sqlite canonical truth 的自动维护与 auto-archive 路径。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-004`，冻结 `TK-479` 作为 migration and governance closeout package。
2. 2026-04-02：补充 `TK-480` 作为 artifact lifecycle automation follow-up package，承接 sqlite canonical truth 之后的 auto-maintenance / auto-archive 实施面。
3. 2026-04-02：`sprint-003 / TK-478` 已完成，当前 primary planning surface 前移至 `sprint-004`，并激活 `TK-479` 承接 migration / verify / rebuild / cutover governance 主收口。
