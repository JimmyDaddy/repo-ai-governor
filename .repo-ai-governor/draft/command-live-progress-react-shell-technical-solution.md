# Repo AI Governor 长时命令实时进度 React Shell 技术方案（Draft）

- Status: draft
- Date: 2026-03-30
- Scope: long-running CLI command live progress / React shell running state / progress event contract / cancellable execution seam
- Target Modules:
  - `entry.cli`
  - `runtime.cli`
  - `runtime.cli-interactive-shell`
  - `integrations.desktop`
- Related:
  - `apps/cli/src/main.ts`
  - `apps/cli/src/commands/connect-command.ts`
  - `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
  - `apps/cli/src/react-cli/app/react-cli-runner.ts`
  - `apps/cli/src/react-cli/session/react-cli-session-controller.ts`
  - `apps/cli/src/react-cli/bridge/react-cli-command-view-model-builder.ts`
  - `apps/cli/src/react-cli/views/layout-shell.tsx`
  - `apps/cli/src/runtime/presentation/command-experience-builder.ts`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/draft/session-shell-ink-input-takeover-technical-solution.md`
- External References:
  - [Ink README](https://github.com/vadimdemedes/ink)
  - [Ink UI README](https://github.com/vadimdemedes/ink-ui)
  - [React `useTransition`](https://react.dev/reference/react/useTransition)
  - [Node.js `AbortController`](https://nodejs.org/docs/latest/api/globals.html#class-abortcontroller)

## 1. 背景与问题

当前 CLI 在执行耗时较长的命令时，例如 `connect`、后续更重的 `doctor / verify / run --dry-run --trace`，会给用户一种“界面卡住”的体感。

这个问题的根因不是命令真正死锁，而是命令态 React shell 仍然是“结果后置渲染”模型：

1. `apps/cli/src/main.ts`
   - 当前先 `await governanceRuntime.execute(...)`
   - 命令全部执行完后，才把 `executionResult.reactCliViewModel` 一次性写到 stderr frame presenter
2. `apps/cli/src/commands/connect-command.ts`
   - candidate 构建、adapter verification、artifact 落盘、agent projection 构建这些耗时步骤都先跑完
   - 到尾部才组装最终 `reactCliViewModel`
3. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
   - 当前 `CliGovernanceCommandResult` 只暴露最终结果
   - `CliCommandExecutorContext` 也没有运行中进度事件、取消信号、或 view-session 更新通道

结果就是：

1. 用户可以看到 React shell，但它只是“结果展示壳”，不是“运行中交互壳”
2. 命令在执行期间没有任何阶段反馈、耗时反馈、日志尾部反馈
3. `connect` 越重，体感越像“挂住”
4. 后续如果继续把更多产品化 surface 放到 React shell，这个问题会成为所有长任务的共享缺陷

## 2. 方案目标

本方案要达成的目标是：

1. 在长时命令开始时立即挂载一个实时 React shell，而不是等命令结束后再渲染
2. 为命令执行链路增加一个稳定的运行中进度事件契约
3. 让 `connect` 成为第一条真正支持 live progress 的命令链路
4. 在命令执行期间持续展示：
   - 当前阶段
   - 已耗时
   - 最新状态
   - 关键 artifact / next action / warning
5. 保持 `stdout` 的机器可读 contract，不让 live UI 污染 `stdout`
6. 让后续 `doctor / verify / run --dry-run --trace` 可以复用同一条 live command shell seam
7. 为取消和 richer UI consumer 预留可演进契约，但不在第一轮就重写整个命令系统

## 3. 非目标

本方案明确不做以下事情：

1. 不把 CLI 命令执行 runtime 改写成 session-shell 那样的完整前台会话系统
2. 不让命令 executor 直接持有 Ink/React 实例
3. 不让 presenter 层成为新的执行事实源
4. 不改变 `plain/json` 输出模式的稳定 contract
5. 不在本轮引入 alternate-screen 全屏 TUI
6. 不为了 live progress 复制一套独立 desktop runtime

## 4. 外部参考结论

结合官方资料，本方案可以建立在现有技术栈之上，不需要换框架。

### 4.1 Ink 已经提供持续挂载与重渲染能力

Ink 官方 README 明确说明：

1. `render(<App />)` 会创建一个活动 app 实例
2. Ink app 生命周期可以通过 `unmount()` 和 `waitUntilExit()` 管理
3. `render()` 返回的实例可以用于持续存活的 CLI UI，而不是只能做一次性字符串渲染

这意味着：

1. 我们不需要继续停留在 `renderToString()` 的结果后置模式
2. 当前仓库已有的 `ReactCliRunner.mount(...)` / `mountSessionShell(...)` / `rerenderLiveSessionShell(...)` 路径，本质上已经验证了可行技术方向

### 4.2 Ink 适合“静态日志 + 动态头部/进度区”的组合模式

Ink README 中的 `<Static>` 组件被官方推荐用于：

1. 已完成任务列表
2. 日志
3. 一次写入、不再回流修改的历史输出

这对我们很关键：

1. 命令运行中的 spinner / elapsed / 当前阶段属于动态区
2. 已经完成的阶段日志、artifact ready 提示、warning 记录更适合 static 区
3. 这样可以减少大面积重绘，降低“整个框每次闪一下”的体感

### 4.3 Ink 官方输入/输出 hooks 已足够支撑命令态交互

Ink README 官方支持：

1. `useInput`
2. `useStdout`
3. `useStderr`
4. `useFocus`
5. `useFocusManager`

这说明：

1. 如果后续命令态 live shell 要支持取消、展开/折叠日志、切换 detail tab，不需要自建 raw terminal parser
2. 即使当前第一阶段不做复杂交互，也可以复用同一技术底座

### 4.4 Ink UI 已有 Spinner / ProgressBar / TextInput / Select 基础组件

`@inkjs/ui` 官方 README 说明：

1. `Spinner` 适合“正在处理中”
2. `ProgressBar` 适合百分比进度
3. `TextInput` 和 `Select` 适合后续 richer command UI

这意味着：

1. 第一阶段可以先用 `Spinner + elapsed + stage rows`
2. 后续如果需要做 live filter、artifact picker、retry/apply confirm，不必从零拼装组件

### 4.5 React `useTransition` 适合降低非紧急重绘优先级，但不能接管输入值

React 官方文档明确指出：

1. `useTransition` 适合 non-blocking updates
2. 可以显示 pending visual state
3. 但 transition updates 不能用于控制 text inputs
4. `await` 之后的 state update 需要再次包 `startTransition`

因此本方案的使用边界应该是：

1. `useTransition` 只用于非输入关键路径的面板刷新，例如 detail log、agent projection panel、复杂 summary 切换
2. 不能把命令输入框或键盘焦点依赖到 transition 语义上
3. 真正的运行中进度还是应该靠结构化 progress event，而不是指望 React 调度自动“变顺滑”

### 4.6 Node 官方 `AbortController` 适合作为取消信号基线

Node 官方 globals 文档已经把 `AbortController` 作为浏览器兼容的全局能力提供。

因此：

1. 命令取消信号不需要自造 token 体系
2. CLI runtime 可以统一采用 `AbortSignal`
3. 后续脚本执行、adapter probe、I/O 写盘、长时间 child process 都可以逐步接入同一个 cancel seam

## 5. 方案结论

建议将命令态 React shell 演进为“两段式产品化模型”：

1. `live running shell`
   - 命令开始后立即挂载
   - 持续展示运行状态
   - 接收进度事件
2. `final result shell`
   - 命令结束后继续复用现有 summary/result presenter
   - 保持当前 `CliGovernanceCommandResult` 和 `CliSuccessOutputPayload` 输出契约

换句话说：

1. 不是推翻现有最终结果模型
2. 而是在它前面补上一层运行中反馈通道

## 6. 核心架构决策

### 6.1 决策 A：命令执行契约改为“最终结果 + 可选运行中进度”

当前 contract：

1. `governanceRuntime.execute(commandName)` 只返回最终 `CliGovernanceCommandResult`

建议演进为：

```ts
interface CliGovernanceCommandExecutionOptions {
  progressSink?: CliCommandProgressSink;
  abortSignal?: AbortSignal;
}
```

```ts
execute(
  commandName: CliCommandName,
  options?: CliGovernanceCommandExecutionOptions,
): Promise<CliGovernanceCommandResult>
```

这样做的好处：

1. `plain/json` 模式完全可以不传 `progressSink`
2. React live shell 只是在需要时开启
3. 不会破坏现有命令返回结果模型

### 6.2 决策 B：运行中更新使用 progress event，而不是命令直接操作 view-model

不建议让 `connect-command.ts` 直接修改 React shell state。

建议新增传输无关的进度接口：

```ts
interface CliCommandProgressSink {
  emit(event: CliCommandProgressEvent): void;
}
```

推荐事件类型：

```ts
type CliCommandProgressEvent =
  | {
      kind: 'status';
      message: string;
      variant?: 'info' | 'success' | 'warning' | 'error';
    }
  | {
      kind: 'step';
      stepId: string;
      stage: ExecutionProgressStage;
      title: string;
      status: 'queued' | 'running' | 'completed' | 'warning' | 'failed';
      detail?: string;
    }
  | {
      kind: 'log';
      stream: 'summary' | 'detail';
      line: string;
    }
  | {
      kind: 'artifact';
      artifactId: string;
      path: string;
      label?: string;
    }
  | {
      kind: 'agent_projection';
      agentView: ExecutionReportAgentView;
    };
```

关键点：

1. `stepId` 是运行中 UI 的主键
2. `stage` 继续复用现有 `ExecutionProgressStage`，保证和最终 `experience` 词典一致
3. `stepId` 允许在同一个 `connect` stage 下拆出多个可见步骤，而不污染全局枚举

### 6.3 决策 C：命令运行面板要和最终结果面板分层，而不是把 running 状态硬塞进 `sections[]`

当前 `ReactCliViewModel` 适合结果摘要，但不适合运行中状态。

建议在 `ReactCliViewModel` 上做加法，而不是滥用 `sections[]`：

```ts
interface ReactCliCommandProgressPanelViewModel {
  title: string;
  phase: 'running' | 'completed' | 'failed' | 'cancelled';
  spinnerLabel?: string;
  elapsedLabel?: string;
  currentStatusLine?: string;
  canCancel: boolean;
  stepRows: Array<{
    stepId: string;
    title: string;
    status: string;
    detailLines: string[];
  }>;
  summaryLogTail: string[];
  detailLogTail: string[];
  artifactLines: string[];
}
```

```ts
interface ReactCliViewModel {
  // existing fields...
  commandProgressPanel?: ReactCliCommandProgressPanelViewModel;
}
```

这样：

1. `layout-shell.tsx` 能显式渲染“运行中面板”
2. 结果摘要、warning、agent projection panel、help 区仍保留现有结构
3. desktop/richer UI 后续也能复用同一个中立 view-model seam

### 6.4 决策 D：复用现有 `ReactCliRunner` 持续挂载能力，不新造第二套 UI runtime

当前仓库已经有：

1. `ReactCliRunner.mount(...)`
2. `ReactCliSessionController`
3. session-shell 的 live mount / rerender 模式

因此命令态 live progress 不应再新造一条平行 runtime。

建议新增：

1. `ReactCliCommandSessionController`
   - 管理命令运行中的 view-model snapshot
2. `CliCommandLiveProgressController`
   - 负责把 `CliCommandProgressEvent` 归约成 React view-model
3. `ReactCliRunner.mount(...)` 继续作为底层挂载器复用

### 6.5 决策 E：live command shell 必须继续坚持 `stderr-only`

当前 session-shell 已明确 live UI 只能渲染到 `stderr`，命令态也应保持一致。

推荐约束：

1. Ink mount 继续使用：
   - `stdin: process.stdin`
   - `stdout: process.stderr`
   - `stderr: process.stderr`
   - `exitOnCtrlC: false`
   - `patchConsole: false`
2. 最终机器可读结果仍由现有 `outputPresenter.writeSuccess(...)` 写到 `stdout`
3. 命令运行中的 UI、spinner、阶段信息、live logs 只能写到 `stderr`

这能保证：

1. `json/plain` 消费者不受污染
2. IDE wrapper / CI 集成仍能稳定消费 stdout

### 6.6 决策 F：运行中日志分为“静态历史”和“动态状态”两层

推荐 UI 分层：

1. 动态状态区
   - spinner
   - elapsed
   - current status
   - 当前 step rows
2. 静态历史区
   - 已完成步骤日志
   - artifact ready
   - warning 记录

原因：

1. 纯 append-only 历史适合 Ink `<Static>`
2. 动态区频繁 rerender，但体量小
3. 可以显著降低“整个框反复重绘”的闪动感

### 6.7 决策 G：取消信号使用 `AbortController`，但分阶段落地

建议在第一版就把 `abortSignal` 放进 command execution contract，但不要求所有命令一夜之间全部可取消。

分层要求：

1. `main.ts` / live runner
   - 创建 `AbortController`
   - 将 signal 传入 runtime execute
2. executor 层
   - 长耗时步骤在边界点检查 `signal.aborted`
3. 子过程 / script / probe
   - 优先在新接入路径上支持 abort
4. UI 层
   - 明确区分 `cancel_requested` 与 `cancelled`

## 7. 详细设计

### 7.1 入口层：先挂载 running shell，再执行命令

`apps/cli/src/main.ts` 的命令执行路径建议改成：

1. 解析 command name、output mode、TTY 条件
2. 如果满足：
   - `output=pretty`
   - `ui=react`
   - `stderr is tty`
   - 非 session-shell 内嵌受限路径
3. 则先创建：
   - `AbortController`
   - `CliCommandLiveProgressController`
   - `ReactCliCommandSessionController`
4. mount 初始 running shell
5. 将 `progressSink + abortSignal` 传入 `governanceRuntime.execute(...)`
6. 命令执行期间持续 rerender
7. 命令完成后：
   - 用最终 `executionResult.reactCliViewModel` 覆盖 running shell
   - 再按现有 contract 写 stdout success payload

### 7.2 `connect` 作为首个 live progress 命令的步骤拆分

建议 `connect` 先显式发出以下步骤：

1. `build_candidate`
   - `stage=connect`
   - 构建 candidate config
2. `validate_candidate`
   - `stage=connect`
   - schema / config validation
3. `verify_adapters`
   - `stage=verify`
   - adapter verification
4. `write_candidate_artifacts`
   - `stage=report`
   - 写 candidate / diff / merge explain
5. `build_agent_projection`
   - `stage=report`
   - 生成 agent view / projection panel facts
6. `write_diagnostics`
   - `stage=report`
   - 写 diagnostics artifact
7. `prepare_followups`
   - `stage=report`
   - 计算 next actions / prompts / checks

这样用户看到的不再是“connect 卡住”，而是：

1. 正在生成 candidate config
2. 正在验证 adapters
3. 正在写 artifacts
4. 正在构建 agent projection
5. 即将完成

### 7.3 运行中 view-model 归约策略

`CliCommandLiveProgressController` 建议只做归约，不做业务决策。

它负责：

1. 维护开始时间与 elapsed
2. 用 `stepId` 更新/替换 step row
3. 维护 summary/detail log tail
4. 维护 artifact ready 列表
5. 可选维护 `agentProjectionPanel`
6. 产出 `ReactCliViewModel`

它不负责：

1. 决定命令要做什么
2. 解释 adapter verification 业务逻辑
3. 决定最终 success/fail payload

### 7.4 `agent projection` 面板应支持“运行中预热”

当前 `connect` 只在尾部生成 `agentView` 和 panel。

建议演进为：

1. `connect` 在 `verify_adapters` 完成后即可 emit `agent_projection` 事件
2. live shell 可以提前显示：
   - selected surfaces
   - fallback routes
   - capability gaps
3. 最终结果 shell 继续复用正式 panel builder

这样能显著提升“命令正在做什么”的可解释性。

### 7.5 日志展示建议

不建议在 live running shell 中完整复刻最终 `checks / artifacts / experience / details` 大块摘要。

建议运行中面板只展示：

1. `status line`
2. `elapsed`
3. `latest 5-8 summary logs`
4. `latest 5-8 detail logs`
5. `artifact ready` 列表
6. `next action hint`（如果某一步已经能判断 warning/blocker）

最终大块摘要仍然等命令结束后用现有 final result shell 来展示。

### 7.6 取消与中断语义

建议语义如下：

1. `Ctrl+C`
   - 如果 live command shell 处于 `running`
   - 首次触发 `abortController.abort()`
   - UI 进入 `cancel_requested`
   - status line 显示“正在尝试取消”
2. 如果命令很快响应
   - shell 进入 `cancelled`
   - stdout 走标准错误输出
3. 如果命令未响应且用户再次 `Ctrl+C`
   - 允许走现有进程级退出路径

这能兼顾：

1. 用户感知上的“可取消”
2. 长任务内部实际响应取消需要时间
3. 不中断现有 CLI 进程安全边界

### 7.7 React 调度建议

`useTransition` 在本方案中应是“可选优化”，不是主设计支点。

推荐做法：

1. 运行中 elapsed timer、step row 状态更新先按普通 state 更新实现
2. 如果后续 detail log、agent projection panel 更新过于频繁，再把非关键更新包进 `startTransition`
3. 不把输入态、焦点态、取消键处理绑定到 transition

原因是：

1. 当前核心问题不是 React 调度不够高级
2. 而是根本没有运行中进度事件通道

## 8. 建议文件落点

### 8.1 新增

1. `apps/cli/src/types/interfaces/cli-command-progress.interface.ts`
2. `apps/cli/src/runtime/presentation/cli-command-live-progress-controller.ts`
3. `apps/cli/src/react-cli/bridge/react-cli-command-progress-view-model-builder.ts`
4. `apps/cli/src/react-cli/views/command-progress-panel.tsx`
5. `apps/cli/test/runtime/cli-command-live-progress-controller.test.ts`
6. `apps/cli/test/runtime/react-cli-command-progress-view-model-builder.test.ts`
7. `apps/cli/test/runtime/command-progress-panel.test.tsx`

### 8.2 修改

1. `apps/cli/src/main.ts`
   - 入口层先 mount running shell，再执行命令
2. `apps/cli/src/types/interfaces/cli-governance-runtime.interface.ts`
   - 增加 `CliGovernanceCommandExecutionOptions`
   - 增加 `progressSink` / `abortSignal`
3. `apps/cli/src/react-cli/state/react-cli-view-model.interface.ts`
   - 增加 `commandProgressPanel`
4. `apps/cli/src/react-cli/app/react-cli-runner.ts`
   - 继续复用 mount/rerender，必要时补更明确的 command-running helper
5. `apps/cli/src/react-cli/views/layout-shell.tsx`
   - 新增运行中面板渲染区
6. `apps/cli/src/commands/connect-command.ts`
   - emit live progress events
7. `apps/cli/src/commands/doctor-command.ts`
8. `apps/cli/src/commands/verify-command.ts`
9. `apps/cli/src/cli-governance-runtime.ts`
   - 将执行选项透传到 executor context

## 9. 分阶段实施建议

### Phase 1：Live shell skeleton

目标：

1. 命令一开始就显示 running shell
2. 有 spinner
3. 有 elapsed
4. 有 current status line
5. 完成后切到最终结果 shell

本阶段不要求：

1. 详细步骤事件
2. 取消
3. 静态日志历史

### Phase 2：`connect` 进度事件接入

目标：

1. `connect` 发出阶段进度事件
2. shell 实时显示 step rows
3. shell 实时显示 artifact ready
4. shell 可提前显示 agent projection panel

这是最有产品价值的一阶段，因为用户最先感知的“卡住”就来自 `connect`。

### Phase 3：取消与 richer logs

目标：

1. 加入 `AbortController`
2. `Ctrl+C` 触发取消请求
3. 引入 `<Static>` 历史日志区
4. 支持 summary/detail log tail

### Phase 4：跨命令推广

目标：

1. `doctor`
2. `verify`
3. `run --dry-run --trace`
4. 后续可能的 `workspace` / `workflow` 长步骤路径

统一接入同一 progress contract。

## 10. 风险与缓解

### 10.1 风险：事件顺序错乱或重复刷新

如果命令内部异步步骤并行，事件可能乱序。

缓解：

1. `stepId` 作为主键
2. controller 采用“replace by key”而不是纯追加
3. 日志 tail 与步骤状态分离

### 10.2 风险：过于频繁的 rerender 导致闪动

缓解：

1. elapsed timer 控制在 `250ms ~ 500ms`
2. 动态区和静态区分离
3. 只有 snapshot 真变更时才 rerender
4. 不在每条 detail log 上都全框重绘

### 10.3 风险：命令作者绕过 progress sink 直接写输出

缓解：

1. 明确 `stderr-only live UI` 规则
2. 命令实现应通过 progress sink 发用户可见运行中信息
3. 继续禁止面向用户的随意 `console.*`

### 10.4 风险：取消信号接入不完整

缓解：

1. 第一版先把 contract 建好
2. 第二版只保证 `connect` 等关键链路在步骤边界可取消
3. UI 明确区分“已请求取消”和“已完成取消”

## 11. 验证策略

### 11.1 单元测试

1. progress controller 正确归约 `status / step / log / artifact / agent_projection`
2. elapsed timer 不会导致无意义 snapshot 抖动
3. `commandProgressPanel` 在 clone/update 时不泄露数组所有权

### 11.2 React/InK 视图测试

1. running shell 初始 mount 成功
2. step row 更新会体现在 frame 中
3. `stderr-only` 不污染 stdout
4. final result shell 可以覆盖 running shell

### 11.3 命令级测试

1. `connect-command.test.ts`
   - 发出预期 step sequence
   - 最终结果 payload 不变
2. `connect-phase2.integration.test.ts`
   - 运行中 shell 与最终结果都能成立

### 11.4 真实 TTY smoke

建议新增一个带 artificial delay 的 smoke fixture，验证：

1. 启动 `connect` 后 1 秒内就能看到 spinner / elapsed / current stage
2. 中途阶段变化可见
3. 最终结果仍与当前 CLI contract 一致

## 12. 推荐实施顺序

我建议的落地顺序是：

1. 先做 `Phase 1`
2. 紧接着做 `Phase 2`
3. 暂时不要一开始就把所有命令都接进 live progress
4. 等 `connect` 证明方案稳定，再推广到 `doctor / verify / run`

原因很简单：

1. 当前最痛的问题是“长时命令看起来像卡住”
2. 最先被用户感知的是 `connect`
3. 只要 `connect` 成功切到 running shell + stage progress，产品体感会立刻改善

## 13. 最终建议

建议接受本方案，并按以下原则执行：

1. 不重写现有命令返回结果模型
2. 在现有结果模型前补一层运行中事件通道
3. 先把 `connect` 做成第一条 live progress 命令
4. live UI 永远留在 `stderr`
5. progress sink 与 abort signal 都采用传输无关契约

这条路径最稳，也最符合当前仓库已经存在的 React shell / Ink / session-shell 技术积累。
