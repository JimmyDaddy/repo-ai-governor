# TK-1021 close sprint-004 boundary and activate sprint-005 execution surface

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-115-acp-execution-bridge-rollout`
- Sprint: `sprint-004-clean-room-execution-and-packaged-evidence`

## 1. 任务目标

After sprint-004 reaches clean `TK/CR` terminal state, close the sprint boundary, activate sprint-005, and prepare the sprint-004 local boundary commit.

## 2. Depends On

1. `CR-001` reviewer-clean handoff

## 3. 预期产物

1. sprint-004 closeout-ready plan/current-context write-back
2. sprint-004 boundary-level local commit recommendation
3. sprint-005 activation handoff note

## 4. Required Inputs

1. AGENTS.md
2. .repo-ai-governor/context/current-context.md
3. .repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/plan.md
4. .repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/plan.md
5. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/tasks/CR-001.md

## 5. Traceback References

1. .codex/skills/workspace-scoped-cr-loop/SKILL.md
2. .codex/skills/workspace-delivery-finisher/SKILL.md
3. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md
4. .repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md

## 6. 实施计划

1. 在 `CR-001` resolved 后完成 review lifecycle、plan 与 current-context 的 closeout write-back。
2. 把 sprint-005 标记为新的 primary execution surface，并让 `TK-1001` 进入 `in_progress`。
3. 运行 sprint-004 boundary gate，准备当前 sprint 的 local boundary commit。

## 7. Development Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-code-review-status-sync.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 8. Delivery Verification

1. `pnpm run check`
2. `node ./scripts/governance/check-code-review-status-sync.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-20：任务创建，状态初始化为 `in_progress`。
2. 2026-04-20：`CR-001` 已 resolved，当前任务作为 sprint-004 的 closeout surface 被立即创建，用于完成 boundary gate、local commit 与 sprint-005 activation write-back。
3. 2026-04-20：`pnpm run check` 已在当前 closeout 窗口通过，`current-context.md`、completed stream history、project plan、sprint-004 / sprint-005 plans 已统一切换到 sprint-004 completed / sprint-005 active truth。
4. 2026-04-20：`TK-1001` 已在同窗口切换为 `in_progress`，作为 sprint-005 的首个 active execution boundary；当前任务切换为 `completed`，下一步仅保留 sprint-004 boundary local commit 作为交付动作。

## 10. 产出

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-004-clean-room-execution-and-packaged-evidence/plan.md`
5. `.repo-ai-governor/context/dev/project-115-acp-execution-bridge-rollout/sprint-005-external-interoperability-and-rollout-closeout/plan.md`
