# CLI Interactive Shell Contract

- Status: active
- Date: 2026-03-30
- Contract ID: `contract.cli.interactive-shell.v1`
- Producer Module: `runtime.cli-interactive-shell`

## 1. 目标

定义命令内 React 风格交互壳层的最小运行 contract，使 `init / connect / workspace / upgrade / workflow` 等配置 surface 能在不破坏自动化契约的前提下共享统一 shell，并为长时命令提供 running-state、elapsed 与 progress panel 的正式演进边界。

## 2. Minimum Fields

1. `ui_mode`
2. `command_name`
3. `descriptor_id`
4. `run_state`
5. `current_step_title`
6. `total_steps`
7. `form_values`
8. `validation_errors`
9. `stderr_rendering`
10. `stdout_contract`
11. `locale`
12. `fallback_behavior`
13. `progress_panel`
14. `status_line`
15. `elapsed_label`
16. `cancel_capability`

## 3. Allowed Values

1. `ui_mode`
   - `none`
   - `classic`
   - `react`
   - `tui`
2. `run_state`
   - `idle`
   - `editing`
   - `validating`
   - `confirming`
   - `submitting`
   - `running`
   - `success`
   - `failure`
   - `cancelled`
3. `stdout_contract`
   - `pretty`
   - `plain`
   - `json`
4. `cancel_capability`
   - `none`
   - `supported`
   - `cancel_requested`

## 4. Required Constraints

1. `--no-interactive`、非 TTY、`json/plain` 必须强制落到 `ui_mode=none`，不得渲染 shell。
2. React shell 必须只渲染到 `stderr`，不得污染 `stdout` 机器输出。
3. `confirming -> submitting -> running` 是允许的标准流转；参数映射失败必须落到 `failure`。
4. `workflow` 命令必须通过显式 Commander 子命令树注册，不允许隐藏字符串分支。
5. Shell 生命周期必须在 `SIGINT`、退出和 fallback 场景下显式 `unmount` 与恢复终端状态。
6. 表单 descriptor 负责字段定义与验证规则，组件只负责渲染与事件转发。
7. 本 contract 只覆盖“显式子命令内部的交互壳层”；无子命令默认进入的 session-first shell 由 `contract.cli.session-shell.v1` 管理。
8. 当命令存在明显长时执行窗口时，React shell 应在昂贵工作开始前进入 `run_state=running`，而不是等最终结果 ready 后才首次渲染。
9. `progress_panel` 必须由传输无关的 progress event seam 驱动，命令 executor 不得直接持有或操作 Ink/React 实例。
10. `status_line`、`elapsed_label` 与 `progress_panel` 的 live 更新只能渲染到 `stderr`；最终 `stdout` success/error payload contract 仍由命令执行结果负责。
11. 若命令声明 `cancel_capability=supported`，取消必须通过标准化 `AbortSignal` seam 收口；若命令尚不支持取消，不得在 UI 中伪造“可取消”语义。
12. `progress_panel` 的行更新必须以稳定 key 收口，允许一个 `ExecutionProgressStage` 下存在多个 UI step，但不允许用无限追加日志替代结构化进度。

## 5. Error and Fallback Semantics

1. shell 初始化失败时，必须降级到 classic prompt 或返回可诊断错误。
2. 输出 contract 不能因交互壳层启用而改变 `pretty/plain/json` 的 machine schema。
3. workflow preview/edit 若遇到 contract 级错误，必须保留可回退的只读摘要。
4. running shell 初始化失败时，CLI 可以回退到现有结果后置渲染路径，但不得破坏最终 success/error output 的稳定 contract。

## 6. Loading Guidance

1. 命中 `technical_solution_module_change`、`technical_solution_promotion_change`、`cli_ui_change`、`command_surface_change` 时加载。
2. 当问题涉及 shell lifecycle、stderr 输出边界或 workflow 命令注册时，优先补载本 contract。

## 7. Compatibility

1. `v1` 只保证 command-scoped React shell 的最小字段与 machine-output 兼容约束稳定。
2. `v1` 不覆盖 session transcript、resume pointer 或 slash command palette 的 presenter 语义；这些语义留给 session-shell contract。
3. `progress_panel`、`status_line`、`elapsed_label` 与 `cancel_capability` 是对 command-scoped shell 的正式增量边界；本轮 formalization 不等于代码已经完成交付，实际 implementation follow-up 由 `project-032-command-live-progress-react-shell-productization` 承接。
