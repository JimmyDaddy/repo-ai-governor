# TK-007 依赖边界白名单与回归准入说明

- Status: active
- Date: 2026-03-19
- Owner: AI-Agent
- Scope: `TK-007`

## 1. 白名单文件与字段

1. 文件路径：`scripts/governance/dependency-boundary-whitelist.json`
2. 字段结构：
   - `allowEdges[]`
   - 每条记录必须包含 `from`、`to`、`reason`
3. 基线策略：默认空白名单；新增记录必须绑定明确兼容窗口原因。

## 2. 允许进入白名单的场景

1. 上下游改造存在跨任务窗口，短期内无法一次性完成拆分。
2. 外部依赖或发布窗口限制，需先保证可发布再完成架构回收。
3. 迁移阶段需要保留临时桥接层，且已有明确拆除任务与截止日期。

## 3. 禁止进入白名单的场景

1. 仅为规避门禁报警且无可追踪治理计划。
2. 引入 `packages/* -> apps/*` 反向依赖。
3. 引入 `packages/shared -> 业务域包` 依赖。
4. 已有无风险替代实现但未采用。

## 4. 回归准入（warning -> blocking）判定

1. 连续 3 次主干质量门禁（`pnpm run check`）`violations=0`。
2. 白名单仍为空或仅保留“有拆除计划”的临时项。
3. `TK-008` 验收任务确认 warning 输出可稳定定位到具体 source/target/rule。
4. 满足以上条件后，下一 sprint 可将默认命令切换到 `--mode block`。

## 5. 执行与审计要求

1. 新增白名单记录必须同步更新：
   - 对应任务卡（`Depends On` / `Input References`）
   - `tasks/checklist.md` 执行记录
   - `tasks/tasks.csv` 执行记录
2. 移除白名单记录时，必须在同一变更中提供“违规已修复”证据（命令输出或 CR 结论）。
