# Project Plan Template

- Status: active
- Date: 2026-04-13
- Scope: canonical `project-xxx/plan.md` generation under `.repo-ai-governor/context/dev/**`
- Owner: delivery

## 1. Purpose

1. 为新的 `project-xxx/plan.md` 提供 concrete reusable template。
2. 固化 project 级 scope、sprint queue、WBS、DoD 与 milestone entry 的最小结构。
3. 避免 project plan 在不同执行流之间反复漂移。

## 2. Usage Rules

1. `project plan` 只承载 project 级目标、sprint 结构、WBS 概览、DoD 与 milestone records。
2. 不在 `project plan` 中维护 task-level canonical status 真值；WBS 的 status 只作为概览，最终以 task ledger 为准。
3. 若尚未 closeout，`里程碑记录入口` 章节仍需保留，并写明 `待 closeout 后补齐`。
4. 若项目只启动了一个 sprint，也应保留 `Sprint 细化` 章节，方便后续扩展。

## 3. Concrete Template

```md
# <project-xxx> 计划

- Status: <planned|active|completed>
- Date: <YYYY-MM-DD>
- Stage Mapping: <stage or `待补充`>
- Phase Mapping: <phase or `待补充`>
- Upstream:
  - `<上游输入 1>`
  - `<上游输入 2>`

## 1. 目标

1. <project 目标 1>
2. <project 目标 2>
3. <project 目标 3>

## 2. Sprint 细化

## 2.1 <sprint-001-xxx>

- Status: <planned|active|completed>
- Sprint Goal: <本 sprint 的目标>
- Task Package: `<TK/CR 清单>`

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-xxx | sprint-001 | <title> | <deliverable type> | <depends_on> | <planned|in_progress|completed> |
| CR-xxx | sprint-001 | <title> | review | <depends_on> | <review_pending|verified|resolved> |

## 4. 依赖产物策略

1. <登记 / 回链策略 1>
2. <登记 / 回链策略 2>
3. <登记 / 回链策略 3>

## 5. DoD（<project-xxx>）

1. <project 完成定义 1>
2. <project 完成定义 2>
3. <project 完成定义 3>

## 6. 里程碑记录

1. <YYYY-MM-DD>：创建 project 与首个 sprint 骨架。
2. <YYYY-MM-DD>：<关键推进记录>

## 7. 里程碑记录入口

1. <待 closeout 后补齐，或回链 completion audit summary>
```

## 4. Notes

1. `Stage Mapping` / `Phase Mapping` 没有现成值时允许先写 `待补充`，但不得省略字段。
2. `Task Package` 建议使用 `TK-xxx` / `CR-xxx` 的短列表，不重复任务目标正文。
3. 若 project 级 scope 涉及多 sprint，可在 `Sprint 细化` 中继续追加 `2.2 / 2.3 ...` 小节。
