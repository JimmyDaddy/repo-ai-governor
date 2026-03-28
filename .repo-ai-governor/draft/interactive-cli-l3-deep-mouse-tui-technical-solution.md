# Repo AI Governor L3 深度鼠标事件 TUI 技术实施方案（Draft）

- Status: draft
- Date: 2026-03-28
- Scope: CLI UX / deep mouse-interactive TUI
- Related:
  - `.repo-ai-governor/draft/interactive-cli-point-and-type-solution-survey.md`
  - `apps/cli/src/main.ts`
  - `apps/cli/src/cli-governance-runtime.ts`
  - `apps/cli/src/commands/init-command.ts`

## 1. 目标

在保留现有 CLI 自动化契约（`pretty/plain/json`、`--no-interactive`）前提下，新增一个 L3 级交互入口，提供：

1. 鼠标可点选（按钮、列表、分页、表单焦点切换）。
2. 鼠标滚轮与拖拽（滚动面板、列表浏览、视图区域切换）。
3. 键盘等价操作（鼠标不可用时不降级功能）。
4. 与现有 `CliGovernanceRuntime` 的无缝复用（不重写业务命令）。

## 2. 非目标

1. 不在首阶段把全部命令切入 TUI，先覆盖 `init/connect/doctor`，以降低鼠标事件终端兼容、状态管理和桥接分层的一次性验证风险。
2. 不改变现有命令语义与输出 schema。
3. 不将 TUI 渲染逻辑混入 `commands/*` 与 runtime 领域逻辑。

## 3. 总体架构

采用“交互壳层 + 命令桥接”分层：

1. `TuiApp`（壳层）
   - 负责生命周期：进入 alternate screen、raw mode、退出恢复。
   - 负责布局：顶部命令栏、左侧命令树、中区表单、底部日志区。
2. `TuiInputRuntime`（输入运行时）
   - 统一处理 keyboard/mouse/scroll/paste 事件。
   - 管理焦点、hover、点击命中、拖拽状态。
3. `TuiViewModelStore`（状态层）
   - 单向数据流（state -> render -> event -> reducer -> state）。
   - 保留命令执行状态机（idle/editing/running/success/failure）。
4. `TuiCommandBridge`（桥接层）
   - 将 UI 表单映射为 CLI 参数调用现有 runtime。
   - 提供 command-result 到 view-model 的归一化转换。
5. `CliGovernanceRuntime`（现有业务层）
   - 继续作为命令执行与治理规则入口，不感知 UI 细节。

## 4. 技术选型

## 4.1 主实现

1. `blessed`（或 `neo-blessed`）作为 Node TUI 基础库。
2. `node-pty` 用于需要 PTY 模拟的回归测试与终端行为验证。

选择理由：

1. Node 生态可直接接入现有 TS CLI。
2. 原生支持鼠标事件、滚动、列表、表单组件与焦点管理。
3. 不引入跨语言子进程 UI（降低交付复杂度）。

## 4.2 终端协议要求

1. 开启 `alternate screen`。
2. 开启 `raw mode` 与 `bracketed paste`。
3. 开启鼠标协议（SGR 1006 + wheel + motion）。
4. 在退出路径（正常退出/异常/中断）强制恢复终端状态。

## 4.3 语言路线决策

基于 `.repo-ai-governor/draft/interactive-cli-point-and-type-solution-survey.md` 的联网调研，当前建议如下：

1. Phase M1-M2 继续优先走 Node/TypeScript 路线。
   - 原因：可以直接复用现有 `CliGovernanceRuntime`、命令语义、输出契约和测试基线。
2. 如果目标是“现代 React 风格 CLI”，优先考虑 `Ink + @inkjs/ui`。
   - 这更适合 L2：组件化、键盘驱动、向导化、表单化。
3. 如果目标明确是 L3 深度鼠标事件 TUI，Node 侧优先考虑 `blessed / neo-blessed` 或 `terminal-kit`。
   - 原因：它们比 `Ink` 更贴近鼠标命中、滚轮、面板、焦点与低层终端控制需求。
4. 如果后续决定把 `ui` 做成独立 product surface，而不是 CLI 内嵌交互壳层，则重新评估跨语言路线：
   - Go：`Bubble Tea` 作为第一候选。
   - Python：`Textual` 作为“复杂交互快速验证”候选。
   - Rust：`Ratatui` 作为“原生性能与长期独立产品化”候选。

## 4.4 跨语言集成边界

若采用其他语言，推荐采用“独立 UI 壳层 + Node runtime 桥接”而非整体重写：

1. 继续由当前 Node CLI 持有 `pretty/plain/json`、`--no-interactive` 和命令语义契约。
2. 其他语言实现的 `ui` 只负责事件、布局、表单与视图状态。
3. UI 与 runtime 之间通过稳定的结构化协议桥接，例如 `stdin/stdout` JSON 或进程级 command bridge。
4. 禁止在第一阶段复制一套新的治理 runtime，避免多语言双份业务逻辑漂移。

## 5. 目录与模块设计（建议）

```text
apps/cli/src/tui/
  app/
    tui-app.ts
    tui-lifecycle.ts
  input/
    tui-input-runtime.ts
    mouse-event-normalizer.ts
    keymap-registry.ts
  state/
    tui-view-model.interface.ts
    tui-state-reducer.ts
    tui-state-store.ts
  bridge/
    tui-command-bridge.ts
    tui-command-form-mapper.ts
    tui-result-presenter.ts
  views/
    layout-shell.ts
    command-tree-panel.ts
    command-form-panel.ts
    run-log-panel.ts
    status-bar.ts
  constants/
    tui-command.constant.ts
    tui-keymap.constant.ts
  types/
    interfaces/*.interface.ts
    aliases/*.type.ts
```

