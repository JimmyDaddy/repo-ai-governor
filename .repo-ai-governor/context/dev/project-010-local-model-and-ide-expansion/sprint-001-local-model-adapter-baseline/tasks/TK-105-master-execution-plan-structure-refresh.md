# TK-105 主执行计划结构重梳与执行导航重构

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-001-local-model-adapter-baseline`

## 1. 任务目标

重新梳理 `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md` 的结构，使其从“阶段信息堆叠”收敛为“当前执行判断 + 路线图 + Stage 9 主线 + project 映射 + 模板”的执行导航文档。

## 2. Depends On

1. `TK-104`（主执行计划全自动研发 gap register 上收）
2. `project-010` 当前 active plan

## 3. 预期产物

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. `resolved_code_review_tk-105-master-execution-plan-structure-refresh.md`

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
6. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`

## 5. 实施计划

1. 重构 master plan 顶层结构，优先突出“当前执行摘要”和“当前主执行流”。
2. 保留有效阶段结论，但压缩重复历史信息，避免 master plan 退化成阶段回顾清单。
3. 将 Stage 9 收口逻辑重排为“定义 -> 已交付基线 -> gap register -> 收敛顺序 -> 当前执行队列”。
4. 保留 project 映射、模板、完成态与 GA 指标，作为后续拆解入口。
5. 同步更新 sprint/project 台账与 review。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建并启动，目标是重构 master plan 的组织方式。
2. 2026-03-24：已完成 master plan 重写，形成“执行导航优先”的新结构。
3. 2026-03-24：已同步 project/sprint 计划、tasks/checklist、tasks.csv 与 resolved review，任务收尾为 `completed`。

## 8. 产出

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/review/resolved_code_review_tk-105-master-execution-plan-structure-refresh.md`
