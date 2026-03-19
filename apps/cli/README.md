# @repo-ai-governor/cli

- Status: baseline
- Date: 2026-03-19
- Scope: `project-001-foundation / TK-006`

## Purpose

承接 `repo-ai-governor` 的命令行入口与命令骨架，确保 Stage 1 可稳定扩展后续真实执行逻辑。

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
2. 当前阶段命令执行为 skeleton 行为，后续迭代逐步替换为真实治理流程。
