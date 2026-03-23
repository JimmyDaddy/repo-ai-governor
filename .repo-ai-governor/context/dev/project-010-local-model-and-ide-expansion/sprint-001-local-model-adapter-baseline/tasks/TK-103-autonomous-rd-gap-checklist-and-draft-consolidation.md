# TK-103 全自动研发 gap 清单与 draft 收敛

- Status: completed
- Date: 2026-03-24
- Owner: AI-Agent
- Priority: P1
- Project: `project-010-local-model-and-ide-expansion`
- Sprint: `sprint-001-local-model-adapter-baseline`

## 1. 任务目标

将“当前工具仍无法做到全自动研发”的分析整理为正式 gap 清单，落盘到 `.repo-ai-governor/draft/`，并同步当前 sprint 的计划与台账，作为 `TK-096/TK-097/TK-098` 的输入约束之一。

## 2. Depends On

1. `DA-098`（project-009 出口验收与运营反馈约束）
2. `TK-095`（本地模型适配契约与配置扩展基线，作为当前 project-010 的已知基线）

## 3. 预期产物

1. `.repo-ai-governor/draft/repo-ai-governor-autonomous-rd-gap-checklist.md`
2. `resolved_code_review_tk-103-autonomous-rd-gap-checklist-and-draft-consolidation.md`

## 4. Input References

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
5. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
6. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`
7. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/plan.md`
8. `apps/cli/src/cli-governance-runtime.ts`
9. `packages/adapters/*`

## 5. 实施计划

1. 复核“全自动研发”在本仓库中的定义与边界，避免将“有条件无人值守”误写成“所有场景零人工介入”。
2. 将核心 gap 收敛为正式 checklist，覆盖真实调用、动态编排、review chain、HITL 回灌、delivery rehearsal 与稳定性门禁。
3. 将 gap 与当前 `TK-096/TK-097/TK-098` 形成显式映射，避免后续任务脱离问题根因。
4. 同步更新 sprint/project 计划、checklist、tasks.csv 与 review 记录。

## 6. 验证

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `pnpm run check`

## 7. 执行记录

1. 2026-03-24：任务创建并启动，准备将“全自动研发 gap”分析正式化为 draft 文档。
2. 2026-03-24：已完成 gap checklist 起草，覆盖 6 类核心未闭环项，并映射到 `TK-096/TK-097/TK-098`。
3. 2026-03-24：已同步 project/sprint 计划、checklist、tasks.csv 与 resolved review，任务收尾为 `completed`。

## 8. 产出

1. `.repo-ai-governor/draft/repo-ai-governor-autonomous-rd-gap-checklist.md`
2. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/review/resolved_code_review_tk-103-autonomous-rd-gap-checklist-and-draft-consolidation.md`
3. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/checklist.md`
4. `.repo-ai-governor/context/dev/project-010-local-model-and-ide-expansion/sprint-001-local-model-adapter-baseline/tasks/tasks.csv`
