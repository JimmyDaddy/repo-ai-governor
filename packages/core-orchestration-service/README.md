# @repo-ai-governor/core-orchestration-service

`core-orchestration-service` 提供本地 orchestration service 的最小 in-process shell。

当前阶段职责：

1. 持有 execution summary 与 buffered event stream
2. 持有 `sqlite-fs` LangGraph checkpoint/recovery 所有权
3. 为 CLI 与未来 desktop client 复用统一的本地 service contract

本包不直接承载 policy、audit、review queue 或 artifact registry 的 canonical source 写入。
