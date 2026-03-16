---
name: governor-delivery-finisher
description: Finish a governed change safely by running the repository gate, generating a Conventional Commit, creating a git commit, and pushing only when explicitly requested.
---

# Governor Delivery Finisher

## Purpose

Turn a completed governed task into a safe repository delivery with a repeatable finish sequence.

## Workflow

1. Read `AGENTS.md` and `.repo-ai-governor/context/current-context.md`.
2. Inspect repository state with:
   - `git status -sb`
   - `git branch --show-current`
   - `git remote -v`
3. Run the documented repository gate.
   - Prefer the repository's standard gate command if it is explicit in docs or scripts.
   - If no gate is documented, prefer:
     - `repo-ai-governor check --format json`
     - then the repository's local test or check command when available
4. If the gate fails, stop immediately.
5. Stage the intended changes without discarding unrelated user work.
6. Generate a Conventional Commit message that reflects the delivered change.
7. Create a normal local commit.
8. Push only when the user explicitly asks for push.

## Guardrails

1. Never push on a plain finish request.
2. Never skip the gate.
3. Never use destructive git commands.
4. Prefer repository-local delivery rules over global defaults when they exist.
5. Respect the active task card and sprint execution records when summarizing the delivery.

## Output Contract

Always report:

1. gate result
2. branch name
3. commit hash
4. commit message
5. push result or reason it was skipped
