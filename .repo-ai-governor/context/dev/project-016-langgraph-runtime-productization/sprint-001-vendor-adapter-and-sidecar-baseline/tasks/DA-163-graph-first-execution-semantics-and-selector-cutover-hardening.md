# DA-163 graph-first execution semantics 与 selector/cutover hardening

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-163`

## 1. 结论

1. `core-runtime` 当前已经具备真实的 graph-first primary execution semantics，不再只是“selector 选到 langgraph，但执行仍由 legacy engine 承接”。
2. `ProcessRuntimeFacade` 与 `core-runtime-langgraph` 的长期边界已更清晰：
   - facade 负责 backend selection、legacy compatibility mapping、role registry bridge
   - LangGraph backend 负责 graph plan prepare 与 graph-first dispatch
3. parity harness 现在回到迁移期比较工具的定位，不再承担 langgraph primary path 的真实执行责任。

## 2. 本轮实现

1. `LangGraphRuntimeBackend` 新增正式 `execute()` 路径，覆盖：
   - sequential / branch / loop / fan-out 基线执行
   - stage timeout / flow timeout / cancelled interruption
   - visited nodes / stage results / interruption result
2. `ProcessRuntimeFacade` 已在 `langgraph` primary backend 下：
   - 调用 LangGraph backend 而非 legacy engine
   - 将 LangGraph 结果映射回 `RuntimeExecutionResult`
   - 通过 facade bridge 延续 `roleRegistry`、condition/loop hooks 与 clock/input options
3. 单测与契约同步：
   - facade 单测显式断言 `langgraph` primary path 不会调用 legacy engine
   - LangGraph backend 单测已覆盖最小 mainchain execute
   - vendor binding 单测的错误对象类型也已收紧到 truthfulness 兼容实现

## 3. 仍保留的迁移边界

1. 本轮没有移除 parity harness；它仍保留给后续 rollout/compare 使用。
2. 本轮没有引入 `sidecar + ipc` host；graph-first execution 仍运行在当前进程内 runtime boundary 上。
3. 本轮没有把社区 `@langchain/langgraph` 变成硬依赖；vendor binding 仍维持 optional peer seam。

## 4. 后续输入

1. `TK-164` 消费本产物，基于真实 graph-first execution 继续建立 `sidecar + ipc` orchestration host baseline。
2. `TK-165` 消费本产物，建立 desktop execution surface 与 service ops/release baseline。
3. `TK-166` 消费本产物，作为 sprint-001 exit acceptance 的正式执行语义证据。
