---
name: governor-task-implementer
description: Implement a single TK task card, keep scope bounded to that task, run the minimum self-check, and sync execution records.
---

# Governor Task Implementer

## Purpose

Execute one `TK-xxx` task card without drifting outside the planned scope.

## Preflight

1. Run `$governor-context-loader` first.
2. Read the target `TK-xxx.md`.
3. Read the active sprint `plan.md`.
4. Read any standards or slot summaries that directly affect the target files.

## Workflow

1. Restate the task goal and the exact files you expect to touch.
2. Implement only the code or docs required for the selected task.
3. Run the minimum self-check that proves the change is valid.
4. Append execution records to:
   - `tasks/checklist.md`
   - `tasks/tasks.csv`
5. If the task creates or updates review artifacts, use the active `code-review/` directory and the status-prefixed filename rules.

## Guardrails

1. Do not start a new task card implicitly.
2. Do not make broad unrelated refactors.
3. Do not finish implementation without leaving an execution record.
4. If the task requires review or verify, leave the repository in a state that those nodes can consume directly.

## Recommended Self-Check

1. Run the smallest relevant test or validation command first.
2. Use `repo-ai-governor check` when a structured governance check is useful.
3. Record the actual verify command in the task execution record.

## Output Contract

Return:

1. touched files
2. self-check command(s)
3. checklist and CSV update confirmation
