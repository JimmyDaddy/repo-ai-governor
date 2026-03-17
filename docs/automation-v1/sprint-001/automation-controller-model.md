# Automation Controller Model

- Task: `TK-951`
- Date: 2026-03-17
- Status: done

## Goal

定义 `automation-v1` 的中央编排控制模型，作为 `run` 命令（`TK-952`）与门禁策略（`TK-953`）的统一上游契约。

## Design Principles

1. 单一编排者：只有 Orchestrator 可以分配阶段任务。
2. 阶段单写者：一个阶段只允许一个 `primary surface` 执行。
3. 事件驱动：阶段完成、门禁结果、重试策略都由事件推进。
4. 可审计：每次路由、门禁和回退都写入执行日志。
5. 安全优先：高风险或 required-surface 缺失时优先暂停，不静默跳过。

## Execution Modes

1. `manual`
   - 只生成计划和派发建议，不自动触发下一阶段。
2. `assisted`
   - 默认自动推进；遇到高风险门禁或关键失败时暂停人工确认。
3. `autonomous`
   - 在策略允许范围内自动推进全部阶段，人工只处理异常。

## State Machine

执行级状态：

1. `created`
2. `preflight_running`
3. `preflight_failed`
4. `ready`
5. `stage_running`
6. `gate_waiting`
7. `paused`
8. `retrying`
9. `completed`
10. `failed`
11. `cancelled`

阶段级状态：

1. `pending`
2. `dispatched`
3. `running`
4. `passed`
5. `warning`
6. `blocked`
7. `failed`
8. `skipped`

关键转换：

1. `created -> preflight_running`
2. `preflight_running -> ready | preflight_failed`
3. `ready -> stage_running`
4. `stage_running -> gate_waiting`
5. `gate_waiting -> stage_running(next) | retrying | paused | failed`
6. 所有阶段 `passed/warning` 后 -> `completed`

## Stage Contract

每个阶段在 runtime 统一使用以下结构：

```json
{
  "stageId": "solution_review",
  "assigneeSurface": "claude-code",
  "requiredSurface": true,
  "inputs": ["artifact:plan.md"],
  "expectedOutputs": ["artifact:review.md"],
  "gatePolicy": {
    "onBlockingFindings": "reroute:review_fix",
    "onWarningFindings": "continue_with_warning"
  },
  "retryPolicy": {
    "maxRetries": 2,
    "backoff": "linear"
  }
}
```

## Run Request / Context Contract

`ExecutionRequest`（`run` 入参）：

```json
{
  "executionId": "auto-20260317-001",
  "mode": "assisted",
  "project": "automation-v1",
  "sprint": "sprint-001",
  "routingProfile": "multi-ai-dev-review",
  "inputRef": "./request.md",
  "preflight": true
}
```

`ExecutionContext`（runtime 上下文）：

```json
{
  "executionId": "auto-20260317-001",
  "mode": "assisted",
  "currentStage": "solution_review",
  "artifacts": {},
  "routingResolved": {},
  "gates": [],
  "warnings": [],
  "auditTrailRef": ".repo-ai-governor/reports/automation/auto-20260317-001.json"
}
```

## High-Risk Gate Contract

高风险分类（v1）：

1. `secrets_or_credentials`
2. `infra_or_deploy`
3. `ci_workflow_modification`
4. `dependency_major_upgrade`
5. `database_migration`
6. `dangerous_command`

门禁接口：

```ts
type GateDecision = "allow" | "pause_for_approval" | "block";

interface GateResult {
  decision: GateDecision;
  reason: string;
  riskTags: string[];
  requiresHumanApproval: boolean;
}
```

决策约定：

1. `allow`：继续自动派发。
2. `pause_for_approval`：进入 `paused`，等待用户确认。
3. `block`：执行失败并终止。

## Stage-To-Surface Routing Contract

路由输入源优先级：

1. CLI 显式参数
2. `routingProfile`
3. `automation.routing`
4. `defaultSurface`

冲突处理：

1. 同一阶段多路由声明时，使用高优先级来源并记录 warning。
2. `requiredSurface=true` 且目标不可用时，不回退，直接 `pause_for_approval`。
3. 非 required 阶段可回退至 `defaultSurface`。

示例路由：

1. `requirements_draft -> codex`
2. `solution_review -> claude-code`
3. `implementation -> codex`
4. `code_review -> github-copilot`
5. `review_fix -> codex`

## Surface Preflight Contract

每个 surface 的 preflight 必须包含：

1. `binary_check`
2. `auth_check`
3. `workspace_binding_check`
4. `health_check`

`SurfaceHealthReport`：

```json
{
  "surface": "claude-code",
  "available": true,
  "checks": [
    {"id": "binary_check", "status": "pass"},
    {"id": "auth_check", "status": "pass"},
    {"id": "workspace_binding_check", "status": "pass"},
    {"id": "health_check", "status": "pass"}
  ],
  "fallbackDecision": "none"
}
```

失败策略：

1. required 阶段：`preflight_failed -> paused`
2. optional 阶段：回退到 `defaultSurface` 并追加 warning
3. 所有回退行为必须写入审计日志

## Implementation Mapping

1. `TK-952`
   - 实现 `preflight -> dispatch -> gate -> auto-trigger` 事件循环。
2. `TK-953`
   - 实现 `GateResult` 决策器与 required-surface 策略。
3. `TK-954`
   - 落盘 `ExecutionContext` 与 `SurfaceHealthReport` 的统一审计记录。

## Decisions For Sprint-001

1. v1 只做串行编排，不支持同阶段多 AI 并发写入。
2. v1 默认开启 preflight，允许通过 `--skip-preflight` 显式关闭（仅 manual 模式建议使用）。
3. v1 审计输出统一归档到 `.repo-ai-governor/reports/automation/`。
