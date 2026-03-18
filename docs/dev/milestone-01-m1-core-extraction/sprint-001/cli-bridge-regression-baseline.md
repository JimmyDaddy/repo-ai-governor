# CLI 与新核心包桥接回归基线（TK-106）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-001`
- Task: `TK-106`

## 1. 目标

在 `core-process`、`core-policy`、`core-role-registry`、`adapter-sdk` 已定义抽离基线后，固定 CLI 到新核心包的桥接回归口径，保证行为等价或更严格且可解释。

## 2. 范围与非目标

1. 范围：
   - `apps/cli` 到核心包的调用桥接路径。
   - 关键命令行为回归断言（与 M0 golden 对齐）。
   - 回退策略、失败模型与审计记录要求。
2. 非目标：
   - 本任务不实现所有命令的最终迁移代码。
   - 本任务不替代 M4 兼容性报告，只提供其上游基线输入。

## 3. 桥接边界与调用关系

1. `apps/cli` 仅通过核心包公开入口调用，不直连内部实现路径。
2. 核心调用映射（基线）：
   - 流程相关命令：优先走 `core-process`
   - 策略相关命令：优先走 `core-policy`
   - 角色相关命令：优先走 `core-role-registry`
   - 适配器能力探测与调用：走 `adapter-sdk` 契约层
3. 禁止在 CLI 中硬编码具体 adapter 私有行为分支；能力差异必须通过 capability matrix 决策。

## 4. 回归断言矩阵（Bridge v1）

| case_id | command | new_path | bridge_assertions |
|---|---|---|---|
| BR-001 | `plan` | `cli -> core-process` | 输出结构与旧路径一致；错误语义不弱化 |
| BR-002 | `check` | `cli -> core-policy` | 策略命中结果一致或更严格且可解释 |
| BR-003 | `run` | `cli -> core-process + core-policy + role-registry + adapter-sdk` | 阶段结果、审批信号、审计字段完整 |
| BR-004 | `review` | `cli -> core-policy + role-registry` | 评审产物命名/状态流转不回退 |
| BR-005 | `review-verify` | `cli -> core-policy` | 同文件追加复核记录并按状态重命名 |
| BR-006 | `report` | `cli -> core-process + core-policy` | 汇总结果可回链任务/CR/审计字段 |

## 5. 行为兼容性标准

1. Exit code 兼容：
   - 成功路径返回 0。
   - 失败路径需保持明确错误类别（参数错误/策略阻断/执行异常）。
2. 输出兼容：
   - 关键输出字段保持稳定（新增字段允许，删减关键字段禁止）。
3. 副作用兼容：
   - 产物文件命名与目录符合 `AGENTS.md` 规则。
4. 审计兼容：
   - 至少记录 `execution_id/stage_id/role_profile_id/decision/error_category`。

## 6. 降级与回退策略

1. 当适配器缺失某能力时，必须显式降级并记录原因，不得静默降级。
2. 桥接异常优先尝试同契约的替代路径；不可恢复时返回 `requires-human` 并触发人工介入。
3. 回退决策必须写入执行记录与 CR 证据，支持后续复盘。

## 7. 执行与验证步骤（建议）

1. 构建桥接路由映射表（命令 -> 核心包入口）。
2. 逐命令运行 `BR-001~BR-006` 场景并记录结果。
3. 对照 M0 golden 清单校验行为一致性。
4. 汇总桥接证据供 `TK-116` 和 `TK-416` 使用。

## 8. 后续任务输入映射

1. `TK-116`：作为 M1 退出回归的桥接证据输入。
2. `TK-416`：作为 M4 兼容性回归报告基线输入。

## 9. 验收标准

1. CLI 到核心包的桥接边界清晰且无反向依赖违规。
2. 回归断言矩阵可直接用于后续执行验证。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
