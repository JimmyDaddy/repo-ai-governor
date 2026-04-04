# TK-538 add session note presenter startup diagnostics regression evidence and rollout closeout acceptance

- Status: planned
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-003-session-note-and-startup-budget`

## 1. 任务目标

将 session note presenter、startup diagnostics 与 rollout closeout acceptance 收口为同一条收尾任务，确保 `project-043` 最终能以 continuity + efficiency 双目标完成闭环。

## 2. Depends On

1. `TK-536`
2. `TK-537`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/src/main.ts`

## 3. 预期产物

1. session note presenter integration
2. startup diagnostics regression evidence
3. `project-043` closeout acceptance package

## 4. Required Inputs

1. `TK-536`
2. `TK-537`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/src/main.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-003-session-note-and-startup-budget/plan.md`
3. `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`

## 6. 实施计划

1. 将 session note 以 presenter-safe summary 形式接入 session shell。
2. 补齐 startup diagnostics regression 与 lazy-load budget evidence。
3. 完成 `project-043` closeout acceptance 与里程碑收口准备。

## 7. Development Verification

1. 后续实现窗口需补 session note presenter tests
2. 后续实现窗口需补 startup diagnostics regression checks
3. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`
2. 后续实现完成并宣告 `completed` 前，必须补 session note presenter / startup diagnostics evidence
3. 后续实现完成并宣告 `completed` 前，必须通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 sprint-003 的 presenter / diagnostics / closeout acceptance 收口。

## 10. 产出

1. 待执行：session note presenter integration
2. 待执行：startup diagnostics regression evidence
3. 待执行：project-043 closeout acceptance package
