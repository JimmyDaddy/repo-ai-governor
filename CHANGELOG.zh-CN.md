# 变更日志

## Unreleased

## 新增

1. 为每个示例场景补齐可执行资产：
   - `scenario.json`
   - `fixtures/input.md`
   - `expected/runtime-baseline.json`
2. 新增运行 smoke 门禁：`pnpm run check:examples-runtime-smoke`。
3. 新增本地接入手册与双语接入文档。

## 变更

1. `check:examples-smoke` 现已串联文档 smoke 与运行 smoke。
2. `gate:examples-smoke` 现改为委托聚合脚本 `check:examples-smoke`。
3. runtime smoke 已强制校验 `expected/runtime-baseline.json` 的 operation 一致性。

## 迁移说明

1. 若你之前将 `check:examples-smoke` 视为“仅文档校验”，请改用：
   - 仅文档：`check:examples-doc-smoke`
   - 完整示例门禁：`check:examples-smoke`
2. 场景维护时，需保持以下两处 operation 映射一致：
   - `scenario.json` 的 `commands[].expect.operation`
   - `expected/runtime-baseline.json` 的 `expectedCommandOperations`
3. 机器消费保持 `--output json`，并依赖稳定字段：
   - `status`
   - `command`
   - `command_result.operation`
