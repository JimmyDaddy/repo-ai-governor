# DA-183 sprint-001 exit acceptance and sprint-002 module migration input constraints

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-183`
- Project: `project-017-technical-solution-modularization`
- Sprint: `sprint-001-module-registry-and-loading-contract-baseline`

## 1. Summary

1. `sprint-001-module-registry-and-loading-contract-baseline` 已完成 bootstrap、registry baseline、总纲瘦身与 gate baseline 的统一收口。
2. 任务卡、checklist、tasks.csv、review、sprint/project plan 与 follow-up stream 均已同步到同一真实状态。
3. `sprint-002` 的输入约束已冻结为“在现有 registry/gate baseline 上迁移首批复杂模块”，不再回退到总纲全文驱动模式。

## 2. Key Outputs

1. [sprint-001 plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-017-technical-solution-modularization/sprint-001-module-registry-and-loading-contract-baseline/plan.md)
2. [project-017 plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-017-technical-solution-modularization/plan.md)
3. [tasks/checklist.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-017-technical-solution-modularization/sprint-001-module-registry-and-loading-contract-baseline/tasks/checklist.md)
4. [tasks/tasks.csv](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-017-technical-solution-modularization/sprint-001-module-registry-and-loading-contract-baseline/tasks/tasks.csv)
5. [current-context.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/current-context.md)
6. [repo-ai-governor-master-execution-plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md)

## 3. Sprint-002 Input Constraints

1. 首批迁移模块优先选择 `runtime.orchestration`、`runtime.memory-provider-loading`、`governance.spec-sync`，因为它们已经具备 baseline overview/contract 与 direct dependency 表达。
2. `sprint-002` 不再改写 registry schema 本身，除非出现明确缺失字段；主目标应转向模块迁移与 gate cutover，而不是重新设计数据模型。
3. 所有 `exported contract` 改动必须同步 producer summary，并通过 `docs-triad-sync` 输出的 `module_impacts[]` 评估 direct consumer 影响面。
4. 在 `DA-180` ~ `DA-183` 被两个及以上后续任务消费前，应先把它们登记进 artifact registry，再继续更深层任务拆解。
