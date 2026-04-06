# integrations/ide Baseline

- Status: active
- Date: 2026-03-24
- Scope: `project-004-agent-adapter-runtime / TK-038`

## Purpose

提供 IDE/Agent 多入口接入骨架，统一“规范注入 + 命令包装”契约，避免各 IDE 插件各自拼装参数导致治理语义漂移。

## Directory Contract

1. `contracts/`：命令包装与规范注入的机器可读契约示例。
2. `examples/`：IDE 入口调用样例（当前提供 VS Code、JetBrains、Cursor 与 Claude Code 官方模板）。
3. `integrations/ide` 只保留 wrapper/contracts/examples 角色；真实 VS Code extension app 固定落在 `apps/vscode-extension`，并消费 shared/service-owned seam。
4. `command-wrapper.contract.json` 现在显式声明 `generic_ide / vscode / jetbrains / cursor / claude_code / web_ide` surface registry、能力声明、降级目标与 `nextAction`。
5. `integrations/ide/examples/README.md` 记录官方模板、`check:ide-entry-smoke` 与 `check:ide-docs-parity` 的执行基线。

## Wrapper Contract Baseline

1. 命令包装必须输出统一 envelope：
   - `argv`: CLI 调用参数
   - `env`: 跨入口共享环境变量
   - `metadata`: surface / outputMode / standards injection
2. 环境变量基线：
   - `REPO_AI_GOVERNOR_OUTPUT_MODE`
   - `REPO_AI_GOVERNOR_ENTRY_SURFACE`
   - `REPO_AI_GOVERNOR_STANDARDS_PROFILE_ID`
   - `REPO_AI_GOVERNOR_STANDARDS_SOURCES`
3. `additionalEnv` 不允许覆盖上述保留键，避免 wrapper metadata 与实际 env 发生漂移。
4. `REPO_AI_GOVERNOR_STANDARDS_SOURCES` 注入的是稳定 `source IDs`，不是当前仓库的具体文件路径。
5. 默认 source IDs：
   - `product_requirements_brief`
   - `overall_technical_solution`
   - `architecture_and_repo_layering`
   - `code_standards`
   - `long_term_maintenance_guide`
   - `agents_projection`
6. self-hosted 仓库中的实际文件路径由 `standards-injection.contract.json -> selfHostedSourceRegistry` 解析；外部接入仓库不得依赖本仓库 `.repo-ai-governor/...` 的内部布局。
7. surface registry 必须显式声明：
   - 能力集合（wrapper / standards injection / environment overlay / next-action hints）
   - 默认 output mode
   - 降级语义（当前统一允许回落到 `generic_ide` 或保持 baseline）
   - 入口失败后的 `nextAction`
8. 官方模板当前固定为：
   - VS Code: `vscode-task.sample.json` + `vscode-launch.sample.json`
   - JetBrains: `jetbrains-run-configuration.sample.xml`
   - Cursor: `cursor-task.sample.json`
   - Claude Code: `claude-code-commands.sample.json`
9. 官方模板允许显式追加 `--output json` 以保证 IDE 调试/任务面板稳定输出；同时必须保留 `REPO_AI_GOVERNOR_*` env 注入，避免 wrapper metadata 丢失。

## Implementation Notes

1. CLI 与 IDE 命令包装共享同一命令集合（`init/doctor/check/run/review/review-verify/plan/upgrade`）。
2. 默认 output mode 使用 `json`，优先服务 IDE 与自动化消费稳定性。
3. 默认 argv 入口使用 `node ./dist/bin/repo-ai-governor.js`，避免 `node repo-ai-governor` 在脚本解析阶段失败。
4. 扩展新 IDE surface 时优先更新 surface registry 与 contract JSON，再补示例，不直接在 wrapper 内写分叉逻辑。
5. Cursor / Claude Code 当前也统一走同一 wrapper baseline；后续若追加 surface-specific source IDs，只允许 append，不允许改写默认 source ID 顺序。
6. VS Code / JetBrains / Cursor / Claude Code 官方模板的可执行性由 `pnpm run check:ide-entry-smoke` 统一校验，并纳入 `pnpm run check`。
7. Cursor / Claude Code 的 contracts/examples/docs 同步由 `pnpm run check:ide-docs-parity` 统一校验，并纳入 `pnpm run check`。
