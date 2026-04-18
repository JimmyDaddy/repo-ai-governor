# TK-985 close sprint-003 boundary and activate sprint-004 execution surface

- Status: planned
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-003-adopt-host-verify-upgrade-service-native-cutover`

## 1. 任务目标

After sprint-003 reaches clean `TK/CR` terminal state, close the sprint boundary, activate sprint-004, and prepare the sprint-003 local boundary commit.

## 2. Depends On

1. `TK-974 prepare sprint-003 exit acceptance and sprint-004 handoff`

## 3. 预期产物

1. sprint-003 closeout-ready plan/current-context write-back
2. sprint-003 boundary-level local commit recommendation
3. sprint-004 activation handoff note

## 4. Required Inputs

1. AGENTS.md
2. .repo-ai-governor/context/current-context.md
3. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
4. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/plan.md
5. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-003-adopt-host-verify-upgrade-service-native-cutover/tasks/TK-974-prepare-sprint-003-exit-acceptance-and-sprint-004-handoff.md

## 5. Traceback References

1. .codex/skills/workspace-scoped-cr-loop/SKILL.md
2. .codex/skills/workspace-delivery-finisher/SKILL.md
3. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 等待 sprint-003 fresh reviewer round clean 收口，并将 review lifecycle 写回当前 sprint ledger。
2. 运行 sprint-003 final gate，确认 boundary commit 的 staging scope 与 commit message。
3. 写回 sprint-003 closeout truth，并把 sprint-004 标记为下一个 active execution surface。

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

## 10. 产出

1. 待执行后补齐
2. 待执行后补齐
3. 待执行后补齐
