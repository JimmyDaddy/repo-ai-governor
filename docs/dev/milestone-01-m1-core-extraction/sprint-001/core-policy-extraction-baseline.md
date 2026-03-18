# Core-Policy 抽离基线（TK-103）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-001`
- Task: `TK-103`

## 1. 目标

定义 `core-policy` 抽离的边界、输入输出契约和迁移路径，保证策略门禁能力从应用层解耦，后续可被多入口（CLI/Runtime/Workflow）复用。

## 2. 范围与非目标

1. 范围：
   - `packages/core-policy` 的职责、目录、入口与测试基线。
   - 与 `core-process`、`core-role-registry`、`core-audit` 的协作边界。
   - M1 阶段策略评估最小能力（allow/deny/require-human）。
2. 非目标：
   - 本任务不实现完整 HITL 通知派发（属于后续 `notification-dispatcher` 迭代）。
   - 本任务不定义最终策略 DSL 语法细节，只固定最小评估契约。

## 3. 包职责边界

### 3.1 `core-policy` 负责

1. 策略规则模型（规则 ID、作用域、阈值、命中条件）。
2. 策略评估器（输入上下文 -> 决策结果）。
3. 标准决策输出结构（含 `decision`、`reason_codes`、`required_actions`）。

### 3.2 `core-policy` 不负责

1. 流程结构解析与编译（属于 `core-process`）。
2. 角色定义持久化（属于 `core-role-registry`）。
3. 通知通道执行（属于 `notification-dispatcher`）。

## 4. 依赖方向约束

1. `core-policy` 可依赖：
   - `shared-types`
   - `shared-utils`
   - `core-audit`（若审计抽离后提供接口）
2. `core-policy` 不可依赖：
   - `apps/cli`
   - `adapters/*`
   - 任何具体 provider SDK
3. `core-policy` 与 `core-process` 通过输入上下文与决策结果接口协作，禁止双向实现耦合。

## 5. 目录与入口基线

```text
packages/core-policy/
  src/
    policy-model.ts
    policy-evaluator.ts
    policy-runtime.ts
    index.ts
  test/
    policy-evaluator.test.ts
    policy-runtime.test.ts
  README.md
```

说明：
1. 命名遵循 `CS-014`。
2. 测试命名遵循 `*.test.ts` 基线；契约测试后续由 M5 补齐 `*.contract.test.ts`。

## 6. 最小决策契约（M1）

```ts
enum PolicyDecision {
  Allow = "allow",
  Deny = "deny",
  RequireHuman = "require-human",
}
```

```ts
interface PolicyEvaluationResult {
  decision: PolicyDecision;
  reasonCodes: string[];
  requiredActions: string[];
  policyVersion: string;
}
```

约束：
1. `deny` 必须包含至少一个 `reasonCode`。
2. `require-human` 必须包含至少一个 `requiredAction`（例如 `manual-review`）。
3. 有限集合值实现时必须集中放在 `packages/core-policy/src/constants/`（对齐 `CS-009`）。

## 7. 抽离执行步骤（建议）

1. 建包：创建 `packages/core-policy` 最小结构。
2. 迁移：将现有策略判断逻辑迁移至 `policy-evaluator.ts`。
3. 统一接口：对外仅暴露 `index.ts` 的评估入口与结果类型。
4. 桥接验证：在 `TK-106` 中验证 CLI 侧策略拦截行为不回退。

## 8. 回归与验收口径

1. `build`：
   - 根级构建可覆盖 `core-policy` 包编译。
2. `test`：
   - 至少覆盖 allow/deny/require-human 三类路径。
3. `bridge`：
   - CLI 桥接后，策略命中结果与历史行为一致或更严格且可解释。
4. `m1-exit`：
   - `TK-116` 退出回归需包含策略决策样例与结果记录。

## 9. 后续任务输入映射

1. `TK-104`：对齐角色输入（角色信息参与策略评估上下文）。
2. `TK-106`：消费该基线完成 CLI 桥接回归。
3. `TK-116`：纳入 M1 退出回归证据。

## 10. 验收标准

1. 策略职责与流程/角色/通知层边界清晰。
2. 最小决策契约可供后续实现直接编码。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
