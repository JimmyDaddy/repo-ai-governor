# checklist

- [x] TK-147 core-runtime-langgraph backend skeleton 与 compiled IR graph adapter 基线
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：sprint-002 启动，状态切换为 `in_progress`。
  - 2026-03-25：已完成 `packages/core-runtime-langgraph` 的 package skeleton、`CompiledIrGraphAdapter`、`LangGraphRuntimeBackend` 与单测，并产出 `DA-147`。
  - 2026-03-25：已完成 working tree CR 复核修复，收口 dangling destination fail-closed 与 execution/terminal status 契约拆分。
- [x] TK-148 Process Runtime facade backend selector 与 cutover parity harness 基线
  - 2026-03-25：任务创建，状态初始化为 `planned`。
  - 2026-03-25：状态切换为 `in_progress`，开始实现 `core-runtime` facade selector 与 parity harness 公共契约。
  - 2026-03-25：已完成 `ProcessRuntimeFacade`、`ProcessRuntimeParityHarness`、`PROCESS_RUNTIME_BACKEND_UNAVAILABLE` fail-closed error code、Vitest alias 补齐与 `DA-148`。
  - 2026-03-25：已完成 working tree CR 复核修复，将 prepared execution profile 纳入 parity compare，并确认 artifact registry 对 closed task 的依赖收口符合治理脚本语义。
- [ ] TK-149 file-backed checkpointer 与 recovery smoke 基线
  - 2026-03-25：任务创建，状态初始化为 `planned`。
- [ ] TK-150 LangGraph `run/review/HITL` 最小主链接线
  - 2026-03-25：任务创建，状态初始化为 `planned`。
- [ ] TK-151 `sqlite-fs` checkpointer 与 shared local orchestration service shell 收敛
  - 2026-03-25：任务创建，状态初始化为 `planned`。
- [ ] TK-152 sprint-002 出口验收与 sprint-003 输入约束
  - 2026-03-25：任务创建，状态初始化为 `planned`。
