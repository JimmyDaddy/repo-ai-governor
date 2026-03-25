# sprint-001-remote-provider-real-invocation-baseline 计划

- Status: completed
- Date: 2026-03-25
- Project: `project-013-remote-provider-and-adapter-ops`

## 1. Sprint Goal

将 Codex / GitHub Copilot / Claude Code 从 baseline stub 升级为统一治理下的真实 provider 执行面，并冻结 adapter 运维契约与后续 rollout 输入约束。

## 2. Task Bundle

1. `TK-136` project-013 启动与远端 provider 收口重排
2. `TK-137` Codex 远端 provider 真实调用与凭据/health 契约
3. `TK-138` GitHub Copilot 远端 provider 真实调用与 capability truthfulness 收口
4. `TK-139` Claude Code 远端 provider 真实调用与 fallback/degrade 收口
5. `TK-140` 跨 provider adapter 运维契约与 route-runner truthfulness hardening
6. `TK-141` sprint-001 出口验收与后续 rollout 输入约束

## 3. Entry Criteria

1. `project-010` 已完成并形成 `DA-112 + completion audit summary`。
2. `project-011` 与 `project-012` 的 handoff 已完成，可作为 CLI bounded-context 与 execution-context 基线继续消费。
3. `current-context.md` 已切换到 `project-013` 作为 active primary stream。

## 4. Exit Criteria

1. 至少 3 类官方远端 provider 路径具备真实 `probe/invoke` 语义。
2. adapter 运维契约覆盖凭据优先级、health/deep probe、timeout/retry、rate-limit/backoff、secret redaction 与 degrade path。
3. CLI runtime、route runner 与 adapter capability/diagnostics 对真实执行面保持一致。
4. 形成 `DA-136`~`DA-141` 产物链，并完成 sprint-001 出口验收。

## 5. Risks

1. 不同远端 provider 的授权与 CLI/SDK 接入方式差异较大，容易在 capability truthfulness 上产生漂移。
2. route runner 若继续假定 baseline adapter 行为，可能导致 diagnostics 与真实执行不一致。
3. 凭据与 rate-limit 处理若没有统一约束，最容易在 blackbox/release gate 中形成不稳定故障。
