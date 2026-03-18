# 契约测试目录基线与命名规范（TK-004）

- Status: active
- Date: 2026-03-18
- Milestone: `M0`
- Sprint: `sprint-001`
- Task: `TK-004`

## 1. 目标

固化测试目录职责与命名规则，确保后续 `M5` 扩展测试覆盖时有一致的结构与可审计口径。

## 2. 目录基线

统一采用以下目录职责：

1. `tests/contract/`
   - 用于跨包契约测试（接口契约、版本兼容、产物契约）。
2. `tests/integration/`
   - 用于跨模块集成验证（核心引擎 + 适配层 + 存储/通知）。
3. `tests/e2e/`
   - 用于端到端链路验证（命令入口到产物回写全流程）。

## 3. 命名规范基线

遵循 `code_standards.md` 的测试命名约束：

1. 单元测试：`*.test.ts`
2. 契约测试：`*.contract.test.ts`
3. 集成测试：`*.integration.test.ts`
4. 端到端测试：`*.e2e.test.ts`

补充规范：

1. 测试文件名称优先“能力域 + 场景”表达（例如 `artifact-registry-resolution.contract.test.ts`）。
2. 禁止使用语义不明确文件名（如 `test1.test.ts`、`tmp.contract.test.ts`）。
3. 与任务产物强关联的测试用例应在注释中标注 `task_id`。

## 4. Golden 检查对齐

与 `golden-command-regression-checklist.md` 协同：

1. `check` 命令失败输出需能定位到 `tests/contract|integration|e2e` 层级。
2. `report` 输出需体现三类测试的通过/失败摘要。
3. 关键回归场景在 `M1`/`M5` 退出评审中可回放。

## 5. 里程碑衔接策略

1. `M0/TK-004`：定义目录与命名基线（本文件）。
2. `M5/TK-501`：按本规范补齐 `tests/contract` 覆盖。
3. `M5/TK-502`：按本规范补齐 `tests/integration` 与 `tests/e2e` 主链路。
4. `M0/TK-006`：退出评审时检查本基线是否已纳入后续任务输入。

## 6. 验收标准

1. 目录职责与命名规则均有明确文本。
2. 与 `code_standards.md`、架构蓝图 `Step 7` 测试目录描述一致。
3. 已登记依赖产物注册表并被后续任务（至少两个）显式引用。
