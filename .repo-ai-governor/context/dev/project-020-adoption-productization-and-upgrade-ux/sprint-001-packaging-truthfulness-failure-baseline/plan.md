# sprint-001-packaging-truthfulness-failure-baseline 计划

- Status: active
- Date: 2026-03-26
- Project: `project-020-adoption-productization-and-upgrade-ux`

## 1. Sprint Goal

固化 `path/link/tgz` 安装矩阵、packaged runtime failure taxonomy 与 published surface inventory，为后续 packaged runtime 真正 cutover 提供 deterministic baseline。

## 2. Task Package

1. `TK-222` project-020 激活与执行面切换 handoff（completed）
2. `TK-223` packaging/install matrix 与 failure-class baseline（planned）
3. `TK-224` published surface inventory 与 packaged-runtime resolvability audit（planned）
4. `TK-225` sprint-001 出口验收与 sprint-002 packaged cutover 输入约束（planned）

## 3. Exit Criteria

1. `current-context.md` 已切换到 `project-020 / sprint-001`，并将 `project-019 / sprint-002` 迁入 completed history。
2. 已形成覆盖 `path / link / tgz` 的 install matrix、failure classes 与 deterministic diagnosis baseline。
3. 已形成 published surface、runtime asset copy、entrypoint resolvability 与 release gate gap map。
4. 已冻结 `sprint-002` 的 packaged runtime cutover 输入约束，而不是在 baseline 未清晰前直接跳到大面积修复。

## 4. Execution Notes

1. `sprint-001` 只处理 packaged distribution 的 baseline、诊断与边界盘点，不提前扩张到 upgrade/workspace UX 实装。
2. 若 baseline 过程中发现必须修复的 instrumentation 阻断，可以 fix-forward，但不能跳过 failure taxonomy 与 support matrix truthfulness。
