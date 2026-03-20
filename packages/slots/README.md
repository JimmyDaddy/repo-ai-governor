# @repo-ai-governor/slots

- Status: baseline
- Date: 2026-03-20
- Scope: `project-003-standards-and-slots / TK-027`

## Purpose

提供 `SlotEngine` 基线，实现插槽双轨（声明式 + 脚本）解析与脚本安全六项约束校验。

## Baseline API

1. `SlotEngine`
   - `registerSlots(slotDefinitions)`
   - `listSlots(options)`
   - `buildExecutionPlan(context, options)`
   - `evaluateScriptSlotSecurity(slotDefinition, context)`
2. `SlotTrack` / `SlotSource` / `SlotConflictStrategy`
3. `SlotPermissionCapability` / `SlotSecurityCheckId`

## Notes

1. 声明式插槽覆盖：元信息、触发条件、适用范围、提示注入、前后置检查、阻断位。
2. 脚本插槽覆盖六项安全约束：沙箱、审批、资源配额、I/O 契约、副作用声明、失败隔离。
3. 执行计划输出包含最小审计字段：`slotScriptId/slotScriptVersion/slotScriptHash/grantedPermissions/exitCode`。
