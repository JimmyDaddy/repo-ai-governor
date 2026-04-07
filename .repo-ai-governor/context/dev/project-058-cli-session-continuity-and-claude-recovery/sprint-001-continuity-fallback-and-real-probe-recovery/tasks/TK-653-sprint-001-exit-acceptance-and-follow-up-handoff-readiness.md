# TK-653 sprint-001 exit acceptance and follow-up handoff readiness

- Status: completed
- Date: 2026-04-07
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-058-cli-session-continuity-and-claude-recovery`
- Sprint: `sprint-001-continuity-fallback-and-real-probe-recovery`

## 1. 任务目标

在 `TK-652` 完成后，为本 sprint 留出独立的 exit acceptance 与后续 handoff 面，避免实现修复和 closeout 证据混写。

## 2. Depends On

1. `TK-652`

## 3. 预期产物

1. sprint-level exit acceptance write-back
2. updated sprint plan milestones and ledger evidence
3. next-step handoff note or closeout recommendation

## 4. Required Inputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
3. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/plan.md`
4. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/tasks/TK-652-fix-session-main-continuity-fallback-and-claude-code-real-path-cli-regression.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`

## 6. 实施计划

1. 汇总 `TK-652` 的实现与验证证据。
2. 决定 sprint 是否可以进入 closeout，或是否需要补充 follow-up task。
3. 同步 sprint plan、ledger、checklist 与 tasks.csv。

## 7. Development Verification

1. 已校对 `TK-652` 的 targeted regression、same-window `pnpm run build` 与 compiled real probe evidence 全部齐备。
2. 已确认本项目本轮不需要新增 CR lifecycle；当前只需 project-final closeout 与 active stream clearance。

## 8. Delivery Verification

1. 继承 `TK-652` 的 same-window build/test evidence：`pnpm vitest run packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts --maxWorkers=1 --maxConcurrency=1`
2. 继承 `TK-652` 的 same-window build/test evidence：`pnpm vitest run apps/cli/test/runtime/session-main-supervisor-runtime.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`
3. 继承 `TK-652` 的 same-window build evidence：`pnpm run build`
4. `node ./scripts/governance/sync-task-ledger.js --task-id TK-653`

## 9. 执行记录

1. 2026-04-07：任务创建，状态初始化为 `planned`；等待 `TK-652` 完成后激活。
2. 2026-04-07：已汇总 `TK-652` 的 closeout 证据，确认两个用户反馈问题都已有实现、回归测试、same-window build 与 compiled real probe 支撑。
3. 2026-04-07：已写入 `DA-653`，并确认 `project-058` 不需要新增 review lifecycle；下一边界固定为 `TK-654` project-final closeout 与 active stream clearance。

## 10. 产出

1. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/tasks/DA-653-sprint-001-closeout-and-project-final-closeout-activation-handoff.md`
2. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/plan.md`
3. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/plan.md`
4. `.repo-ai-governor/context/dev/project-058-cli-session-continuity-and-claude-recovery/sprint-001-continuity-fallback-and-real-probe-recovery/tasks/TK-654-finalize-project-058-closeout-and-clear-the-active-primary-stream.md`
