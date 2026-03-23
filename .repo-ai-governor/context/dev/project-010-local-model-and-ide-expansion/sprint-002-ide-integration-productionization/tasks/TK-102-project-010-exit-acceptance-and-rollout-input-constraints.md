# TK-102 project-010 出口验收与后续 rollout 输入约束

- Status: planned
- Date: 2026-03-23
- Owner: TBD
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-002-ide-integration-productionization`

## 1. 任务目标

汇总 project-010 交付证据，完成出口验收，并沉淀后续 rollout 输入约束与风险清单。

## 2. Depends On

1. `TK-100`
2. `TK-101`

## 3. 预期产物

1. `DA-106` project-010 出口验收与后续 rollout 输入约束产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/TK-100-vscode-jetbrains-official-templates-and-smoke-gate.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/TK-101-cursor-claude-code-integration-templates-and-docs-parity.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. 实施计划

1. 汇总 `DA-099`~`DA-105` 并完成 project-010 `accept/block` 结论。
2. 输出后续 rollout 输入约束：本地模型运维、IDE 模板扩展、CI 平台扩展优先级。
3. 产出 project 完成态审计摘要并更新项目里程碑回链。
4. 回写台账并登记 `DA-106`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`
5. `pnpm run release:ga-check`

## 7. 执行记录

1. 2026-03-23：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-106` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/TK-102-project-010-exit-acceptance-and-rollout-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-ide-integration-productionization/tasks/tasks.csv`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/project-010-completion-audit-summary.md`（收尾时产出）
