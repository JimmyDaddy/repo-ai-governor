# TK-173 plugin-enabled distribution、clean-room、examples 与 release gate expansion

- Status: planned
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-003-optional-plugin-mode-and-policy-hardening`

## 1. 任务目标

建立 plugin-enabled distribution 的独立验证路径，把 clean-room、examples/runtime smoke 与 release gate 扩展到 optional plugin mode，而不是继续复用 default distribution 的结果。

## 2. Depends On

1. `TK-171`
2. `TK-172`
3. `DA-170`
4. `DA-169`
5. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 3. 预期产物

1. plugin-enabled distribution baseline。
2. clean-room / examples/runtime smoke 扩展。
3. release/local verification 与支持矩阵同步。

## 4. Required Inputs

1. `scripts/build/copy-runtime-assets.js`
2. `scripts/release/verify-local-distribution.js`
3. `scripts/release/verify-cleanroom-local-install.js`
4. `scripts/examples/check-examples-runtime.js`
5. `TK-171`

## 5. Traceback References

1. `DA-169`
2. `DA-170`
3. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 建立 plugin-enabled distribution 与默认发行包的分离校验路径。
2. 把 clean-room、examples/runtime smoke 与 release gate 扩展到 optional plugin mode。
3. 冻结 plugin-enabled support matrix，并与 default distribution truthfulness 对齐。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm run build`
3. `pnpm run release:verify-local`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。

## 10. 产出

1. 待 `DA-173`。
