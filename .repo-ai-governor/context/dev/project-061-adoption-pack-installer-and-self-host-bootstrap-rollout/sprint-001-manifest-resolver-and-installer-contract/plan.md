# sprint-001-manifest-resolver-and-installer-contract 计划

- Status: completed
- Date: 2026-04-09
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint Goal: 冻结 adoption-pack manifest v1、installer contract boundary 与 layered resolver baseline。

## 1. Task Package

1. `TK-656` freeze adoption-pack manifest v1 and installer contract boundary
2. `TK-657` implement layered adoption-pack resolver and source provenance baseline
3. `TK-668` sprint-001 exit acceptance and sprint-002 handoff readiness

## 2. Exit Criteria

1. manifest / profile / managed asset groups / receipt 字段集已冻结。
2. layered resolver 已能区分 `built_in / global / repo_local` source。
3. source provenance 与 override precedence 不再依赖 `.codex/skills/**` 单一路径心智。

## 3. Milestones

1. 2026-04-09：创建 `sprint-001-manifest-resolver-and-installer-contract` 作为 `project-061` 的首个 planned execution sprint。
2. 2026-04-09：切换为当前 active sprint，开始落地 adoption-pack manifest v1 与 layered resolver baseline。
3. 2026-04-09：`TK-656`、`TK-657` 与 `TK-668` 已全部完成，`sprint-001` 已固定为 `completed`，下一边界切换到 `sprint-002-adopt-apply-and-managed-metadata`。
