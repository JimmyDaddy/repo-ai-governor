# TK-169 distribution 与 release 对 optional built-in provider 的边界收口

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-002-built-in-registry-and-loader-foundation`

## 1. 任务目标

收敛 build / release / local verification 对 built-in provider 与 optional provider 的最小支持矩阵，避免运行时已模块化但发行面仍全量镜像 provider。

## 2. Depends On

1. `TK-167`
2. `TK-168`
3. `DA-159`
4. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 3. 预期产物

1. default distribution 与 optional built-in provider 的边界基线。
2. build/release/local verification 同步。
3. clean-room / release gate 的最小支持矩阵说明。

## 4. Required Inputs

1. `scripts/release/verify-local-distribution.js`
2. `scripts/build/copy-runtime-assets.js`
3. `package.json`
4. `turbo.json`
5. `TK-167`

## 5. Traceback References

1. `DA-159`
2. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 审视当前 provider 资产打包路径与默认分发语义。
2. 收敛默认 built-in 与 optional provider 的 release 口径。
3. 为 `TK-170` 冻结可验收的发布矩阵。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run build`
3. `pnpm run release:verify-local`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始收敛 default distribution 与 optional built-in provider 的 runtime/release 边界。
3. 2026-03-26：任务完成，默认发行包已排除 `sqlite-fs` optional built-in provider 载荷，并把 verify-local / release-ready 校验同步到最小支持矩阵。

## 10. 产出

1. [DA-169](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-002-built-in-registry-and-loader-foundation/tasks/DA-169-distribution-and-release-alignment-for-optional-built-in-providers.md)
