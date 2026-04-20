# TK-985 close sprint-003 boundary and activate sprint-004 execution surface

- Status: completed
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

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts`
2. `pnpm run build`
3. `pnpm run check`
4. `git status --short`

## 8. Delivery Verification

1. `pnpm exec vitest run --config vitest.packages.config.ts apps/vscode-extension/test/vscode-extension-controller-and-provider.test.ts apps/vscode-extension/test/vscode-extension-presentation-builder.test.ts apps/vscode-extension/test/vscode-extension-selection-store.test.ts`
2. `pnpm run build`
3. `pnpm run check`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`
7. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-18：任务创建，状态初始化为 `planned`。
2. 2026-04-18：`CR-001` 已 resolved，sprint-003 的 review/task truth、project plan、sprint plan 与 current-context 已统一切换到 closeout-ready state。
3. 2026-04-18：已将 sprint-003 标记为 completed，并激活 sprint-004 作为新的 primary execution surface；sprint-004 `CR-001` 与 `TK-975` 已在同窗口完成 activation write-back。

## 10. 产出

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/plan.md`
3. `.repo-ai-governor/context/dev/project-114-vscode-plugin-full-ownership-and-zero-cli-user-path/sprint-004-workflow-authoring-run-review-and-automation-primaryization/plan.md`
