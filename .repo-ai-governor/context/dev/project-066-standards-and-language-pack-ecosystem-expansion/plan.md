# project-066-standards-and-language-pack-ecosystem-expansion 计划

- Status: active
- Date: 2026-04-08
- Stage Mapping: ecosystem expansion
- Phase Mapping: official pack roadmap + first-wave expansion
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
  - `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 1. 目标

1. 把官方 standards pack 从“minimal baseline”推进到更有 adoption 价值的生态面。
2. 先定义哪些语言/流程 pack 属于官方维护范围，再做首批扩展。
3. 避免继续把 loader 做得更深，而 pack 内容本身长期停留在 minimal baseline。

## 2. Sprint 细化

## 2.1 sprint-001-official-pack-expansion-matrix-and-first-wave

- Status: planned
- Sprint Goal: 定义官方 pack 扩展矩阵，并完成第一波扩展与验证。
- Task Package: `TK-676`、`TK-677`、`TK-678`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-676 | sprint-001 | freeze official pack expansion matrix and acceptance contract | product/contract | project-062 recommended | in_progress |
| TK-677 | sprint-001 | implement first-wave official pack expansion and runtime/docs examples | standards/implementation | TK-676 | planned |
| TK-678 | sprint-001 | close ecosystem expansion baseline with validation evidence and support narrative refresh | acceptance/closeout | TK-676、TK-677 | planned |

## 4. 依赖产物策略

1. 先定义官方 pack 的维护范围，再启动第一波扩展。
2. closeout 重点是 pack 内容与 adopter narrative，而不是继续扩 loader。

## 5. DoD（project-066）

1. 官方维护的 pack 范围明确。
2. 至少一波新的 official pack 扩展与 runtime/docs example 完成。
3. support narrative 不再只剩 minimal baseline 描述。

## 6. 里程碑记录

1. 2026-04-08：作为 `project-072` follow-up decomposition 产物创建，当前保持 `planned`。
2. 2026-04-08：`project-065` final closeout 完成后被激活为当前 primary project，`sprint-001 / TK-676` 进入执行窗口。
