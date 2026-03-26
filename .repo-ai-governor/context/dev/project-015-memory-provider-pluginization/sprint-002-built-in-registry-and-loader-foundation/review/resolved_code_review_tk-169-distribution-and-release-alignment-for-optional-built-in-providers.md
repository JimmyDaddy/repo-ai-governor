# resolved_code_review_tk-169-distribution-and-release-alignment-for-optional-built-in-providers

- Status: resolved
- Date: 2026-03-26
- Task: `TK-169`
- Scope: `distribution matrix / release verification / optional built-in provider packaging boundary`

## Review Summary

1. 确认默认 distribution 已与 optional built-in provider 责任边界对齐，不再默认携带 `sqlite-fs` runtime payload。
2. 确认 runtime asset copy、packaged artifact 校验与 release/local verification 使用同一最小支持矩阵。
3. 确认 `verify-local-distribution` 对 optional built-in provider 采用 fail-closed 校验，避免 future drift 重新把 optional payload 带回默认发行面。

## Findings

1. 无待保留 finding。

## Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run build`
3. `pnpm run release:verify-local`
4. `pnpm run check`
