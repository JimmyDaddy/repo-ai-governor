# @repo-ai-governor/core-runtime-langgraph

`core-runtime-langgraph` 承载 `Process Runtime Facade -> LangGraph Runtime Adapter` 的 backend 层。

当前包当前的 truthfulness 口径是：

1. 它是 `LangGraph-oriented graph-first backend`
2. 它默认随包分发社区 `@langchain/langgraph`，并提供 vendor contract verification
3. 它的 primary execution 仍然是仓库自有 graph-first backend，而不是把执行责任直接委托给社区包

当前阶段只提供以下能力：

1. `compiled IR -> graph plan` 适配
2. graph-first runtime backend
3. `file-backed` / `sqlite-fs` checkpointer 与最小 recovery smoke 基线
4. 社区 `@langchain/langgraph` 的 bundled contract verification

## Community Vendor Binding

本包通过 `LangGraphCommunityVendorBinding` 暴露社区 vendor binding seam：

1. 默认校验随包分发的 `@langchain/langgraph`
2. 当前 direct dependency 版本线对齐稳定 `1.x`
3. 校验最小 required exports：`StateGraph`、`START`、`END`
4. 在 vendor 包异常缺失或分发损坏时 fail-closed，返回 `module_missing`

这意味着：

1. 当前包名仍然保留 `langgraph`，因为 roadmap 已明确要向社区 LangGraph 靠拢
2. package/README/runtime contract 已明确区分：
   - 现在已有的是 bundled vendor contract + repo-owned graph-first backend
   - 尚未完成的是“直接以社区 LangGraph 作为唯一执行内核”的更深 vendor-specific execution 绑定
3. `dependencies` 声明的是当前默认随包分发的社区支持线
4. 更深的 vendor-specific execution cutover 若要推进，仍需单独更新 truthfulness 与 release contract

本包不持有 policy、audit、ledger、artifact registry 或 task ledger 的 canonical source 写入责任。
