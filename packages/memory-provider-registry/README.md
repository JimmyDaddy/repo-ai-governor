# @repo-ai-governor/memory-provider-registry

Built-in memory provider registry and loader baseline.

## Responsibilities

1. Freeze the built-in descriptor contract for `fs-csv` and `sqlite-fs`.
2. Resolve legacy `MemoryRuntimeConfig.storeEngine` into a stable built-in provider selection.
3. Freeze the optional plugin baseline for `memory.provider.module / exportName / options`, including allowlist/prefix/path policy.
4. Lazily load provider implementations and validate the loaded export against the `MemoryStoreProvider` contract.

## Current Scope

1. Phase 2 now supports controlled plugin mode through `memory.provider.module`.
2. `sqlite-fs` is the default built-in provider for runtime durable truth and is bundled in the default distribution.
3. `fs-csv` remains a built-in provider for compatibility, export, debug, and fallback scenarios.
4. `memory.provider.id` remains the built-in selection path, while `memory.provider.module` is admitted only through the optional plugin registry contract.
5. The sprint-003 baseline only permits allowlist-controlled bare package specifiers for `memory.provider.module`; relative paths, absolute paths, and `file:` URLs remain fail-closed.
6. `loadProvider()` now routes built-in, legacy `storeEngine`, and controlled `provider.module` resolution through one shared registry seam.
