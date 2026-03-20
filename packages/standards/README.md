# @repo-ai-governor/standards

`standards` 包提供 Stage 4 的 Standards Pack 基线能力：

1. `StandardsPackRegistry`：登记并解析规范包，按 `mergePrecedence` 合并同语义规则。
2. `RuleRenderer`：将同源语义规则渲染到 `human/ai/agents` 三类目标输出。
3. `AgentsProjector`：将 `agents` 视图投影为 `AGENTS.md` 兼容文本，并附带 `projection_target/projected_at/source_pack_refs` 元数据与 parity 校验。
4. `StandardsUpgradePlanner`：输出升级冲突分级（阻断/可自动修复/建议）、回滚步骤与版本 pin 决策。

设计约束：

1. 同一条规则通过 `semanticKey` 作为唯一语义锚点。
2. 多视图渲染必须共用同一语义锚点，不允许跨视图语义分叉。
3. locale 解析遵循 `requested -> language-base -> default -> fallback`，保证弱网络/降级场景稳定可读。
4. `agents` 投影默认启用 human/ai/agents parity 校验，防止投影视图与同源规则资产漂移。
5. 升级规划默认执行 major 锁定策略，并提供 minor/patch 自动升级开关与回滚引用字段。
