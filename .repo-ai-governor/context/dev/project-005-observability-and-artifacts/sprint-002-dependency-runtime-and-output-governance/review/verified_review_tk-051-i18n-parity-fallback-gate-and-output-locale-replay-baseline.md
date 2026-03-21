# verified_review_tk-051-i18n-parity-fallback-gate-and-output-locale-replay-baseline

- Status: verified
- Date: 2026-03-22
- Task: `TK-051`
- Scope: `i18n parity/fallback gate and output_locale replay baseline`

## 1. 审核结论

1. 通过。已建立 i18n parity/fallback 可阻断门禁，并把 `output_locale` 纳入 replay explain 的过滤与输出链路，满足 TK-051 目标。

## 2. 已核验证据

1. `scripts/governance/check-i18n-parity-fallback.js` 已校验 locale key parity、默认/回退 locale 可解析性与 supported locale 可用性。
2. `package.json` 与 `turbo.json` 已接线 `check/gate:i18n-parity-fallback`，门禁并入 `pnpm run check` 主链路。
3. `packages/reporting/src/replay-explainer.ts` 已支持 `outputLocale` 查询过滤并在 explain 行输出 `output_locale=...`。
4. `packages/reporting/src/types/interfaces/reporting.interface.ts` 已补齐 `ExplainReplayOptions/ReplayExplainQuery` 的 `outputLocale` 字段。
5. `packages/reporting/test/replay-explainer.unit.test.ts`、`packages/reporting/test/report-builder.unit.test.ts`、`packages/core-session/test/audit-recorder.unit.test.ts` 已覆盖 `output_locale` 回放链路。
6. `test/i18n-parity-fallback-gate.integration.test.ts` 已覆盖门禁脚本机器输出契约与通过路径。

## 3. 验证命令

1. `pnpm run typecheck`（通过）
2. `pnpm run test:packages -- packages/core-session/test/audit-recorder.unit.test.ts packages/reporting/test/report-builder.unit.test.ts packages/reporting/test/replay-explainer.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run test:integration -- test/i18n-parity-fallback-gate.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
4. `node ./scripts/governance/check-i18n-parity-fallback.js --format json`（通过）
5. `pnpm run check`（通过）

## 4. 风险与后续

1. 当前 parity gate 覆盖 shared 基线 locale 资源；后续新增 locale 时需同步扩展 `LOCALE_SOURCE_DEFINITIONS`，避免误判“未纳入校验”。
