# checklist

- [x] TK-123 shared 与 package-local 边界收敛及 exports 清理
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：切换为 `in_progress`，开始基于 `DA-120` 冻结稿审计 `apps/cli` 的 shared/package-local 归属与 package exports 基线。
  - 2026-03-24：已基于最终 `DA-120` 结论冻结 `DA-121`，确认当前无需 shared promotion 或 subpath exports，任务状态更新为 `completed`。
- [x] TK-124 cli package 回归、smoke 与 test topology 加固
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：切换为 `in_progress`，开始审计 `apps/cli/test` 的 package topology、public entry smoke 与根层 `@repo-ai-governor/cli` 消费用例。
  - 2026-03-24：已确认高复杂度命令链在 package-scoped integration 中已有稳定覆盖，`DA-122` 更新为最终 `accept` 结论，任务状态更新为 `completed`。
- [x] TK-125 project-011 出口验收与 project-010 rollout 输入约束
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：切换为 `in_progress`，以滚动验收草案方式汇总 `DA-113`~`DA-122` 证据，并提前冻结 `project-010` 消费 project-011 的输入边界。
  - 2026-03-24：已完成 `DA-123` 最终 `accept`、project completion audit summary 与 `project-010` 正式回链，任务状态更新为 `completed`。
