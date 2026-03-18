# Repo AI Governor Workspace Rules

## Current Context

1. Read `.repo-ai-governor/context/current-context.md` before acting.
2. Treat that file as the mutable source for the primary execution stream and any parallel streams.
3. Update the context file instead of editing `AGENTS.md` when project, sprint, or stream ownership changes.

## Source Of Truth

1. Structured configuration and standards documents are the source of truth.
2. `AGENTS.md` is the repository-level AI execution entrypoint for IDEs and agents.
3. When rules in docs and `AGENTS.md` diverge, update `AGENTS.md` to match the structured docs.

## Product Entry

1. Before planning or execution, AI agents must read `docs/repo-ai-governor-overall-technical-solution.md`.
2. `docs/repo-ai-governor-overall-technical-solution.md` is the tool-level architecture and implementation north star.
3. For architecture boundaries and repository layering, AI agents must read `docs/repo-ai-governor-architecture-and-repo-layering.md`.
4. Before planning or execution, AI agents must read `docs/product-requirements-brief.md`.
5. `docs/product-requirements-brief.md` is the default execution objective to prevent scope drift during implementation.
6. `docs/product-requirements.md` is the full product reference for iteration planning, capability alignment, and major scope decisions.
7. Any update to `docs/product-requirements.md` must include a synchronized update to `docs/product-requirements-brief.md` in the same change set.
8. Feature implementation must prioritize the product goal: govern AI development workflows in repositories that adopt this tool.
9. This repository's own governance workflow is used as a self-hosting validation path, not the primary product target.

## Standards Entry

1. Before planning or execution, AI agents must read `code_standards.md`.
2. Before planning or execution, AI agents must read `docs/governance/long-term-maintenance-guide.md`.
3. All implementation and review outputs must follow `code_standards.md` non-negotiable rules and verification commands.

## Working Rules

1. New planning or execution work should follow the active stream paths declared in `.repo-ai-governor/context/current-context.md`.
2. Task decomposition for the primary stream must update the stream-specific `plan.md`, `tasks/checklist.md`, `tasks/tasks.csv`, and `tasks/TK-xxx.md` paths declared in the context file.
3. Code review output must be written under the stream-specific `code-review/` directory declared in the context file and use meaningful status-prefixed file names.
4. Default CR lifecycle:
   - `review_<slug>.md`: review generated and pending verify
   - `verified_review_<slug>.md`: verify completed
   - `resolved_review_<slug>.md`: accepted findings resolved
5. Review re-check must append results into the same CR file, then rename the file to the next status.
6. Sprint execution progress must be maintained in the primary stream checklist, and each task entry should append execution records.

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
