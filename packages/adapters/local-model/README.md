# @repo-ai-governor/adapter-local-model

- Status: active
- Scope: `project-010-local-model-and-ide-expansion / TK-095 + TK-096`

## Purpose

提供本地模型（Ollama 类）surface 的协议实现：在保留统一 adapter contract 的前提下，支持真实 `probe/invoke`、可配置 timeout/retry，以及作为远端 surface 不可用时的本地 fallback 路径。当前能力矩阵保持保守口径，不将 `tool_calling` / `structured_output` / `confirmation_gate` 误报为已完整实现。

当前正式口径：

1. `local-model` / `ollama` 已进入 `Fallback-only real-path (local-runtime constrained)` 正式支持矩阵，定位为本地优先或远端 fallback 的正式 surface。
2. 该 surface 的 probe/invoke 真值依赖 endpoint-backed local runtime，但它不是 promoted primary lane。
3. 能力说明必须继续保守，不得把 `tool_calling`、`structured_output`、`confirmation_gate` 误报为与远端主 surface 等价。
