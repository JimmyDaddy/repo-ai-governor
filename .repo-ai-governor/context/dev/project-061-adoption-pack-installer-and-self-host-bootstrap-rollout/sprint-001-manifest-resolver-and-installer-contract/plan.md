# sprint-001-manifest-resolver-and-installer-contract 计划

- Status: planned
- Date: 2026-04-09
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint Goal: 冻结 adoption-pack manifest v1、installer contract boundary 与 layered resolver baseline。

## 1. Task Package

1. `TK-656` freeze adoption-pack manifest v1 and installer contract boundary
2. `TK-657` implement layered adoption-pack resolver and source provenance baseline

## 2. Exit Criteria

1. manifest / profile / managed asset groups / receipt 字段集已冻结。
2. layered resolver 已能区分 `built_in / global / repo_local` source。
3. source provenance 与 override precedence 不再依赖 `.codex/skills/**` 单一路径心智。

## 3. Milestones

1. 2026-04-09：创建 `sprint-001-manifest-resolver-and-installer-contract` 作为 `project-061` 的首个 planned execution sprint。
