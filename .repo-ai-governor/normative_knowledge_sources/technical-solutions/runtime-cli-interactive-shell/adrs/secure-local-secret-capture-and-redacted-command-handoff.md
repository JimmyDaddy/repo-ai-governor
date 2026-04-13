# Secure Local Secret Capture And Redacted Command Handoff ADR

- Status: active
- Date: 2026-04-12
- Module ID: `runtime.cli-interactive-shell`
- ADR ID: `adr.runtime.cli-interactive-shell.secure-local-secret-capture.v1`

## 1. Context

`runtime.governance-clients` 已经 formalize `secret set` 的安全边界：

1. 明文 secret 不得以位置参数传入。
2. 真正 secret 只允许通过 `stdin`、no-echo prompt 或等价本地隐藏输入进入 backend mutation。

但 session shell 当前仍把 `/secret set <keyName>` 当作普通 bridge command：

1. 命令会被转成 `bridgeArgv`。
2. nested CLI 会以 `--output json + --no-interactive + isStdinTty=false` 执行。
3. 一旦用户把 secret 打进 slash 文本，raw bytes 就有机会进入 `composer_value`、`slash_query`、preview 与 transcript 风险面。

因此，session shell 需要一条不经过普通 bridge preview、也不重新放宽 secret command contract 的 authoring 路径。

## 2. Decision

1. 显式 `/secret set <keyName>` 进入 `runtime.cli-interactive-shell` 的 shell-local secure capture path，而不是普通 `bridgeArgv` handoff。
2. 当用户提交精确命令 `/secret set <keyName>` 时，shell 必须先清空普通 slash/composer presenter state，再切换到 `secure_local_capture`；后续 secret 输入只进入本地隐藏输入 buffer。
3. 一旦 secure route `/secret set <keyName>` 被识别，额外 typed/pasted suffix 必须在 presenter-state commit 之前被拦截并丢弃；这些字节不得写入 `composer_value`、`slash_query`、palette state、preview、transcript 或错误文案。
4. shell 在 secure-local path 中必须通过本地 secret mutation seam 调用共享 backend mutation core，而不得把 raw secret 重新包装为 nested CLI JSON、`bridgeArgv` 或 command recap。
5. 用户可见结果只允许包含 redacted metadata，例如 selector、backend、成功/失败/取消状态；不允许包含 secret 原文、前后缀、长度或含 secret 的 command recap。
6. 当前 ADR 的 formal scope 只覆盖 shell-initiated secure secret authoring；service-owned secure-input request、desktop secure dialog 与 VS Code secure prompt parity 仍留在后续独立 solution。

## 3. Consequences

1. session shell 可以在不放宽 `secret set` contract 的情况下完成安全 authoring。
2. secure route 的输入所有权需要在 controller 层显式建模，而不能继续依赖普通 slash composer 默认行为。
3. `runtime.cli-interactive-shell` 需要为 secure-local path 增加独立 mode/focus/action 语义。
4. `runtime.governance-clients` 需要保持 secret mutation core 可被 shell-local runtime 复用，而不是强制所有 authoring 都回到 nested CLI JSON path。
5. 真实 skill-driven secure input request 仍未 formalize；后续若要支持该能力，必须先为 producer module、outcome contract 与多表面 consumer ownership 建立新的正式方案。

## 4. Implementation Guidance

1. 推荐把 secure route 的 pre-commit interception 放在 session-shell foreground controller，而不是下游 preview/handoff runner。
2. 推荐将 secure-local path 的成功、失败与取消统一落成 redacted `system_notice` 或等价 presenter-safe summary。
3. 推荐复用共享 secret mutation core，而不是在 session shell 内复制 backend-specific mutation rule。

## 5. Compatibility

1. 本 ADR 不改变 `contract.runtime.governance-local-config-and-secret-command.v1` 关于 `secret set` 输入模式与 secret backend ownership 的既有约束。
2. 本 ADR 不要求 `session.main`、desktop 或 VS Code 已经拥有 secure-input request / secure prompt contract。
3. docs-only promotion 不等于代码已经交付；真实实现仍需由后续 rollout project 承接。
