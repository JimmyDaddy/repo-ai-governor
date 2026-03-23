# TK-098 sprint-001 出口验收与 sprint-002 输入约束

- Status: planned
- Date: 2026-03-23
- Owner: TBD
- Priority: P0
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-001-local-model-adapter-baseline`

## 1. 任务目标

汇总 sprint-001 本地模型基线交付证据，形成出口验收结论并沉淀 sprint-002 IDE 集成生产化输入约束。

## 2. Depends On

1. `TK-095`
2. `TK-096`
3. `TK-097`

## 3. 预期产物

1. `DA-102` sprint-001 出口验收与 sprint-002 输入约束产物文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-095-local-model-adapter-contract-and-config-extension-baseline.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-096-ollama-like-adapter-and-route-fallback-baseline.md`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-097-local-model-diagnostics-and-restricted-network-rehearsal-baseline.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 5. 实施计划

1. 汇总 `DA-099`~`DA-101` 的实现与门禁证据，给出 sprint-001 `accept/block` 结论。
2. 明确 sprint-002 IDE 集成任务的输入约束、阻断项与 fix-forward 优先级。
3. 回写 project 计划里程碑并同步 sprint 台账状态。
4. 回写台账并登记 `DA-102`。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-23：任务创建，状态初始化为 `planned`。

## 8. 产出

1. `DA-102` `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/TK-098-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
