# @repo-ai-governor/orchestration-service-client

`orchestration-service-client` 定义本地 orchestration service 的 transport-neutral DTO 和 client contract。

当前阶段覆盖：

1. execution start/get/list/subscribe/recover 基线
2. execution list request/response 与 desktop-ready summary 基线
3. HITL decision submit 的 service-owned response 基线
4. recovery request/response 与 checkpoint backlink 基线
5. transport-neutral streaming cursor、event sequence 与 desktop-ready payload 字段
6. service host / transport seam 基线（当前产品化推荐候选为 `sidecar + ipc`）
7. execution summary、stream token 与 runtime owner 边界基线
8. execution status 与 event type 的稳定枚举
9. service health / lifecycle probe 基线
10. session start/send/append/resume/list/subscribe 基线
11. service-backed transcript roles、resume selector 与 session cursor 语义
12. future desktop / CLI 共用的 session event contract（包括 slash/system transcript 追加能力）
