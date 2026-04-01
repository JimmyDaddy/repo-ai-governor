# sprint-002-artifact-registry-sqlite-truth-and-rendered-views 计划

- Status: planned
- Date: 2026-04-02
- Project: `project-036-runtime-durable-storage-and-registry-cutover`
- Sprint Goal: 将 Artifact Registry / Archive Registry 切为 sqlite canonical truth，并把 CSV 收口为 rendered compatibility/export view。

## 1. Task Package

1. `TK-477` implement sqlite-backed artifact registry canonical truth and rendered CSV compatibility views

## 2. Exit Criteria

1. Artifact Registry / Archive Registry 已具备 sqlite-backed canonical truth。
2. `artifacts.csv / artifacts.archive.csv` 已降级为 rendered compatibility/export view。
3. lifecycle gate、dependency resolution、render/reconcile 流程能直接读取 canonical registry。

## 3. Milestones

1. 2026-04-02：创建 planned `sprint-002`，冻结 `TK-477` 作为 artifact registry cutover implementation package。
