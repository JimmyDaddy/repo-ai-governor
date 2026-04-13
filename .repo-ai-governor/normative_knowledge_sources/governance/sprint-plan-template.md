# Sprint Plan Template

- Status: active
- Date: 2026-04-13
- Scope: canonical `sprint-xxx/plan.md` generation under `.repo-ai-governor/context/dev/**`
- Owner: delivery

## 1. Purpose

1. 为新的 `sprint-xxx/plan.md` 提供 concrete reusable template。
2. 统一 sprint 级目标、scope、WBS、exit criteria 与 sprint notes 的表达方式。
3. 让 sprint plan 和 `TK/CR/checklist/tasks.csv` 的关系更清晰，不再混用职责。

## 2. Usage Rules

1. `sprint plan` 只承载 sprint goal、scope、WBS、exit criteria 与 sprint notes。
2. task-level 真值在 task ledger，不在 sprint plan 重复维护执行轨迹明细。
3. `Exit Criteria` 应面向 sprint 交付边界，而不是重复 task card 的验证命令全文。
4. `Sprint Notes` 建议记录 review 策略、activation / closeout 约束、或对下一 sprint 的 handoff 提醒。

## 3. Concrete Template

```md
# <sprint-xxx> 计划

- Status: <planned|active|completed>
- Date: <YYYY-MM-DD>
- Sprint Goal: <sprint goal>
- Project: `<project-xxx>`
- Upstream:
  - `<上游输入 1>`
  - `<上游输入 2>`

## 1. Scope

1. <scope 1>
2. <scope 2>
3. <scope 3>

## 2. 任务拆解矩阵（WBS）

| task_id | title | depends_on | status |
| --- | --- | --- | --- |
| TK-xxx | <title> | <depends_on> | <planned|in_progress|completed> |
| CR-xxx | <title> | <depends_on> | <review_pending|verified|resolved> |

## 3. Exit Criteria

1. <exit criterion 1>
2. <exit criterion 2>
3. <exit criterion 3>

## 4. Sprint Notes

1. <note 1>
2. <note 2>
3. <note 3>
```

## 4. Notes

1. 若该 sprint 暂不引入独立 `CR-xxx`，也要在 `Sprint Notes` 中说明 review/verify 如何承接。
2. 若该 sprint 只是在 bootstrap 阶段创建骨架，`Exit Criteria` 至少要包含 task cards、checklist、tasks.csv 与 review scaffold 已创建，并注明正式激活前需执行 ledger sync。
