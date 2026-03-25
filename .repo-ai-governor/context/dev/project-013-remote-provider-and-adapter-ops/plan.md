# project-013-remote-provider-and-adapter-ops 计划

- Status: active
- Date: 2026-03-25
- Stage Mapping: Stage 9 remaining closure + remote provider execution hardening
- Phase Mapping: Phase E follow-up + Adapter Operations Hardening

## 1. 目标

1. 在 `project-010` 已完成自动主链、HITL、delivery、GA 与多 IDE official surfaces 收口的前提下，单独收敛 Codex / GitHub Copilot / Claude Code 的远端 provider 真实调用。
2. 将 adapter 运维契约正式落地到远端 provider：凭据优先级、health/deep probe、timeout/retry、限流/退避、错误映射、脱敏和 degrade path。
3. 让“多工具/多模型在统一流程与门禁下真实执行”从 baseline contract 升级为可验证的真实执行面。

## 2. 工作流分解（Workstreams）

1. WS-01 Remote Provider Invocation
   - 将 Codex / GitHub Copilot / Claude Code 从 baseline stub 升级为真实 provider 调用。
2. WS-02 Adapter Operations Contract
   - 统一凭据来源、health/deep probe、timeout/retry、rate-limit/backoff、secret redaction 与 degrade path。
3. WS-03 Route Runner Truthfulness
   - 确保 CLI runtime、route runner、capability matrix、diagnostics 和 adapter output 对真实执行面保持一致，不再出现“探测/执行/能力声明”漂移。
4. WS-04 Exit Acceptance And Rollout Backfeed
   - 汇总远端 provider 执行面证据，回灌 master plan 与后续 rollout 输入约束。

## 2.1 远端 Provider 收口优先级（P0/P1）

1. P0-1 project-013 启动与依赖重排（`TK-136`）
   - 先把 `project-010` 归档为 completed stream，并建立独立执行流承接最后的 Stage 9 阻断项。
2. P0-2 Codex 远端 provider 真实调用与凭据/health 契约（`TK-137`）
   - 先验证一条远端 provider 主路径的真实执行面。
3. P0-3 GitHub Copilot 远端 provider 真实调用与 capability truthfulness（`TK-138`）
   - 确保 capability 声明和真实行为一致，并对接 route runner。
4. P0-4 Claude Code 远端 provider 真实调用与 fallback/degrade 收口（`TK-139`）
   - 覆盖第三条官方 provider 路径，补齐与 restricted-network/local fallback 的协作边界。
5. P0-5 跨 provider adapter 运维契约与 route runner truthfulness hardening（`TK-140`）
   - 收敛凭据、错误、重试、限流、脱敏和统一 diagnostics。
6. P0-6 sprint-001 出口验收与后续 rollout 输入约束（`TK-141`）
   - 冻结远端 provider 执行面基线，为后续 P1/P2 扩张提供正式 handoff。

## 3. Sprint 细化

## 3.1 sprint-001-remote-provider-real-invocation-baseline

- Sprint Goal: 将 Codex / GitHub Copilot / Claude Code 从 baseline stub 升级为统一治理下的真实 provider 执行面，并形成 adapter 运维契约与 rollout 输入约束。
- 任务包：`TK-136`、`TK-137`、`TK-138`、`TK-139`、`TK-140`、`TK-141`。
- Exit Criteria:
  1. 至少 3 类官方远端 provider 路径具备真实 `probe/invoke` 语义，并与 capability matrix / diagnostics 保持一致。
  2. adapter 运维契约覆盖凭据优先级、health/deep probe、timeout/retry、rate-limit/backoff、secret redaction 与 degrade path。
  3. CLI `run` / route runner / adapter diagnostics 不再把远端 provider 误表示为 baseline mock 行为。
  4. 形成 `DA-136`~`DA-141` 产物链，并完成 project-013 sprint-001 出口验收。

## 4. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-136 | sprint-001 | project-013 启动与远端 provider 收口重排 | analysis/baseline | project-010 completion | completed |
| TK-137 | sprint-001 | Codex 远端 provider 真实调用与凭据/health 契约 | implementation/adapter | TK-136,DA-136 | completed |
| TK-138 | sprint-001 | GitHub Copilot 远端 provider 真实调用与 capability truthfulness 收口 | implementation/adapter | TK-136,DA-136 | completed |
| TK-139 | sprint-001 | Claude Code 远端 provider 真实调用与 fallback/degrade 收口 | implementation/adapter | TK-136,DA-136 | completed |
| TK-140 | sprint-001 | 跨 provider adapter 运维契约与 route-runner truthfulness hardening | implementation/runtime | TK-137,TK-138,TK-139 | planned |
| TK-141 | sprint-001 | sprint-001 出口验收与后续 rollout 输入约束 | acceptance baseline | TK-137,TK-138,TK-139,TK-140 | planned |

## 5. 依赖产物策略

1. project-013 启动入口默认消费：
   - `DA-094`
   - `DA-098`
   - `DA-112`
   - `project-010-local-model-and-ide-expansion-completion-audit-summary.md`
   - `project-011-cli-package-decomposition-completion-audit-summary.md`
   - `project-012-execution-context-optimization-reclosure-audit-summary.md`
2. sprint-001 产物目标：`DA-136`~`DA-141`。
3. 仅“规范/基线/约束”类产物进入 artifact registry；过程性计划文档不登记。
4. 远端 provider 真实执行面改动必须继续遵守 `project-011` 的 CLI bounded-context 边界，不得回退到单文件 God object 扩写路径。

## 6. DoD（project-013）

1. Codex / GitHub Copilot / Claude Code 不再只是 baseline stub，而是具备真实 provider `probe/invoke` 路径。
2. adapter capability 声明、CLI diagnostics、route runner 决策与真实执行行为保持一致。
3. 远端 provider 运维契约覆盖凭据、健康探测、重试、限流、脱敏与 degrade path。
4. 质量门禁、任务台账、review 生命周期与 artifact registry 同步保持通过。
5. `project-010` 可从 “Stage 9 current active line” 正式降级为 completed handoff，后续 rollout 只消费其产物，不再承载新增阻断项。

## 7. 里程碑记录

1. 2026-03-25：创建 `project-013`，将 Stage 9 剩余阻断项正式收敛为“远端 provider 真实调用 + adapter operations”独立执行流，并把 `project-010 / sprint-003` 迁入 completed history。
