# CLI Interactive Shell Contract

- Status: active
- Date: 2026-03-28
- Contract ID: `contract.cli.interactive-shell.v1`
- Producer Module: `runtime.cli-interactive-shell`

## 1. 目标

定义 CLI React 风格交互壳层的最小运行 contract，使 `init / connect / workspace / upgrade / workflow` 等配置 surface 能在不破坏自动化契约的前提下共享统一 shell。

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

## 4. Required Constraints

1. `--no-interactive`、非 TTY、`json/plain` 必须强制落到 `ui_mode=none`，不得渲染 shell。
2. React shell 必须只渲染到 `stderr`，不得污染 `stdout` 机器输出。
3. `confirming -> submitting -> running` 是允许的标准流转；参数映射失败必须落到 `failure`。
4. `workflow` 命令必须通过显式 Commander 子命令树注册，不允许隐藏字符串分支。
5. Shell 生命周期必须在 `SIGINT`、退出和 fallback 场景下显式 `unmount` 与恢复终端状态。
6. 表单 descriptor 负责字段定义与验证规则，组件只负责渲染与事件转发。

## 5. Error and Fallback Semantics

1. shell 初始化失败时，必须降级到 classic prompt 或返回可诊断错误。
2. 输出 contract 不能因交互壳层启用而改变 `pretty/plain/json` 的 machine schema。
3. workflow preview/edit 若遇到 contract 级错误，必须保留可回退的只读摘要。

## 6. Loading Guidance

1. 命中 `technical_solution_module_change`、`technical_solution_promotion_change`、`cli_ui_change`、`command_surface_change` 时加载。
2. 当问题涉及 shell lifecycle、stderr 输出边界或 workflow 命令注册时，优先补载本 contract。
