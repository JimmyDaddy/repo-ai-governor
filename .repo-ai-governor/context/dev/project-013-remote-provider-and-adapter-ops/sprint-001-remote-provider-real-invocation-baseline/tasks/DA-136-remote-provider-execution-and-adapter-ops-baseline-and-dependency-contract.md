# DA-136 远端 provider 真实调用与 adapter 运维契约基线

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-136`
- Produced By: `TK-136`
- Scope: `project-013-remote-provider-and-adapter-ops`

## 1. 目的

定义 `project-013` 的目标边界、执行顺序，以及与 `project-009` / `project-010` / `project-011` / `project-012` 的依赖关系，作为后续远端 provider 实调用与 adapter 运维契约收口的统一输入。

## 2. 为什么拆成独立 project

1. `project-010` 已完成本地模型、task-driven mainchain、inline review subchain、HITL、delivery、GA 与多 IDE official surfaces 收口，继续在其 completed stream 上叠加远端 provider 实调用会破坏 project closure 边界。
2. 当前 Stage 9 剩余阻断项已经明显收敛为单一问题族：Codex / GitHub Copilot / Claude Code 仍停留在 baseline stub，远端 provider 真实执行面和 adapter 运维契约未正式落地。
3. 因此 `project-013` 作为新的主执行流存在，专门处理远端 provider 真实调用、adapter operations 和 route-runner truthfulness，避免把 completed project 重新拉回 active。

## 3. 目标问题陈述

1. 当前本地模型路径已具备真实 `probe/invoke` 语义，但 Codex / GitHub Copilot / Claude Code 仍返回 baseline `echoedInput` 风格输出。
2. 这导致“多工具/多模型在统一流程与门禁下真实执行”仍然不成立，尽管 `run`、review chain、HITL、delivery 和 blackbox/GA 已经完成。
3. 同时，远端 provider 的凭据来源、health/deep probe、timeout/retry、rate-limit/backoff、secret redaction 与 degrade path 还没有统一收敛为正式运维契约。

## 4. 与既有项目的依赖契约

1. 消费 `project-009`
   - `DA-094`：多工具真实调用与无人值守路径的早期基线。
   - `DA-098`：投产基线、试点接入和 30 天运营反馈窗口。
2. 消费 `project-010`
   - `DA-112`：project-010 出口验收与 rollout 输入约束。
   - `project-010-local-model-and-ide-expansion-completion-audit-summary.md`：确认自动主链、HITL、delivery、GA 与 IDE 已经关闭。
3. 消费 `project-011`
   - 远端 provider 改动必须遵守 `commands/*`、`runtime/*`、`runtime/artifacts/*`、`runtime/presentation/*` 的 CLI bounded-context 边界，避免回退到 legacy God object。
4. 消费 `project-012`
   - 继续使用 startup/context/task-ledger/review-chain/selective-memory 的已冻结治理基线，不再回退到更重的默认上下文入口。

## 5. 分阶段约束

1. sprint-001：远端 provider 执行面 baseline
   - `TK-137`：Codex
   - `TK-138`：GitHub Copilot
   - `TK-139`：Claude Code
2. sprint-001：统一运维契约收口
   - `TK-140`：credential precedence、health/deep probe、timeout/retry、rate-limit/backoff、secret redaction、degrade path、route-runner truthfulness
3. sprint-001：出口验收
   - `TK-141`：冻结远端 provider 执行面的后续 rollout 输入约束

## 6. 不得回退的边界

1. 不得为追求“先跑通”而重新绕开 `AgentRouteRunner`，把远端 provider 执行逻辑回塞到单个 facade 或 command 中。
2. 不得把 capability matrix 声明成“已支持”而真实执行面仍未落地。
3. 不得只补 probe，不补 invoke；也不得只补 invoke，不补 credential/health/degrade 等运维契约。
4. 不得破坏 `project-010` 已形成的 task-driven mainchain、inline review、HITL、delivery 和 GA baseline。

## 7. 使用方式

1. `TK-137`~`TK-140` 必须将本 artifact 作为唯一基线输入。
2. 所有远端 provider 执行面改动都必须继续回链 `DA-136`，直到 `TK-141` 产出新的出口约束。
3. 若本项目后续拆出第二个 sprint，则新的 sprint plan 必须显式继承本 artifact 的边界约束。
