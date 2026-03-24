# IDE Entry Templates

- Status: active
- Date: 2026-03-24
- Scope: `TK-110 / TK-111`

## Purpose

为 VS Code、JetBrains、Cursor 与 Claude Code 提供可直接复用的官方模板，并通过统一 smoke / parity gate 避免 templates、contracts、docs 与 CLI 最小链路漂移。

## Templates

1. `vscode-task.sample.json`
   - 提供 `init / doctor / check` 三个 task 模板。
   - 显式注入 `REPO_AI_GOVERNOR_*` 基线环境变量。
2. `vscode-launch.sample.json`
   - 提供 VS Code `check` 调试模板。
3. `jetbrains-run-configuration.sample.xml`
   - 提供 JetBrains shell run configuration 模板。
   - 保持与 VS Code 相同的 `json + en-US + surface env` 基线。
4. `cursor-task.sample.json`
   - 提供 Cursor task 模板。
   - 结构与 VS Code task 保持同构，只将 surface 固定为 `cursor`。
5. `claude-code-commands.sample.json`
   - 提供 Claude Code 命令包装模板与常见错误 `nextAction` 示例。
   - 保持与 contract surface registry 同一组 `REPO_AI_GOVERNOR_*` 基线环境变量。

## Standards Injection Baseline

1. `REPO_AI_GOVERNOR_STANDARDS_SOURCES` 使用稳定 `source IDs`，不是当前仓库的具体规范文件路径。
2. 当前官方模板固定注入：
   - `product_requirements_brief`
   - `overall_technical_solution`
   - `architecture_and_repo_layering`
   - `code_standards`
   - `long_term_maintenance_guide`
   - `agents_projection`
3. self-hosted 文件路径解析由 `integrations/ide/contracts/standards-injection.contract.json -> selfHostedSourceRegistry` 负责，模板和外部接入方不应依赖本仓库 `.repo-ai-governor/...` 布局。

## Smoke Gate

1. `pnpm run check:ide-entry-smoke`
   - 校验模板文件存在且结构合法。
   - 校验保留环境变量、surface 与命令序列不漂移。
   - 在临时仓库中执行 `init -> doctor -> check` 最小链路。
2. `pnpm run check`
   - 通过 `gate:ide-entry-smoke` 自动包含上述校验。

## Parity Gate

1. `pnpm run check:ide-docs-parity`
   - 校验 `command-wrapper.contract.json`、`integrations/ide/README.md`、本 README 与 Cursor/Claude Code 模板同步。
   - 校验 Cursor / Claude Code 的 `nextAction` 文案与 contract surface registry 保持一致。
2. `pnpm run check`
   - 通过 `gate:ide-docs-parity` 自动包含上述校验。

## Common Errors

1. Cursor
   - `ENTRYPOINT_COMMAND_WRAPPER_INVALID`
   - `nextAction`: `Retry with the Cursor wrapper template or omit surface to fall back to the generic IDE contract.`
2. Claude Code
   - `ENTRYPOINT_COMMAND_WRAPPER_INVALID`
   - `nextAction`: `Retry with the Claude Code wrapper template or omit surface to fall back to the generic IDE contract.`
   - `CONFIG_SCHEMA_VALIDATION_FAILED`
   - `nextAction`: `Add the repo-local governor.yaml baseline before invoking Claude Code commands.`
