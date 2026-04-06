# @repo-ai-governor/adapter-claude-code

- Status: active
- Scope: `project-004-agent-adapter-runtime / TK-036`

## Purpose

提供 Claude Code surface 的首批 adapter 基线实现，对齐 `adapter-sdk` 统一协议与 capability matrix 契约。

当前正式口径：

1. 该 surface 已进入 fixture-backed 正式支持矩阵。
2. 当 credential 或 probe 前置条件失败时，运行时应保留 fallback / degraded routing 语义，而不是误报为核心治理链路失效。
