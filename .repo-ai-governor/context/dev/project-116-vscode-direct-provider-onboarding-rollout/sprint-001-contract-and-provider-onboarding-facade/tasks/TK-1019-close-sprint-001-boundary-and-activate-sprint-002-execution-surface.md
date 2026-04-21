# TK-1019 close sprint-001 boundary and activate sprint-002 execution surface

- Status: completed
- Date: 2026-04-20
- Owner: AI-Agent
- Priority: P1
- Project: `project-116-vscode-direct-provider-onboarding-rollout`
- Sprint: `sprint-001-contract-and-provider-onboarding-facade`

## 1. 任务目标

After sprint-001 reaches clean `TK/CR` terminal state, close the sprint boundary, activate sprint-002, and prepare the local boundary commit.

## 2. Depends On

1. `CR-001` reviewer-clean handoff

## 3. 预期产物

1. sprint-001 closeout-ready plan/current-context write-back
2. sprint-001 boundary-level local commit recommendation
3. sprint-002 activation handoff note

## 4. Required Inputs

1. AGENTS.md
2. .repo-ai-governor/context/current-context.md
3. .repo-ai-governor/context/completed-streams-history.md
4. .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md
5. .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/plan.md
6. .repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/plan.md
7. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/tasks/CR-001.md

## 5. Traceback References

1. .codex/skills/workspace-scoped-cr-loop/SKILL.md
2. .codex/skills/workspace-delivery-finisher/SKILL.md
3. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 在 `CR-001` resolved 后完成 sprint-001 的 review/task truth、plan、history 与 `current-context.md` closeout write-back。
2. 把 sprint-002 标记为新的 primary execution surface，并让 `TK-1007` 进入 `in_progress`。
3. 运行 sprint-001 boundary gate，准备当前 sprint 的 local boundary commit。

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

1. 2026-04-20：任务创建，用于承接 sprint-001 reviewer-clean 之后的 closeout、boundary gate 与 sprint-002 activation truth 切换。
2. 2026-04-20：`CR-001` 已 resolved；sprint-001 的 review/task truth、project plan、sprint plans、completed history 与 `current-context.md` 已统一切换到 closeout-ready / sprint-002 activation truth。
3. 2026-04-20：`TK-1007` 已在同窗口切换为 `in_progress`，作为 sprint-002 的首个 active execution boundary；下一步只保留 sprint-001 boundary gate 与 local commit。

## 10. 产出

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-001-contract-and-provider-onboarding-facade/plan.md`
5. `.repo-ai-governor/context/dev/project-116-vscode-direct-provider-onboarding-rollout/sprint-002-plugin-native-direct-api-key-entry/plan.md`
