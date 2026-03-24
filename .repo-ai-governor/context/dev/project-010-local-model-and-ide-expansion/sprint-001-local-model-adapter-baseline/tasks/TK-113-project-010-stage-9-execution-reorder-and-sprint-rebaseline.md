# TK-113 project-010 Stage 9 执行重排与 sprint rebaseline

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-001-local-model-adapter-baseline`

## 1. 任务目标

基于新版 `master execution plan`、总技术方案与架构蓝图，将 `project-010` 从 `IDE-first` 重排为 `mainchain-first`：保留 sprint-001，创建新的 `sprint-002-autonomous-mainchain-foundation`，并将原 `sprint-002` 顺延为 `sprint-003-delivery-ide-and-ga-hardening`。

## 2. Depends On

1. `TK-106`（triad 文档 Stage 9 overlay 补强同步）
2. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`

## 3. 预期产物

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/plan.md`
5. `resolved_code_review_tk-113-project-010-stage-9-execution-reorder-and-sprint-rebaseline.md`

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
6. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`

## 5. 实施计划

1. 依据 Stage 9 收敛顺序，将 `project-010` 的 sprint 顺序调整为 `真实调用 -> 自动主链 -> delivery/blackbox/IDE`。
2. 保留现有 `sprint-001` 与 `TK-096/TK-097/TK-098`，但将 `TK-098` 的输入约束目标改为自动主链优先。
3. 新建 `sprint-002-autonomous-mainchain-foundation`，承接 `TK-099` ~ `TK-102`。
4. 将原 `sprint-002` 顺延为 `sprint-003-delivery-ide-and-ga-hardening`，并重新编号为 `TK-107` ~ `TK-112`。
5. 同步 `master plan`、`project plan`、当前 sprint 台账与 review。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建并启动，目标是将 `project-010` 从 IDE-first 重排为 mainchain-first。
2. 2026-03-24：已完成 `master plan`、`project plan`、`sprint-001` 输入约束与新的 `sprint-002/sprint-003` 目录骨架重排。
3. 2026-03-24：已同步 task card、checklist、tasks.csv 与 resolved review，任务收尾为 `completed`。

## 8. 产出

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-002-autonomous-mainchain-foundation/plan.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-003-delivery-ide-and-ga-hardening/plan.md`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/review/resolved_code_review_tk-113-project-010-stage-9-execution-reorder-and-sprint-rebaseline.md`
