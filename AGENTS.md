# Repo AI Governor Workspace Rules

## Current Context

- Current project: `mvp`
- Current sprint: `none`
- Active sprint docs root: `not started`
- Last completed sprint docs root: `docs/mvp/sprint-004/`
- Last completed task records: `docs/mvp/sprint-004/tasks/`
- Last completed code review records: `docs/mvp/sprint-004/code-review/`

## Source Of Truth

1. Structured configuration and standards documents are the source of truth.
2. `AGENTS.md` is the repository-level AI execution entrypoint for IDEs and agents.
3. When rules in docs and `AGENTS.md` diverge, update `AGENTS.md` to match the structured docs.

## Working Rules

1. `sprint-004` is closed. Do not start new implementation tasks or new `TK-xxx` work until the next sprint is explicitly planned.
2. Before executing follow-up work such as `TK-503`, create the next sprint directory under `docs/mvp/sprint-xxx/` and update `AGENTS.md` to point to it.
3. Sprint closeout, retrospective, or cross-sprint planning updates may still write under `docs/mvp/sprint-004/`.
4. Once a new sprint is opened, task decomposition must update that sprint's:
   - `plan.md`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - `tasks/TK-xxx.md`
5. Code review output for an active sprint must be written under that sprint's `code-review/` directory and use meaningful status-prefixed file names.
6. Default CR lifecycle:
   - `review_<slug>.md`: review generated and pending verify
   - `verified_review_<slug>.md`: verify completed
   - `resolved_review_<slug>.md`: accepted findings resolved
7. Review re-check must append results into the same CR file, then rename the file to the next status.
8. Sprint execution progress must be maintained in the active sprint's `tasks/checklist.md`, and each task entry should append execution records.

## Naming Rules

1. Project directory format: `docs/<project>/`
2. Sprint directory format: `sprint-xxx`
3. Task file format: `TK-xxx.md`
4. CSV task register file: `tasks.csv`
5. Checklist file: `checklist.md`
6. CR file format: `review_<slug>.md`, `verified_review_<slug>.md`, `resolved_review_<slug>.md`
7. `<slug>` should include the task ID or change scope, for example `tk-001-initialize-sprint-templates`
8. `tasks/checklist.md` uses a flat task list and appends multiple execution records under each task
9. `tasks/tasks.csv` stores one execution record per row with fields `execution_id,task_id,title,owner,priority,due_date,status,project,sprint,plan,result,verify,review_delta,recorded_at`

## Default Workflow

1. Update or create plan.
2. Split tasks and sync checklist plus CSV.
3. Execute implementation.
4. Run self-check.
5. Write `review_<slug>.md`.
6. Append verify results into the same CR file and rename it to `verified_review_<slug>.md`.
7. After accepted items are fixed, rename it to `resolved_review_<slug>.md`.
8. Append execution records to `tasks/checklist.md` and `tasks/tasks.csv`.

## Local Skills

1. `workspace-delivery-finisher`
   - Path: `.codex/skills/workspace-delivery-finisher/SKILL.md`
   - Use when the user says `收尾`、`提交并推送`、`收尾并推送`
   - Trigger mapping:
     - `收尾`: run the repository gate, generate a Conventional Commit message, and create a local commit only
     - `提交并推送`: run the same finish flow, then push to the current remote branch
     - `收尾并推送`: same as `提交并推送`
   - This local skill overrides the generic `delivery-finisher` behavior for this repository
