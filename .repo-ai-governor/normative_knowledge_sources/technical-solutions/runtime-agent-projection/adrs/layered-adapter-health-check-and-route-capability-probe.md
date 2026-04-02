# Layered Adapter Health Check And Route Capability Probe ADR

- Status: active
- Date: 2026-04-02
- Module ID: `runtime.agent-projection`
- ADR ID: `adr.runtime.agent-projection.layered-adapter-health-check-and-route-capability-probe.v1`

## 1. Context

当前 `Codex`、`GitHub Copilot` 与 `Claude Code` 的 probe 长期依赖 `Respond with exactly OK.` 这类文本回声，并用精确字符串比较决定 surface 是否 available。真实环境已经出现误伤：工具本地可用，但只因返回 `OK.` 等 trivial variant 就被判定为 unavailable 并 fallback。与此同时，`Ollama` 已经采用 `/api/tags` 等能力型检查，系统内部出现了两套不一致的 probe 模型。

## 2. Decision

1. 将 adapter health check 统一建模为五层：
   - `install`
   - `auth`
   - `protocol`
   - `semantic`
   - `route_capability`
2. 将“文本 no-op probe”降级为 `semantic` 层的次级信号，不再作为跨工具统一真值。
3. 保留 adapter-specific 的底层探测方式：
   - `Codex / GitHub Copilot / Claude Code` 可继续走 CLI 轻量调用
   - `Ollama` 继续走 API capability check
4. 为 `connect / doctor / verify`、role routing 与 fallback 提供统一的 normalized contract 与稳定 reason code。
5. 将 route fallback 决策从“stderr/文本文案猜测”切换为“基于 route capability 诊断的结构化降级”。

## 3. Consequences

1. `doctor` 与 `verify` 可以明确告诉用户失败发生在安装、认证、协议、轻量语义检查还是 route 能力层。
2. `GitHub Copilot`、`Claude Code`、`Codex` 不会再因 `OK.` 之类 trivial 文本差异被误判为完全不可用。
3. adapter 层仍然可以按供应商特性演进，无需为了统一 health check 而强制完全相同的底层实现。
4. reviewer/tester 这类 route 的 fallback 会更可解释，但 rollout 需要分阶段完成 shared contract、adapter-specific probe 与 route consumer 的切换。
