# TK-122 sprint-002 出口验收与 sprint-003 输入约束

- Status: in_progress
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-002-command-surface-and-facade-cutover`

## 1. 任务目标

汇总 sprint-002 的 artifact/presentation/command/facade 收敛证据，形成出口验收并冻结 sprint-003 的 package hardening 与 rollout 对齐输入约束。

## 2. Depends On

1. `TK-119`
2. `TK-120`
3. `TK-121`

## 3. 预期产物

1. `DA-120` sprint-002 出口验收与 sprint-003 输入约束产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-119-artifact-report-presentation-extraction.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-120-command-executor-extraction-and-entry-registry-baseline.md`
4. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/TK-121-run-review-command-executor-extraction-and-thin-facade-cutover.md`

## 5. 实施计划

1. 汇总 sprint-002 交付证据并形成 `accept/block` 结论。
2. 冻结 sprint-003 的 shared/package-local、exports、tests、rollout alignment 输入约束。
3. 回写 `DA-120`、artifact registry 与台账。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：切换为 `in_progress`，开始汇总 `DA-117/DA-118` 与 `TK-121` 在途证据，并起草 sprint-003 输入约束。

## 8. 产出

1. `DA-120` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-002-command-surface-and-facade-cutover/tasks/DA-120-sprint-002-exit-acceptance-and-sprint-003-input-constraints.md`
