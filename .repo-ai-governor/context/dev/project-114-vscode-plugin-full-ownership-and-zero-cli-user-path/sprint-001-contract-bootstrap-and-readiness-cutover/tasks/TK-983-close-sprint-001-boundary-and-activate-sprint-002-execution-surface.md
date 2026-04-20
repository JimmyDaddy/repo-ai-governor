# TK-983 close sprint-001 boundary and activate sprint-002 execution surface

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-001-contract-bootstrap-and-readiness-cutover`

## 1. 任务目标

After sprint-001 reaches clean `TK/CR` terminal state, close the sprint boundary, write back the activation truth for sprint-002, and prepare the local boundary commit.

## 2. Depends On

1. `TK-966 prepare sprint-001 exit acceptance and sprint-002 handoff`

## 3. 预期产物

1. sprint-001 closeout-ready plan/current-context write-back
2. sprint-001 boundary-level local commit recommendation
3. sprint-002 activation handoff note

## 4. Required Inputs

1. AGENTS.md
2. .repo-ai-governor/context/current-context.md
3. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
4. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/plan.md
5. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/tasks/TK-966-prepare-sprint-001-exit-acceptance-and-sprint-002-handoff.md

## 5. Traceback References

1. .codex/skills/workspace-scoped-cr-loop/SKILL.md
2. .codex/skills/workspace-delivery-finisher/SKILL.md
3. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 等待 sprint-001 fresh reviewer round clean 收口，并将 review lifecycle 写回当前 sprint ledger。
2. 运行 sprint-001 final gate，确认 boundary commit 的 staging scope 与 commit message。
3. 写回 sprint-001 closeout truth，并把 sprint-002 标记为下一个 active execution surface。

## 7. Development Verification

1. pnpm run check
2. git status --short

## 8. Delivery Verification

1. pnpm run check
2. node ./scripts/governance/check-task-ledger-sync.js
3. node ./scripts/governance/check-sprint-plan-status-sync.js
4. node ./scripts/governance/check-code-review-status-sync.js

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：sprint-001 的 `TK-963 ~ TK-966` 与 `CR-001 ~ CR-008` 已全部进入终态，closeout 前置条件满足。
3. 2026-04-18：已将 sprint-001 plan/current-context/completed-stream history 写回 completed truth，并激活 sprint-002 为新的 primary execution surface。
4. 2026-04-18：closeout 窗口再次核验 `pnpm run check` 与治理同步门禁，sprint-001 boundary 已具备本地 commit 条件。

## 10. 产出

1. sprint-001 closeout truth：`.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-001-contract-bootstrap-and-readiness-cutover/plan.md`
2. sprint-002 activation truth：`.repo-ai-governor/context/current-context.md`
3. completed stream history write-back：`.repo-ai-governor/context/completed-streams-history.md`
