# sprint-002-packaged-runtime-cutover-and-release-gate-block 计划

- Status: completed
- Date: 2026-03-26
- Project: `project-020-adoption-productization-and-upgrade-ux`

## 1. Sprint Goal

修复 packaged distribution 真值，并将 clean-room packaged install 验证切为 release/GA blocking gate。

## 2. Task Package

1. `TK-226` sprint-002 激活与 sprint-001 closeout handoff（completed）
2. `TK-227` packaged docs truthfulness 与 root README/playbook cutover（completed）
3. `TK-228` skill publish surface、offline install truthfulness 与 blocking gate expansion（completed）
4. `TK-229` sprint-002 出口验收与 sprint-003 upgrade/workspace 输入约束（completed）

## 3. Exit Criteria

1. 根 README、adoption playbook 与 tarball 内真实 docs surface 口径一致。
2. skill surface 的 canonical publish path 已确定并进入 package truthfulness contract。
3. `tgz` 的 online/offline truthfulness 与 support matrix 口径一致，不再模糊宣称离线自包含安装。
4. blocking release gate 已扩围到 docs/skills/support-matrix truthfulness，而不只校验 runtime path suffix。

## 4. Execution Notes

1. `sprint-002` 不再回退到旧的 internal package resolution 假设；`DA-223` 与 `DA-224` 已证明那不是当前主阻断。
2. 本轮主目标是“声明与发布物一致”，不是继续扩大实现面。
3. `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline` 已接管主执行流；本 sprint 仅保留为 completed evidence surface。
