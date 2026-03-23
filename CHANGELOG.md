# Changelog

## Unreleased

## Added

1. Added executable examples assets for each scenario under `examples/`:
   - `scenario.json`
   - `fixtures/input.md`
   - `expected/runtime-baseline.json`
2. Added runtime smoke gate: `pnpm run check:examples-runtime-smoke`.
3. Added local adoption playbook and bilingual onboarding docs.

## Changed

1. `check:examples-smoke` now runs both doc smoke and runtime smoke.
2. `gate:examples-smoke` now delegates to the aggregated `check:examples-smoke`.
3. Runtime smoke now enforces operation parity against `expected/runtime-baseline.json`.

## Migration Notes

1. If your pipeline previously used `check:examples-smoke` as doc-only validation, switch to:
   - doc-only: `check:examples-doc-smoke`
   - full examples gate: `check:examples-smoke`
2. Scenario owners must keep operation mapping aligned across:
   - `scenario.json` (`commands[].expect.operation`)
   - `expected/runtime-baseline.json` (`expectedCommandOperations`)
3. For machine consumption, continue to use CLI `--output json` and rely on stable fields:
   - `status`
   - `command`
   - `command_result.operation`
