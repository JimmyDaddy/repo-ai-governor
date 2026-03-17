# Default + Custom Orchestration Solution

- Date: 2026-03-17
- Project: `automation-v1`
- Sprint: `sprint-001`
- Status: proposed

## Problem

当前 `run` 已有默认流程，但默认流程写在代码常量中。  
我们需要同时满足两件事：

1. 开箱即用：用户不配置也能跑通标准治理流。
2. 可按项目编排：用户可根据团队流程替换阶段、循环与角色路由。

## Target

在保持“默认可用”的前提下，提供“配置可编排”的统一机制：

1. 默认流程由内置模板提供（内置最佳实践）。
2. 用户通过 `governor.yaml` 覆盖流程，而不是改源码。
3. 编排结果可解释：执行输出要能看出当前是默认流还是自定义流。

## Current Baseline (已落地)

`TK-952` 当前实现已经具备“默认 + 可覆盖”的基础能力：

1. 默认主链路：`需求输入 -> 需求草拟 -> 草案评审循环 -> 技术方案评审循环 -> 任务拆解 -> 任务开发评审循环`。
2. 支持 `automation.process.stageDefinitions` 覆盖阶段列表。
3. 支持 `automation.process.draftReviewLoop`、`automation.process.solutionReviewLoop`、`automation.process.taskLoop` 调整循环行为。
4. 支持 `automation.routing/profiles/surfaces` 按角色配置 AI 入口。

## Proposed Orchestration Model

统一采用“编排编译”模型：

1. 读取默认流程模板（builtin）。
2. 叠加用户流程配置（process override）。
3. 生成运行时编排计划（compiled process）。
4. preflight + route resolve 后按 compiled process 串行执行。

### Config Shape (建议标准)

```yaml
automation:
  defaultSurface: codex
  routingProfile: multi-ai-dev-review
  process:
    stageDefinitions: []
    draftReviewLoop:
      enabled: true
      routeSequence: ["draft-review", "draft-review-verify"]
      maxReviewCycles: 2
      completionPolicy: first-cycle
    solutionReviewLoop:
      enabled: true
      routeSequence:
        - technical-solution
        - technical-solution-review
        - technical-solution-revise
      maxReviewCycles: 3
      completionPolicy: first-cycle
    taskLoop:
      stageId: task-delivery-loop
      implementationRouteKey: task-implementation
      codeReviewRouteKey: task-code-review
      maxReviewCycles: 3
```

### User-Orchestrated Example

下面示例把“技术方案评审循环”改成两步，并把任务 loop 的阶段名替换为 `delivery-loop`：

```yaml
automation:
  process:
    stageDefinitions:
      - id: requirements-input
        kind: system
      - id: requirements-draft
        kind: ai
        routeKey: requirements-draft
      - id: draft-review-loop
        kind: loop
      - id: task-breakdown
        kind: ai
        routeKey: task-breakdown
      - id: delivery-loop
        kind: loop
    solutionReviewLoop:
      enabled: true
      routeSequence: ["technical-solution", "technical-solution-review"]
      maxReviewCycles: 2
      completionPolicy: max-cycles
    taskLoop:
      stageId: delivery-loop
      implementationRouteKey: task-implementation
      codeReviewRouteKey: task-code-review
      maxReviewCycles: 4
```

## Validation Rules

为防止配置出错，编排编译阶段需要强校验：

1. `stageDefinitions.id` 全局唯一。
2. 每个 loop 的 `routeSequence` 至少 2 个 routeKey。
3. `taskLoop.stageId` 不能与 review loop 冲突。
4. 全部 routeKey 全局唯一，避免派发歧义。
5. routeKey 对应入口在 preflight 可解析（required 时阻断）。

## Execution Result Optimization

建议在 `run` 输出中固定追加以下字段，便于用户确认当前到底跑了哪套流程：

1. `process.source`: `default | customized`
2. `process.reviewLoops`: 已生效的 loop 配置（stageId/routeSequence/maxReviewCycles）
3. `process.taskLoop.stageId`: 当前任务循环绑定的阶段

这样可以直接回答“是否已按自定义流程运行”。

## Rollout

1. Sprint-001（当前）
   - 完成默认流程与配置覆盖能力（已落地）。
   - 补齐本技术方案文档（本次）。
2. Sprint-002（建议）
   - 增加 `run --explain-process`，输出编排编译结果（markdown/json）。
   - 增加流程配置合法性检查子命令（如 `run --validate-process --dry-run`）。

## Risks

1. 过度自定义可能导致流程与治理规范脱钩。
2. 配置复杂度提升后，错误定位成本增加。
3. 不同仓库流程差异大时，需要更强的“流程解释输出”降低维护成本。

## Decision

采纳“默认模板 + 配置编排”的双轨方案：  
默认流程保证可用，自定义配置保证灵活；两者统一落在 `automation.process` 并通过编排编译阶段收敛。
