# project-058-cli-session-continuity-and-claude-recovery 计划

- Status: completed
- Date: 2026-04-07
- Stage Mapping: cli interaction hardening
- Phase Mapping: session continuity fallback / Claude Code real-path recovery
- Upstream:
  - `.repo-ai-governor/context/dev/project-039-provider-session-reuse-and-backend-conversation-continuity-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
  - `.repo-ai-governor/context/dev/project-053-real-adapter-invocation-productization/plan.md`

## 1. 目标

1. 修复 CLI `session.main` 在 provider backend continuation 不可用时缺少轻量上下文连续性的产品缺口。
2. 修复 `Claude Code` real-path `cli_exec` probe/invoke 参数拼装回归，恢复本机可用环境下的真实探测与调用。
3. 为后续 sprint closeout 保留一条单独的 exit acceptance 边界，而不把实现修复和治理收口混在同一个 `TK` 中。

## 2. Sprint 细化

## 2.1 sprint-001-continuity-fallback-and-real-probe-recovery

- Status: completed
- Sprint Goal: 用一个最小实现边界同时修复 `session.main` 轻量连续性和 `Claude Code` real-path CLI 回归。
- Task Package: `TK-652`、`TK-653`、`TK-654`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-652 | sprint-001 | fix session.main continuity fallback and Claude Code real-path CLI regression | cli/runtime/adapter | project-039、project-043、project-053 tracebacks | completed |
| TK-653 | sprint-001 | sprint-001 exit acceptance and follow-up handoff readiness | closeout/handoff | TK-652 | completed |
| TK-654 | sprint-001 | finalize project-058 closeout and clear the active primary stream | closeout/final-audit | TK-652、TK-653 | completed |

## 4. 依赖产物策略

1. `session.main` 连续性优先复用现有 `latestNoteSummary / previewSummary`，避免额外引入新的 durable truth 面。
2. `Claude Code` real-path 修复优先限定在参数拼装与真实性回归，不扩大 transport contract。
3. 本项目在 `TK-652` 完成后再进入 sprint closeout，避免尚未核验就过早宣称边界完成。

## 5. DoD（project-058）

1. `Claude Code` 本机已可用时，CLI adapter probe 不再稳定误报失败。
2. `session.main` 在 provider continuation `unsupported` 时，后续轮次仍可消费 lightweight session note continuity。
3. 至少具备 targeted regression evidence，且同窗口 `pnpm run build` 通过。

## 6. 里程碑记录

1. 2026-04-07：创建 `project-058 / sprint-001` active stream，用于收口用户反馈的 CLI 连续性与 Claude real-path 回归。
2. 2026-04-07：`TK-652` 已完成，`session.main` 现在会在 provider continuation `unsupported` 时回退到 lightweight session note，且编译后真实 `Claude Code` adapter probe 已在本机恢复为 `available`；下一边界为 `TK-653` sprint exit acceptance。
3. 2026-04-07：`TK-653 / DA-653` 已完成 sprint-001 closeout，确认本项目无需新增 CR lifecycle，即可直接进入 `TK-654` project-final closeout。
4. 2026-04-07：`TK-654 / DA-654` 已完成最终 closeout write-back，`project-058` 正式进入 `completed`，并在此里程碑回链 [project-058 completion audit summary](./project-058-cli-session-continuity-and-claude-recovery-completion-audit-summary.md)。
