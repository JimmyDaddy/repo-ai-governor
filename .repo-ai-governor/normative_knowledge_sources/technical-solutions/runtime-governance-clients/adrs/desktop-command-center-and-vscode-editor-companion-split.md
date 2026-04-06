# ADR: Desktop Command Center And VS Code Editor Companion Split

- Status: active
- Date: 2026-04-05
- Module: `runtime.governance-clients`

## 1. Context

`project-041` 已把桌面端产品形态冻结为 `local orchestration service` 的 desktop governance console；`project-044` 与 `project-046` 又完成了 desktop foundation 与 artifact-pane contract baseline。但在进入 `P2` 前，仍有一个关键决策需要正式化：

1. Desktop 是否继续向 full IDE 方向扩张。
2. 若同时实现 VS Code 插件，desktop 与 editor surface 应如何分工。
3. 多表面如何共享 query/command seam、session/execution/hitl/artifact truth 与 handoff 语义。

与此同时，2026-04-05 检索到的官方资料显示：

1. `Codex app` 已被定位为 `command center for agents`。
2. `Cursor` 将 desktop 强化为 AI-native editor + background agent network。
3. `GitHub Copilot` 明确区分 editor 内 agent 与 cloud coding agent。
4. VS Code 官方扩展 UX 更适合轻量 views/chat participant/commands，而不是重型 webview app shell。

## 2. Decision

正式采用以下产品分工：

1. `Desktop` 作为 `outer-loop governance command center`。
2. `VS Code` 插件作为 `inner-loop editor companion`。
3. `CLI` 保持 `bootstrap / automation / CI / scriptable entry`。
4. 三者共享同一套 `local orchestration service + shared query/command contract + shared identifiers`。

## 3. Rationale

1. 这最符合 PRD 与架构既有边界：UI 入口只能做 client/presenter，不得拥有 runtime 主状态。
2. 这比 full IDE 路线更能保住本产品的治理差异化：HITL、review verify、policy trace、ledger evidence、automation queue。
3. 这也比把 VS Code 插件做成“大 webview 套壳 app”更符合官方扩展模式与 adoption 路径。
4. surface split 明确后，desktop 与 VS Code 就不再需要追求完全功能对等，只需共享 truth boundary 与 handoff semantics。

## 4. Consequences

1. desktop 的第一优先级从“更多只读 panel”改为“actionable console baseline”：
   - `submitHitlDecision`
   - `recoverExecution`
   - `getExecution`
   - `terminateExecution`
   - handoff contract
2. VS Code 插件 MVP 的正式形态固定为：
   - `1` 个 view container
   - `3-4` 个 lightweight views
   - `1` 个 chat participant
   - 少量 tools / commands / code actions
   - detail-only webview
3. future surface 不得自行维护 execution/session/review/policy 的 shadow truth。
4. 若未来确实需要 richer editor affordance，应作为 optional overlay 增量引入，而不是回退为 full IDE fork。

## 5. Follow-Up

1. 本 ADR formalize 的是 split 和 rollout order，不宣称桌面端或 VS Code 插件已经完成实现。
2. 真正的 delivery follow-up 由 `project-048-governance-surface-clients-rollout` 承接：
   - sprint-001：shared core + actionable desktop console baseline
   - sprint-002：VS Code editor companion MVP
   - sprint-003：desktop governance evidence surface
   - sprint-004：automation queue + multi-workspace governance
