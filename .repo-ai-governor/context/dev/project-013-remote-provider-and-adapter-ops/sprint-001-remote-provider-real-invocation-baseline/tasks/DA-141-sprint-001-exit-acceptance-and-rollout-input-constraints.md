# DA-141 sprint-001 出口验收与后续 rollout 输入约束

- Status: active
- Date: 2026-03-25
- Owner: AI-Agent
- Artifact ID: `DA-141`
- Produced By: `TK-141`
- Scope: `project-013-remote-provider-and-adapter-ops`

## 1. 出口结论

`accept`

`project-013 / sprint-001-remote-provider-real-invocation-baseline` 已满足远端 provider 真实执行面 baseline 的退出条件，可以作为后续 rollout 与剩余 P1/P2 扩张的正式输入基线继续消费。

## 2. 验收范围

1. Codex / GitHub Copilot / Claude Code 三条官方远端 provider 路径的真实 `probe/invoke` 语义
2. adapter 运维契约：凭据优先级、health/deep probe、timeout/retry、rate-limit/backoff、secret redaction、degrade path
3. CLI runtime、route runner、capability truthfulness 与 diagnostics 映射的一致性
4. 任务台账、review 生命周期、artifact registry 与质量门禁同步情况

## 3. 出口判定

1. Exit Criteria 1：通过
   - `DA-137`、`DA-138`、`DA-139` 已分别证明 Codex / GitHub Copilot / Claude Code 均具备真实 CLI-backed `probe/invoke` 路径。
   - 各自都完成了官方入口选择、missing command / credential / timeout 等失败映射，以及 gate fixture 稳定性收口。
2. Exit Criteria 2：通过
   - `DA-140` 已把跨 provider 的 retry/backoff、detail 抽取、脱敏、quota/rate-limit diagnostics 和总 timeout budget 语义统一到共享 runtime。
   - `TK-140` follow-up CR 已进一步验证共享 retry runtime 不会重试已 abort 请求，也不会把单次 `timeoutMs` 线性叠加到多次重试。
3. Exit Criteria 3：通过
   - `DA-137`~`DA-140` 已证明 route runner、CLI diagnostics 与 capability matrix 不再把远端 provider 误表示为 baseline stub。
   - Claude Code `STRUCTURED_OUTPUT` truthfulness、GitHub Copilot non-zero exit fail-closed、Codex fixture fail-closed 都已形成明确收口证据。
4. Exit Criteria 4：通过
   - sprint-001 产物链 `DA-136`~`DA-141` 已完整形成。
   - review 生命周期、task ledger、artifact registry lifecycle 与总 gate 均已通过。

## 4. 关键证据

1. `DA-136`：定义 `project-013` 的边界、依赖与禁止回退约束。
2. `DA-137`：Codex 远端 provider、health probe、fixture 与 diagnostics 基线。
3. `DA-138`：GitHub Copilot `copilot -> gh copilot --` 入口回退、capability truthfulness 与 gate 稳定性基线。
4. `DA-139`：Claude Code `claude -> claude-code` 回退、fallback/degrade 与 structured-output truthfulness 基线。
5. `DA-140`：跨 provider 共享 CLI exec operations runtime 与 route-runner truthfulness 基线。

## 5. 冻结后的 rollout 输入约束

1. 新增远端 provider 时，必须同时完成真实 `probe/invoke`、capability truthfulness、diagnostics 映射和 gate fixture 注入；不得先以 baseline stub 进入生产路由。
2. 远端 CLI-backed provider 默认必须复用 `AgentCliExecOperationsRuntime`，不得再次在 adapter 内复制 retry/backoff、detail 抽取或 redaction 逻辑。
3. 任何 provider 若真实输出仍是 plain text，就不得把 `STRUCTURED_OUTPUT` 标为 `SUPPORTED`。
4. route runner 与 CLI diagnostics 的 unavailable reason taxonomy 必须与 adapter 实际 probe 行为保持同源，不得再出现“探测/执行/能力声明”漂移。
5. 所有 gate / examples / blackbox / e2e 路径必须使用显式 test-fixture enable gate，默认 fail-closed，避免生产入口接受测试 override。
6. 后续 rollout 如扩张到更多 provider 或更深的 release/ops 面，必须继续遵守 `project-011` 已冻结的 CLI bounded-context 边界。

## 6. 非阻断遗留项

1. 本轮只完成了第一批官方远端 provider baseline，后续若要扩 provider coverage，属于新的 rollout 工作，而非本 sprint 阻断。
2. 当前产物已足以证明 Stage 9 中“远端 provider 真实调用与 adapter 运维契约”这条阻断项完成 baseline 收口。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`
