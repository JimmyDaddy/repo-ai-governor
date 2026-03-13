# Check Command Runtime

- Date: 2026-03-13
- Task: `TK-206`
- Status: done

## Goal

把 `check` 命令从占位输出推进为真实可执行的最小治理检查入口，复用 Governance Engine 和标准规范包，对 sprint 产物进行结构化校验并返回稳定退出码。

## Delivered

1. 新增 `src/commands/check-command.js`，完成：
   - 当前项目与 sprint 产物解析
   - `plan -> breakdown -> self-check` 的最小治理检查流程
   - 规则命中、失败原因与建议动作输出
   - `--stage`、`--changed-only`、`--write-report` 支持
2. 新增 `test/commands/check-command.test.js`，覆盖：
   - 标准计划产物通过检查
   - 计划缺失关键章节时失败
   - `--write-report` 报告落盘与 `changed-only` warning
3. 为了让 `check` 校验真实产物而不是放宽规则，本任务同步做了两处上游对齐：
   - `plan.md` 模板补齐 `In Scope / Out Of Scope / Acceptance / Verification Path`
   - `official/base` 中任务拆解同步规则纳入 `check` 消费面

## Runtime Flow

1. 读取 `governor.yaml` 和当前 CLI 覆盖项。
2. 解析 `official/base` 规范内容。
3. 通过 Governance Engine 执行三段检查：
   - `plan`
   - `breakdown`
   - `self-check`
4. 输出：
   - 阶段状态汇总
   - 命中规则列表
   - 结构化 findings
   - 可选报告文件

## Validation Scope

当前 MVP 最小检查重点覆盖：

1. `plan.md` 是否包含目标、范围、风险、验收和验证路径
2. checklist、CSV 和任务卡是否同步引用同一批任务编号
3. checklist 是否包含执行记录
4. `tasks.csv` 是否保留标准台账字段和至少一条执行记录

## Validation

1. `test/commands/check-command.test.js`
2. `npm run check`
3. 当前仓库 49 个测试全部通过

## Follow-up

1. `TK-207` 可以直接复用当前 findings 和阶段汇总模型生成 review 结果。
2. `TK-208` 可以复用相同结构输出 review 复核结论。
