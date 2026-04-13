# project-098-cli-exec-runtime-rollout 计划

- Status: active
- Date: 2026-04-13
- Stage Mapping: runtime.agent-projection cli_exec runtime rollout
- Phase Mapping: native runtime foundation / cross-adapter hardening and diagnostics evidence / explicit ACP seam guardrails and closeout
- Upstream:
  - `.repo-ai-governor/context/dev/project-097-cli-exec-runtime-promotion-and-decomposition/plan.md`
  - `.repo-ai-governor/context/dev/project-097-cli-exec-runtime-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-819-cli-exec-runtime-promotion-and-rollout-decomposition-handoff.md`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`

## 1. 目标

1. 把 cli-exec runtime hardening 方向从 formal docs 落到 shared native `cli_exec` process runtime、adapter cutover 与 cross-platform diagnostics / evidence surface。
2. 先收敛 adapter-authored `resolved launch plan` 与 shared `lifecycle observer`，再补 `Claude Code` / `GitHub Copilot` cutover 和 Windows/Unix process-tree hardening。
3. 保持 ACP 仅作为 explicit、non-default、non-public seam；若未来要把 ACP 升格为 host-facing surface、distribution contract 或新的 canonical transport value，必须先新建独立 technical solution。

## 2. Sprint 细化

## 2.1 sprint-001-native-cli-runtime-foundation-and-codex-convergence

- Status: completed
- Sprint Goal: 建立 shared native `cli_exec` runtime、adapter-authored launch-plan seam 与 Codex lifecycle observer baseline。
- Task Package: `TK-821`、`TK-822`、`TK-823`、`TK-824`

## 2.2 sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence

- Status: completed
- Sprint Goal: 将 shared runtime 扩展到 `Claude Code` / `GitHub Copilot`，并补齐 cross-platform diagnostics 与 evidence。
- Task Package: `TK-825`、`TK-826`、`TK-827`、`TK-828`

## 2.3 sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout

- Status: active
- Sprint Goal: 锁定 explicit ACP seam guardrail、补齐 non-regression evidence，并完成 rollout closeout。
- Task Package: `TK-829`、`TK-830`、`TK-831`、`TK-832`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-821 | sprint-001 | establish shared native cli_exec process runtime and adapter-authored resolved launch plan seam | runtime/foundation | promotion handoff | completed |
| TK-822 | sprint-001 | project codex lifecycle observer partial-output and terminate-phase semantics onto the shared runtime | runtime/liveness | TK-821 | completed |
| TK-823 | sprint-001 | preserve adapter-owned entrypoint shell and process-tree policies while adding baseline launch diagnostics | diagnostics/ownership | TK-822 | completed |
| TK-824 | sprint-001 | sprint-001 exit acceptance and sprint-002 activation handoff | sprint/closeout | TK-821、TK-822、TK-823 | completed |
| TK-825 | sprint-002 | cut claude-code onto the shared native cli_exec runtime and lifecycle observer | adapter/cutover | TK-823 | completed |
| TK-826 | sprint-002 | cut github-copilot onto the shared native cli_exec runtime and aligned cancellation semantics | adapter/cutover | TK-825 | completed |
| TK-827 | sprint-002 | harden Unix and Windows process-tree termination plus additive diagnostics evidence across adapters | cross-platform/evidence | TK-826 | completed |
| TK-828 | sprint-002 | sprint-002 exit acceptance and sprint-003 activation handoff | sprint/closeout | TK-825、TK-826、TK-827 | completed |
| TK-829 | sprint-003 | isolate a provisional ACP extension seam behind non-canonical internal runtime boundaries | runtime/seam | TK-827 | active |
| TK-830 | sprint-003 | add guardrails so ACP remains additive non-default and non-public without a separate solution | governance/guardrails | TK-829 | active |
| TK-831 | sprint-003 | produce regression and evidence packets for native cli_exec convergence and ACP seam non-regression | evidence/verification | TK-830 | active |
| TK-832 | sprint-003 | finalize project-098 rollout closeout and delivery evidence handoff | closeout/delivery | TK-831 | planned |

## 4. 依赖产物策略

1. `sprint-001` 必须优先收敛 shared runtime owner、adapter-authored `resolved launch plan` 与 shared lifecycle observer，否则后续 cross-adapter cutover 只会把漂移复制到更多 surface。
2. `sprint-002` 只在 `Codex` baseline 已成为公共 seam 后启动，避免 `Claude Code` / `GitHub Copilot` 抢跑到未稳定的 runtime abstraction 上。
3. `sprint-003` 只锁定 explicit ACP seam guardrail 与 internal non-regression evidence，不在本项目内把 ACP 升格为公开 transport 或 adopter-facing support wording。
4. 若未来需要 host-facing ACP surface、distribution contract、support matrix uplift 或新的 canonical transport value，必须先新建独立 technical solution，而不是在本 rollout 内隐式扩 scope。

## 5. DoD（project-098）

1. shared native `cli_exec` runtime 能统一 launch / timeout / cancel / partial-output / lifecycle diagnostics owner，而不改变 canonical `cli_exec` truth。
2. adapter-owned `resolved launch plan`、`entrypoint`、`shell_strategy`、`process_tree_policy` 与 `request_cancellation_mode` 边界保持稳定，没有退化成新的 cross-layer God object。
3. cross-platform diagnostics / evidence 能证明 additive truth，例如 `entrypoint_resolution`、`shell_wrapped`、`process_tree_policy`、`spawn_error_code`，同时不把这些字段误升级为 minimum contract requirement。
4. ACP seam 保持 explicit、non-default、non-public；project closeout 时 delivery registry 与 evidence artifacts 已能清楚表达这一边界。

## 6. 里程碑记录

1. 2026-04-13：`project-098` 作为 `technical-solution.cli-exec-runtime-hardening-and-explicit-acp-extension-seam` 的 planned rollout stream 被创建。
2. 2026-04-13：三阶段拆解已冻结为 `shared runtime foundation -> cross-adapter hardening -> explicit ACP seam guardrails`。
3. 2026-04-13：已将 `sprint-001 ~ sprint-003` 与 `TK-821 ~ TK-832` 全量拆解写入 project / sprint / task surface，待后续窗口按顺序激活。
4. 2026-04-13：`project-098 / sprint-001` 已切为 primary execution surface；shared runtime、Codex convergence、Claude/GitHub cutover、ACP internal seam 与 focused evidence 已完成实现，当前按 sprint 顺序进入 delegated CR loop。
5. 2026-04-13：`CR-001` 已 resolved，shared runtime 非零退出语义与 regression coverage 已补齐；`TK-821 ~ TK-824` 已完成收口，当前已激活 `sprint-002` 作为下一条 primary execution surface。
6. 2026-04-13：`Claude Code` / `GitHub Copilot` shared runtime cutover、cross-platform terminate hardening 与 additive diagnostics evidence 已完成实现，`TK-825 ~ TK-827` 当前进入 sprint-002 fresh reviewer CR loop。
7. 2026-04-13：`sprint-002` fresh review 已 clean 收口；`process_group_best_effort` branch-level regression coverage 已补齐，`TK-825 ~ TK-828` 全部完成，当前已激活 `sprint-003` 作为新的 primary execution surface。
8. 2026-04-13：`TK-829 ~ TK-831` 已切换为 `active`；internal ACP seam、config guardrail 与 non-regression evidence 当前进入 sprint-003 fresh reviewer CR loop。

## 7. 里程碑记录入口

1. 后续 closeout 完成后在此回链 `project-098-cli-exec-runtime-rollout-completion-audit-summary.md`
