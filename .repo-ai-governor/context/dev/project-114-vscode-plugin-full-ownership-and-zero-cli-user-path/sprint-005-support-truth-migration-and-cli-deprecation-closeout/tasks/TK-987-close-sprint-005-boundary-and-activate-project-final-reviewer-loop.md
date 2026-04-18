# TK-987 close sprint-005 boundary and activate project-final reviewer loop

- Status: completed
- Date: 2026-04-18
- Owner: AI-Agent
- Priority: P1
- Project: `project-114-vscode-plugin-full-ownership-and-zero-cli-user-path`
- Sprint: `sprint-005-support-truth-migration-and-cli-deprecation-closeout`

## 1. 任务目标

After sprint-005 reaches clean `TK/CR` terminal state, close the sprint boundary, prepare the sprint-005 local boundary commit, and activate the project-final fresh reviewer loop.

## 2. Depends On

1. `TK-982 prepare project-final closeout and zero-cli delivery recommendation`

## 3. 预期产物

1. sprint-005 closeout-ready plan/current-context write-back
2. sprint-005 boundary-level local commit recommendation
3. project-final reviewer bootstrap note

## 4. Required Inputs

1. AGENTS.md
2. .repo-ai-governor/context/current-context.md
3. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md
4. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/plan.md
5. .repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/tasks/TK-982-prepare-project-final-closeout-and-zero-cli-delivery-recommendation.md

## 5. Traceback References

1. .codex/skills/workspace-scoped-cr-loop/SKILL.md
2. .codex/skills/workspace-delivery-finisher/SKILL.md
3. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 等待 sprint-005 fresh reviewer round clean 收口，并将 review lifecycle 写回当前 sprint ledger。
2. 运行 sprint-005 final gate，确认 boundary commit 的 staging scope 与 commit message。
3. 写回 sprint-005 closeout truth，并激活 project-final fresh reviewer loop。

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
2. 2026-04-18：sprint-005 的 `CR-001` 已完成 `review_pending -> verified -> resolved` 全流程，fresh reviewer 提出的 installed-VSIX wording / activation-coverage drift 均已修复并通过 targeted vitest、`pnpm run build`、`pnpm run check:ide-docs-parity`、governance gates 与 `pnpm run check`。
3. 2026-04-18：project plan、sprint plan 与 `current-context.md` 已写回 sprint-005 clean / project-final-next 的当前真值；当前任务切换为 `completed`，下一步固定执行 sprint-005 boundary local commit 并启动 project-final fresh reviewer loop。

## 10. 产出

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md`
3. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-005-support-truth-migration-and-cli-deprecation-closeout/plan.md`
