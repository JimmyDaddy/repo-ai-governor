# @repo-ai-governor/core-runtime-langgraph

`core-runtime-langgraph` 承载 `Process Runtime Facade -> LangGraph Runtime Adapter` 的 backend 层。

当前阶段只提供两类能力：

1. `compiled IR -> graph plan` 适配
2. 可实例化的 runtime backend skeleton

本包不持有 policy、audit、ledger、artifact registry 或 task ledger 的 canonical source 写入责任。
