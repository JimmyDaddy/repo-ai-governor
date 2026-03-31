# project-033-session-main-agent-runtime-productization 计划

- Status: active
- Date: 2026-03-31
- Stage Mapping: Session-first shell path-A follow-up
- Phase Mapping: Activation and contract delta / Service-owned dispatcher / Intent and adapter routing / Rollout and parity
- Upstream:
  - `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
  - `.repo-ai-governor/context/dev/project-029-cli-session-first-agent-shell/project-029-cli-session-first-agent-shell-completion-audit-summary.md`
  - `.repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/plan.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/adrs/session-first-shell-and-service-owned-session-state.md`

## 1. 目标

1. 将 `session.main` 从当前 `baseline_ack` 升级为真实的 service-owned 主 agent turn runtime。
2. 保持 CLI / future desktop 继续只消费 `orchestration-service-client` DTO 与 event contract，不旁路 runtime internals。
3. 让主 agent 在前台承担意图识别、adapter-routing 选择、slash handoff 建议与 transcript metadata 回灌，而不是直接替代后台编排角色。
4. 为后续 LangGraph / MCP / A2A 演进保留兼容位，但当前阶段锁定路径 A：`service-owned session.main + local adapter routing + command handoff`。

## 2. Sprint 细化

## 2.1 sprint-001-activation-and-session-main-contract-delta

- Status: completed
- Sprint Goal: 激活 follow-up project，固化 `session.main` contract delta、turn result semantics 与 path-A phase map。
- Task Package: `TK-451`、`TK-452`。

## 2.2 sprint-002-service-owned-session-main-dispatcher

- Status: completed
- Sprint Goal: 实现真实 `session.main` dispatcher、assistant delta/complete/failure event semantics，并替换 `baseline_ack`。
- Task Package: `TK-453`、`TK-454`。

## 2.3 sprint-003-intent-routing-and-command-handoff

- Status: completed
- Sprint Goal: 为主 agent 接入 adapter routing、session-level routing preference 与 command-intent / handoff metadata。
- Task Package: `TK-455`、`TK-456`。

## 2.4 sprint-004-rollout-and-parity-closeout

- Status: planned
- Sprint Goal: 完成 CLI session shell / resume / desktop consumer parity 验证、docs/review/rollout closeout。
- Task Package: `TK-457`、`TK-458`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-451 | sprint-001 | activate project-033 and sync path-A phase map | planning/governance | `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md` | completed |
| TK-452 | sprint-001 | formalize session.main contract delta and structured turn semantics | docs/contracts | TK-451 | completed |
| TK-453 | sprint-002 | implement service-owned session.main dispatcher and replace baseline ack | runtime/session-main | TK-452 | completed |
| TK-454 | sprint-002 | stream assistant delta completion and failure metadata through session events | runtime/session-events | TK-453 | completed |
| TK-455 | sprint-003 | integrate session.main with adapter routing and session-level routing preference | runtime/adapter-routing | TK-454 | completed |
| TK-456 | sprint-003 | emit command-intent suggestion handoff metadata and transcript backlinks | runtime/handoff-metadata | TK-455 | completed |
| TK-457 | sprint-004 | verify CLI session shell resume and desktop consumer parity for real main-agent turns | verification/parity | TK-456 | planned |
| TK-458 | sprint-004 | close docs review and rollout evidence for path-A productization | docs/rollout | TK-457 | planned |

## 4. 依赖产物策略

1. `project-033` 站在 `project-029` completed truth 之上推进，不回滚 session-first shell 已完成的入口、resume、slash handoff 与 productization 结论。
2. `project-032` 继续承接 live progress shell follow-up；本项目只关注“真实主 agent turn runtime”，不重复实现 progress dock 范围。
3. 当前 follow-up 的 canonical truth 仍然是 `runtime.cli-interactive-shell` 模块文档与 `orchestration-service-client` contract；CLI 与 desktop 只允许作为 consumer/presenter。
4. 任务编号固定保留在 `TK-451 ~ TK-458`，避免与 `project-032` 已占用 `TK-443 ~ TK-450` 冲突。

## 5. DoD（project-033）

1. `session.main` 不再返回纯 `baseline_ack`，而是能执行真实主 agent turn。
2. turn 生命周期具备稳定的 `submitted / delta / completed / failed / cancelled` service-backed event semantics。
3. 主 agent 能输出至少以下结构化结果之一：
   - `assistantMessage`
   - `suggestedSlashCommand`
   - `executionIntent`
   - `followUpQuestion`
4. session-level routing preference、adapter selection reason 与 command handoff metadata 能通过 shared session DTO / transcript semantics 回灌给 CLI 与 desktop consumer。
5. CLI session shell、resume 命令与 desktop consumer baseline 对同一份 session truth 呈现一致语义。
6. docs / review / rollout evidence 与 current-context planned/active stream surfaces 保持同步。

## 6. 里程碑记录

1. 2026-03-31：基于 session-first shell draft 中对路径 A/B/C 的重新比较，创建 `project-033-session-main-agent-runtime-productization` 作为路径 A 的 planned follow-up stream。
2. 2026-03-31：预留 `TK-451 ~ TK-458` 号段，并拆解为四个 planned sprint，覆盖 contract delta、dispatcher、intent routing 与 rollout parity。
3. 2026-03-31：完成 `sprint-001`，将路径 A phase map 与 `session.main` contract delta 正式写回 draft，并把 planned follow-up stream 推进到 `sprint-002-service-owned-session-main-dispatcher`。
4. 2026-03-31：完成 `TK-453`，为 `session.main` 新增 service-owned dispatcher，替换 `baseline_ack`，并让 transcript store 能消费 structured handoff preview metadata。
5. 2026-03-31：完成 `TK-454`，将 `TURN_FAILED / TURN_CANCELLED` 补入 shared session event contract，并让 service runtime 与 transcript presenter 都能消费失败/取消 turn 语义。
6. 2026-03-31：完成 `TK-455`，让 `session.main` 正式消费 `sessionRoutingPreference`，并将 adapter-surface selection reason 回灌到 transcript-visible metadata。
7. 2026-03-31：完成 `TK-456`，为 `session.main` completed payload 补齐 `handoffBacklinks` 结构化元数据，并让 transcript 渲染 backlink lines。
8. 2026-03-31：完成 `project-033 / sprint-003` working-tree CR 复核与修复，恢复 plain completed turn 的兼容式 transcript recap，并修正 failed/cancelled 后 `turnIndex` 的单调递增语义；同时将 follow-up planning surface 正式推进到 `sprint-004-rollout-and-parity-closeout`。
