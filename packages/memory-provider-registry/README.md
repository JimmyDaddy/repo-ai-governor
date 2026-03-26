# @repo-ai-governor/memory-provider-registry

Built-in memory provider registry and loader baseline.

## Responsibilities

1. Freeze the built-in descriptor contract for `fs-csv` and `sqlite-fs`.
2. Resolve legacy `MemoryRuntimeConfig.storeEngine` into a stable built-in provider selection.
3. Lazily load provider implementations and validate the loaded export against the `MemoryStoreProvider` contract.

## Current Scope

1. Phase 1 only supports built-in providers.
2. `fs-csv` remains the default distribution provider.
3. `sqlite-fs` is modeled as an optional built-in provider; default distribution intentionally fail-closes unless a plugin-enabled distribution explicitly provides that package.
4. `memory.provider.id` is accepted for built-in selection, while `memory.provider.module` remains reserved and fail-closed until optional plugin mode is enabled.
