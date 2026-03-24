# TK-114 cli-governance-runtime 拆分方案与 anti-God-object 规范基线

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-001-local-model-adapter-baseline`

## 1. 任务目标

针对 `apps/cli/src/cli-governance-runtime.ts` 的臃肿问题，先产出可执行的拆分方案 draft，并将“禁止跨层级 God object”提升为正式代码规范，避免后续 Stage 9 主链实现继续堆叠到单一运行时文件。

## 2. Depends On

1. `TK-113`
2. `apps/cli/src/cli-governance-runtime.ts`

## 3. 预期产物

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
4. `resolved_code_review_tk-114-cli-runtime-decomposition-draft-and-god-object-governance.md`

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
7. `apps/cli/src/cli-governance-runtime.ts`

## 5. 实施计划

1. 对 `cli-governance-runtime.ts` 进行职责梳理，明确跨层级聚合面和后续拆分优先级。
2. 将拆分方案沉淀到 `.repo-ai-governor/draft/`，为未来 runtime 重构提供唯一分析输入。
3. 在 `code_standards.md` 新增“禁止跨层级 God object”规则，并给出临时例外登记方式。
4. 在 `long-term-maintenance-guide.md` 同步规则映射与后续 gate 集成入口。
5. 同步 project/sprint 台账与 resolved review。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/run-normative-loading-manifest-gate.js`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建并启动，目标是将 `cli-governance-runtime.ts` 的拆分边界和 anti-God-object 规则正式化。
2. 2026-03-24：已完成拆分方案 draft、`CS-027` 规则补充、维护指南映射同步与台账回写，任务收尾为 `completed`。
3. 2026-03-24：根据 diff comment 收紧 Phase 5 表述，明确“通用辅助函数”需先判断是否进入 `shared`，仅 CLI bounded context 复用的逻辑应保留在 package-local 模块中。

## 8. 产出

1. `.repo-ai-governor/draft/cli-governance-runtime-decomposition-plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
3. `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
5. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/plan.md`
6. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
7. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
8. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/review/resolved_code_review_tk-114-cli-runtime-decomposition-draft-and-god-object-governance.md`
