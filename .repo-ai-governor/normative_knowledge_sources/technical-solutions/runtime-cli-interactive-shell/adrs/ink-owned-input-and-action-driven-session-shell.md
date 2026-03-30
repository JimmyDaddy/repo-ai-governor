# Ink-Owned Input And Action-Driven Session Shell ADR

- Status: active
- Date: 2026-03-30
- Module ID: `runtime.cli-interactive-shell`
- ADR ID: `adr.runtime.cli-interactive-shell.ink-owned-input-session-shell.v1`

## 1. Context

`runtime.cli-interactive-shell` 的 `v2` session-first shell 已完成默认入口、service-owned session DTO、slash handoff 与 transcript continuity，但真实手工验收暴露出一个结构性限制：

1. session shell 的 frame 已由 Ink 渲染。
2. 前台输入仍由 `readline` 在 frame 外按行收集。
3. 这种“`renderToString()` + 外部 prompt”结构无法稳定支撑 live composer、slash palette、`Tab` completion 与 palette 内 `Up/Down/Esc` 键盘语义。

如果继续围绕 `readline` 打补丁，session shell 会被锁死在线式输入模型，既无法自然演进为真正的 live command palette，也会让 future desktop 难以复用同一份 presenter 语义。

## 2. Decision

1. session shell 的默认 foreground input owner 切换为 Ink，而不是 `readline`。
2. `CliSessionShellRunner` 从“阻塞式 `readLine()` 循环”演进为“消费前台 action stream 的 runner/runtime”。
3. `CliSessionShellReadlinePromptAdapter` 保留为 fallback seam，只允许用于 non-TTY、debug 或 Ink/raw-mode 不可用的保底路径。
4. composer 以 Ink-owned live input 为基座；slash palette 保持自定义 controller，不把 command metadata / handoff policy 外包给通用 `Select` 组件。
5. 所有 live shell 输出继续限定为 `stderr`，不得污染 `stdout` 机器输出 contract。
6. CLI 只允许持有 composer、palette、highlight 和 preview 等 presenter-local state；canonical session truth 仍由 local orchestration service 托管。

## 3. Consequences

1. 输入 `/` 时，palette 可以在同一 live shell surface 中即时出现，而不是等 `Enter` 后才刷新。
2. `Up/Down`、`Tab`、`Esc`、`Ctrl+L` 等键盘语义可以通过统一 action model 收口到同一前台控制器。
3. session shell 的实现复杂度会上升，因为 runner、controller、Ink app 与 fallback seam 的边界必须显式建模。
4. 测试 seam 需要从“整行输入”升级到“逐键输入 + frame 演进”，优先使用 Ink Testing Library 覆盖 live input path。
5. future desktop 仍应复用同一份 session DTO 和 presenter 语义，而不是复制第二套 session/input owner。

## 4. Implementation Guidance

1. 推荐新增 `CliSessionShellInkRunner` 与 `CliSessionShellInkController` 作为前台输入 ownership 的默认实现。
2. 推荐最小 action 集至少覆盖：
   - `composer_changed`
   - `composer_submitted`
   - `palette_highlight_next`
   - `palette_highlight_previous`
   - `palette_accept_highlighted`
   - `palette_closed`
   - `session_clear_screen`
   - `session_exit_requested`
3. `readline` fallback 不得再承载默认 live palette 语义，只能作为兼容保底路径。

## 5. Compatibility

1. 本 ADR 不改变 `contract.cli.session-shell.v1` 已有的 service-owned session truth、`stderr-only` 与 handoff preview 治理边界。
2. 本 ADR 允许分阶段落地：先接管 Ink input baseline，再推进 action-driven runner，最后做默认 cutover。
3. docs-only promotion 不等于实现已经完成；实际实现仍应在 follow-up execution window 中补齐 runner/controller/test seam。
