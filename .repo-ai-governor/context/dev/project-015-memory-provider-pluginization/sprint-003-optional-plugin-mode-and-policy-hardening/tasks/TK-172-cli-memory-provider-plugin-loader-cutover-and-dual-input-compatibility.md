# TK-172 CLI memory provider plugin loader cutover 与 dual-input compatibility

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-015-memory-provider-pluginization`
- Sprint: `sprint-003-optional-plugin-mode-and-policy-hardening`

## 1. 任务目标

把 CLI/config 侧正式切到受控 plugin loader 路径，同时保持 `storeEngine`、`memory.provider.id` 与新 `memory.provider.module` 的 dual-input 兼容与 truthfulness。

## 2. Depends On

1. `TK-171`
2. `DA-170`
3. `DA-168`
4. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 3. 预期产物

1. CLI plugin loader cutover baseline。
2. dual-input compatibility baseline。
3. diagnostics / config / integration tests 同步。

## 4. Required Inputs

1. `apps/cli/src/main.ts`
2. `packages/config/src/schema-validator.ts`
3. `packages/memory-provider-registry`
4. `TK-171`

## 5. Traceback References

1. `DA-168`
2. `DA-170`
3. `.repo-ai-governor/draft/memory-provider-pluginization-technical-solution.md`

## 6. 实施计划

1. 将 CLI loader 路径扩展到受控 `provider.module` 解析。
2. 保持 `storeEngine` 与 `provider.id` 的兼容优先级，并显式暴露 plugin source diagnostics。
3. 补齐 plugin success / fail-closed / legacy fallback 回归。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/memory-provider-registry/test/memory-provider-registry.unit.test.ts test/memory-store-config-and-cli-composition.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run check`

## 9. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始将 CLI loader 正式切到 `provider.module` 受控解析路径，并补齐 dual-input diagnostics。
3. 2026-03-26：任务完成，CLI 已通过统一 registry loader 支持 `storeEngine / provider.id / provider.module`，并补齐 plugin success / fail-closed integration coverage 与 `DA-172`。

## 10. 产出

1. [DA-172](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-015-memory-provider-pluginization/sprint-003-optional-plugin-mode-and-policy-hardening/tasks/DA-172-cli-memory-provider-plugin-loader-cutover-and-dual-input-compatibility.md)
