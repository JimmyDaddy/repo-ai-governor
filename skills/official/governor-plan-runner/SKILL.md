---
name: governor-plan-runner
description: Organize a requirement into request input, run repo-ai-governor plan, and verify that plan and task artifacts were generated.
---

# Governor Plan Runner

## Purpose

Turn a requirement into repository planning artifacts that the rest of the governance workflow can consume.

## Preflight

1. Run `$governor-context-loader` first.
2. Read the active stream `plan.md`, `tasks/checklist.md`, and `tasks/tasks.csv`.
3. Read the user requirement or existing `request.md`.

## Workflow

1. If the request is incomplete, use `scripts/create-request-draft.js` with `templates/request-draft.md` to generate a deterministic requirement skeleton.
2. Let the AI fill every `TODO_AI_FILL` zone with project-specific content.
3. Run `repo-ai-governor plan --project <project> --sprint <sprint> --input <request-file>`.
4. Verify that the following artifacts exist and are updated:
   - `plan.md`
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
   - at least one `tasks/TK-xxx.md`
5. If artifacts are missing, stop and explain what was not produced.

## Guardrails

1. Do not skip the CLI and handwrite planning artifacts when `plan` is available.
2. Do not leave `TODO_AI_FILL` markers unresolved in the final request input.
3. Keep the generated request focused on one sprint-sized planning outcome.

## Script-Assisted Mode

This skill demonstrates the recommended boundary:

1. `scripts/create-request-draft.js` generates the stable shell.
2. The AI fills summary, scope, acceptance, and verification details.
3. The CLI generates the authoritative sprint artifacts.

## Output Contract

After the run, report:

1. request input path
2. generated `plan.md` path
3. number of task cards
4. checklist and CSV paths
