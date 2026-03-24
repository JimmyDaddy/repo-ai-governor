# TK-125 project-011 出口验收与 project-010 rollout 输入约束

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-003-package-hardening-and-rollout-alignment`

## 1. 任务目标

汇总 project-011 的全部拆分与硬化证据，形成项目级出口验收，并把 CLI package decomposition 的正式输入约束回灌给 `project-010`。

## 2. Depends On

1. `TK-123`
2. `TK-124`

## 3. 预期产物

1. `DA-123` project-011 出口验收与 project-010 rollout 输入约束产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/TK-123-shared-and-package-local-boundary-hardening-and-exports-cleanup.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/TK-124-cli-package-regression-smoke-and-test-topology-hardening.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`

## 5. 实施计划

1. 汇总 `DA-113`~`DA-122` 的交付证据并形成 `accept/block` 结论。
2. 明确 `project-010` 后续主链、delivery、IDE 工作应如何消费 CLI decomposition 成果。
3. 回写 `DA-123`、artifact registry、project completion 审计入口与台账。
4. 在 `TK-124` 收口前，以滚动草案方式维护验收结论，不提前冻结最终出口状态。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：切换为 `in_progress`，开始汇总 `DA-113`~`DA-121` 与 `TK-124` 基线证据，并起草 project-010 rollout 输入约束。
3. 2026-03-24：已完成 `DA-123` 最终 `accept` 结论、project completion audit summary 与 `project-010` 正式回链，任务状态更新为 `completed`。

## 8. 产出

1. `DA-123` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-003-package-hardening-and-rollout-alignment/tasks/DA-123-project-011-exit-acceptance-and-project-010-rollout-input-constraints.md`
