# DA-169 distribution 与 release 对 optional built-in provider 的边界收口

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-169`
- Producer Execution: `exec-20260326-130`

## 1. 摘要

本产物冻结了 memory provider 的默认发行矩阵：`fs-csv` 作为 default built-in provider 继续进入默认 distribution，`sqlite-fs` 收敛为 optional built-in provider，并从默认 `dist` 与 packaged artifact 中排除；release/local verification 同步以 fail-closed 方式校验这一边界。

## 2. 交付内容

1. default distribution / optional built-in provider 边界基线
2. runtime asset copy 策略收口
3. local distribution / release-ready gate 对齐
4. sprint-002 可验收的最小支持矩阵

## 3. 关键实现

1. runtime distribution metadata 收敛：
   - [copy-runtime-assets.js](/Users/jimmydaddy/study/ai-governor/scripts/build/copy-runtime-assets.js)
   - `memory-provider-fs-csv = default`
   - `memory-provider-sqlite-fs = optional`
   - `memory-provider-registry = default`
   - `memory-store-adapter = default`
2. 默认 distribution 构建时跳过 optional built-in provider：
   - [copy-runtime-assets.js](/Users/jimmydaddy/study/ai-governor/scripts/build/copy-runtime-assets.js)
   - `materializeWorkspacePackagesForDistributionRuntime()` 不再复制 optional package
   - 新增 `pruneOptionalPackagesFromDefaultDistribution()`
3. release/local verification fail-closed：
   - [verify-local-distribution.js](/Users/jimmydaddy/study/ai-governor/scripts/release/verify-local-distribution.js)
   - 默认 packaged artifact 若含 `sqlite-fs` 相关路径则直接失败

## 4. 冻结的发布矩阵

1. 默认发行包必须包含：
   - `memory-provider-registry`
   - `memory-provider-fs-csv`
   - `memory-store-adapter`
2. 默认发行包不得包含：
   - `memory-provider-sqlite-fs` runtime payload
3. `sqlite-fs` 继续保留为 optional built-in provider 语义，但不再隐式镜像进默认 distribution。

## 5. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run build`
3. `pnpm run release:verify-local`
4. `pnpm run check`

## 6. 对后续任务的约束

1. `TK-170` 必须把 “default distribution 不包含 optional built-in provider payload” 作为出口验收项。
2. 后续 optional plugin sprint 若引入新 provider，不得重新把 optional provider 默认打包回发行主路径。
