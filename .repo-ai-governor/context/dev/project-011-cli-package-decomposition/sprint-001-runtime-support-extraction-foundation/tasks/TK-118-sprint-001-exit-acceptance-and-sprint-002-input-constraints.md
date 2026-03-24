# TK-118 sprint-001 出口验收与 sprint-002 输入约束

- Status: planned
- Date: 2026-03-24
- Owner: TBD
- Priority: P0
- Project: `project-011-cli-package-decomposition`
- Sprint: `sprint-001-runtime-support-extraction-foundation`

## 1. 任务目标

汇总 sprint-001 的 decomposition 证据，形成出口验收并冻结 sprint-002 的 artifact/presentation/command/facade cutover 输入约束。

## 2. Depends On

1. `TK-116`
2. `TK-117`

## 3. 预期产物

1. `DA-116` sprint-001 出口验收与 sprint-002 输入约束产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/plan.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-113-cli-package-decomposition-baseline-and-dependency-contract.md`
4. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/TK-116-adapter-verification-and-local-probe-extraction.md`
5. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/TK-117-route-fallback-and-diagnostics-artifact-builder-extraction.md`

## 5. 实施计划

1. 汇总 `DA-113`~`DA-115` 的实现与验证证据。
2. 给出 sprint-001 `accept/block` 结论。
3. 冻结 sprint-002 的命令/展示/facade cutover 输入约束，并回链 `project-010`。
4. 回写 `DA-116`、artifact registry 与台账。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-116` `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/DA-116-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-011-cli-package-decomposition/sprint-001-runtime-support-extraction-foundation/tasks/tasks.csv`
