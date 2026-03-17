# TS-only Whitelist Inventory

- Date: 2026-03-18
- Source: `scripts/governance/ts-only-whitelist.json`
- Scopes: `src`, `test`

## In-scope Whitelist Entries

当前无 JS 白名单条目（`pathAllowList` 为空）。

## Out-of-scope Explicit Exemptions

1. `bin`
   - reason: CLI runtime bootstrap entry is intentionally JavaScript for direct Node execution.
2. `scripts`
   - reason: Build/release/governance tooling currently executes as JavaScript CLI scripts.
3. `skills/official/governor-plan-runner/scripts`
   - reason: Official packaged skill keeps runtime helper script in JavaScript.

## Current Tracked JS Outside `src/test`

1. `bin/repo-ai-governor.js`
2. `scripts/acceptance/run-automation-v1-smoke.js`
3. `scripts/build/copy-runtime-assets.js`
4. `scripts/examples/load-dist-module.js`
5. `scripts/examples/render-claude-code-adapter-bundle.js`
6. `scripts/examples/render-codex-adapter-bundle.js`
7. `scripts/examples/render-github-copilot-adapter-bundle.js`
8. `scripts/governance/check-code-standards.js`
9. `scripts/governance/check-dynamic-import-usage.js`
10. `scripts/governance/check-esm-import-specifiers.js`
11. `scripts/governance/check-finite-literal-sets.js`
12. `scripts/governance/check-ts-only-residue.js`
13. `scripts/governance/check-type-governance.js`
14. `scripts/governance/check-utils-reuse-governance.js`
15. `scripts/release/check-release-ready.js`
16. `scripts/release/render-release-notes.js`
17. `scripts/release/verify-local-distribution.js`
18. `skills/official/governor-plan-runner/scripts/create-request-draft.js`

## Notes

1. 新增白名单请优先写入 `pathAllowList`，并为每个路径提供 `reason`。
2. `src/test` 之外新增 `.js` 必须命中 `outOfScopeAllowList` 并提供明确 reason。
3. `allowList` 仅用于历史兼容；门禁会提示迁移到 `pathAllowList`。
