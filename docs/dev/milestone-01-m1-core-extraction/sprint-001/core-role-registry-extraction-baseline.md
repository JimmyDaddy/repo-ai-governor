# Core-Role-Registry 抽离基线（TK-104）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-001`
- Task: `TK-104`

## 1. 目标

定义 `core-role-registry` 的抽离边界、角色模型契约与迁移策略，确保默认角色与用户自定义角色都能被统一注册、校验和消费。

## 2. 范围与非目标

1. 范围：
   - `packages/core-role-registry` 的职责、目录结构与公共入口。
   - 角色配置模型、注册表查询接口与基础校验规则。
   - 与 `core-process`、`core-policy` 的协作边界。
2. 非目标：
   - 本任务不实现在线角色市场或远程角色分发。
   - 本任务不实现跨 workspace 角色同步，只固定本仓库/当前 workspace 基线。

## 3. 包职责边界

### 3.1 `core-role-registry` 负责

1. 默认角色定义加载（例如 architect/reviewer/implementer）。
2. 用户自定义角色注册与唯一性校验（`role_profile_id`）。
3. 角色查询接口（按 ID、按标签、按能力特征）。
4. 角色元数据标准化输出供流程与策略层消费。

### 3.2 `core-role-registry` 不负责

1. 流程编排结构计算（属于 `core-process`）。
2. 策略命中判定（属于 `core-policy`）。
3. 具体 provider 适配逻辑（属于 adapters + `adapter-sdk`）。

## 4. 依赖方向约束

1. `core-role-registry` 可依赖：
   - `shared-types`
   - `shared-utils`
   - `config`（若后续拆出配置包）
2. `core-role-registry` 不可依赖：
   - `apps/cli`
   - `adapters/*`
   - `core-process` 的实现层
3. `core-role-registry` 输出角色元数据给 `core-process/core-policy`，保持单向依赖。

## 5. 目录与入口基线

```text
packages/core-role-registry/
  src/
    role-model.ts
    role-registry.ts
    role-validator.ts
    index.ts
  test/
    role-registry.test.ts
    role-validator.test.ts
  README.md
```

说明：
1. 命名遵循 `CS-014` 与已批准的 monorepo 命名规范。
2. 入口统一通过 `index.ts` 暴露，禁止业务侧直连内部文件路径。

## 6. 最小角色契约（M1）

```ts
enum RoleProfileSource {
  Default = "default",
  Custom = "custom",
}

interface RoleProfile {
  roleProfileId: string;
  displayName: string;
  capabilities: string[];
  constraints: string[];
  source: RoleProfileSource;
  version: string;
}
```

约束：
1. `roleProfileId` 必须全局唯一（同一 workspace 内）。
2. `capabilities` 至少包含 1 项。
3. `source=custom` 的角色必须记录来源描述用于审计。
4. 有限集合值实现时必须集中放在 `packages/core-role-registry/src/constants/`（对齐 `CS-009`）。

## 7. 抽离执行步骤（建议）

1. 建包：创建 `packages/core-role-registry` 最小目录结构。
2. 迁移：将现有角色定义与解析逻辑迁入 `role-registry.ts`。
3. 校验：实现 `role-validator.ts` 对唯一性和字段完整性进行校验。
4. 桥接：CLI 与 runtime 通过统一入口查询角色，不再读取分散定义。

## 8. 回归与验收口径

1. `build`：
   - 根级构建能够包含 `core-role-registry`。
2. `test`：
   - 至少覆盖默认角色加载、自定义注册、重复 ID 拦截三类测试。
3. `bridge`：
   - `TK-106` 中验证 CLI 桥接角色查询行为不回退。
4. `m1-exit`：
   - `TK-116` 退出回归需纳入角色注册与解析样例。

## 9. 后续任务输入映射

1. `TK-105`：在 `adapter-sdk` 契约中约束角色能力字段对接方式。
2. `TK-106`：消费该基线完成 CLI 桥接回归。
3. `TK-116`：纳入 M1 退出回归证据。

## 10. 验收标准

1. 角色层职责边界清晰且不与流程/策略/适配层混淆。
2. 最小角色契约可直接指导后续实现与测试。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
