# TK-011 upgrade 人工确认策略基线

- Status: active
- Date: 2026-03-20
- Owner: AI-Agent
- Task: `TK-011`
- Scope: `schema diff -> 迁移建议 -> 人工确认`

## 1. 目标

为升级流程提供可执行的人工确认策略约束，确保自动迁移只覆盖低风险变更，关键版本切换保留人工闸口。

## 2. 决策契约

1. 输入
   - `diffs[]`：schema 差异项（added/changed/removed）。
   - `suggestions[]`：迁移建议项（auto_apply/confirm_required/manual_action）。
   - `confirmationItems[]`：人工确认项（带 `reason`、`paths`、`blocking`）。
2. 输出
   - `ALLOW`：无确认项，可直接进入自动执行链路。
   - `CONFIRM`：存在非阻断确认项，需人工确认后继续。
   - `BLOCK`：存在阻断确认项，必须人工介入并调整升级方案。

## 3. 基线策略（当前仓库）

1. `schemaVersion` 变更默认归类为 `CONFIRM_REQUIRED`。
2. 新增 `workspace.migrationPolicy`（v1.1 要求）归类为 `AUTO_APPLY`。
3. 不支持的升级路径（例如 `1.1 -> 1.0`）直接 `BLOCK` 并输出标准化错误。
4. 自动建议生成的 `autoMigratedConfig` 不直接落盘；落盘动作必须由上层命令在确认后触发。

## 4. 审计字段建议

1. `source_version`
2. `target_version`
3. `confirmation_decision`
4. `confirmation_reasons`
5. `applied_auto_suggestions`
6. `pending_manual_items`

## 5. 后续演进

1. 在 TK-012 验收中将本策略映射到升级回滚演练清单。
2. 在 Stage 2 把 `confirmation_decision` 接入 Policy Gate Engine 的 `allow/confirm/block` 统一通道。
