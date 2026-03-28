# TK-307 M1 回归测试、fallback 与 non-interactive contract gate

- Status: completed
- Task ID: `TK-307`
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P0
- Project: `project-027-cli-interactive-shell-implementation`
- Sprint: `sprint-001-react-cli-shell-foundation`

## 1. 任务目标

为 M1 基线补齐测试和门禁，确保 shell foundation 不破坏现有 automation contract。

## 2. 产出

1. 单元测试基线
2. 组件/集成测试基线
3. non-interactive / fallback gate

## 3. 约束

1. `--no-interactive` 与 machine output contract 优先于任何 shell 默认行为。
2. 测试必须覆盖 `stderr` 渲染、SIGINT 与 fallback。
3. 失败路径必须可诊断，不允许静默退化。

## 4. 执行记录

1. 2026-03-28：新增 `apps/cli/test/runtime/interactive-shell-ui-mode-resolver.test.ts`，覆盖 default classic、explicit react、`no-interactive`、`plain/json`、非 TTY 与 `tui -> classic` fallback。
2. 2026-03-28：新增 `apps/cli/test/runtime/init-react-shell-runner.test.ts`，覆盖 descriptor/state 驱动的字段收集、validation feedback、confirmation 与 stderr unmount 边界。
3. 2026-03-28：扩展 `apps/cli/test/cli-output-contract.integration.test.ts`，验证 `--ui react` + `--no-interactive` fallback 以及非法 `--ui` 在 JSON 模式下仍保持稳定错误契约。
4. 2026-03-28：根据更严格的 CR 标准，追加 confirmation reject 后 restart-loop 测试，并把 SIGINT / teardown 双保险路径提升为需显式注释说明的 lifecycle-sensitive 实现。
