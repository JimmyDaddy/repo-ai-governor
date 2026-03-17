# Automation V1 Execution Plan

- Status: active
- Date: 2026-03-17
- Basis:
  - [../product-requirements.md](../product-requirements.md)
  - [../post-mvp-project-recommendation.md](../post-mvp-project-recommendation.md)
  - [../mvp-execution-plan.md](../mvp-execution-plan.md)
  - [./sprint-001/default-and-custom-orchestration-solution.md](./sprint-001/default-and-custom-orchestration-solution.md)

## Goal

把 PRD 中“AI 全自动开发模式”的核心缺口拆成可执行迭代，先交付可控、可审计、可门禁、可自定义编排的自动化执行 `v1` 基线。

## Product Outcome

完成 `automation-v1` 后，用户应能做到：

1. 通过统一命令触发受控自动化流程，而不是手动串联多个命令。
2. 在自动化流程中应用权限分级与高风险人工确认点。
3. 在每次自动化执行后获得可审计的执行轨迹与结论报告。
4. 在失败时根据检查点进行恢复或人工接管。
5. 使用默认流程快速启动，并通过配置自定义阶段与循环编排。
6. 清晰知道当前执行采用“默认流程”还是“项目自定义流程”。

## New Inputs (2026-03-17)

本轮新增并已纳入计划的关键输入：

1. 默认流程升级为：`需求输入 -> 需求草拟 -> 草案评审循环 -> 技术方案评审循环 -> 任务拆解 -> 任务执行评审循环`。
2. 新增“默认模板 + 配置编排”技术方案文档，明确 `automation.process` 为流程自定义主入口。
3. 新增流程循环配置能力：`draftReviewLoop`、`solutionReviewLoop`、`taskLoop.stageId`。

## Process Strategy

采用“双轨编排策略”：

1. 默认轨（Default）
   - 内置流程模板开箱即用，保证新项目可直接运行。
2. 自编排轨（Custom）
   - 用户通过 `governor.yaml` 的 `automation.process` 覆盖阶段、循环与路由。
3. 编排编译（Compile）
   - 运行前统一做流程编译与路由解析，确保执行轨迹可解释、可审计。

## Multi-AI Integration Path

为了接入多个 AI 入口，`automation-v1` 采用“统一治理内核 + 入口适配层”：

1. 统一治理内核
   - 所有入口都复用同一套仓库治理资产：`AGENTS.md`、`.repo-ai-governor/context/current-context.md`、`governor.yaml`、sprint 任务产物和标准规则。
2. 入口适配层
   - `codex`：仓库级目录 `.codex/skills/`
   - `github-copilot`：仓库级目录 `.github/skills/`
   - `claude-code`：仓库级目录 `.claude/skills/`
3. 标准接入步骤
   - 步骤 1：初始化并启用适配器，例如 `repo-ai-governor init --adapter codex --adapter github-copilot --adapter claude-code`
   - 步骤 2：按入口安装 skills，例如 `repo-ai-governor skills install --surface <surface> --scope repo`
   - 步骤 3：统一使用 `repo-ai-governor run` 执行编排
   - 步骤 4：通过验收脚本回归三入口行为一致性

## Multi-AI Collaboration Mode

推荐按路由键分工（每个 routeKey 只绑定一个主入口）：

1. `requirements-draft` -> `codex`
2. `draft-review` / `technical-solution-review` -> `claude-code`
3. `task-implementation` -> `codex`
4. `task-code-review` -> `github-copilot`

路由规则（v1）：

1. 每个 routeKey 只有一个 `primary surface`。
2. 目标入口不可用时按策略回退到 `defaultSurface` 或阻断。
3. 审计日志必须记录每个阶段与 routeKey 的实际执行入口。

### Multi-AI Quick Setup

```bash
repo-ai-governor init --adapter codex --adapter github-copilot --adapter claude-code

repo-ai-governor skills install --surface codex --scope repo
repo-ai-governor skills install --surface github-copilot --scope repo
repo-ai-governor skills install --surface claude-code --scope repo

repo-ai-governor run \
  --mode assisted \
  --project <project> \
  --sprint <sprint> \
  --input <request-file> \
  --format json
```

路由与流程配置示例：

```yaml
automation:
  defaultSurface: codex
  routing:
    draft-review: claude-code
    technical-solution-review: claude-code
    task-code-review: github-copilot
  process:
    draftReviewLoop:
      enabled: true
      routeSequence: ["draft-review", "draft-review-verify"]
      maxReviewCycles: 2
    solutionReviewLoop:
      enabled: true
      routeSequence:
        - technical-solution
        - technical-solution-review
        - technical-solution-revise
      maxReviewCycles: 3
```

## In Scope

1. 自动化控制器最小版本（模式、状态机、阶段推进）。
2. `run` 编排命令最小版本与可配置流程能力。
3. 权限分级与高风险门禁。
4. 审计日志与执行检查点。
5. 多 AI（`codex / github-copilot / claude-code`）阶段路由与自动化验收路径。
6. 编排解释与流程校验能力（面向自定义流程）。
7. CI smoke gate。

## Out Of Scope

1. 完整无人值守多任务并发调度。
2. 组织级远程编排服务与队列系统。
3. 跨仓库协调执行。
4. 可视化控制台。

## Iteration Plan

### Sprint 001: Controlled Automation Baseline (in progress)

目标：

1. 建立自动化控制器与执行契约。
2. 交付 `run` 命令串联阶段执行。
3. 建立权限和高风险门禁。
4. 落地审计日志、流程校验与验收链路。

任务拆解（重排）：

1. Wave A：编排主链路（已完成）
   - `TK-951` 自动化控制器模型、执行状态机与阶段路由契约
   - `TK-952` `run` 命令最小编排能力（含默认流程 + 可配置流程）
2. Wave B：安全与可审计（待执行）
   - `TK-953` 权限分级与高风险人工确认门禁
   - `TK-954` 自动化执行审计日志与恢复检查点
3. Wave C：验收与可用性增强（待执行）
   - `TK-955` 多 AI 自动化验收脚本与 CI smoke gate
   - `TK-956` 编排解释输出（默认/自定义来源、已编译 loop 配置）
   - `TK-957` 流程配置校验入口（`run --explain-process` / `run --validate-process`）

### Sprint 002: Assisted Recovery And Reliability

目标：

1. 增强失败重试与恢复策略。
2. 增加更细粒度门禁策略和可配置阈值。
3. 扩展自动化场景覆盖。

### Sprint 003: Autonomous Expansion

目标：

1. 扩展更多工具入口与自动化执行策略映射。
2. 强化跨阶段上下文治理。
3. 为后续平台化编排预留接口。

## Exit Criteria

1. `run` 能在受控模式下串联关键治理阶段执行。
2. 高风险行为在非交互模式下默认阻断，在交互模式下支持显式确认。
3. 每次执行产出机器可读审计结果并保留阶段轨迹。
4. `codex / github-copilot / claude-code` 三入口自动化验收路径可在本地与 CI 复现。
5. `run` 能输出当前流程来源与已生效编排配置，支持排障与回溯。
