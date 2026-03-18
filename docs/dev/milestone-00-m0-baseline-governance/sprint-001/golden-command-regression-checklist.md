# 核心命令 Golden 回归清单（TK-003）

- Status: active
- Date: 2026-03-18
- Milestone: `M0`
- Sprint: `sprint-001`
- Task: `TK-003`

## 1. 目标

在大规模重构前固定“核心命令行为基线”，确保后续拆分过程中可以快速识别行为回归。

## 2. 覆盖命令范围

1. `init`
2. `doctor`
3. `plan`
4. `check`
5. `run`
6. `review`
7. `review-verify`
8. `report`

## 3. Golden 场景矩阵（v1）

| case_id | command | scenario | expected_exit_code | golden_assertions |
|---|---|---|---|---|
| GC-001 | `init` | 最小参数初始化 | 0 | 生成 `docs/<project>/sprint-xxx` 与基础台账文件 |
| GC-002 | `doctor` | 健康仓库检查 | 0 | 返回通过状态且不触发修复 |
| GC-003 | `doctor --fix` | 缺失目录修复 | 0 | 自动补齐安全目录并写入结果摘要 |
| GC-004 | `plan` | 标准任务拆解 | 0 | 产出 `plan.md/checklist/tasks.csv/TK` 一致结构 |
| GC-005 | `check` | 质量门禁检查 | 0 或非 0 | 失败时输出明确违规类别与定位路径 |
| GC-006 | `run` | 受控流程执行 | 0 或策略中断码 | 阶段状态、策略命中、人工闸口记录完整 |
| GC-007 | `review` | 生成评审文档 | 0 | 创建 `review_<slug>.md` 且命名符合规范 |
| GC-008 | `review-verify` | 评审复核流转 | 0 | 同文件追加复核结果并重命名到 `verified_review_` |
| GC-009 | `report` | 报告汇总输出 | 0 | 输出执行摘要并可回链任务与 CR 产物 |

## 4. 断言基线

1. 结构断言
   - 命令执行后产物目录与命名符合 `AGENTS.md` 约束。
2. 台账断言
   - `tasks/checklist.md` 与 `tasks/tasks.csv` 同步更新且字段完整。
3. 流程断言
   - CR 生命周期严格遵循 `review -> verified_review -> resolved_review`。
4. 治理断言
   - 关键命令结果可追踪到策略命中、验证结论和执行记录。

## 5. 执行与维护策略

1. 在 `M0` 先落文档基线，作为后续实现与测试的单一参考。
2. 在 `M1`（`TK-116`）使用本清单做退出回归。
3. 在 `M0`（`TK-006`）将本清单作为里程碑退出评审输入。
4. 后续若新增核心命令或行为语义变更，必须同步更新本清单并登记依赖产物注册表。

## 6. 验收标准

1. 清单覆盖 8 个核心命令与关键成功/失败路径。
2. 断言口径可直接映射到 checklist/CSV/CR 产物检查。
3. 已被后续任务声明依赖并可检索回链。
