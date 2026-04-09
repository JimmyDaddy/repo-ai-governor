# project-076-transport-selection-authority-rollout 计划

- Status: active
- Date: 2026-04-09
- Stage Mapping: runtime.agent-projection follow-up rollout
- Phase Mapping: contract and routing truth / connect UX / evidence-gated docs uplift
- Upstream:
  - `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/plan.md`
  - `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-718-transport-selection-authority-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`

## 1. 目标

1. 把 transport selection authority 与 strict transport routing 从 formal docs 落到 runtime / diagnostics / connect UX / evidence surfaces。
2. 补齐 `enabled_tools[]` canonical truth、same-surface no-failover guard 与 per-tool transport authoring UX。
3. 在 evidence gate 通过时再升级 adopter-facing docs wording，并把升级证据回链到 delivery registry。

## 2. Sprint 细化

## 2.1 sprint-001-contract-and-routing-truth-cutover

- Status: completed
- Sprint Goal: 收敛 onboarding / probe / runtime contract truth，并建立 same-surface no-failover guard 与回归基线。
- Task Package: `TK-726`、`TK-727`、`TK-728`、`TK-735`

## 2.2 sprint-002-connect-selection-ux-and-candidate-materialization

- Status: completed
- Sprint Goal: 为 `connect` 增加显式 transport 选择 UX，并保证 candidate config / diagnostics 稳定 materialize user-selected transport。
- Task Package: `TK-729`、`TK-730`、`TK-731`、`TK-736`

## 2.3 sprint-003-evidence-gated-docs-and-adopter-truth

- Status: active
- Sprint Goal: 产出 clean-room / verify evidence，并仅在 gate 通过时升级 public support wording 与 delivery closeout。
- Task Package: `TK-732`、`TK-733`、`TK-734`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-726 | sprint-001 | converge enabled-tools canonical transport truth and compatibility bridge | contract/runtime | promotion handoff | completed |
| TK-727 | sprint-001 | implement strict transport routing fail-closed guard and probe truth alignment | runtime/diagnostics | TK-726 | completed |
| TK-728 | sprint-001 | add same-surface no-failover regression coverage | tests/verification | TK-727 | completed |
| TK-735 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | sprint/closeout | TK-726、TK-727、TK-728、CR-001 | completed |
| TK-729 | sprint-002 | add per-tool transport selection flags to connect | cli/ux | TK-728 | completed |
| TK-730 | sprint-002 | materialize explicit transport in candidate config and validate unsupported combinations | config/validation | TK-729 | completed |
| TK-731 | sprint-002 | project transport selection source and lock state across connect-doctor-verify outputs | diagnostics/output | TK-730 | completed |
| TK-736 | sprint-002 | sprint-002 exit acceptance and sprint-003 activation handoff | sprint/closeout | TK-729、TK-730、TK-731、CR-001、CR-002、CR-003 | completed |
| TK-732 | sprint-003 | produce clean-room and verify evidence for codex and claude-code remote_api paths | evidence/verification | TK-731 | completed |
| TK-733 | sprint-003 | uplift adopter-facing support wording only when evidence gate passes | docs/evidence-gated uplift | TK-732 | completed |
| TK-734 | sprint-003 | finalize rollout closeout and delivery evidence handoff | closeout/delivery | TK-733 | planned |

## 4. 依赖产物策略

1. `sprint-001` 优先落实 runtime / contract truth，不允许 public docs wording 抢跑。
2. `sprint-002` 只在 `sprint-001` 的 canonical truth 收口后再扩展 connect UX，避免 CLI authoring 与 runtime truth 漂移。
3. `sprint-003` 的 docs uplift 必须绑定 clean-room / release-style evidence；若证据不足，允许只完成 evidence gap register 而不提升 wording。

## 5. DoD（project-076）

1. runtime / onboarding / probe surfaces 已诚实表达 explicit transport selection 与 strict transport routing。
2. `connect` 能显式 author per-tool transport，并 materialize candidate config truth。
3. `verify` / clean-room evidence 能证明 `remote_api` 路径未被静默改写为同 surface `cli_exec` 成功结果。
4. 若 evidence gate 通过，`docs/support-matrix*` 与 `docs/local-adoption-playbook*` 已完成受控 uplift；否则交付明确 gap register 与保守 wording。

## 6. 里程碑记录

1. 2026-04-09：`project-076` 作为 `technical-solution.transport-selection-authority-and-strict-routing` 的 planned rollout stream 被创建。
2. 2026-04-09：三阶段拆解已冻结为 `contract truth -> connect UX -> evidence-gated docs`。
3. 2026-04-09：用户要求开始任务拆解后，`sprint-001-contract-and-routing-truth-cutover` 已被激活为当前 primary execution surface。
4. 2026-04-09：`TK-726`、`TK-727`、`TK-728` 已完成实现与定向验证，当前进入 `sprint-001` scoped CR loop。
5. 2026-04-09：`CR-001` 已 resolved，`TK-735 / DA-735` 已完成 sprint-001 closeout 与 sprint-002 activation handoff；当前下一边界固定为 `TK-729`。
6. 2026-04-10：`TK-729`、`TK-730`、`TK-731` 的实现与定向验证已完成；当前边界进入 `sprint-002` scoped CR loop。
7. 2026-04-10：`CR-002` 的迟到 reviewer finding 已完成修复，`CR-003` fresh delegated recheck 返回 clean verdict；`TK-736 / DA-736` 已完成 sprint-002 closeout，并将 primary execution surface 激活到 `sprint-003`。
8. 2026-04-10：`TK-732 / DA-732` 已完成 Codex / Claude Code 显式 `remote_api` 的 targeted adapter、packaged distribution 与 clean-room 证据汇总，evidence gate 判定为 `passed`。
9. 2026-04-10：`TK-733` 已基于 `TK-732` 的 gate verdict 受控升级 `docs/support-matrix*` 与 `docs/local-adoption-playbook*` wording；下一边界为 `sprint-003` scoped CR loop。
