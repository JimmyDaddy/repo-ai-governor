# 自定义角色注册与 role_profile_id 生命周期基线（TK-313）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-002`
- Task: `TK-313`

## 1. 目标

定义用户自定义角色的注册模型、校验约束与 `role_profile_id` 生命周期，支撑多 Agent 可治理扩展。

## 2. 角色生命周期契约（Draft）

```ts
enum RoleSource {
  Default = "default",
  Custom = "custom",
}

enum RoleProfileLifecycleStatus {
  Draft = "draft",
  Active = "active",
  Deprecated = "deprecated",
  Archived = "archived",
}

enum RoleProfileValidationResult {
  Passed = "passed",
  Rejected = "rejected",
}
```

CS-009 落地要求：以上有限集合在代码实现阶段集中到 `src/constants/` 管理。

## 3. 自定义角色最小字段

1. `role_profile_id`
2. `display_name`
3. `responsibilities`
4. `capabilities`
5. `permission_ceiling`
6. `input_schema_ref`
7. `output_schema_ref`

## 4. 生命周期规则

1. 新角色从 `draft` 开始，校验通过后进入 `active`。
2. `active` 角色可被 routeKey 绑定。
3. 被替换角色进入 `deprecated`，不再允许新流程绑定。
4. 历史保留角色进入 `archived`，仅可回放不可新建执行。

## 5. 治理边界

1. `permission_ceiling` 不得突破全局策略上限。
2. 高风险动作仍受 Policy Gate 与 HITL 约束。
3. 审计必须记录 `role_profile_id`, `role_source`, `role_version`。

## 6. 后续任务输入映射

1. `TK-314`：消费角色模型定义 Agent/Skill 边界责任。
2. `TK-315`：消费 `role_profile_id` 绑定共享 session 协作约束。
3. `TK-316`：消费角色生命周期做端到端路由验证。

## 7. 验收标准

1. 自定义角色注册入口与校验规则明确。
2. 生命周期状态转换规则可执行。
3. 与路由策略、审计字段可直接衔接。
