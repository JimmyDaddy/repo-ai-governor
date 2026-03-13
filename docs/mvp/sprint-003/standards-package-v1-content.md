# Standards Package V1 Content

- Date: 2026-03-13
- Task: `TK-204`
- Status: done

## Goal

在 `official/base` 预设下补齐一套可被 CLI 和 AI 入口直接消费的标准规范内容，让 `plan`、`check`、`review` 等命令不再依赖占位规则。

## Delivered

1. 新增 `src/standards/official-base-package.js`，提供：
   - `OFFICIAL_BASE_STANDARDS_PACKAGE`
   - `OFFICIAL_BASE_PACKAGE_RULES`
   - `resolveStandardsPackage`
   - `listRulesForConsumer`
   - `renderRulesForConsumer`
2. 当前官方规范内容已覆盖五类规范：
   - `code`
   - `engineering`
   - `process`
   - `quality`
   - `collaboration`
3. 当前内容同时支持：
   - `zh-CN` / `en-US`
   - `ai` / `human` 双视图
   - `plan` / `check` / `review` / `review-verify` / `report` 等消费者过滤

## Content Shape

当前 v1 规则重点覆盖：

1. 代码改动应遵循现有仓库结构
2. 交付必须使用 Conventional Commit
3. 方案必须明确目标、范围与风险
4. 任务拆解必须同步 checklist 与 CSV
5. 交付前必须给出验证路径
6. 校验结果必须记录到任务台账
7. 风险与假设应显式记录

## Code Artifacts

1. `src/standards/official-base-package.js`
2. `test/standards/official-base-package.test.js`
3. `src/commands/plan-command.js`

## Follow-up

1. `TK-205` 已开始直接消费 `official/base` 规则生成计划文档和任务拆解。
2. `TK-206` 将继续复用同一规则包输出治理检查结果。
3. `TK-207`、`TK-208` 后续可复用同一消费者过滤逻辑生成 CR 与复核结论。
