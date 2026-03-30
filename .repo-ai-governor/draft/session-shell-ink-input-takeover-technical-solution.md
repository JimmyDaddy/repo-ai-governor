# Repo AI Governor Session-Shell Ink 输入接管技术方案（Draft）

- Status: draft
- Date: 2026-03-30
- Scope: session-shell live composer / slash palette / keyboard routing / Ink-owned input lifecycle
- Target Modules:
  - `runtime.cli-interactive-shell`
  - `entry.cli`
  - `integrations.desktop`
- Related:
  - `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/sprint-004-polish-and-session-productization/session-shell-ink-owned-input-solution-review-20260330.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
  - `apps/cli/src/runtime/interactive-shell/session-shell-readline-prompt-adapter.ts`
  - `apps/cli/src/react-cli/views/session-shell-app.tsx`

## 1. 背景与问题

`project-029` 已经把 session-first shell 的基础能力收口到可运行状态，但真实手工验收暴露出一个结构性问题：

1. 当前 session shell 的 frame 由 Ink 渲染。
2. 当前 session shell 的输入仍由 `readline` 在 frame 外按行收集。
3. 因此，slash palette 只能在 `Enter` 之后更新，不能在输入 `/` 时即时出现。
4. `Up/Down`、`Tab`、`Esc`、`Ctrl+L` 这类会话级快捷键也无法稳定落到统一输入状态机。

这不是“少几个键盘监听”的局部问题，而是输入 ownership 落在了错误层级。

当前结构是：

1. `CliSessionShellRunner`
   - 按行 `readLine()`
2. `CliSessionShellStderrRenderer`
   - `renderToString()` 后整体刷 frame
3. `readline`
   - 在 frame 外单独持有 prompt 和行编辑语义

在这个结构下，任何 live slash palette / live composer 都需要围绕 `readline` 做补丁式兼容，最终会把产品行为锁死在错误的输入模型上。

## 2. 方案结论

建议将 session shell 的前台输入所有权从 `CliSessionShellReadlinePromptAdapter` 迁移到 Ink，形成：

1. Ink 负责 live input capture、focus、paste、cursor 和 rerender lifecycle。
2. session-shell runner 负责 orchestration、slash command dispatch、command handoff、transcript sync。
3. local orchestration service 继续持有 canonical session truth。

换句话说：

1. CLI 仍然只是 presenter + client。
2. 但 presenter 的输入层不再是 frame 外 `readline`，而是同一棵 Ink 树中的 composer / palette controller。

## 3. 外部参考结论

基于官方资料，Ink 本身已经提供了这次改造所需的大部分基础能力。

### 3.1 Ink 输入与焦点能力已经足够

Ink 官方 README 明确提供：

1. `useInput()`
   - 逐次接收用户输入与按键信息，适合统一处理字符输入、方向键和快捷键。
2. `useFocus()` / `useFocusManager()`
   - 允许组件显式参与 focus lifecycle，而不是把键盘事件永远交给单一输入框。
3. `useCursor()`
   - 允许组件在需要时显示光标，适合把 cursor ownership 放回 composer 组件内部。

这说明我们不需要自建 raw-terminal parser，也不需要继续把 focus 留给 `readline`。

### 3.2 Ink 渲染选项适合守住当前 contract

Ink `render()` API 支持：

1. 自定义 `stdout` / `stderr` / `stdin`
2. `exitOnCtrlC`
3. `patchConsole`
4. `debug`
5. `experimental`
6. `isScreenReaderEnabled`
7. `defaultDirection`
8. `stdin`
9. `stdout`
10. `stderr`
11. `experimental`, including `patchConsole` and `exitOnCtrlC`

其中对本方案最重要的是：

1. 可以把渲染输出显式绑定到 `process.stderr`，继续满足 session-shell `stderr only` contract。
2. 可以关闭 `exitOnCtrlC`，把 `Ctrl+C` 交回 session shell 自己的语义，而不是直接让 Ink 终止进程。
3. README 还明确提供 `incrementalRendering` 选项，可用于减少大 frame 重绘造成的闪烁。

### 3.3 `@inkjs/ui` 足够承接基础输入组件

`@inkjs/ui` 官方仓库和本地安装类型都表明：

1. `TextInput`
   - 支持 `placeholder`
   - 支持 `defaultValue`
   - 支持 `suggestions`
   - 支持 `onChange`
   - 支持 `onSubmit`
2. `Select`
   - 支持 `options`
   - 支持 `visibleOptionCount`
   - 支持 `highlightText`
   - 支持 `onChange`
3. `ConfirmInput`
   - 适合沿用现有确认型 UI 语义

这意味着：

1. composer 不需要从零手写字符输入组件。
2. slash palette 至少可以复用 `highlightText` 和 option rendering 思路。
3. 但 session-shell palette 仍应由我们自己的 controller 决定高亮与 handoff policy，不应把所有状态外包给 `Select`。

### 3.4 官方测试工具也支持这次演进

Ink 官方 `ink-testing-library` 支持：

1. `render()`
2. `rerender()`
3. `stdin.write()`
4. `stdout.frames`
5. `stderr.frames`

这对方案的价值很直接：

1. 可以在测试里真正驱动 `useInput()` 路径，而不再只测“按行输入一个字符串”。
2. 可以验证 live palette / focus / paste / confirmation transition 是否按 frame 演进。

## 4. 目标

本方案的目标是：

1. 输入 `/` 时，slash palette 在同一 live shell surface 中即时出现。
2. `Up/Down` 用于 palette highlight，而不是继续交给 `readline`。
3. `Tab` 能将当前高亮命令补全到 composer。
4. `Esc` 能关闭 palette，而不清空 composer 文本。
5. `Enter` 在普通文本与 slash command 之间遵守既有 contract 语法分流。
6. `Ctrl+C`、`Ctrl+D`、`Ctrl+L` 在 Ink-owned input 结构下仍保持与 session-shell contract 一致。
7. 整个 live shell 仍只输出到 `stderr`。

## 5. 非目标

1. 不改写 canonical session ownership；它仍属于 local orchestration service。
2. 不把 session shell 变成 alternate-screen 全屏 TUI。
3. 不在本轮实现鼠标事件、拖拽或复杂多 pane 布局。
4. 不改变 `json/plain` 场景下的输出 contract。
5. 不因为 Ink 输入接管而复制第二套 desktop/CLI session DTO。

## 6. 核心架构决策

### 6.1 决策 A：输入 ownership 上移到 Ink

新增一条新的前台控制链路：

1. `CliSessionShellInkRunner`
   - mount / unmount Ink instance
   - 注入 `stdin=process.stdin`
   - 注入 `stdout=process.stderr`
   - 注入 `stderr=process.stderr`
   - 配置 `exitOnCtrlC=false`
2. `CliSessionShellInkController`
   - 持有 presenter-only 前台状态
3. `CliSessionShellRunner`
   - 从“主动阻塞读取一行”改为“消费来自 controller 的 action”

结果是：

1. 输入和渲染在同一棵树里。
2. rerender 不需要再手工修补 prompt。
3. live palette 和 composer 才能成为真正的 product surface。

### 6.2 决策 B：保留 runner 的 runtime 职责，不把领域逻辑塞进组件

不建议让 React 组件直接调用 orchestration client 或 command executor。

建议分层：

1. `CliSessionShellInkController`
   - 只负责本地 view state 与 action dispatch
2. `CliSessionShellRunner`
   - 负责 slash resolution、handoff policy、transcript append、session subscribe

这样能避免把 `session-shell-app.tsx` 变成新的 god object，并继续遵守 `CS-027`。

### 6.3 决策 C：`TextInput` 作为 composer 基座，palette 仍由自定义 controller 驱动

建议：

1. composer 使用 `@inkjs/ui` 的 `TextInput`
   - 通过 `onChange` 获得实时文本
   - 通过 `onSubmit` 获得 Enter 提交
   - 用 `suggestions` 提供最轻量的命令补全
2. slash palette 继续使用自定义渲染组件
   - 保留命令说明
   - 保留 highlightSegments
   - 保留 handoff policy / preview hint

不建议直接把 `Select` 变成 palette 主体，原因是：

1. session shell 需要“同一个 composer 文本 + 下方命令列表”的并行模型。
2. `Select` 更适合独占焦点的选项列表，而不是和文本输入共享同一个键盘会话。
3. palette 的高亮移动、命令补全和 handoff preview 必须和 composer 文本强绑定。

### 6.4 决策 D：runner 输入模型改成 action-driven

当前模型：

1. `while (true)`
2. `readLine()`
3. 处理一整行

建议改成：

1. Ink 组件产生 action
2. controller 将 action 发送给 runner
3. runner 返回新的 presenter snapshot

推荐 action 最少包含：

1. `composer_changed`
2. `composer_submitted`
3. `palette_highlight_next`
4. `palette_highlight_previous`
5. `palette_accept_highlighted`
6. `palette_closed`
7. `session_clear_screen`
8. `session_exit_requested`

这样 multiline、paste、confirm gate、pending preview 都可以归到统一状态机，而不再依赖行输入的副作用。

### 6.5 决策 E：保持 `stderr-only` 输出边界

Ink instance 必须以 `process.stderr` 为 live render stream。

推荐约束：

1. `render(..., { stdout: process.stderr, stderr: process.stderr, exitOnCtrlC: false })`
2. session-shell 内部禁止直接用 `console.log()` 输出用户可见内容
3. nested command execution 期间，machine-readable `stdout` contract 仍由既有 command runtime 决定

这样做的原因是：

1. `cli-session-shell-contract` 已经明确 live UI 不能污染 `stdout`
2. CI / 集成消费者依然依赖 stdout 稳定性

### 6.6 决策 F：`readline` 退化为 fallback seam，而不是默认输入 owner

建议保留 `CliSessionShellReadlinePromptAdapter`，但降级为：

1. non-TTY fallback
2. debug / emergency compatibility seam
3. 未来如果 Ink raw-mode 不可用时的保底路径

不再让它继续充当前台默认输入通道。

## 7. 建议文件落点

```text
apps/cli/src/runtime/interactive-shell/
  session-shell-ink-runner.ts
  session-shell-ink-controller.ts
  session-shell-action-dispatcher.ts
  session-shell-readline-prompt-adapter.ts        # fallback only
  session-shell-runner.ts                         # runtime/core state machine

