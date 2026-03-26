# Plugin Resolution Policy And Distribution Truthfulness ADR

- Status: active
- Date: 2026-03-26
- Module ID: `runtime.memory-provider-loading`
- ADR ID: `adr.runtime.memory-provider-loading.plugin-policy-and-distribution-truthfulness.v1`

## 1. Context

`project-015 / DA-171`、`DA-172`、`DA-173` 与 `DA-177` 已经证明 memory provider pluginization 不只是 shared loader cutover。系统还需要冻结两类规则：

1. `provider.module` 可以如何被解析，以及哪些 module specifier 必须 fail-closed。
2. default distribution、plugin-enabled distribution 与 service-host clean-room 的验证结果不能互相代替。

如果这些事实只留在 task/DA 产物里，lifecycle promotion 虽然能通过，但正式模块文档仍然会丢失关键治理边界。

## 2. Decision

1. `provider.module` 只允许受 allowlist / prefix policy 控制的 bare package specifier。
2. 相对路径、绝对路径与 `file:` specifier 一律保持 fail-closed，不作为当前正式承诺范围。
3. `provider.module` 命中后必须显式外显 `resolution_source=plugin_module`，且失败时不允许隐式回落到 built-in provider。
4. default distribution 不携带 optional provider payload；plugin-enabled distribution 与 service-host clean-room 必须各自独立验证。
5. release / clean-room truthfulness 必须复用本模块导出的 machine-readable loading summary，而不是由 host 或脚本侧重新拼装 provider 选择结果。

## 3. Consequences

1. 本模块的 exported contract 需要继续稳定暴露 `resolution_source` 与 `distribution_mode` 语义。
2. 后续若扩大 plugin trust model，只能在当前 ADR 基线上扩张 allowlist policy，不能回退到任意 module execution。
3. 若新增 provider package，必须先补 plugin-enabled 与 service-host clean-room 证据，再扩 allowlist。
4. 文档层新增的 plugin policy 或 distribution truthfulness 大多属于 ADR 变化；只有改变 machine-readable fields 或 resolution semantics 时才视为 exported contract 变化。

## 4. Source Anchors

1. `project-015 / DA-171`
2. `project-015 / DA-172`
3. `project-015 / DA-173`
4. `project-015 / DA-177`
