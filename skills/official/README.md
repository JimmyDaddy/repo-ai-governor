# Official Skills Package

This directory contains the bundled official skill package for `Repo AI Governor`.

## Entry Points

1. `catalog.json` is the canonical entrypoint for official skill discovery.
2. Individual skill assets live under `skills/official/<skill-id>/`.
3. Shared assets that do not belong to a single skill live under `../shared/`.

## Bundled Skills

1. `governor-context-loader`
   - Resolve the active stream and artifact paths before other skills act.
2. `governor-plan-runner`
   - Organize requirement input and execute `repo-ai-governor plan`.
3. `governor-task-implementer`
   - Implement a specific `TK-xxx` task and sync execution records.
4. `governor-delivery-finisher`
   - Run repository gates, create a Conventional Commit, and optionally push.

## Notes

1. All bundled skills target `Codex`, `GitHub Copilot`, and `Claude Code`.
2. `governor-plan-runner` includes a `script-assisted` example that generates a deterministic request skeleton before AI fills semantic content.
