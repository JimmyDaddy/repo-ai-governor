# Automation V1 Execution Plan

- Status: active
- Date: 2026-03-16
- Basis:
  - [../product-requirements.md](../product-requirements.md)
  - [../post-mvp-project-recommendation.md](../post-mvp-project-recommendation.md)
  - [../mvp-execution-plan.md](../mvp-execution-plan.md)

## Goal

把 PRD 中“AI 全自动开发模式”的核心缺口拆成可执行迭代，先交付可控、可审计、可门禁的自动化执行 `v1` 基线。

## Product Outcome

完成 `automation-v1` 后，用户应能做到：

1. 通过统一命令触发受控自动化流程，而不是手动串联多个命令。
2. 在自动化流程中应用权限分级与高风险人工确认点。
3. 在每次自动化执行后获得可审计的执行轨迹与结论报告。
4. 在失败时根据检查点进行恢复或人工接管。

## Multi-AI Integration Path

为了接入多个 AI 入口，`automation-v1` 采用“统一治理内核 + 入口适配层”：

1. 统一治理内核
   - 所有入口都复用同一套仓库治理资产：`AGENTS.md`、`.repo-ai-governor/context/current-context.md`、`governor.yaml`、sprint 任务产物和标准规则。
2. 入口适配层
   - `codex`：仓库级目录 `.codex/skills/`
   - `github-copilot`：仓库级目录 `.github/skills/`（hybrid）
   - `claude-code`：仓库级目录 `.claude/skills/`
3. 标准接入步骤
   - 步骤 1：初始化并启用适配器，例如 `repo-ai-governor init --adapter codex --adapter github-copilot --adapter claude-code`
   - 步骤 2：按入口安装官方 skills，例如 `repo-ai-governor skills install --surface <surface> --scope repo`
   - 步骤 3：在各入口触发同一条自动化执行命令（`repo-ai-governor run`），而不是维护多套流程
   - 步骤 4：通过统一验收脚本回归三入口行为一致性
4. Sprint 落地映射
   - `TK-952`：交付 `run` 命令最小编排能力
   - `TK-955`：完成 `codex / github-copilot / claude-code` 三入口 smoke 验收

## Multi-AI Collaboration Mode

可以一次接入多个 AI，并按阶段分工协作。

推荐采用“阶段路由”策略：每个阶段设置一个主执行入口，避免同一阶段多入口并发写入导致上下文漂移。

示例分工（可直接使用）：

1. `codex`：实施开发（代码编写与改动落地）
2. `claude-code`：方案评审（技术方案 review / 风险补充）
3. `github-copilot`：代码评审（review 发现与建议）

`automation-v1 / sprint-001` 的落地范围：

1. `TK-951` 定义 `stage -> surface` 路由模型与冲突规则
2. `TK-952` 在 `run` 中按路由执行阶段并记录实际执行入口
3. `TK-955` 以三入口分工场景做 smoke 验收

路由规则（v1）：

1. 每个阶段只有一个 `primary surface`
2. 若指定入口不可用，则回退到 `default surface` 并输出 warning
3. 审计日志必须记录每个阶段实际使用的 `surface`
4. 详细方案见 `docs/automation-v1/sprint-001/multi-ai-handoff-orchestration-solution.md`

### Multi-AI Quick Setup

`TK-952` 完成后，推荐最小接入路径如下：

```bash
repo-ai-governor init --adapter codex --adapter github-copilot --adapter claude-code

repo-ai-governor skills install --surface codex --scope repo
repo-ai-governor skills install --surface github-copilot --scope repo
repo-ai-governor skills install --surface claude-code --scope repo

repo-ai-governor run --mode assisted --project <project> --sprint <sprint> --format json
```

阶段路由配置示例（v1 提案）：

```yaml
automation:
  defaultSurface: codex
  stageRouting:
    solution_review: claude-code
    implementation: codex
    code_review: github-copilot
```

## In Scope

1. 自动化控制器最小版本（模式、状态机、阶段推进）
2. `run` 编排命令最小版本
3. 权限分级与高风险门禁
4. 审计日志与执行检查点
5. 多 AI（`codex / github-copilot / claude-code`）阶段路由与自动化验收路径
6. CI smoke gate

## Out Of Scope

1. 完整无人值守多任务并发调度
2. 组织级远程编排服务与队列系统
3. 跨仓库协调执行
4. 可视化控制台

## Iteration Plan

### Sprint 001: Controlled Automation Baseline

目标：

1. 建立自动化控制器与执行契约
2. 交付 `run` 命令串联阶段执行
3. 建立权限和高风险门禁
4. 落地审计日志与验收链路

建议任务：

1. `TK-951` 设计自动化控制器模型、执行状态机与阶段路由契约
2. `TK-952` 实现 `run` 命令最小编排能力与路由执行
3. `TK-953` 实现权限分级与高风险人工确认门禁
4. `TK-954` 实现自动化执行审计日志与恢复检查点
5. `TK-955` 构建多 AI 自动化验收脚本与 CI smoke gate

### Sprint 002: Assisted Recovery And Reliability

目标：

1. 增强失败重试与恢复策略
2. 增加更细粒度门禁策略和可配置阈值
3. 扩展自动化场景覆盖

### Sprint 003: Autonomous Expansion

目标：

1. 扩展更多工具入口与自动化执行策略映射
2. 强化跨阶段上下文治理
3. 为后续平台化编排预留接口

## Exit Criteria

1. `run` 能在受控模式下串联关键治理阶段执行。
2. 高风险行为在非交互模式下默认阻断，在交互模式下支持显式确认。
3. 每次执行产出机器可读审计结果并保留阶段轨迹。
4. `codex / github-copilot / claude-code` 三入口的自动化验收路径可在本地与 CI 复现。
