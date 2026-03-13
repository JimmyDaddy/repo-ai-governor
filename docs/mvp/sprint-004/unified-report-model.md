# Unified Report Model

- Date: 2026-03-14
- Task: `TK-501`
- Status: done

## Goal

定义一套统一报告模型，把 `check`、`review`、`review-verify` 这些命令的原始 payload 归一成同一个报告结构，并提供 `summary`、`markdown`、`json` 三类输出，为后续 `report` 命令与 CI 归档提供共享基线。

## Model Shape

统一报告模型当前采用以下顶层结构：

1. `schemaVersion`
   - 当前固定为 `1`
2. `kind`
   - 当前固定为 `governance-report`
3. `command`
   - 来源命令，如 `check`、`review`、`review-verify`
4. `status`
   - `pass` / `warn` / `fail`
5. `generatedAt`
   - 生成时间戳
6. `context`
   - `cwd`
   - `configFile`
   - `project`
   - `sprint`
   - `locale`
7. `summary`
   - 原始命令的汇总状态，如 `errors`、`warnings`、`exitCode`
8. `workflow`
   - `status`
   - `selectedStageIds`
   - `summary`
   - `stages`
9. `standards`
   - `preset`
   - `totalRules`
   - `matchedRuleIds`
10. `findings`
   - 统一归一为 `id / ruleId / severity / status / message / target / suggestion / stageId`
11. `artifacts`
   - `reportFile`
   - `reviewFile`
   - `sourceFile`
   - `outputFile`
12. `nextActions`
   - 从 findings 的 `suggestion` 或命令状态推导出的建议动作

## Format Mapping

### 1. `summary`

面向终端摘要和轻量日志，采用稳定的 `key=value` 文本结构，重点包含：

1. `status`
2. `command`
3. `project`
4. `sprint`
5. `findings`
6. `matched_rules`
7. `workflow`
8. `next_action_n`

### 2. `markdown`

面向人类阅读和归档，结构固定为：

1. 标题 `# Governance Report: <command>`
2. 头部元信息
3. `## Workflow`
4. `## Findings`
5. `## Next Actions`

### 3. `json`

面向 CI、IDE 和后续 `report` 命令消费，直接输出完整统一报告对象。

## Current Integration

当前落地状态：

1. 新增 `src/reporting/report-model.js`
   - `buildUnifiedReport(payload, options)`
   - `renderUnifiedReport(report, format)`
2. `check --write-report` 已切换为通过统一报告模型输出文件内容
3. `review`、`review-verify` 的命令原始 payload 保持不变，但模型已经支持消费它们的结构
4. 新增 `test/reporting/report-model.test.js`，覆盖：
   - `check` payload 归一
   - `review` payload 归一
   - `summary / markdown / json` 三类渲染

## Design Decisions

1. 命令原始 JSON 输出暂不强制改成统一报告结构，避免打断当前 AI/CI 消费方。
2. 统一报告模型作为“派生报告层”，后续 `report` 命令直接消费它。
3. `nextActions` 优先来源于 findings 的 `suggestion`，没有 suggestion 时再根据 `pass / warn / fail` 状态回退生成默认动作。
4. `matchedRuleIds` 会从原始 `standards.matchedRuleIds` 与 findings 上的 `ruleId` 做合并去重，避免丢失规则上下文。

## Validation

1. `test/reporting/report-model.test.js`
2. `npm run check`
3. 当前仓库 58 个测试全部通过

## Follow-up

1. `TK-502` 将直接消费统一报告模型实现 `report` 命令。
2. `TK-503` 可基于统一报告模型补充 CI 输出规范与退出码说明。
