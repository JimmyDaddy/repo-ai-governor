# DSL/IR: Sequential/Parallel/Loop/Condition 基线（TK-301）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-001`
- Task: `TK-301`

## 1. 目标

定义流程 DSL 与编译后 IR 的最小可执行契约，确保 `Sequential/Parallel/Loop/Condition` 四类节点可被统一解析、校验、编排与审计，并作为 M3 后续编译、策略与 HITL 任务的共同输入。

## 2. 范围与非目标

1. 范围：
   - 固化 DSL 根结构、节点结构、边结构与全局策略引用。
   - 固化四类节点语义与最小字段约束。
   - 固化编译前校验错误模型与阻断策略。
2. 非目标：
   - 本任务不实现 Process Compiler 代码落地（由 `TK-302` 负责）。
   - 本任务不实现 Policy Gate 与 HITL 决策规则细节（由 `TK-303/TK-304` 负责）。

## 3. DSL 最小结构契约（Draft）

```ts
enum ProcessNodeType {
  Sequential = "sequential",
  Parallel = "parallel",
  Loop = "loop",
  Condition = "condition",
}

enum ProcessEdgeType {
  Default = "default",
  Success = "success",
  Failure = "failure",
  PolicyRoute = "policy-route",
}

enum ProcessConditionOperator {
  Eq = "eq",
  Ne = "ne",
  In = "in",
  Gt = "gt",
  Lt = "lt",
  Exists = "exists",
}

interface ProcessDslDocument {
  processId: string;
  version: string;
  entryNodeId: string;
  nodes: ProcessNode[];
  edges: ProcessEdge[];
  globals?: Record<string, unknown>;
}
```

CS-009 落地要求：
1. `ProcessNodeType`、`ProcessEdgeType`、`ProcessConditionOperator` 必须集中放在 `src/constants/`。
2. 节点分支判定禁止散落字面量，统一通过常量集合驱动。

## 4. 四类节点语义

1. `Sequential`
   - 单一路径顺序执行；下一个节点由 `default/success/failure` 边决定。
2. `Parallel`
   - 多分支并行执行；必须声明聚合策略（`allOf/anyOf/majority`）。
3. `Loop`
   - 必须声明 `maxCycles` 与 `maxWallTimeSeconds`，防止无限循环。
4. `Condition`
   - 使用条件表达式路由到不同分支，至少支持 `eq/ne/in/exists`。

## 5. IR 映射契约（Draft）

```ts
interface ProcessIr {
  irVersion: string;
  processId: string;
  executionId: string;
  compiledAt: string; // RFC3339 秒级
  entryNodeId: string;
  nodes: ProcessIrNode[];
  edges: ProcessIrEdge[];
  compileWarnings: CompileIssue[];
  compileErrors: CompileIssue[];
}
```

约束：
1. `compiledAt` 使用 RFC3339 秒级时间戳。
2. 命中 `compileErrors` 时禁止进入 runtime。
3. `compileWarnings` 允许继续，但必须写审计。

## 6. 校验规则基线

1. 结构规则：`entryNodeId` 必须存在，所有边的 `from/to` 节点必须可达。
2. 语义规则：
   - `Parallel` 必须存在聚合策略。
   - `Loop` 必须声明循环上限和总耗时上限。
   - `Condition` 的每个分支需有默认回退路径。
3. 资源规则：节点可选声明 `timeout_policy_ref`、`retry_policy_ref`、`budget_policy_ref`。

## 7. 审计与回放要求

1. 编译输入与输出应可回链：`execution_id`、`execution_session_id`。
2. 编译问题项应保留：`error_code/severity/message/location/suggestion`。
3. 编译产物建议落盘：`<workspace_root>/context/compiled-ir/<execution_id>.json`。

## 8. 后续任务输入映射

1. `TK-302`：消费本基线实现 Compiler 校验与产物输出。
2. `TK-303`：消费节点与路由语义绑定 Policy Gate 规则。
3. `TK-304`：消费 condition/policy-route 语义接入 HITL 决策模型。

## 9. 验收标准

1. 四类节点 DSL/IR 字段与语义已固定。
2. 校验规则与阻断策略可直接指导编译实现。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
