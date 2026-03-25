# @repo-ai-governor/core-runtime-langgraph

`core-runtime-langgraph` 承载 `Process Runtime Facade -> LangGraph Runtime Adapter` 的 backend 层。

当前包当前的 truthfulness 口径是：

1. 它是 `LangGraph-oriented backend shell`
2. 它提供 `optional community vendor binding seam`
3. 它还不是已经内置真实社区 LangGraph runtime 的完整 vendor-backed engine

当前阶段只提供以下能力：

1. `compiled IR -> graph plan` 适配
2. 可实例化的 runtime backend skeleton
3. `file-backed` / `sqlite-fs` checkpointer 与最小 recovery smoke 基线
4. 社区 `@langchain/langgraph` 的可选 binding probe

## Community Vendor Binding

本包通过 `LangGraphCommunityVendorBinding` 暴露社区 vendor binding seam：

1. 默认探测可选 peer `@langchain/langgraph`
2. 当前 optional peer range 对齐稳定 `1.x` 版本线，而不是继续停留在早期 `0.4.x`
3. 校验最小 required exports：`StateGraph`、`START`、`END`
4. 在 vendor 包缺失时 fail-closed，返回 `module_missing`，而不是谎报“已完成 vendor adoption”

这意味着：

1. 当前包名仍然保留 `langgraph`，因为 roadmap 已明确要向社区 LangGraph 靠拢
2. 但 package/README/runtime contract 已明确区分：
   - 现在已有的是 adapter shell + binding seam
   - 尚未完成的是真实 vendor-backed graph execution
3. `peerDependencies` 声明的是当前支持的稳定主线，不等于“已经完成真实 vendor runtime productization”
4. 后续 `TK-163/TK-164/TK-165` 才继续收敛 graph-first engine 与 sidecar host 产品化

本包不持有 policy、audit、ledger、artifact registry 或 task ledger 的 canonical source 写入责任。
