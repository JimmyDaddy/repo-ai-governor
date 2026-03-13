# Project Sprint Artifact Conventions

- Status: done
- Date: 2026-03-13
- Task: `TK-106`

## Goal

固化 `docs/<project>/sprint-xxx/` 下的标准目录、默认文件、任务记录格式和 CR 生命周期，作为 `plan`、`review`、`review-verify` 以及后续自动化写盘的公共基线。

## Baseline Structure

```text
docs/
  <project>/
    sprint-xxx/
      index.md
      plan.md
      tasks/
        checklist.md
        tasks.csv
        TK-xxx.md
      code-review/
        review_<slug>.md
        verified_review_<slug>.md
        resolved_review_<slug>.md
```

## Directory Responsibilities

1. `index.md`
   - 当前 project / sprint 的入口页，汇总关键文档、任务卡和 CR 记录。
2. `plan.md`
   - 当前 sprint 的目标、范围、风险、里程碑和任务拆解。
3. `tasks/`
   - 单任务卡和执行记录目录。
4. `tasks/checklist.md`
   - 单列表任务清单，每个任务条目下持续追加执行记录。
5. `tasks/tasks.csv`
   - 追加式执行台账，每条执行或复核更新一行。
6. `tasks/TK-xxx.md`
   - 单任务明细，记录任务目标、交付物、验收标准和补充说明。
7. `code-review/`
   - 状态化 CR 文档目录，复核结果直接追加到同一文件中。

## Naming Rules

1. `<project>` 使用小写 kebab-case，例如 `mvp`、`platform-core`。
2. sprint 目录固定使用 `sprint-xxx`，编号使用三位数字，例如 `sprint-001`。
3. 单任务文件固定使用 `TK-xxx.md`。
4. CR 文件必须带状态前缀，生命周期固定为 `review_<slug>.md` -> `verified_review_<slug>.md` -> `resolved_review_<slug>.md`。
5. `<slug>` 使用小写 kebab-case，且应包含任务编号或变更主题，例如 `tk-106-design-project-sprint-artifacts`。

## Checklist Contract

1. `tasks/checklist.md` 使用单列表，不按状态分组。
2. 每个任务条目至少包含任务编号、标题、负责人、优先级、截止日期、状态。
3. 每次计划、实现、复核、修复都通过 `执行记录` 追加在同一任务条目下。
4. checklist 不承载复杂结构化统计，统计以 `tasks.csv` 为准。

推荐样式：

```md
- [x] **TK-084** 落地邮箱验证码发送接口（负责人：Backend｜优先级：HIGH｜截止：2026-03-09｜状态：done）
  - 执行记录：plan=实现邮箱验证码发送接口含DTO校验响应序列化与服务存储链路并补齐单测;result=已新增POST /api/v1/auth/login/email/send并完成DTO校验与AuthService邮箱发送逻辑及Redis邮箱验证码存储扩展;verify=pnpm lint/typecheck/test 通过
  - 执行记录：review_delta=按CR移除不应暴露的接口并重生成契约;verify=openapi 校验与全量 lint/typecheck/test 通过
```

## CSV Contract

`tasks/tasks.csv` 固定为追加式执行台账，字段顺序如下：

1. `execution_id`
2. `task_id`
3. `title`
4. `owner`
5. `priority`
6. `due_date`
7. `status`
8. `project`
9. `sprint`
10. `plan`
11. `result`
12. `verify`
13. `review_delta`
14. `recorded_at`

约束：

1. 每次执行记录一行，不回写覆盖旧记录。
2. `execution_id` 推荐格式为 `TK-xxx-yy`。
3. `review_delta` 仅在评审采纳、复核修复或差异修订时填写。
4. 复杂文本应按 CSV 转义规则写入。

## CR Lifecycle

1. 首次生成评审结论时写入 `review_<slug>.md`。
2. 复核完成后，将同一文件重命名为 `verified_review_<slug>.md`。
3. 认可的问题修复完成后，将同一文件重命名为 `resolved_review_<slug>.md`。
4. 不再生成单独的 `review-verify.md`。

## Command Responsibilities

1. `init`
   - 负责生成最小可运行的 `index.md`、`plan.md`、`tasks/checklist.md`、`tasks/tasks.csv` 和 `code-review/`。
2. `plan`
   - 负责补充 `TK-xxx.md` 任务卡，并回写 checklist / CSV。
3. `review`
   - 负责生成 `review_<slug>.md`。
4. `review-verify`
   - 负责在原 CR 文件追加复核结果并推进状态命名。

## Reference Implementation

1. 代码常量与命名规则基线位于 `src/config/repository-layout.js`。
2. schema 默认值位于 `src/config/schema/governor.schema.json` 的 `artifacts` 段。
3. 当前 `init` 与 `doctor` 已复用这套目录约定，可作为 `plan` 和 `review` 后续实现的落地样本。
