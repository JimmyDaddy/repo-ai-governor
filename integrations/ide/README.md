# integrations/ide Baseline

- Status: active
- Date: 2026-03-21
- Scope: `project-004-agent-adapter-runtime / TK-038`

## Purpose

提供 IDE/Agent 多入口接入骨架，统一“规范注入 + 命令包装”契约，避免各 IDE 插件各自拼装参数导致治理语义漂移。

## Directory Contract

1. `contracts/`：命令包装与规范注入的机器可读契约示例。
2. `examples/`：IDE 入口调用样例（当前提供 VS Code task 示例）。
3. 代码实现入口统一复用 `apps/cli/src/ide-command-wrapper.ts`，不在 `integrations/ide` 内重复实现业务逻辑。

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
3. 规范注入默认来源：
   - `product-requirements-brief`
   - `overall-technical-solution`
   - `architecture-and-repo-layering`
   - `code_standards`
   - `long-term-maintenance-guide`
   - `AGENTS.md`

## Implementation Notes

1. CLI 与 IDE 命令包装共享同一命令集合（`init/doctor/check/run/review/review-verify/plan/upgrade`）。
2. 默认 output mode 使用 `json`，优先服务 IDE 与自动化消费稳定性。
3. 默认 argv 入口使用 `node ./dist/bin/repo-ai-governor.js`，避免 `node repo-ai-governor` 在脚本解析阶段失败。
4. 扩展新 IDE surface 时仅新增 surface 映射与示例，不改动核心 wrapper 语义。
