# Execution Stream Scaffold Template

- Status: active
- Date: 2026-04-13
- Scope: canonical `project/sprint/tasks/review` scaffold generation under `.repo-ai-governor/context/dev/**`
- Owner: delivery

## 1. Purpose

1. 为新的 execution stream 提供统一的目录骨架，避免 project/sprint/task 初始化继续靠自由发挥。
2. 让 task decomposition 的输出可以直接衔接 `plan.md`、`tasks/checklist.md`、`tasks/tasks.csv`、`TK/CR` 与 `review/`。
3. 把“目录创建”和“正式进入 active execution”拆开，避免在还没 canonicalize ledger 前就把流切成 active。

## 2. Canonical Directory Layout

```text
.repo-ai-governor/context/dev/
  project-xxx-meaningful-name/
    plan.md
    project-xxx-meaningful-name-completion-audit-summary.md   # closeout 后补齐
    sprint-001-meaningful-name/
      plan.md
      review/
        .gitkeep
      tasks/
        checklist.md
        tasks.csv
        TK-xxx-meaningful-slug.md
        CR-xxx.md
```

## 3. Bootstrap Contract

每次创建新的 execution stream，至少要生成：

1. `project-xxx/plan.md`
2. `sprint-xxx/plan.md`
3. `sprint-xxx/tasks/checklist.md`
4. `sprint-xxx/tasks/tasks.csv`
5. `sprint-xxx/tasks/TK-xxx-*.md`
6. `sprint-xxx/tasks/CR-xxx-*.md`（命中 review 管理时）
7. `sprint-xxx/review/.gitkeep`

## 4. Template Sources

1. project 级 plan：`.repo-ai-governor/normative_knowledge_sources/governance/project-plan-template.md`
2. sprint 级 plan：`.repo-ai-governor/normative_knowledge_sources/governance/sprint-plan-template.md`
3. task card：`.repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md`
4. decomposition contract：`.repo-ai-governor/normative_knowledge_sources/governance/decomposition-protocol-template.md`

## 5. Bootstrap Rules

1. 新建 stream 时，先创建目录骨架与 canonical task cards，再生成 `checklist.md` / `tasks.csv` 的初始 scaffold view。
2. `TK` 编号默认使用 workspace-scope reservation；`CR` 编号默认使用 sprint `tasks/` 目录局部 reservation。
3. 推荐使用 `node ./scripts/governance/reserve-task-id.js --tasks-dir <...> --type <TK|CR> --count <n>` 预留号段，避免并行拆解碰撞。
4. 初始 scaffold 允许先写入 `checklist.md` / `tasks.csv` 的 seed 内容；但在 stream 正式进入 `active` 前，必须执行 `node ./scripts/governance/sync-task-ledger.js --tasks-dir <...>` 完成 sqlite canonicalization 与 rendered view 对齐。
5. `current-context.md` 只在以下场景更新：
   - 用户明确要求把新 stream 激活为当前执行入口。
   - 当前任务已经从“规划/拆解”切换到“开始执行”。
6. `review/` 目录在 bootstrap 阶段必须创建，但不应预生成 `code_review_*` 生命周期文件。

## 6. Minimal Seed Views

`tasks/checklist.md` 最小骨架：

```md
# checklist

- [ ] TK-xxx <title>
  - YYYY-MM-DD：任务创建，状态初始化为 `planned`。
```

`tasks/tasks.csv` 最小骨架：

```csv
execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at
seed-yyyymmdd-tk-xxx,TK-xxx,<title>,AI-Agent,P1,YYYY-MM-DD,planned,<project>,<sprint>,<goal>,待执行,待验证,待执行,YYYY-MM-DD
```

## 7. Guardrails

1. 不要在 `project/sprint plan` 里重复维护 task-level status 真值矩阵；task-level status 仍以 `TK/CR + sqlite canonical ledger + rendered views` 为准。
2. 不要在同一个 bootstrap 动作里同时创建多个 `active` sprint；若一次拆出多个 sprint，只激活第一个执行面，其余保持 `planned`。
3. 不要跳过 `review/.gitkeep`；即使当前还未进入 CR 生命周期，也要保持 review surface 可用。
4. 不要把 closeout summary 或 completion audit 提前写成已完成；这些产物只在终态窗口创建。
