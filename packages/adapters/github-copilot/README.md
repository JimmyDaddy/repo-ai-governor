# @repo-ai-governor/adapter-github-copilot

- Status: active
- Scope: `project-004-agent-adapter-runtime / TK-036`

## Purpose

提供 GitHub Copilot surface 的首批 adapter 基线实现，对齐 `adapter-sdk` 统一协议与 capability matrix 契约。

当前正式口径：

1. 该 surface 已进入 `Real-path available (environment-gated)` 正式支持矩阵，当前默认真实 transport 为 `cli_exec`。
2. 当 quota、credential 或 probe 前置条件失败时，运行时应保留 fallback / degraded routing 语义，而不是误报为核心治理链路失效。
3. `confirmation_gate` 与取消能力在当前 CLI-backed path 上仍保持不支持口径，不得把它误报为与主 reviewer/coder surface 完全等价。
4. 对 host-native distribution 而言，`github_copilot.github_com_agent` 仍是 reserved target follow-up：当前只保留 schema-safe staged export contract，不是正式支持的 adopter-facing target。
5. 该 reserved target 当前 capability profile 固定为：`supportedModes=[]`、`supportedDiscoveryStates=[staged_export]`、`supportsApplyToRepo=false`、`supportsBundlePackaging=false`、`isMvpTarget=false`。
6. 在这些约束解除前，不得把 `github-com-agent` staged export、`host verify` failure receipt 或 renderer fixture 误读成已支持的 GitHub.com coding-agent consumption path。
