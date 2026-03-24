# TK-128 `TK` 单写源与任务模板输入收紧

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P0
- Project: `project-012-execution-context-optimization`
- Sprint: `sprint-001-startup-context-and-ledger-slimming`

## 1. 任务目标

进一步落实 `TK` 作为 canonical source 的执行语义，并收紧任务模板的输入引用范围，减少单任务默认需要阅读的重复台账和追溯资料。

## 2. Depends On

1. `TK-126`
2. `TK-127`

## 3. 预期产物

1. `DA-126` `TK` 单写源与任务模板输入收紧产物文档。

## 4. Required Inputs

1. `.repo-ai-governor/draft/task-execution-context-growth-analysis.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
4. `apps/cli/src/runtime/task-driven-run-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-008-workflow-optimization/sprint-001-execution-workflow-optimization/tasks/TK-042-task-ledger-single-write-source-contract.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/tasks/TK-099-task-driven-dag-and-run-mainchain-assembly.md`

## 6. 实施计划

1. 对照现有 task-ledger contract 与当前任务卡样本，识别 `TK/checklist/tasks.csv` 的重复任务语义。
2. 收敛 `TK` 的最小 canonical 字段与派生台账承担的职责，减少非必要重复维护。
3. 调整任务模板，明确执行必需输入与 traceback 输入的边界，避免默认全量阅读。
4. 补齐模板示例、治理说明与 `DA-126`，并回写台账。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `pnpm run check`

## 8. 执行记录

1. 2026-03-24：任务创建，状态初始化为 `planned`。
2. 2026-03-24：任务启动，状态切换为 `active`，开始收敛 `TK/checklist/tasks.csv` 的单写源语义并调整任务卡输入结构。
3. 2026-03-24：更新 task-ledger contract 与 decomposition template，明确 `TK` 为 canonical source，`checklist/tasks.csv` 为派生台账摘要与审计视图。
4. 2026-03-24：将任务卡模板升级为 `Required Inputs + Traceback References`，并让 CLI task-driven runtime 对新旧结构双兼容，产出 `DA-126`。

## 9. 产出

1. `DA-126` `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/DA-126-task-ledger-single-source-and-tk-template-tightening.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`
4. `apps/cli/src/runtime/task-driven-run-runtime.ts`
5. `apps/cli/test/runtime/task-driven-run-runtime.test.ts`
2. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-012-execution-context-optimization/sprint-001-startup-context-and-ledger-slimming/tasks/tasks.csv`
