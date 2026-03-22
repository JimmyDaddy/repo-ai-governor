# @repo-ai-governor/cli

- Status: baseline
- Date: 2026-03-22
- Scope: `project-009-production-readiness / TK-075`

## Purpose

承接 `repo-ai-governor` 的命令行入口与 Stage 9 最小可执行治理链路，确保关键命令具备真实可运行语义。

## Baseline Commands

1. `init`
2. `doctor`
3. `check`
4. `run`
5. `review`
6. `review-verify`
7. `plan`
8. `upgrade`

## Notes

1. 命令描述与提示文案通过 `packages/shared/src/i18n` 提供的 `i18next` runtime 渲染。
2. `init/doctor/check` 已收敛为可执行语义；`run` 已接入 compiler/runtime/policy/audit/report 最小链路。
3. `review/review-verify/plan/upgrade` 提供最小可执行边界并产出可追踪 artifact，供后续阶段继续收敛。
4. 输出契约支持 `pretty/plain/json` 与 `--output/--verbosity/--no-color`。
5. non-TTY 环境中，`pretty` 会自动降级到 `plain`；`json` 显式请求保持机器输出。
6. 失败输出包含结构化字段：`error_code`、`hint`、`next_action`。
