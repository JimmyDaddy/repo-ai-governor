# DA-176 CLI、desktop host 与 service-backed runtime 的 memory provider loader reuse cutover

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-176`

## 1. Cutover 结论

CLI、desktop host 与 service-backed runtime 已切到同一条 memory provider loader reuse seam。host 不再复制 provider resolution 逻辑，而是统一透传 `memoryConfig` 给 shared loader / service host。

## 2. 本轮收敛结果

1. `CliOrchestrationServiceRuntime` 已把 `memoryConfig` 透传给 embedded shell 与 sidecar client。
2. CLI JSON diagnostics 已直接复用 registry summary，不再手工拼接 provider diagnostics。
3. desktop sidecar runtime smoke 与 integration tests 已显式验证 `memoryProvider` composition 在 default / plugin-enabled 两条路径下都能返回。
4. service-backed execution summary 已在 `health/startExecution/getExecution/listExecutions` 四个接口上维持一致。

## 3. 关键实现锚点

1. `apps/cli/src/runtime/orchestration-service-runtime.ts`
2. `apps/cli/src/main.ts`
3. `apps/cli/src/types/interfaces/cli-orchestration-service-runtime.interface.ts`
4. `apps/cli/src/types/interfaces/cli-output.interface.ts`
5. `test/desktop-entry-smoke.integration.test.ts`
6. `apps/cli/test/runtime/orchestration-service-runtime.test.ts`

## 4. 验证证据

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run apps/cli/test/runtime/orchestration-service-runtime.test.ts test/desktop-entry-smoke.integration.test.ts test/memory-store-config-and-cli-composition.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/examples/check-desktop-entry-smoke.js`
4. `node ./scripts/examples/check-desktop-entry-smoke.js --distribution-mode plugin-enabled`
5. `pnpm run check`
