# Repo AI Governor `run` Live React Session Shell 技术方案（Draft）

- Status: draft
- Date: 2026-03-29
- Scope: CLI runtime UX / orchestration event streaming / live React session shell
- Target Modules:
  - `runtime.cli-interactive-shell`
  - `runtime.orchestration`
- Related:
  - `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-interactive-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
  - `apps/cli/src/commands/run-command.ts`
  - `apps/cli/src/cli-governance-runtime.ts`
  - `apps/cli/src/runtime/orchestration-service-runtime.ts`
  - `apps/cli/src/runtime/presentation/command-experience-builder.ts`
  - `apps/cli/src/runtime/interactive-shell/init-react-shell-ink-prompt-adapter.tsx`
  - `apps/cli/src/runtime/interactive-shell/init-react-shell-live-prompt.tsx`

## 1. 背景与问题

`project-027-cli-interactive-shell-implementation` 已经把 `init / connect / workspace / upgrade / workflow` 等 surface 接入了 React 风格 shell，并且在本地交互式 `TTY + pretty` 场景下默认进入 React 模式。

但 `run` 命令目前仍然只有“结束后输出结果”的模式，用户无法在执行过程中看到：

1. 当前处于哪个 runtime stage。
2. 哪些 agent / role lane 正在推进。
3. policy / HITL 为什么阻塞。
4. 哪些 artifact 已经落地。
5. inline review chain / delivery rehearsal / checkpoint 是否已经发生。

这会让真实项目里的 `run` 对人类使用者呈现为黑盒；而本产品的核心能力又恰恰是“多 Agent 编排 + 人工闸口 + 可审计运行时”。因此，`run` 的交互层不能只停留在静态 summary，必须提供执行中的 live session shell。

## 2. 目标

本方案的目标是：

1. 为 `run` 引入一个真正的 live React session shell，而不是执行结束后的静态结果页。
2. 保持 `stdout` 的 `pretty/plain/json` 输出 contract 不变，所有 live UI 只渲染到 `stderr`。
3. 让 live shell 直接消费 orchestration event stream，而不是在 UI 层自行推断业务真相。
4. 在本地人类交互场景默认启用 React shell，在 AI agent / CI / 非交互场景默认保持 `ui_mode=none`。
5. 先交付只读 monitor，再逐步演进到 HITL 决策交互与更广泛的长流程命令统一壳层。

## 3. 非目标

1. 本阶段不重写 `run` 的业务执行链，不改变 `CliGovernanceRuntime` 的治理语义。
2. 不把 `run` 直接做成 alternate-screen 全屏 TUI。
3. 不在第一阶段实现拖拽、鼠标面板重排或图形化 workflow editor。
4. 不改变现有退出码、artifact schema、`pretty/plain/json` machine output contract。
5. 不让 React 组件直接持有 runtime、policy、artifact 或 audit 的 canonical truth。

## 4. 硬约束

### 4.1 UI 模式约束

1. 本地人类交互式调用：`TTY + pretty + 非 agent/CI` 默认 `ui_mode=react`。
2. AI agent、CI、非 TTY、`plain/json`、`--no-interactive` 一律默认 `ui_mode=none`。
3. 显式 `--ui none` 必须始终可关闭 live shell。

### 4.2 输出通道约束

1. live shell 只能渲染到 `stderr`。
2. `stdout` 继续保留给既有 command result presenter。
3. shell teardown 后才能输出最终 summary，避免终端内容相互覆盖。

### 4.3 事实源约束

1. live shell 的执行状态必须以 orchestration service event stream 为准。
2. UI 层允许做聚合、排序、降噪和本地派生，但不得发明新的执行真相。
3. `run` 结束后仍保留既有 `commandExperienceBuilder.createRunCommandExperience(...)` 作为静态 summary 产物。

### 4.4 文案与可观测性约束

1. 所有用户可见文案必须通过项目 i18n runtime 提供。
2. shell 生命周期必须支持 `SIGINT`、异常退出、fallback 清理和 cursor-based resubscribe。
3. 所有新增 live 行为都必须在测试中验证 `stdout` 未被污染。

## 5. 现状与现成接缝

### 5.1 已存在的代码接缝

1. `apps/cli/src/commands/run-command.ts`
   - `run` 命令入口很薄，只负责把执行委托给 runtime facade。
2. `apps/cli/src/cli-governance-runtime.ts`
   - `executeRunCommand()` 已经掌握 `executionId`、compile、runtime、policy、HITL、artifact、report 的完整链路。
3. `apps/cli/src/runtime/orchestration-service-runtime.ts`
   - 已提供 `startExecution()`、`getExecution()`、`publishEvent()`、`subscribeExecution()`、`submitHitlDecision()` 等 live session 必需 seam。
4. `apps/cli/src/runtime/presentation/command-experience-builder.ts`
   - 已能在执行完成后把 runtime facts 转换成 `roleProgress`、`layeredLogs`、`interactionPrompts` 等静态 summary。
5. `apps/cli/src/runtime/interactive-shell/init-react-shell-ink-prompt-adapter.tsx`
   - 已经验证了 `Ink + @inkjs/ui + stderr-only` 的 live mount 模式可行。

### 5.2 已存在但尚未充分利用的事件能力

orchestration service contract 中已经存在以下事件类型：

1. `execution.started`
2. `stage.progress`
3. `stage.completed`
4. `artifact.ready`
5. `hitl.required`
6. `execution.interrupted`
7. `execution.completed`
8. `execution.failed`

其中 `stage.progress` 已存在于服务契约与测试中，但 `run` 当前主要发布的是完成态和产物态事件，尚未系统利用它来表达“进行中”的可见状态。这意味着 live shell 的 Phase 1 可以优先复用既有 contract，而不是先设计一条新的流。

## 6. 总体方案

采用“`run` 执行链 + orchestration event stream + stderr-only React live session”三段式结构。

### 6.1 运行流程

1. `run` 进入 `executeRunCommand()`。
2. 生成 `executionId`，完成 `startExecution()`。
3. 如果 `ui_mode=react`，挂载 `RunReactCliLiveSessionRunner` 到 `stderr`。
4. session runner 启动 cursor-based subscription loop，持续消费 orchestration events。
5. `CliGovernanceRuntime` 继续执行 compile、runtime、policy、HITL、artifact、report 写入。
6. session controller 将事件 reduce 为 UI state 并触发 Ink 重渲染。
7. 执行结束或中断后，runner unmount shell。
8. 现有 presenter 输出最终 `stdout` summary；machine-readable contract 保持不变。

### 6.2 新增组件

建议在 `apps/cli/src/runtime/interactive-shell/` 下新增以下运行组件：

1. `run-react-cli-live-session-runner.ts`
   - 负责 mount/unmount、subscription loop、cleanup、fallback、exit handshake。
2. `run-react-cli-session-controller.ts`
   - 负责接收 orchestration events、维护聚合态、生成 view state。
3. `run-react-cli-live-session-view.tsx`
   - 负责把 session state 渲染为 live shell。
4. `run-react-cli-session-state.interface.ts`
   - 定义 live session 的聚合数据结构。
5. `run-react-cli-session-reducer.ts`
   - 管理事件到 session state 的纯函数归约逻辑。

原则：

1. `CliGovernanceRuntime` 不直接负责 React view 拼装。
2. `session controller` 不直接执行 runtime side effects。
3. 组件层不直接碰 orchestration service client。

## 7. Session State 设计

建议把 live shell 的状态聚合成以下模型：

1. `executionMeta`
   - `executionId`
   - `taskId`
   - `projectId`
   - `sprintId`
   - `backend`
   - `serviceHostKind`
   - `serviceTransportKind`
2. `overallStatus`
   - `accepted | running | hitl_required | interrupted | completed | failed | cancelled`
3. `activeStage`
   - 当前 stage id
   - 当前 stage 开始时间
   - 当前 stage 最近一条进度消息
4. `stageTimeline[]`
   - 按 stage 聚合 `pending/running/completed/failed/interrupted`
   - 记录最近更新时间和摘要
5. `recentEvents[]`
   - 只保留最近 N 条事件，按 sequence 展示
6. `artifactCards[]`
   - `artifactId`
   - `artifactPath`
   - ready timestamp
7. `hitlState`
   - `required`
   - `awaitingDecision`
   - `decision`
   - `resumeAction`
   - `notificationArtifactPath`
   - `decisionReceiptPath`
8. `policyState`
   - `originalOutcome`
   - `effectiveOutcome`
9. `footerState`
   - `stderr_only`
   - `stdout_contract`
   - `fallback_behavior`

该状态模型只服务于渲染和局部聚合，不替代最终的 `commandResult.details`。

## 8. 视图设计

live shell 不做成“结果卡片”，而做成“会话监控面板”。

### 8.1 顶部固定状态条

展示：

1. `run` 标题
2. `executionId`
3. 当前 backend
4. `ui=react / stderr=only / stdout=pretty`
5. 当前整体状态
6. 当前活跃 stage

### 8.2 中间主区域

建议分三块：

1. `Stage Timeline`
   - 展示 stage 列表及其当前状态
   - 高亮当前运行 stage
2. `Recent Events`
   - 展示最近 N 条 orchestration events
   - 包括 stage 进展、artifact ready、policy/HITL 提示
3. `Artifacts / Attention`
   - 展示已落地产物路径
   - 展示当前阻塞原因和下一步提示

### 8.3 底部固定说明

展示：

1. 快捷键说明
2. `stdout` contract 稳定提示
3. fallback 状态
4. shell 只渲染到 `stderr` 的提醒

## 9. 事件消费与增量渲染策略

### 9.1 订阅策略

session runner 通过以下方式建立 live session：

1. 初次使用 `eventStreamToken` 订阅。
2. 拿到 `nextCursor` 后循环订阅增量事件。
3. 当 cursor 未推进时，进入轻量等待并继续轮询。
4. 当遇到 terminal event 时结束 loop。

### 9.2 事件到 UI 的映射

1. `execution.started`
   - 初始化 header/meta，显示“session attached”。
2. `stage.progress`
   - 更新 `activeStage` 与对应 timeline 项。
3. `stage.completed`
   - 将对应 stage 标为 completed/failed。
4. `artifact.ready`
   - 追加 artifact card。
5. `hitl.required`
   - 将整体状态提升为 `hitl_required`，并高亮 attention 区。
6. `execution.interrupted`
   - 显示中断原因与后续动作提示。
7. `execution.completed` / `execution.failed`
   - 切换终态并触发 shell 退出倒计时或直接 teardown。

### 9.3 `run` 侧需要补强的事件发布

为保证“执行中可见”，建议在 `run` 里逐步补齐以下发布点：

1. stage 进入时发布 `stage.progress`。
2. 长阶段关键节点可再次发布 `stage.progress`。
3. inline review chain、delivery rehearsal、checkpoint capture 等支线动作可用 `stage.progress` 或更丰富的 message 更新。

Phase 1 不要求把所有中间细节都事件化；但至少要让用户能看到“现在正在做什么”，而不是只在完成时看到结果。

## 10. 与现有 contract 的关系

### 10.1 `runtime.cli-interactive-shell`

当前 contract 更偏向“表单向导型 shell”，字段主要覆盖：

1. `command_name`
2. `descriptor_id`
3. `run_state`
4. `current_step_title`
5. `total_steps`
6. `form_values`
7. `validation_errors`

`run` live session 需要补充“执行监控型 shell”的字段。建议在 formalization 阶段扩展 contract，使其同时支持：

1. `execution_id`
2. `event_stream_token`
3. `execution_status`
4. `active_stage_id`
5. `stage_timeline[]`
6. `recent_events[]`
7. `artifacts[]`
8. `hitl_state`

兼容策略：

1. 若新增字段全部为 optional，可保持在同一 contract 版本内做向后兼容扩展。
2. 若 review 认为“表单型 shell”和“监控型 shell”差异过大，则在正式化时升级为新 contract 版本。

### 10.2 `runtime.orchestration`

本方案优先复用已存在的 orchestration event stream contract，不新增独立 UI 通道。

只有当 review 认定当前 `OrchestrationServiceEvent` 负载不足以表达 live session 必需信息时，才考虑在正式化时把“事件 message / typed payload”扩展为受控 contract 变更。

## 11. 分阶段实施建议

### 11.1 Phase 1: Read-only live monitor

目标：

1. `run --output pretty` 在本地 TTY 下默认显示 live React shell。
2. 只读展示 `stage timeline + recent events + artifacts + HITL state`。
3. 不在 shell 内处理输入式决策。

### 11.2 Phase 2: HITL interactive shell

目标：

1. 当 runtime 进入 `hitl_required` 时，在 shell 中显示 decision panel。
2. 支持 `approve / reject / revise` 或等价 resume action 的显式交互。
3. 与现有 `submitHitlDecision()`、decision receipt artifact 对齐。

### 11.3 Phase 3: Shared long-running command shell

目标：

1. 将 `check / review / workflow runtime` 等长流程命令统一到共享 live session shell。
2. 抽象出跨命令的 session controller / event mapping seam。
3. 让 command family 之间共享一套 stage/event/artifact presentation vocabulary。

## 12. 测试与验证

建议至少覆盖：

1. `run` 在 `TTY + pretty + react` 下会挂载 `stderr-only` live shell。
2. `plain/json/non-TTY/agent-like` 场景不会挂载 live shell。
3. `stdout` contract 在 live shell 启用前后保持不变。
4. event subscription loop 能正确处理 cursor 增量推进。
5. shell 在 `SIGINT`、异常、fallback、terminal event 下都会正确 unmount。
6. `hitl.required`、`artifact.ready`、`execution.failed` 在 UI 上有可见反馈。
7. i18n parity gate 通过，且 shell 文案不使用硬编码单语字符串。

## 13. 风险与评审点

### 13.1 主要风险

1. `CliGovernanceRuntime` 已经偏大，若继续直接吸收 live session 逻辑，容易进一步触发 God object 风险。
2. orchestration event 粒度不足时，UI 可能退化为“只是滚动日志”，不能真正表达阶段语义。
3. 如果 shell teardown 时机处理不好，可能污染本地终端或覆盖最终 summary。
4. 如果默认 React 规则定义过宽，AI agent 或脚本调用会被意外拉进交互模式。

### 13.2 需要重点评审的问题

1. `run` live shell 应继续收敛在 `runtime.cli-interactive-shell` 模块，还是拆成独立 runtime monitor 模块。
2. 现有 `contract.cli.interactive-shell.v1` 是做 optional 扩展还是升级新版本。
3. Phase 1 是否必须先补齐 `stage.progress` 发布，再开始 UI 接入。
4. HITL 交互应该何时进入 shell，而不是继续依赖命令行参数回灌。

## 14. 建议结论

建议先按本草案推进评审，并在评审通过后按以下顺序执行：

1. 先落 `Phase 1` 的 read-only live monitor。
2. 在不破坏 `stdout` contract 的前提下补齐 `stage.progress` 发布点。
3. 将 React live session controller 从 `CliGovernanceRuntime` 中抽离为独立运行组件。
4. Phase 1 稳定后再进入 HITL 交互。

这条路径能最快把 `run` 从“黑盒执行”提升为“可见、可解释、可治理的 live session”，同时不要求在第一轮就把 CLI 变成重型全屏 TUI。
