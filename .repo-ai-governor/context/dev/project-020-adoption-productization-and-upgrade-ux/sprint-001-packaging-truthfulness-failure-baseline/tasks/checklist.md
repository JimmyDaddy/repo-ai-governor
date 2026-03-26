# checklist

- [x] TK-222 project-020 激活与执行面切换 handoff
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始创建 `project-020` skeleton 并切换 active execution surface。
  - 2026-03-26：已完成 `current-context` 切换、`completed-streams-history` 迁移、`project-020 / sprint-001` 骨架创建与 `DA-222`。
- [x] TK-223 packaging/install matrix 与 failure-class baseline
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始盘点 clean-room / pack / install / release gate 相关脚本与 path/link/tgz 安装矩阵。
  - 2026-03-26：已完成 `path`、`link` 与 `tgz` clean-room baseline；确认 `tgz` 在真实网络下通过，但在受限网络环境会因 `commander/i18next/yaml` registry 解析失败而提前中断，形成 `DA-223`。
- [x] TK-224 published surface inventory 与 packaged-runtime resolvability audit
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始盘点 pack manifest、build asset copy、published surface 与 verify-local-distribution 证据。
  - 2026-03-26：已完成 tarball manifest、`verify-local-distribution`、`copy-runtime-assets` 与文档口径比对，形成 `DA-224`；确认 packaged runtime resolvability 当前通过，但 docs/skills/offline install truthfulness 仍有显式 gap。
- [x] TK-225 sprint-001 出口验收与 sprint-002 packaged cutover 输入约束
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始基于 `DA-222`、`DA-223` 与 `DA-224` 评估 sprint-001 exit criteria，并冻结 sprint-002 的 cutover 输入约束。
  - 2026-03-26：已确认 sprint-001 exit criteria 达成，形成 `DA-225`，并将 sprint-001 切为 `completed`。
