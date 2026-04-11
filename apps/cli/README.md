# @repo-ai-governor/cli

- Status: baseline
- Date: 2026-04-11
- Scope: `project-009-production-readiness / TK-075,TK-076`; `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout / TK-656~TK-667`; `project-082-session-shell-readability-and-workspace-discoverability / TK-765~TK-767`; `project-083-session-shell-theme-choice-and-readability-followup / TK-768~TK-770`

## Purpose

承接 `repo-ai-governor` 的命令行入口与 Stage 9 最小可执行治理链路，确保关键命令具备真实可运行语义。

## Public Command Surface

1. 初始化与审计：`init`、`check`
2. 多工具接入与 readiness：`connect`、`doctor`
3. 产品化工作流与受治理执行：`plan`、`run`、`review`、`review-verify`
4. 会话入口：无子命令 session shell、`resume`
5. adopter 安装生命周期：`adopt list`、`adopt apply`、`adopt diff`、`adopt verify`、`adopt upgrade`、`adopt remove`
6. 流程与生命周期：`workflow`、`upgrade`
7. workspace 与壳层偏好：`workspace`、`set-ui-theme`
8. 宿主分发：`host export`、`host verify`、`host pack`

## Notes

1. 命令描述与提示文案通过 `packages/shared/src/i18n` 提供的 `i18next` runtime 渲染，可用 `--locale <locale>` 固定人类可读输出语言。
2. `init/doctor/check` 已收敛为可执行语义；`connect` 负责 adapter onboarding，`doctor` 提供公开 readiness 诊断入口；底层 verification runtime 仅保留为 internal gate；`run` 已接入 compiler/runtime/policy/audit/report 最小链路，但公开语义收窄为 reusable governed workflow / task-driven execution flow，不再默认承接泛化“帮我实现”请求。
3. `review/review-verify/plan/upgrade/workflow` 提供可执行边界并产出可追踪 artifact；`plan` 支持 `preview|commit`，`workflow` 支持 `preview|create|edit`。
4. 输出契约支持 `pretty/plain/json` 与 `--output/--verbosity/--no-color`。
5. non-TTY 环境中，`pretty` 会自动降级到 `plain`；`json` 显式请求保持机器输出。
6. 失败输出包含结构化字段：`error_code`、`hint`、`next_action`。
7. `run` 支持 `--dry-run`、`--trace` 与 `--replay <path>`，并产出 `context/diagnostics/{trace,replay}` 诊断产物；它面向已明确目标后的执行流，而不是开放式实现讨论入口。
8. `review-verify` 结果会同时生成 `context/ledger-backfill/review-verify/*.json`，用于后续台账回填与归因。
9. 无子命令入口在交互式 TTY + `pretty` 模式下会进入 session shell；`resume` 可恢复最近一次或指定的持久化会话。
10. `workspace` 现在同时承接 `dry-run|execute|rollback|clear-config|switch-branch|set-ui-theme`，而顶层 `set-ui-theme` 负责持久化 React shell 主题；在交互式 TTY + `pretty` 下省略 `[theme]` 时，两条入口都会直接打开 selector。session shell 中输入 `/workspace` 会补齐这些 nested action 提示，而输入 `/workspace set-ui-theme` 会直接给出 `governor|catppuccin|calm` preset 选项；这仍只是 discoverability 增强，不是新的 public command family。
11. `adopt list/apply/diff/verify/upgrade/remove` 负责 built-in 或 override adoption pack 的解析、受管安装、差异检查、验证与移除；`self-host-complete` profile 只在显式选择时才会 materialize `repo_local` governance bootstrap surface。
12. `host export/verify/pack` 负责 staged host assets、verification summary 与 pack receipt；公开 host family 已覆盖 `codex`、`claude-code` 与 `github-copilot`，其中 `github-com-agent` 仍保持 reserved/fail-closed；公开的 service-host 根包入口固定为 `@cjhdev/repo-ai-governor/service-host`。
13. session shell 的默认可读性增强只调整 presenter 层的强调样式、关键 chrome 对比度、palette 可见条目数与摘要截断宽度；实际字体大小仍由宿主终端或 IDE 控制，不新增 shell-side font/theme preference。
