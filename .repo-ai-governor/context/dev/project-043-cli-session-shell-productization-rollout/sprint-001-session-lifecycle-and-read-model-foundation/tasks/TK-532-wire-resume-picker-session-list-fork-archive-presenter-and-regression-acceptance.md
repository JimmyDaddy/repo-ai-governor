# TK-532 wire resume picker session list fork archive presenter and regression acceptance

- Status: completed
- Date: 2026-04-04
- Owner: AI-Agent
- Priority: P1
- Project: `project-043-cli-session-shell-productization-rollout`
- Sprint: `sprint-001-session-lifecycle-and-read-model-foundation`

## 1. 任务目标

将 `TK-531` 产出的 lifecycle seam 与 session projection 正式接入 session shell presenter，完成 resume picker、session list 与 fork/archive affordance，并为 sprint-001 提供回归验收闭环。

## 2. Depends On

1. `TK-530`
2. `TK-531`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`

## 3. 预期产物

1. session shell presenter 接入 recent list / resume picker
2. fork/archive affordance 与 presenter-safe receipt
3. sprint-001 regression acceptance evidence

## 4. Required Inputs

1. `TK-530`
2. `TK-531`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`

## 5. Traceback References

1. `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/plan.md`
3. `.repo-ai-governor/context/dev/project-043-cli-session-shell-productization-rollout/sprint-001-session-lifecycle-and-read-model-foundation/plan.md`

## 6. 实施计划

1. 将 session projection 结果接入 recent list / resume picker presenter。
2. 将 lifecycle actions 以 presenter-safe affordance 形式接入 session shell。
3. 补齐 regression acceptance，确保 presenter 不重建 shadow truth。

## 7. Development Verification

1. 后续实现窗口需补 session shell lifecycle presenter tests
2. 后续实现窗口需补 targeted integration for resume/list/fork/archive
3. `node ./scripts/governance/check-task-ledger-sync.js`

## 8. Delivery Verification

1. 后续实现完成并宣告 `completed` 前，必须补 `pnpm run build`
2. 后续实现完成并宣告 `completed` 前，必须补 session shell lifecycle regression evidence
3. 后续实现完成并宣告 `completed` 前，必须通过 `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-04：任务创建，状态初始化为 `planned`；承接 sprint-001 的 presenter 接线与回归收口。
2. 2026-04-04：完成 resume continuity 与 sprint-001 regression closeout；session parity 与 output contract integration 已覆盖 presenter-safe affordance。
3. 2026-04-04：补齐 `/sessions` `/fork` `/archive` `/unarchive` 接线、continuation notice 与 `/status` projection 输出，并通过 runner/package/integration suites 验证。
4. 2026-04-04：补齐 `/unarchive <sessionId>` 成功 attach 与缺参校验的 runner 回归，收口前台恢复路径的 presenter 分支覆盖。
5. 2026-04-04：补齐 `/fork` `/archive` `/unarchive` failure-path runner 回归，验证 presenter-safe 错误回执与失败后的 current attachment 稳定性。

## 10. 产出

1. 已完成：resume picker / session list presenter integration -> `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
2. 已完成：fork/archive/unarchive presenter-safe affordance -> `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts` + `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
3. 已完成：sprint-001 regression acceptance evidence -> `apps/cli/test/runtime/session-shell-runner.test.ts` + `apps/cli/test/runtime/session-main-parity.integration.test.ts` + `apps/cli/test/cli-output-contract.integration.test.ts`
