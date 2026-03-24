# checklist

- [x] TK-119 artifact/report/presentation 模块抽离
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：切换为 `in_progress`，开始抽离 artifact/report/presentation 边界。
  - 2026-03-24：完成 artifact I/O、review queue、replay explain 与 command experience 抽离，`pnpm run check` 通过并输出 `DA-117` / resolved review。
- [x] TK-120 通用命令执行器抽离与 entry registry 基线
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：切换为 `in_progress`，开始梳理非 run/review 命令的统一 command executor 与 entry registry 骨架。
  - 2026-03-24：完成 `init/connect/doctor/check/verify/plan/upgrade` command executor、registry 接线与 CLI 回归验证，输出 `DA-118` / resolved review。
  - 2026-03-24：根据 follow-up CR 修复 registry duplicate guard 与 facade dispatch coverage 缺口，并将 follow-up review 收尾为 resolved。
- [ ] TK-121 run/review 命令执行器抽离与 thin facade cutover
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：切换为 `in_progress`，开始抽离 `review/review-verify` 命令链并为后续 `run/replay` cutover 预留 command context。
- [ ] TK-122 sprint-002 出口验收与 sprint-003 输入约束
  - 2026-03-24：任务创建，状态初始化为 `planned`。
