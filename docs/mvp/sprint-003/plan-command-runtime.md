# Plan Command Runtime

- Date: 2026-03-13
- Task: `TK-205`
- Status: done

## Goal

把 `plan` 命令从 CLI 占位输出推进为真实可执行命令，复用 Governance Engine 和标准规范包，生成 sprint 级的方案与任务拆解产物。

## Delivered

1. 新增 `src/commands/plan-command.js`，完成：
   - 需求标题/输入文件解析
   - 当前项目与 sprint 产物路径解析
   - `plan -> breakdown` 阶段执行
   - `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv`、`tasks/TK-xxx.md` 写入
   - `--dry-run` 与 `--out` 支持
2. 新增 `src/commands/templates/plan-documents.js`，提供中英文计划文档、checklist、CSV 和任务卡模板。
3. CLI 已将 `plan` 命令接入真实执行入口，不再走占位注册输出。

## Runtime Flow

1. 读取 `governor.yaml` 与当前 CLI 覆盖项。
2. 解析 `official/base` 标准规范包。
3. 通过 Governance Engine 执行：
   - `plan`
   - `breakdown`
4. 生成标准产物：
   - `plan.md`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - `tasks/TK-xxx.md`
5. 按 `--format` 输出终端结果，并在需要时写入 `--out` 文件。

## Validation

1. `test/commands/plan-command.test.js` 覆盖 dry-run 和真实落盘场景。
2. `npm run check` 验证当前仓库 46 个测试全部通过。

## Follow-up

1. `TK-206` 将复用同一执行器与规范包实现 `check` 命令。
2. `TK-207`、`TK-208` 后续可沿用当前产物结构落 CR 与复核结果。
