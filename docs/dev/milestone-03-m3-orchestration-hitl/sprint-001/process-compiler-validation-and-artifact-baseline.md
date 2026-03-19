# Process Compiler 校验与产物基线（TK-302）

- Status: active
- Date: 2026-03-19
- Milestone: `M3`
- Sprint: `sprint-001`
- Task: `TK-302`

## 1. 目标

在 `TK-301` DSL/IR 契约基础上，定义 Process Compiler 的校验阶段、产物输出、错误分级与持久化约束，确保编译结果可阻断执行、可审计、可回放。

## 2. 范围与非目标

1. 范围：
   - 固化 compiler 输入/输出模型与阶段化校验流程。
   - 固化 compile error/warning 分级与阻断语义。
   - 固化编译产物落盘路径与版本兼容策略。
2. 非目标：
   - 本任务不实现 Policy Gate 规则内容（`TK-303`）。
   - 本任务不实现运行时执行引擎（后续 runtime 任务）。

## 3. Compiler 输入输出契约（Draft）

```ts
enum CompileIssueSeverity {
  Warning = "warning",
  Error = "error",
}

enum CompileStage {
  Parse = "parse",
  Normalize = "normalize",
  Validate = "validate",
  Emit = "emit",
}

enum CompileResultStatus {
  Succeeded = "succeeded",
  Failed = "failed",
}

interface ProcessCompileRequest {
  executionId: string;
  executionSessionId?: string;
  source: ProcessDslDocument;
  irVersion: string;
}

interface ProcessCompileResult {
  status: CompileResultStatus;
  ir?: ProcessIr;
  warnings: CompileIssue[];
  errors: CompileIssue[];
  compiledAt: string; // RFC3339 秒级
  compiledAtDisplay: string; // YYYY-MM-DD HH:mm:ss UTC±HH:MM
}
```

CS-009 落地要求：
1. `CompileIssueSeverity`、`CompileStage`、`CompileResultStatus` 集中放在 `src/constants/`。
2. 编译阶段控制流禁止使用散落字面量。

## 4. 编译阶段与校验顺序

1. `parse`：解析 DSL 文档并生成 AST。
2. `normalize`：补齐默认值并规范节点/边结构。
3. `validate`：执行结构校验、语义校验、资源策略校验。
4. `emit`：生成 IR 并附带 warning/error 列表。

阻断规则：
1. 任一 `error` 命中则 `status=failed`，禁止进入 runtime。
2. 仅有 `warning` 时允许进入 runtime，但必须写审计。

## 5. 编译问题项契约

`CompileIssue` 最小字段：
1. `issue_id`
2. `severity`（warning/error）
3. `error_code`
4. `message`
5. `location`
6. `suggestion`
7. `compile_stage`

## 6. 产物落盘与版本策略

1. 默认落盘：`<workspace_root>/context/compiled-ir/<execution_id>.json`。
2. IR 版本不兼容时直接阻断，并提示迁移路径。
3. 需保留 `compiledAt/compiledAtDisplay` 双时间字段，供审计与人类查看。

## 7. 审计与依赖注入衔接

1. 编译结果必须可回链 `execution_id/execution_session_id`。
2. 编译成功后可注册为可依赖产物，供后续任务注入。
3. 编译失败事件必须写审计并附 `compile_stage/error_code`。

## 8. 后续任务输入映射

1. `TK-303`：消费 compile issue 契约绑定 Policy Gate 阈值。
2. `TK-304`：消费 compile warning/error 路由语义接入 HITL 决策。
3. `TK-307`：消费编译产物元数据接入 Artifact Registry 自动注册。

## 9. 验收标准

1. 编译输入输出、分级阻断与产物落盘契约已固定。
2. 与 `TK-301` DSL/IR 契约保持一致且可直接实现。
3. 产物已登记依赖注册表并被至少两个后续任务回链消费。
