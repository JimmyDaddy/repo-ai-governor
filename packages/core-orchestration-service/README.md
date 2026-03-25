# @repo-ai-governor/core-orchestration-service

`core-orchestration-service` 提供本地 orchestration service 的最小 in-process shell。

当前阶段职责：

1. 持有 execution summary、execution list 与 buffered event stream
2. 持有 `sqlite-fs` LangGraph checkpoint/recovery 所有权
3. 为 CLI 与未来 desktop client 复用统一的本地 service contract
4. 暴露 `start/get/list/stream/submitHitlDecision/recover` 级 execution owner API 基线
5. 统一生成 transport-neutral streaming cursor、event sequence 与 desktop-ready host/transport seam
6. 将 HITL receipt、checkpoint backlink 与 recovery 响应收敛为 service-owned DTO

本包不直接承载 policy、audit、review queue 或 artifact registry 的 canonical source 写入。
