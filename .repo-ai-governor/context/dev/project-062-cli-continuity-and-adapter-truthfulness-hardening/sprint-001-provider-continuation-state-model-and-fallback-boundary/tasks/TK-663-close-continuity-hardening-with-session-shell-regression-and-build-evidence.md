# TK-663 close continuity hardening with session-shell regression and build evidence

- Status: planned
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-062-cli-continuity-and-adapter-truthfulness-hardening`
- Sprint: `sprint-001-provider-continuation-state-model-and-fallback-boundary`

## 1. 任务目标

用 session-shell regression、continuity evidence 与 build evidence 关闭 continuity hardening 第一阶段，并为 `sprint-002` 提供稳定输入。

## 2. Depends On

1. `TK-661`
2. `TK-662`

## 3. 预期产物

1. continuity regression evidence
2. sprint closeout recommendation
3. `TK-664` activation input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-001-provider-continuation-state-model-and-fallback-boundary/tasks/TK-661-freeze-provider-continuation-lifecycle-and-presenter-truth-contract.md`
2. `.repo-ai-governor/context/dev/project-062-cli-continuity-and-adapter-truthfulness-hardening/sprint-001-provider-continuation-state-model-and-fallback-boundary/tasks/TK-662-implement-provider-native-continuation-slot-lifecycle-and-fallback-active-separation.md`
3. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-059-cli-provider-continuity-fallback-truthfulness/project-059-cli-provider-continuity-fallback-truthfulness-completion-audit-summary.md`
2. `.repo-ai-governor/draft/repo-ai-governor-current-surface-gap-guide-project-sprint-task-decomposition.md`

## 6. 实施计划

1. 执行 continuity-focused session-shell regression。
2. 记录 provider-native / fallback-active / unsupported 三类 evidence。
3. 输出 sprint-001 closeout input，并为 `sprint-002` 留出 truth-source alignment 起点。

## 7. Development Verification

1. session-shell continuity regression suite
2. provider readiness transcript spot check

## 8. Delivery Verification

1. `pnpm run build`
2. sprint closeout evidence review

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待执行：continuity regression evidence
2. 待执行：sprint-002 activation input
