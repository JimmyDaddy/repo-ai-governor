# @repo-ai-governor/cli

- Status: baseline
- Date: 2026-04-08
- Scope: `project-009-production-readiness / TK-075,TK-076`

## Purpose

承接 `repo-ai-governor` 的命令行入口与 Stage 9 最小可执行治理链路，确保关键命令具备真实可运行语义。

## Public Command Surface

1. 初始化与审计：`init`、`doctor`、`check`
2. 多工具接入：`connect`、`verify`
3. 受治理执行：`plan`、`run`、`review`、`review-verify`
4. 会话入口：无子命令 session shell、`resume`
5. 流程与生命周期：`workflow`、`upgrade`
6. workspace 与壳层偏好：`workspace`、`set-ui-theme`
7. 宿主分发：`host export`、`host verify`、`host pack`

## Notes

1. 命令描述与提示文案通过 `packages/shared/src/i18n` 提供的 `i18next` runtime 渲染。
2. `init/doctor/check` 已收敛为可执行语义；`connect/verify` 负责 adapter onboarding 与 readiness 真值；`run` 已接入 compiler/runtime/policy/audit/report 最小链路。
3. `review/review-verify/plan/upgrade/workflow` 提供可执行边界并产出可追踪 artifact；`plan` 支持 `preview|commit`，`workflow` 支持 `preview|create|edit`。
4. 输出契约支持 `pretty/plain/json` 与 `--output/--verbosity/--no-color`。
5. non-TTY 环境中，`pretty` 会自动降级到 `plain`；`json` 显式请求保持机器输出。
6. 失败输出包含结构化字段：`error_code`、`hint`、`next_action`。
7. `run` 支持 `--dry-run`、`--trace` 与 `--replay <path>`，并产出 `context/diagnostics/{trace,replay}` 诊断产物。
8. `review-verify` 结果会同时生成 `context/ledger-backfill/review-verify/*.json`，用于后续台账回填与归因。
9. 无子命令入口在交互式 TTY + `pretty` 模式下会进入 session shell；`resume` 可恢复最近一次或指定的持久化会话。
10. `workspace` 现在同时承接 `dry-run|execute|rollback|clear-config|switch-branch|set-ui-theme`，而顶层 `set-ui-theme` 负责持久化 React shell 主题。
11. `host export/verify/pack` 负责 staged host assets、verification summary 与 pack receipt；公开的 service-host 根包入口固定为 `@cjhdev/repo-ai-governor/service-host`。
