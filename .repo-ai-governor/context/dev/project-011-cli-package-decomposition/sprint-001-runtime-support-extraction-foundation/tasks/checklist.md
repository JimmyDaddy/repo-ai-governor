# checklist

- [x] TK-115 project-011 启动与 CLI package decomposition 依赖重排
  - 2026-03-24：任务创建并启动，目标是将 CLI package decomposition 独立成新的 project 主线。
  - 2026-03-24：已完成 `project-011` 骨架、`DA-113`、context/master-plan/project-010 回链与 resolved review，任务状态收尾为 `completed`。
- [x] TK-116 adapter verification 与 local probe 模块抽离
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：任务切换为 `in_progress`，开始抽离 adapter verification/local probe runtime 与相关类型契约。
  - 2026-03-24：已完成 runtime/types 抽离、unit/integration 回归、`DA-114` 和 resolved review，任务状态收尾为 `completed`。
  - 2026-03-24：已根据 diff review comment 将 `selectedBy` 有限集合提升为 enum 管理，并完成回归验证。
- [x] TK-117 route fallback 与 diagnostics artifact builder 抽离
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：任务切换为 `in_progress`，开始抽离 route/fallback runtime 与 diagnostics payload builder。
  - 2026-03-24：已完成 `CliAdapterRoutingRuntime` 与 `CliAdapterDiagnosticsRuntime` 抽离、runtime/integration 回归、`DA-115` 与 resolved review，任务状态收尾为 `completed`。
- [x] TK-118 sprint-001 出口验收与 sprint-002 输入约束
  - 2026-03-24：任务创建，状态初始化为 `planned`。
  - 2026-03-24：任务切换为 `in_progress`，已创建 provisional `DA-116` 并冻结首版 sprint-002 输入约束；最终出口验收结论仍待 `TK-117` 完成。
  - 2026-03-24：已完成最终 `DA-116`、`TK-119` handoff 约束回写、resolved review 与 artifact registry 登记，任务状态收尾为 `completed`。