CLI 入口建议：

1. 新增全局参数：`--ui`（实验入口）。
2. 新增命令：`ui`（显式启动 TUI）。
3. 约束：`--output json/plain` 时禁用 TUI，自动回落并提示。

## 6. 关键接口草图（Draft）

```ts
// apps/cli/src/tui/bridge/tui-command-bridge.ts
export interface TuiCommandInvokeRequest {
  commandName: 'init' | 'connect' | 'doctor';
  args: string[];
}

export interface TuiCommandInvokeResult {
  status: 'success' | 'failure';
  message: string;
  checks: Array<{ id: string; status: string; detail: string }>;
}

export interface TuiCommandBridge {
  invoke(request: TuiCommandInvokeRequest): Promise<TuiCommandInvokeResult>;
}
```

```ts
// apps/cli/src/tui/state/tui-view-model.interface.ts
export interface TuiViewModel {
  focusedPanel: 'command-tree' | 'form' | 'log';
  selectedCommand: string;
  formValues: Record<string, string | boolean>;
  runState: 'idle' | 'editing' | 'running' | 'success' | 'failure';
  logs: string[];
  mouseEnabled: boolean;
}
```

## 7. 命令覆盖优先级

阶段性命令接入顺序：

1. `init`（配置向导，低风险，最适合点选体验）。
2. `connect`（工具接入配置，表单化收益高）。
3. `doctor`（可展示检查列表与修复动作）。
4. `workspace`（在 PoC 稳定后接入）。
5. `upgrade`（最后接入，避免高风险命令先复杂化）。

## 8. 交互规则与可用性基线

1. 每个鼠标操作必须有键盘等价路径（Tab、箭头、Enter、Esc）。
2. 表单提交前有统一 validation 区与错误定位。
3. 长任务必须显示进度状态与可取消提示。
4. 所有外部动作都要有明确“确认层”（尤其 workspace/upgrade）。
5. `Ctrl+C` 行为可配置：返回上层/退出应用/中断当前执行。

## 9. 测试策略

## 9.1 单元测试

1. 状态 reducer（输入事件 -> 状态变更）。
2. mouse/key 事件归一化。
3. form mapper（UI 值 -> CLI 参数）正确性。

## 9.2 集成测试

1. TTY 环境下的 `--ui` 启动与退出恢复。
2. 非 TTY 下的自动回退（不得卡死）。
3. `--no-interactive` 与 `--ui` 冲突行为（优先级定义为禁用交互）。

## 9.3 端到端测试

1. `ui -> init` 完整流（点击/输入/提交）。
2. `ui -> connect -> doctor` 连续执行流。
3. 异常恢复（执行中断、错误面板、终端状态恢复）。

## 10. 风险与回退策略

主要风险：

1. 不同终端的鼠标事件支持差异导致行为不一致。
2. raw mode 清理不完整导致终端残留异常状态。
3. 业务逻辑侵入 UI 层，后续维护成本飙升。

回退策略：

1. 保留 `--no-interactive`、`--output json/plain` 的无 UI 快速路径。
2. `--ui` 作为实验能力逐步放量，不默认强依赖。
3. 任何 TUI 启动失败自动回退到现有 CLI 并输出可诊断错误。

## 11. 里程碑与执行计划（建议）

## M1（PoC，5-7 天）

1. `ui` 命令入口。
2. `init` 单命令鼠标点选表单。
3. 启停与恢复完整。

验收：

1. TTY 可用，非 TTY 自动回落。
2. `init` 支持点选 + 输入 + 提交。
3. 退出不污染终端。

## M2（可用版，7-10 天）

1. 接入 `connect/doctor`。
2. 命令树 + 结果区 + 日志区布局稳定。
3. 基本快捷键和焦点管理完备。

验收：

1. 三命令可在 TUI 内顺序执行。
2. 交互失败有可读错误与可重试路径。
3. 集成测试覆盖主路径。

## M3（稳定版，5-7 天）

1. 性能与兼容性修正（iTerm2/Terminal/VSCode Terminal）。
2. 完善异常与中断恢复。
3. 文档与运维指导补齐。

验收：

1. 终端兼容基线达标。
2. `pnpm run check` 全绿。
3. `ui` 文档可独立指导新用户完成初始化。

## 12. 任务拆解建议（可映射 TK）

1. TK-L3-001：搭建 TUI 壳层与生命周期管理。
2. TK-L3-002：输入运行时（鼠标/键盘归一化）。
3. TK-L3-003：状态管理与 reducer。
4. TK-L3-004：`init` 桥接与表单面板。
5. TK-L3-005：`connect` 桥接与结果展示。
6. TK-L3-006：`doctor` 桥接与检查面板。
7. TK-L3-007：TTY/非TTY 回退与冲突策略测试。
8. TK-L3-008：终端兼容矩阵验证与文档。

## 13. 结论

L3 深度鼠标事件 TUI 在本仓库可行，但必须坚持“UI 壳层与治理 runtime 分离”原则。

优先建议：先用 `--ui` 实验开关完成 M1/M2，再决定是否推广为默认交互入口。
