# Session-Shell Ink-Owned Input Solution Review

- Status: proposed
- Date: 2026-03-30
- Project: `project-029-cli-session-first-agent-shell`
- Sprint: `sprint-004-polish-and-session-productization`

## 1. 背景

真实手工验收暴露了一个产品级缺口：当前 session shell 虽然使用 Ink 渲染 frame，但输入仍由 `readline` 在 frame 外单独收集。这种“`renderToString()` + 外部 prompt”结构可以支撑 submit-after-enter 的 MVP，却天然不适合：

1. 输入 `/` 时立即展示 slash palette
2. 在 palette 中用 `Up/Down` 移动高亮
3. 用 `Tab` 做 slash completion
4. 在不破坏 prompt 的前提下持续原地重绘 composer

因此，“live slash palette / composer”不应继续靠 `readline` 打补丁，而应让 Ink 自己接管输入和 frame 生命周期。

## 2. 结论

建议把 session shell 的前台输入所有权从 `CliSessionShellReadlinePromptAdapter` 迁移到 Ink，形成统一的 `Ink renderer + Ink input controller + service-backed session runner` 结构。

这不是本次修补窗口内继续追加的临时增强，而是下一阶段正式演进方向。

## 3. 当前实现为什么做不好

当前路径是：

1. `CliSessionShellRunner` 按行调用 `readLine()`
2. `CliSessionShellStderrRenderer` 用 `renderToString()` 生成整帧
3. `readline` prompt 在 frame 外独立显示

这个结构的问题：

1. frame 和输入光标不在同一个渲染树里，任何 live redraw 都需要手动修补 prompt 恢复。
2. `slashQuery` 只有在按下 `Enter` 后才能稳定进入 runner 状态机。
3. `Up/Down`、`Tab`、`Esc` 这类 palette 内快捷键会和 `readline` 自己的行编辑语义冲突。
4. 当前 draft technical solution 第 12 节已经把 session shell 目标定义为“底部 composer + command palette”，这更接近真正的 Ink app，而不是 frame 外另挂一条 shell prompt。

## 4. 建议架构

建议把 session shell 分成四层：

1. `CliSessionShellRunner`
   - 保留 orchestration client、slash/action dispatch、command handoff、transcript sync 的 runtime 职责。
2. `CliSessionShellInkController`
   - 新增 presenter/controller，拥有前台临时 view state：composer text、palette open state、highlight index、completion candidate。
3. `CliSessionShellInkApp`
   - 继续复用现有 `ReactCliSessionShellApp` 视图体系，但改为真正 mount 到 Ink instance，而不是 `renderToString()`。
4. `CliSessionShellInkInputAdapter`
   - 用 Ink 的输入能力直接消费按键事件，把字符输入、方向键、`Tab`、`Esc`、`Ctrl+L` 等统一转换成 controller action。

## 5. 目标文件落点

建议新增或演进：

1. `apps/cli/src/runtime/interactive-shell/session-shell-ink-runner.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-ink-input-adapter.ts`
4. `apps/cli/src/react-cli/views/session-shell-app.tsx`
5. `apps/cli/src/react-cli/views/composer-input.tsx`
6. `apps/cli/src/react-cli/views/slash-command-palette.tsx`

建议保留：

1. `CliSessionShellReadlinePromptAdapter`
   - 仅作为 fallback / non-live compatibility seam，不再是默认 foreground input owner。

## 6. 行为方案

Ink-owned input 后，session shell 应满足：

1. 输入 `/` 立即打开 palette，并按前缀过滤命令。
2. `Up/Down` 只在 palette 打开时移动高亮，不再交给 `readline`。
3. `Tab` 应把当前高亮命令补全到 composer。
4. `Esc` 关闭 palette，但不清空 composer 文本。
5. `Enter`
   - 普通文本：发送主 agent turn
   - slash command：执行 builtin 或进入 handoff policy
6. `Ctrl+L` 清屏但不删除当前 session transcript。

## 7. 与当前修补版的关系

本次窗口已经修复：

1. `stderr` 原地刷新
2. `/doctor` 这类安全 handoff 不再额外 `/confirm`
3. `/exit` 会清掉 pending preview 残留

本次窗口不继续做：

1. 用 `readline` 拼接逐键 preview
2. 在现有 line-based prompt 上堆叠 palette 快捷键

原因是这会把最终方向锁死在错误层级。

## 8. 风险

1. Ink 接管输入后，当前 `readLine()` 驱动的 runner 循环要改成 action/event 驱动，属于结构性变更。
2. 需要重新定义 composer、palette、handoff preview 和 nested command execution 的焦点切换规则。
3. 必须持续守住 `stderr` only contract，不能让 live UI 污染 `stdout`。
4. 现有 session-shell unit tests 大多按“输入一整行 -> runner 处理”建模，测试 seam 需要升级。

## 9. 迁移步骤建议

1. 先新增 Ink controller 和 input adapter，不立刻删除 `readline` fallback。
2. 让 `CliSessionShellRunner` 改成接收 action stream，而不是直接阻塞式 `readLine()`。
3. 补齐 palette keyboard navigation、completion、composer live typing 测试。
4. 最后再把默认 foreground input owner 从 `readline` 切到 Ink。

## 10. 验收标准

1. 输入 `/` 后，palette 在同一 live shell surface 中即时出现。
2. `Up/Down` / `Tab` / `Esc` 的行为与 palette 状态一致。
3. 所有 live UI 仍只输出到 `stderr`。
4. `pnpm run build`、session-shell 目标测试、CLI output contract 测试全部通过。

## 11. 参考

1. Node `readline` 文档：`rl.line`、`emitKeypressEvents`、`cursorTo`、`clearScreenDown`
   - <https://nodejs.org/download/release/v22.17.0/docs/api/readline.html#rlline>
   - <https://nodejs.org/download/release/v22.17.0/docs/api/readline.html#readlineemitkeypresseventsstream-interface>
2. Ink 官方输入与实例 API
   - <https://github.com/vadimdemedes/ink#useinputinputhandler-options>
   - <https://github.com/vadimdemedes/ink#instance>
