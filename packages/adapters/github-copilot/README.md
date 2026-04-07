# @repo-ai-governor/adapter-github-copilot

- Status: active
- Scope: `project-004-agent-adapter-runtime / TK-036`

## Purpose

提供 GitHub Copilot surface 的首批 adapter 基线实现，对齐 `adapter-sdk` 统一协议与 capability matrix 契约。

当前正式口径：

1. 该 surface 已进入 `Real-path available (environment-gated)` 正式支持矩阵，当前默认真实 transport 为 `cli_exec`。
2. 当 quota、credential 或 probe 前置条件失败时，运行时应保留 fallback / degraded routing 语义，而不是误报为核心治理链路失效。
3. `confirmation_gate` 与取消能力在当前 CLI-backed path 上仍保持不支持口径，不得把它误报为与主 reviewer/coder surface 完全等价。
