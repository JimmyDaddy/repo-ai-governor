# checklist

- [x] TK-142 LangGraph 采用决策并入 triad/master plan 与 project-014 启动
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：已完成 triad/master plan/current-context/projects overview/dev index 与 `project-014` 骨架同步，并产出 `DA-142`。
  - 2026-03-25：已完成 CR 复核修复，formal input chain 改为以 `DA-142` + triad/master plan 为正式基线，`DA-142` direct consumer 语义与 artifact registry 已对齐。
- [x] TK-143 Process Runtime -> LangGraph adapter 边界与 state contract 基线
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：已完成 `DA-143`，明确 facade、LangGraph adapter、checkpointer 与外部 side-effect services 的职责边界，并固化运行时状态映射与 checkpoint 准入/禁入规则。
- [x] TK-144 shared local orchestration service（CLI + desktop）契约基线
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：已完成 `DA-144`，明确单一 runtime owner、CLI/desktop client 边界，以及 execution/streaming/HITL/recovery API 和本地部署约束。
- [x] TK-145 LangGraph Phase 0 spike、cutover parity 验证与 rollout 迁移计划
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：已完成 `DA-145`，明确 Phase 0 最小闭环、cutover parity harness、file-backed -> sqlite-fs checkpointer 路径与 rollout 顺序。
- [x] TK-146 sprint-001 出口验收与 sprint-002 输入约束
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：已完成 `DA-146`，确认 sprint-001 满足退出条件，并冻结 sprint-002 的 LangGraph backend、service shell、checkpoint/recovery 与 parity 验证输入约束。
