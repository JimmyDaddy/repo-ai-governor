# TK-549 align current-context completed-stream history delivery registry and project status truth

- Status: completed
- Date: 2026-04-05
- Owner: AI-Agent
- Priority: P0
- Project: `project-045-governance-truth-alignment-and-primary-stream-cutover`
- Sprint: `sprint-001-governance-truth-alignment-and-context-cutover`

## 1. 任务目标

对齐 `current-context`、completed stream history、delivery registry 与相关 project plan 的 completed/planned 真值，修复当前显式可见的状态漂移。

## 2. Depends On

1. `TK-548`

## 3. 预期产物

1. repaired `current-context.md`
2. updated `completed-streams-history.md`
3. repaired `technical-solution-delivery-registry.yaml`
4. repaired project truth for `project-038` and `project-041`

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/context/dev/project-038-session-main-capability-explainer-productization/plan.md`
5. `.repo-ai-governor/context/dev/project-041-desktop-surface-tech-selection-and-design/plan.md`
6. `.repo-ai-governor/context/dev/project-044-desktop-governance-console-mvp-foundation/plan.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-priority-backlog.md`
2. `.repo-ai-governor/context/dev/project-039-provider-session-reuse-and-backend-conversation-continuity-rollout/project-039-provider-session-reuse-and-backend-conversation-continuity-rollout-completion-audit-summary.md`
3. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/project-043-cli-session-shell-productization-rollout-completion-audit-summary.md`

## 6. 实施计划

1. 将 `project-044 / sprint-003` 从 current-context active primary 移入 completed history。
2. 修正 delivery registry 中已完成 rollout 仍标为 `planned` 的项。
3. 为 `project-038` 补齐项目级 completion audit，并把顶层 status 对齐到 `completed`。
4. 将 `project-041` 计划中的 sprint status 对齐到 `completed`。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 9. 执行记录

1. 2026-04-05：任务创建，状态初始化为 `planned`；承接 `current-context`、completed history、delivery registry 与 project status 对齐。
2. 2026-04-05：完成 `project-044 / sprint-003` 的 history 迁移，并将 `project-045 / sprint-001` 切为新的 primary governance stream。
3. 2026-04-05：完成 `technical-solution.interactive-cli-react-style-cli` 与 `technical-solution.multi-ai-tools-onboarding-role-agent-projection` 的 rollout truth 修正。
4. 2026-04-05：为 `project-038` 补齐 completion audit summary 并将顶层 status 对齐为 `completed`；同时将 `project-041` 计划中的 sprint status 对齐为 `completed`。

## 10. 产出

1. 已完成：active stream truth repair -> `.repo-ai-governor/context/current-context.md`
2. 已完成：completed stream history repair -> `.repo-ai-governor/context/completed-streams-history.md`
3. 已完成：delivery registry rollout truth repair -> `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. 已完成：project truth repair -> `project-038` / `project-041` plan updates
