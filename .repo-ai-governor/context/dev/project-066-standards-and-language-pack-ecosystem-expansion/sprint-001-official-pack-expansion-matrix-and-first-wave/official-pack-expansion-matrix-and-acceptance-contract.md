# Official Pack Expansion Matrix And Acceptance Contract

- Status: completed
- Date: 2026-04-08
- Project: `project-066-standards-and-language-pack-ecosystem-expansion`
- Sprint: `sprint-001-official-pack-expansion-matrix-and-first-wave`

## 1. Official Catalog Matrix

| family | export | status | contract | notes |
|---|---|---|---|---|
| Workflow review baseline | `workflowReviewGovernancePack` | active | official workflow baseline | Can be layered with every language pack and carries the governed `CR-xxx` lifecycle. |
| JavaScript baseline | `javascriptMinimalGovernancePack` | first-wave active | official language baseline | Targets `package.json` script-driven JavaScript / Node repositories. |
| Python baseline | `pythonMinimalGovernancePack` | active | official language baseline | Targets `pyproject.toml` + `ruff` + `pytest` + `pyright` style repos. |
| Go baseline | `goMinimalGovernancePack` | active | official language baseline | Targets `go.mod` / `go.sum` repos with `fmt/test/vet` delivery expectations. |
| Rust baseline | `rustMinimalGovernancePack` | first-wave active | official language baseline | Targets Cargo workspace repos with `fmt/clippy/test` delivery expectations. |
| TypeScript repository example | `n/a` | existing | repository reference example | The current self-host TypeScript baseline remains a repository-level example, not a separately published official pack. |

## 2. Acceptance Contract

1. Official packs must export from both `packages/standards/src/examples/index.ts` and the top-level `packages/standards/src/index.ts` surface.
2. Every official pack must carry bilingual `human / ai / agents` localized templates and render clean through the standards render/projection tests.
3. Official-pack runtime examples must stay consumable through `StandardsRuntimeLoader` using layered `governor.yaml.standards.packSources.official[]` configuration.
4. Adopter-facing docs must describe which packs are official published baselines versus repository reference examples; the public narrative cannot collapse back to a single “minimal baseline only” statement.
5. `project-066` first-wave implementation scope is fixed to catalog refresh plus the new JavaScript and Rust official packs; deeper loader/schema changes remain out of scope.