apps/cli/src/react-cli/views/
  session-shell-app.tsx
  composer-input.tsx
  slash-command-palette.tsx
  prompt-bar.tsx
  transcript-pane.tsx

apps/cli/test/runtime/
  session-shell-ink-runner.test.ts
  session-shell-ink-controller.test.ts
  session-shell-action-dispatcher.test.ts
  session-shell-runner.test.ts
```

## 8. 交互行为设计

### 8.1 composer

1. 默认焦点在 composer。
2. 每次输入字符都触发 `composer_changed`。
3. 当文本以 `/` 开头时：
   - `input_mode=slash_command`
   - `shell_mode=command_palette`
4. 当文本不以 `/` 开头时：
   - `input_mode=plain_text`
   - `shell_mode=session_shell`

### 8.2 slash palette

1. 输入 `/` 时展示全部可见命令。
2. 输入 `/wo` 时按前缀过滤。
3. `Up/Down` 只改变 `highlighted_command`。
4. `Tab`
   - 将当前高亮 command 补全到 composer 文本
5. `Esc`
   - 关闭 palette，但保留 composer 文本
6. `Enter`
   - 若当前为 slash command，按已补全文本执行 builtin 或 handoff policy

### 8.3 handoff preview

保持当前 contract：

1. 高副作用 `cli_handoff`
   - 进入 `command_handoff_preview`
   - 等待 `/confirm` 或 `/cancel`
2. safe `cli_handoff`
   - 直接执行，不额外多一层 confirm

Ink 输入接管不改变这个治理语义，只改变触发与展示方式。

### 8.4 `Ctrl+C` / `Ctrl+D` / `Ctrl+L`

1. `Ctrl+C`
   - 由 Ink input handler 接住
   - 转换为 session-shell exit 或 cancel action
2. `Ctrl+D`
   - 在空 composer 时可等价视为 EOF 退出
3. `Ctrl+L`
   - 清屏但不删除 canonical transcript
   - 只重置当前 viewport surface

## 9. 迁移计划

### 9.1 Phase 1: Ink input baseline

1. 新增 `CliSessionShellInkRunner`
2. 新增 `CliSessionShellInkController`
3. 将 `session-shell-app.tsx` 从静态 frame 渲染改为 mounted live tree
4. 保留 `readline` fallback，不改 contract

### 9.2 Phase 2: action-driven runner

1. 把 runner 从 `readLine()` 循环改成 action 消费者
2. 将 slash palette / composer / exit / clear / multiline 收口到统一 action model
3. 保持 service-backed transcript sync 不变

### 9.3 Phase 3: keyboard behaviors and tests

1. `Up/Down`
2. `Tab`
3. `Esc`
4. `Ctrl+L`
5. paste / long input / CJK input smoke

### 9.4 Phase 4: default cutover

1. 默认 foreground input owner 切到 Ink
2. `readline` 仅作为 fallback 保留
3. 更新 adoption docs / help surface

## 10. 风险与权衡

### 10.1 结构性改动风险

这是输入层 ownership 迁移，不是简单的 patch。风险点在于：

1. runner 从同步行输入切到 action 驱动
2. 测试 seam 需要升级
3. pending preview / nested command execution 的焦点规则要重新梳理

### 10.2 组件复用边界

虽然 `@inkjs/ui` 已经有 `TextInput` 和 `Select`，但 session-shell palette 不应被错误地建模成“普通 select”。否则：

1. composer 与 palette 会争抢焦点
2. slash metadata/handoff preview 无法自然接入

### 10.3 `stderr-only` 合规风险

如果 Ink 实例或任何辅助日志写回 `stdout`，会立即破坏当前 contract。这部分在实现和测试里都必须显式锁死。

### 10.4 desktop 收敛风险

若方案把 palette / composer 状态做成 CLI 私有领域对象，而不是 presenter-only surface，后续 desktop 会再次出现双实现风险。这里必须坚持“CLI 只拥有 presenter state”。

## 11. 验证建议

docs-only 方案阶段建议验证：

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

实现阶段建议新增：

1. `pnpm run build`
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-ink-runner.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts`
3. `pnpm exec vitest run apps/cli/test/cli-output-contract.integration.test.ts`

## 12. 评审焦点

这份方案建议评审时重点看四个问题：

1. 我们是否接受“composer 用 `TextInput`，palette 继续自定义 controller”的组件边界？
2. 我们是否接受把 runner 改成 action-driven，而不是继续围绕 `readLine()` 打补丁？
3. 我们是否接受 `readline` 只保留为 fallback，而不再做默认前台输入 owner？
4. 我们是否需要在 Phase 1 就一起收 multiline / paste，还是把它们留到 Phase 3？

## 13. 参考

1. Ink 官方 README
   - `useInput`, `useFocus`, `useFocusManager`, `useCursor`, `render`, `incrementalRendering`
   - <https://github.com/vadimdemedes/ink>
2. Ink UI 官方 README
   - `TextInput`, `Select`, `ConfirmInput`
   - <https://github.com/vadimdemedes/ink-ui>
3. Ink Testing Library 官方 README
   - `stdin.write`, `stdout.frames`, `stderr.frames`, `rerender`
   - <https://github.com/vadimdemedes/ink-testing-library>
