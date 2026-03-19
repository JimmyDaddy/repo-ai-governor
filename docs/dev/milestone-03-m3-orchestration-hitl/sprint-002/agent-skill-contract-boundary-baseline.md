# Agent 与 Skill 契约边界基线（TK-314）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-002`
- Task: `TK-314`

## 1. 目标

固化 Agent 与 Skill 的职责边界、调度关系和审计要求，避免执行时权限语义混淆。

## 2. 边界契约（Draft）

```ts
enum ExecutionActorType {
  Agent = "agent",
  Skill = "skill",
}

enum SkillLoadMode {
  Required = "required",
  Optional = "optional",
}

enum SkillInvocationResult {
  Applied = "applied",
  Skipped = "skipped",
  Failed = "failed",
}
```

CS-009 落地要求：以上有限集合在代码实现阶段集中到 `src/constants/` 管理。

## 3. 职责定义

1. Agent：阶段责任主体，持有角色权限，输出阶段结果并承担策略命中责任。
2. Skill：能力单元，不具备独立权限，只能在 Agent 权限边界内执行。
3. 编排层：只调度 Agent，不直接调度 Skill。

## 4. 绑定规则

1. `route_key` 绑定 `role_profile_id`，再由 Agent 装配 Skill 集合。
2. Skill 必须声明 `input_schema_ref` 与 `output_schema_ref`。
3. Skill 版本变化不应破坏 Agent 输出契约。

## 5. 审计字段要求

1. `agent_role`, `role_profile_id`, `role_source`
2. `skill_id`, `skill_version`, `skill_invocation_result`
3. `policy_outcome`, `execution_session_id`

## 6. 后续任务输入映射

1. `TK-315`：消费边界约束构建共享 session 多 Agent 协作协议。
2. `TK-316`：消费边界约束验证端到端编排一致性。
3. `TK-405`：消费边界约束补齐适配器契约测试覆盖。

## 7. 验收标准

1. Agent/Skill 边界可执行且可审计。
2. 权限与调度关系无冲突。
3. 与角色模型和适配器契约保持一致。
