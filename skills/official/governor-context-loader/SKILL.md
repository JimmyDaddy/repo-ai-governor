---
name: governor-context-loader
description: Resolve AGENTS.md, current-context.md, and the active project/sprint artifact paths before any governance action runs.
---

# Governor Context Loader

## Purpose

Load the repository execution context before another governance skill performs planning, implementation, review, or delivery.

## Read Order

1. Read `AGENTS.md`.
2. Read `.repo-ai-governor/context/current-context.md`.
3. Prefer any explicit `project / sprint / stream` given by the user over the primary stream.
4. If a target task is already known, read the matching `plan.md`, `tasks/checklist.md`, `tasks/tasks.csv`, and `TK-xxx.md`.

## Workflow

1. Resolve the active stream.
2. If multiple active streams exist and no explicit target is given, stop and ask for the stream.
3. Summarize:
   - active project
   - active sprint
   - docs root
   - plan path
   - checklist path
   - CSV path
   - code review directory
4. Hand these paths to the next skill instead of re-deriving them later.

## Guardrails

1. Treat `AGENTS.md` as the stable entrypoint, not the mutable state store.
2. Treat `.repo-ai-governor/context/current-context.md` as the mutable context source.
3. Do not update `AGENTS.md` to switch projects or sprints.
4. Do not continue if the active stream is ambiguous.

## Output Contract

Return a concise context block with:

1. `project`
2. `sprint`
3. `docs_root`
4. `plan_file`
5. `checklist_file`
6. `tasks_csv`
7. `code_review_dir`

## Artifact Notes

1. `templates/context-summary.md` provides a reusable summary skeleton.
2. `references/read-order.md` records the canonical read sequence for future adapter projections.
