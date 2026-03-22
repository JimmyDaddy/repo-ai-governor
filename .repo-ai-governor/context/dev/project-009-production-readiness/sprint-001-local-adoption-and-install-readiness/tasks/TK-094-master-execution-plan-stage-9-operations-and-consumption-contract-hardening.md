# TK-094 主执行计划 Stage 9 运营指标与外部消费契约补强

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P1
- Project: `project-009-production-readiness`
- Sprint: `sprint-001-local-adoption-and-install-readiness`

## 1. 任务目标

继续补强 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md` 与 `project-009` 执行入口，将尚未显式落盘的 Stage 9 口径收敛为正文，包括运营指标快照、外部消费契约黑盒矩阵、最小支持矩阵、HITL 通知主备演练、受控 delivery rehearsal，以及 `examples/` 根目录口径统一。

## 2. Depends On

1. `TK-089`
2. `TK-090`
3. `TK-091`
4. `TK-093`

## 3. 预期产物

1. 更新后的主执行计划文档，显式纳管本轮补强点。
2. 同步后的 `project-009` project/sprint 计划入口。
3. 与主计划一致的 `TK-078` / `TK-080` 任务口径回写。
4. `resolved_code_review_tk-094-master-execution-plan-stage-9-operations-and-consumption-contract-hardening.md` 评审记录。

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-078-examples-assets-and-example-smoke-gate.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
6. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
7. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
8. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
9. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
10. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
11. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
12. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 5. 实施计划

1. 补强 `Stage 9A/9B` 的硬门槛与交付清单，显式纳入外部消费契约矩阵、最小支持矩阵、运营指标快照、HITL 通知演练与受控 delivery rehearsal。
2. 将 `scripts/examples/` 统一收敛为与架构蓝图一致的根级 `examples/` 口径，并同步 project/sprint 计划与任务卡。
3. 将新增口径下钻到 `TK-078` / `TK-080`，确保 Stage 9A 验收模板能够承载 examples、契约矩阵、通知演练与运营指标等证据。
4. 回写 `project-009` project/sprint 台账入口，并补充 review 产物以闭合本轮 planning workstream。

## 6. 收敛结果

1. `Stage 9A` 已补齐根级 `examples/`、外部消费契约黑盒矩阵与最小支持矩阵的显式门槛。
2. `Stage 9B` 已补齐 HITL 通知主备演练、受控 delivery rehearsal 与运营指标快照的出口要求。
3. `Stage 9 交付清单`、`完成态定义` 与 `GA Readiness 量化信号` 已统一纳管上述补强点，避免仅凭仓库内 smoke 判定投产就绪。
4. `project-009` 的 project/sprint 计划与 `TK-078` / `TK-080` 任务卡已同步使用根级 `examples/`，并对齐新的 Stage 9A/9B 验收口径。

## 7. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
5. `pnpm run check`

## 8. 执行记录

1. 2026-03-22：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `active`，开始将本轮补强建议落入主执行计划正文、`project-009` 执行入口与 Stage 9A 任务卡。
3. 2026-03-22：完成主执行计划、`project-009` 计划、`TK-078` / `TK-080` 及台账同步，状态切换为 `completed`。

## 9. 产出

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. `.repo-ai-governor/context/dev/project-009-production-readiness/plan.md`
3. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/plan.md`
4. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-078-examples-assets-and-example-smoke-gate.md`
5. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/TK-080-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
6. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/checklist.md`
7. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/tasks/tasks.csv`
8. `.repo-ai-governor/context/dev/project-009-production-readiness/sprint-001-local-adoption-and-install-readiness/review/resolved_code_review_tk-094-master-execution-plan-stage-9-operations-and-consumption-contract-hardening.md`
