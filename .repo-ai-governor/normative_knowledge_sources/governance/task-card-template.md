# Task Card Template

- Status: active
- Date: 2026-04-06
- Scope: canonical `TK-xxx` / `CR-xxx` task-card generation under `.repo-ai-governor/context/dev/**`
- Owner: `project-008-workflow-optimization / TK-044`

## 1. Purpose

1. 为后续 `TK-xxx` / `CR-xxx` 任务卡提供可直接复用的统一骨架。
2. 消除“只有最小模板说明、没有 concrete task-card 模板文件”导致的生成漂移。
3. 让新任务卡默认满足 `TK/CR` canonical source、`Required Inputs + Traceback References` 分层与交付验证分离要求。

## 2. Usage Rules

1. 生成新的 `TK-xxx` 或 `CR-xxx` 时，默认从本模板实例化，而不是自由发挥章节结构。
2. 顶部元数据至少填写 `Status/Date/Owner/Priority/Project/Sprint`；`task_id` 由 `# <TASK-ID> <title>` heading 承担。
3. `## 4. Required Inputs` 只放执行当前任务必需阅读的输入，建议控制在 `3-5` 条。
4. `## 4. Required Inputs` 中直接 `DA-*` 输入建议控制在 `1-3` 条，只保留首跳正式消费项；额外候选 DA、旧 handoff 和历史材料移到 `## 5. Traceback References`。
5. 新建任务前，优先使用 `node ./scripts/governance/query-artifact-candidates.js --project <project-xxx> --task-title "<title>" --goal "<goal>" --limit 5` 缩小候选 DA 集，而不是手工浏览完整 artifact corpus。
6. `## 5. Traceback References` 只放追溯、handoff、review、历史计划或 audit 资料，不进入默认执行输入面。
7. `## 7. Development Verification` 默认记录 fast/targeted verification；`## 8. Delivery Verification` 记录切换到终态前必须满足的 gate、release 或 closeout 验证。
8. `## 9. 执行记录` 采用时间顺序追加；任务创建时至少写入一条“状态初始化为 `planned` / `review_pending`”或“切换为进行中状态”记录。
9. `## 10. 产出` 对 `planned` / `review_pending` / `verified` 任务允许写“待执行：…”占位；切到 `completed` / `resolved` 后应补齐实际产物路径或明确产物名称。
10. 实现任务使用 `TK-xxx` 与 `planned / in_progress / completed`；评审任务使用 `CR-xxx` 与 `review_pending / verified / resolved`。

## 3. Concrete Template

```md
# <TASK-ID> <任务标题>

- Status: <planned|in_progress|completed|review_pending|verified|resolved>
- Date: <YYYY-MM-DD>
- Owner: <owner>
- Priority: <P0|P1|P2>
- Project: `<project-xxx>`
- Sprint: `<sprint-xxx>`

## 1. 任务目标

<1-2 句，描述任务完成后要达成的明确目标。>

## 2. Depends On

1. `<TK-xxx 或上游契约/文档>`
2. `<TK-xxx 或上游契约/文档>`

## 3. 预期产物

1. `<产物 1>`
2. `<产物 2>`
3. `<产物 3>`

## 4. Required Inputs

1. `<执行必需输入路径>`
2. `<执行必需输入路径>`
3. `<执行必需输入路径>`

## 5. Traceback References

1. `<追溯或 handoff 资料路径>`
2. `<review / audit / plan 路径>`

## 6. 实施计划

1. `<步骤 1>`
2. `<步骤 2>`
3. `<步骤 3>`

## 7. Development Verification

1. `<定向开发验证命令或验证面>`
2. `<定向开发验证命令或验证面>`

## 8. Delivery Verification

1. `<交付前 gate / closeout 验证>`
2. `<交付前 gate / closeout 验证>`

## 9. 执行记录

1. <YYYY-MM-DD>：任务创建，状态初始化为 `<planned|review_pending>`。

## 10. 产出

1. `<实际产物路径或 planned 占位>`
2. `<实际产物路径或 planned 占位>`
```

## 4. Notes

1. 已存在的历史任务卡不要求批量回写到完全一致，但新生成任务卡默认必须遵循本模板。
2. `TK` 任务用于实现、closeout、activation、治理收口等执行项；`CR` 任务用于 review / recheck / fix 的独立管理。
3. 若任务属于 exit acceptance / closeout / completion audit 类，可在 `## 6. 实施计划` 与 `## 8. Delivery Verification` 中展开验收矩阵，但仍保留本模板的章节骨架。
4. 若任务确实不需要 `Traceback References`，章节可保留并写明 `不适用`，避免后续再次出现章节缺失导致的结构漂移。
5. 若确有充分理由突破 `Required Inputs` 默认上限，可在任务卡中添加 `required-input-limit-allowed: <reason>` 说明，并在同一 change set 记录原因。
