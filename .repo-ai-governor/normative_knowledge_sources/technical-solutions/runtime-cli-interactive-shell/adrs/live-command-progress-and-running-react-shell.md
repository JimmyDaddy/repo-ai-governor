# Live Command Progress And Running React Shell ADR

- Status: active
- Date: 2026-03-30
- Module ID: `runtime.cli-interactive-shell`
- ADR ID: `adr.runtime.cli-interactive-shell.live-command-progress-react-shell.v1`

## 1. Context

`runtime.cli-interactive-shell` 的 `v2` 已经完成：

1. command-scoped React shell baseline
2. session-first shell
3. Ink-owned session input
4. `stderr-only` live UI contract

但真实产品体验仍存在一个明显断点：

1. `connect` 等长时命令在执行期间缺乏运行中反馈
2. 当前 command React shell 主要是“最终结果壳”，不是“运行中壳”
3. 用户会把长时执行感知为“界面卡住”
4. 后续 richer CLI / desktop consumer 也缺少一条稳定的 running-state seam

继续让命令只在执行结束后一次性产出 `reactCliViewModel`，会把 command-scoped shell 永久锁死在结果后置模型上。

## 2. Decision

1. `runtime.cli-interactive-shell` 正式接受“长时命令 running shell”作为 command-scoped React shell 的下一条演进方向。
2. `CliGovernanceRuntime.execute(...)` 应补充可选 `progressSink` 与 `abortSignal` seam，但保持最终 `CliGovernanceCommandResult` 模型不变。
3. 命令执行期间的 UI 更新必须通过结构化 progress event 收口，不允许命令 executor 直接操作 Ink/React tree。
4. running shell 必须继续坚持 `stderr-only`，不得污染 `stdout` 的 machine-readable output contract。
5. running shell 应采用“动态状态区 + 静态历史区”分层；已完成步骤和日志适合 static 区，当前状态和 elapsed 适合动态区。
6. `connect` 作为第一条 live progress 命令链路，先落 candidate build、adapter verification、artifact writing、agent projection build 等阶段反馈。
7. 取消信号统一采用 `AbortSignal`；若实现尚未完成，UI 必须明确区分“可取消”与“尚未支持取消”。

## 3. Consequences

1. 长时命令可以在开始执行后立即展示 spinner、elapsed、阶段进度与关键 artifact，而不是静止等待最终结果。
2. `plain/json` 不需要承担 live UI 复杂度，因为 progress sink 是可选的。
3. CLI / desktop 可以共享同一条 transport-neutral running-state seam，而不是各自发明一套 progress 协议。
4. 控制器与 view-model 复杂度会上升，因为需要归约 progress events、去重 step rows、管理 log tail 与 cancel state。
5. docs-only promotion 不等于实现已完成；实际实现由 `project-032-command-live-progress-react-shell-productization` 承接。

## 4. Implementation Guidance

1. 推荐新增 `CliCommandProgressSink` 与 `CliCommandProgressEvent` typed seam。
2. 推荐新增 command-scoped live progress controller，将 event 归约为 `ReactCliViewModel` 的 `commandProgressPanel`。
3. 推荐复用现有 `ReactCliRunner.mount(...)` 与 session-shell live mount 经验，不新造第二套 Ink runtime。
4. 推荐 `connect` 先落第一版 live progress，再逐步推广到 `doctor / verify / run --dry-run --trace`。
5. 推荐取消语义采用“第一次 `Ctrl+C` 请求 abort、第二次允许硬退出”的双阶段策略，但只在真正支持 `AbortSignal` 的命令上暴露。

## 5. Compatibility

1. 本 ADR 不改变 `contract.cli.interactive-shell.v1` 的 `stderr-only` 与 machine-output 兼容边界，只把 command-scoped shell 的 accepted direction 扩展到 running-state。
2. 本 ADR 不改变 `contract.cli.session-shell.v1` 的 session truth、transcript continuity 与 Ink-owned foreground input 语义。
3. formal promotion 成立后，delivery ownership 必须切到 follow-up execution stream；不能因为 ADR 已 active 就声称 live progress 已实现完毕。
