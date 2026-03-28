# @repo-ai-governor/cli

- Status: baseline
- Date: 2026-03-28
- Scope: `project-009-production-readiness / TK-075,TK-076`

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
7. `run` 支持 `--dry-run`、`--trace` 与 `--replay <path>`，并产出 `context/diagnostics/{trace,replay}` 诊断产物。
8. `review-verify` 结果会同时生成 `context/ledger-backfill/review-verify/*.json`，用于后续台账回填与归因。
9. `init` 新增实验性 `--ui react` 入口：最小向导只渲染到 `stderr`，并在 `--no-interactive`、非 TTY、`plain/json` 下自动回退到 `none`。
