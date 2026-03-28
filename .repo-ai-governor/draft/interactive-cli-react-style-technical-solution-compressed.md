# Repo AI Governor React 风格交互式 CLI 技术实施方案（Compressed）

- Status: draft
- Date: 2026-03-28
- Source: [interactive-cli-react-style-technical-solution.md](./interactive-cli-react-style-technical-solution.md)

## 1. 一句话结论

当前阶段优先做 `Ink + @inkjs/ui` 的 React 风格 CLI，而不是直接做深度鼠标 TUI。

原因很简单：

1. 当前最主要的问题是“配置更人性化”，不是“做一个全屏终端应用”。
2. 现有 Node.js + TypeScript CLI 可以低成本接上 React 风格壳层。
3. `pretty/plain/json` 和 `--no-interactive` 这套自动化契约必须保留。
4. 流程定制有底层 DSL / Compiler 支持，但用户侧入口还不够好用，适合单独做 `workflow` 向导。

## 2. 当前是否支持流程定制

结论：

1. 底层支持已经有了。
2. 产品化、交互友好的流程定制入口还没有。

现有基础包括：

1. `packages/core-process` 已有 `ProcessDslDefinition`、`ProcessNodeType`、`ProcessCompiler`。
2. 现有节点模型已覆盖 `Sequential / Parallel / Loop / Condition`。
3. CLI 当前更像“固定流程 + 程序化 assembly”，不是“用户可编辑流程设计器”。

因此，React CLI 方案里应把 `workflow` 作为独立能力，而不是塞进 `init`。

## 3. 推荐架构

采用四层：

1. `CLI Command Entry`
2. `ReactCliShell`
3. `ReactCliSessionController + CommandBridge`
4. `CliGovernanceRuntime / existing presenters`

关键原则：

1. React 层只持有交互状态，不持有业务真相。
2. 命令逻辑继续复用现有 runtime。
3. React 壳层失败时必须能回退 classic prompt。
4. React UI 渲染到 `stderr`，最终结果继续走现有 presenter。

## 4. 界面原则

目标不是“更炫”，而是“更清楚、更少心智负担”。

1. 每屏只表达一个决策点。
2. 主按钮只有一个。
3. 重要信息层次分明，错误靠近字段。
4. 允许返回、跳过、取消。
5. 默认值优先，复杂项后置。

React CLI 应该把“可测试性、可访问性、主题化”作为第一批需求，而不是后补。

## 5. 技术选型

主实现：

1. `Ink`
2. `@inkjs/ui`

选它们的原因：

1. React 风格组件化最自然。
2. 有现成的输入、选择、多选、确认组件。
3. 官方有测试与可访问性支持，适合做长期可维护的 CLI shell。

不在首阶段引入：

1. 深度鼠标事件
2. alternate screen 全屏应用
3. 拖拽式图编辑
4. 跨语言 UI 子系统

## 6. 建议落地顺序

### M1

目标：先把最小可用的 React 配置向导跑通。

交付：

1. 新增 `--ui react`
2. 建立 React shell 骨架和状态机
3. 仅接入 `init`
4. 保留 classic fallback
5. 统一 `TTY + pretty + interactive` gating
6. 保留 `pretty/plain/json` 输出契约
7. 复用现有 `CliCommandName`、`WorkspaceMode`、`Locale`

验收：

1. `init --ui react` 能完成配置
2. 非 TTY 和 `--no-interactive` 自动回退
3. 现有 classic 路径不回归

### M2

目标：把配置向导扩成共享框架。

交付：

1. 抽出共享 `CommandDescriptor` 注册表
2. 统一字段渲染器：text/password/select/multi-select/confirm
3. 接入 `connect` 和 `workspace`
4. 抽出统一 help/error/footer
5. `init` 在 `TTY + pretty + interactive` 下默认走 React
6. 新增 `workflow preview`

验收：

1. `init/connect/workspace` 共享同一壳层
2. 交互步骤由 descriptor 驱动
3. `workflow preview` 只展示，不改写

### M3

目标：把流程定制从预览推进到可编辑、可保存、可验证。

交付：

1. `workflow create/edit/preview`
2. 节点编辑：`Sequential / Parallel / Loop / Condition`
3. Loop 节点强制展示 `maxCycles` 与 `maxWallTimeSeconds`
4. 支持连线与条件分支编辑
5. 保存为 workspace 配置文件
6. `connect/workspace` 默认切到 React，`upgrade` 保持显式开启

验收：

1. `workflow edit` 可保存流程定义
2. 保存后的流程能被编译器接受
3. 新用户不会被 JSON/YAML 直接劝退

## 7. `workflow` 交互草图

`workflow` 应该是“流程设计向导”，不是全功能图编辑器。

建议顺序：

1. 选动作：`create / edit / preview`
2. 选模板：`sequential-baseline / parallel-review / loop-guarded / condition-route`
3. 编辑节点：`stageId / routeKey / roleProfileId`
4. 编辑连线：`fromNodeId -> toNodeId`
5. Loop 节点填写 guardrail
6. 预览 compiled IR
7. 保存到 workspace

建议首屏摘要：

```text
Workflow Designer

Template: loop-guarded
Process ID: repo-guided-flow
Entry node: node-planner

node-planner [SEQUENTIAL] ---> node-execute [PARALLEL] ---> node-review [LOOP]
                                                        ↘ condition: retry

Loop limits:
  maxCycles = 3
  maxWallTimeSeconds = 900
```

核心原则：

1. 先让用户看懂流程，再让用户编辑流程。
2. 先模板化，再轻编辑，最后才考虑复杂图编辑。
3. 不要一开始就做拖拽式编辑器。

## 8. 任务颗粒度

可以直接拆成以下任务：

1. `TK-RC-001`：UI mode 解析与 `--ui react` 入口
2. `TK-RC-002`：React CLI shell 与 session controller
3. `TK-RC-003`：`init` descriptor / form mapper / bridge
4. `TK-RC-004`：`connect/workspace` descriptor 化改造
5. `TK-RC-005`：输出流与 presenter 契约回归测试
6. `TK-RC-006`：`init` 默认切换与 classic fallback
7. `TK-RC-007`：`upgrade` 风险确认与 `workflow` PoC

## 9. 方案审视

保留的点：

1. `Ink + @inkjs/ui` 是合适底座。
2. 统一 session/bridge 层是必要的。
3. `workflow` 先模板、预览、轻编辑，再扩展完整编辑器，是更稳妥的路径。

需要收紧的点：

1. 不要把 `workflow` 过早做成完整图编辑器。
2. 可测试性和可访问性要前置。
3. 默认体验要轻，不要把简单配置做重。

## 10. 参考资料

1. Ink: https://github.com/vadimdemedes/ink
2. Ink UI: https://github.com/vadimdemedes/ink-ui
3. Ink testing library: https://github.com/vadimdemedes/ink-testing-library
4. Inquirer.js: https://github.com/SBoudrias/Inquirer.js
5. Clack: https://github.com/bombshell-dev/clack
6. Textual: https://textual.textualize.io/guide/input/ , https://textual.textualize.io/widgets/
7. Bubble Tea: https://github.com/charmbracelet/bubbletea
8. Bubbles: https://github.com/charmbracelet/bubbles
9. Huh: https://github.com/charmbracelet/huh
