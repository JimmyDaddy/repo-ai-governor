# @repo-ai-governor/standards

`standards` 包提供 Stage 4 的 Standards Pack 基线能力：

1. `StandardsPackRegistry`：登记并解析规范包，按 `mergePrecedence` 合并同语义规则。
2. `RuleRenderer`：将同源语义规则渲染到 `human/ai/agents` 三类目标输出。

设计约束：

1. 同一条规则通过 `semanticKey` 作为唯一语义锚点。
2. 多视图渲染必须共用同一语义锚点，不允许跨视图语义分叉。
3. locale 解析遵循 `requested -> language-base -> default -> fallback`，保证弱网络/降级场景稳定可读。
