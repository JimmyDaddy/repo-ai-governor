# ADR: VS Code Direct Workbench Authoring, Runtime Lanes, And HITL Decision Cockpit

- Status: active
- Date: 2026-04-22
- Module: `runtime.governance-clients`

## 1. Context

`runtime.governance-clients` 已 formalize `VS Code primary governance workbench`，但当前 VS Code 插件在三类高价值能力上仍然停留在 bridge-first 或 evidence-only 形态：

1. `Workflow Studio` 当前仍是 service-backed evidence webview，还不是直接 authoring surface。
2. runtime 状态消费目前分散在 execution / queue / artifact / session continuity 投影里，尚未形成 `role lane + stage progress + execution graph` 的统一工作台。
3. HITL 相关动作虽然已经可以 `submit / recover / terminate`，但 risk facts、SLA、impact scope 与 decision context 还没有收敛成一个 decision cockpit。
4. 既有 `VS Code primary full governance workbench` ADR 解决的是产品边界与 split cutover，不是这三类 surface 的 payload、ownership 与 phased rollout contract。
5. 如果继续只把 richer surface 留在 draft 或代码命名层，就会长期存在 “publicly primary, but still not directly operable” 的落差。

## 2. Decision

正式接受以下 follow-up direction：

1. 在既有 `primary governance workbench` 方向下，新增三类 first-class direct-workbench surface：
   - `Workflow Studio Authoring`
   - `Runtime Lanes`
   - `HITL Decision Cockpit`
2. `Workflow Studio Authoring` 固定采用 `schema-first authoring + graph projection`：
   - canonical workflow truth 继续由 service-owned workflow definition / compiled IR 持有
   - VS Code 只能消费 `workflow draft session`，并以 patch + validate + commit 的形式回写
   - richer graph editing 只能建立在 service-owned draft session 之上，不允许 extension-local graph truth
3. `Runtime Lanes` 固定消费 `execution graph / role lane status / execution stage progress / task execution backlinks / session continuity` 的 service-owned projection，不允许插件本地拼装第二套状态机。
4. `HITL Decision Cockpit` 固定消费 `hitl decision packet`，并继续通过 `submitHitlDecision / recoverExecution / terminateExecution` 走既有 trust/policy gate。
5. 更强的 direct-workbench claim 继续 evidence-gated：
   - 本 ADR formalize planning-side direction 与 owner split
   - 不提前宣称 direct graph authoring、runtime lanes 或 full decision cockpit 已在 public support truth 中完成
6. follow-up rollout 由 `project-121-vscode-direct-workbench-orchestration-runtime-hitl-rollout` 承接。

## 3. Rationale

1. 把 direct-workbench follow-up 单独 formalize，可以避免和现有 active full-workbench solution 产生竞争性 replacement 关系。
2. 将 workflow authoring 收敛为 `draft session + revision token + conflict state`，可以在增强交互的同时守住 `service-owned truth` 边界。
3. 把 runtime lanes 与 HITL cockpit 定义为 richer workbench panel，而不是继续塞进 commands/tree-only affordance，更符合 multi-object / cross-entity / context-heavy interaction 的负载形态。
4. 明确保留 public support truth 的分层治理，可以避免因为 formal solution 升级而倒逼 README/support docs 误报“已全部交付”。

## 4. Consequences

1. `runtime.governance-clients` 必须更新 `contract.runtime.vscode-governance-workbench-surface.v1`，把 `workflow_draft_session / runtime_lane_status / session_continuity / hitl_decision_packet` 纳入 stable capability vocabulary。
2. `runtime.orchestration` 必须新增 direct-workbench contract，并同步扩展 aggregation facade contract，正式冻结 workflow draft session、runtime status bus 与 HITL decision packet 的最小 payload shape。
3. VS Code 插件后续实现必须继续以 `local orchestration service` 为唯一 truth owner；所有 richer panels 只消费 DTO / query / command seam。
4. 若未来需要把 direct-workbench claim 从 planning-side formal direction 升级为新的 public support truth，必须走独立 evidence window，而不是借本 ADR 静默改口。

## 5. Follow-Up

1. `project-121` sprint-001：冻结 direct HITL cockpit 与 runtime-lane baseline contract，形成 activation handoff
2. `project-121` sprint-002：落 workflow draft session 与 schema-first authoring baseline
3. `project-121` sprint-003：评估 richer graph editing、support-truth boundary 与 delivery evidence readiness
