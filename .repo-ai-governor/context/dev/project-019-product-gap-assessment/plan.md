# project-019-product-gap-assessment 计划

- Status: completed
- Date: 2026-03-26
- Stage Mapping: Cross-stage product alignment follow-up
- Phase Mapping: PRD Gap Assessment / Priority Recalibration

## 1. 目标

1. 基于当前 PRD、master execution plan、真实 CLI/runtime/adapters/packages 现状，形成一份“当前工具开发现状 vs 目标”的结构化差距评估。
2. 区分“内部治理架构是否存在”和“外部仓库是否能稳定采用”的两类成熟度，避免把自举治理完成误判为产品完成。
3. 将评估结果保存到 `draft/`，作为后续新项目拆解与优先级重排的输入，而不是直接改写 PRD。
4. 把当前 active closeout surface 从已完成的 `project-018` 切换到新的分析流，避免继续占用 promotion pilot project。
5. 将差距评估里的第一优先级与第二优先级收敛成可执行的 delivery planning，明确推荐的 project/sprint 顺序、依赖链与退出标准。

## 2. Sprint 细化

## 2.1 sprint-001-current-state-vs-prd-gap-assessment

- Status: completed
- Sprint Goal: 基于 PRD 与实际代码/文档/命令面证据，产出一份当前工具现状、能力覆盖度、差距项与下一阶段优先级建议的 draft 评估文档。
- Task Package: `TK-214`、`TK-215`、`TK-216`、`TK-217`。
- Exit Criteria:
  1. `project-019` skeleton 已建立，`current-context.md` 已从 `project-018 / sprint-004` 切换到新的评估流，并将后者迁入 completed history。
  2. 已形成基于 PRD 能力域的 coverage matrix，区分 `complete / mostly_complete / partial / not_started`。
  3. 已生成 `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`，并明确当前核心差距与建议优先级。
  4. task/artifact/context/master-plan 等台账同步完成，相关 governance gates 通过。

## 2.2 sprint-002-priority-1-and-2-delivery-planning

- Status: completed
- Sprint Goal: 将“打包分发真值”和“upgrade/workspace lifecycle adopter UX”两条最高优先级差距项拆成一份可执行 delivery plan，并保存到 `draft/`。
- Task Package: `TK-218`、`TK-219`、`TK-220`、`TK-221`。
- Exit Criteria:
  1. `project-019` 已从 sprint-001 closeout surface 切换到 `sprint-002`，并将 `sprint-001` 迁入 completed history。
  2. 已形成两条优先级主线的 scope、依赖顺序、建议 sprint 切分、验证门槛与风险 register。
  3. 已生成 `.repo-ai-governor/draft/repo-ai-governor-priority-1-and-2-delivery-plan.md`。
  4. task/artifact/context/master-plan 等台账同步完成，相关 governance gates 通过。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-214 | sprint-001 | project-019 激活与执行面切换 handoff | bootstrap/governance | project-018 completion audit,project-018 sprint-004 completion | completed |
| TK-215 | sprint-001 | PRD 能力覆盖矩阵与证据基线盘点 | analysis/baseline | TK-214,product-requirements.md,repo-ai-governor-master-execution-plan.md | completed |
| TK-216 | sprint-001 | 当前工具现状 vs PRD 差距评估 draft | draft/assessment | TK-215,DA-215,README.md,apps/cli/README.md | completed |
| TK-217 | sprint-001 | sprint-001 出口验收与后续优先级建议 | acceptance/baseline | TK-214,TK-215,TK-216,DA-214,DA-215,DA-216 | completed |
| TK-218 | sprint-002 | sprint-002 激活与 project-019 reopen handoff | bootstrap/governance | DA-217,project-019 sprint-001 completion audit | completed |
| TK-219 | sprint-002 | 优先级 1/2 范围分解与依赖顺序重排 | planning/baseline | TK-218,DA-216 | completed |
| TK-220 | sprint-002 | 优先级 1/2 delivery planning draft | draft/planning | TK-219,DA-219 | completed |
| TK-221 | sprint-002 | sprint-002 出口验收与后续激活建议 | acceptance/baseline | TK-218,TK-219,TK-220,DA-218,DA-219,DA-220 | completed |

## 4. 依赖产物策略

1. `project-019` 启动默认消费：
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
   - `.repo-ai-governor/context/dev/projects-overview.md`
   - `README.md`
   - `apps/cli/README.md`
2. 证据采样优先覆盖：
   - `apps/cli`
   - `packages/config`
   - `packages/core-*`
   - `packages/standards`
   - `packages/slots`
   - `packages/reporting`
   - `packages/adapters/*`
   - `integrations/ide`
   - `integrations/desktop`
3. 本项目只做盘点与优先级建议，不修改 PRD 目标语义，不把 gap assessment 冒充为正式规范。
4. `sprint-002` 只负责 planning，不直接激活新的实现型 project；推荐执行 project 仅作为 draft 建议输出。

## 5. DoD（project-019）

1. 已形成一份明确区分“架构完成度”和“外部产品化完成度”的评估文档。
2. 已按 PRD 能力域给出证据驱动的完成度判断，而不是只引用历史 project 完成结论。
3. 已明确当前 3 到 5 个最高优先级差距项与建议执行顺序。
4. `current-context / completed history / projects overview / dev index / master execution plan / artifact registry` 与新的执行流保持同步。
5. 文档与台账类 gates 可通过。
6. 已将第一优先级与第二优先级收敛成后续可直接激活的 delivery planning，而不是停留在高层建议。

## 6. 里程碑记录

1. 2026-03-26：创建 `project-019-product-gap-assessment`，将 `project-018 / sprint-004` 从 active closeout surface 迁入 completed history。
2. 2026-03-26：通过 `TK-215 / DA-215` 建立基于 PRD 能力域的 coverage matrix 与 evidence baseline。
3. 2026-03-26：通过 `TK-216 / DA-216` 形成当前工具“现状 vs PRD”差距评估 draft。
4. 2026-03-26：通过 `TK-217 / DA-217` 完成 sprint-001 验收并生成项目完成态审计摘要。
5. 2026-03-26：reopen `project-019` 执行 `sprint-002-priority-1-and-2-delivery-planning`，完成 `DA-218` ~ `DA-221`，生成优先级 1/2 delivery planning draft，并产出新的项目完成态审计摘要 `project-019-product-gap-assessment-completion-audit-summary-sprint-002-priority-1-and-2-delivery-planning.md`。
