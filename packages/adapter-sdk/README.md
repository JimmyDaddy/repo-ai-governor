# @repo-ai-governor/adapter-sdk

- Status: active
- Scope: `project-004-agent-adapter-runtime / TK-033`

## Purpose

定义统一 Agent 协议与 capability matrix 契约，作为 `adapters/*` 与 runtime 之间的共享边界。

## Baseline Capabilities

1. 统一协议方法：`probe`、`invokeStage`、`streamEvents`、`requestConfirmation`、`cancel`。
2. 统一 capability matrix 字段：能力支持级别、超时语义、取消语义、上下文窗口能力。
3. 统一降级契约：当能力 `degraded/unsupported` 时输出可消费的 fallback action。
4. 提供 `routeKey` 主备路由基线：`AgentRouteRegistry` + `AgentRouteRunner` 支持 primary/fallback surface 选择。
5. 提供标准化错误映射：`AgentProtocolErrorMapper` 统一 probe/invoke/stream/confirmation/cancel 错误输出。
