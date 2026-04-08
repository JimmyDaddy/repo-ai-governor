# @repo-ai-governor/adapter-local-model

- Status: active
- Scope: `project-010-local-model-and-ide-expansion / TK-095 + TK-096`

## Purpose

提供本地模型（Ollama 类）surface 的协议实现：在保留统一 adapter contract 的前提下，支持真实 `probe/invoke`、可配置 timeout/retry，以及作为 restricted-network 或 operator-selected 场景的受限本地 fallback 路径。当前能力矩阵保持保守口径，不将 `tool_calling` / `structured_output` / `confirmation_gate` 误报为已完整实现。

当前正式口径：

1. `local-model` / `ollama` 已进入 `Fallback-only real-path (local-runtime constrained)` 正式支持矩阵，定位为 restricted-network 或 operator-selected local fallback 的正式 surface，而不是本地优先 lane。
2. 该 surface 的 probe/invoke 真值依赖 endpoint-backed local runtime，但它不是 promoted primary lane。
3. 能力说明必须继续保守，不得把 `tool_calling`、`structured_output`、`confirmation_gate` 误报为与远端主 surface 等价。
4. 当前 promoted use case 固定为：restricted-network 或 operator-selected local fallback 下、仅要求 capability-compatible plain-text generation 的 route rehearsal；不要把它升级成默认 primary coder/reviewer lane。
5. 当前 capability ceiling 固定为：`tool_calling` = unsupported、`structured_output` = unsupported、`confirmation_gate` = unsupported；`parallel_task`、`streaming`、`cancellation` 仅处于 degraded 支持层级。
6. 当只剩 `local-model` fallback 时，repository-review reviewer delegation 与其他依赖上述能力的 required-role 路径必须保持 guard，而不是继续把它们自动下放给本地模型 surface。
