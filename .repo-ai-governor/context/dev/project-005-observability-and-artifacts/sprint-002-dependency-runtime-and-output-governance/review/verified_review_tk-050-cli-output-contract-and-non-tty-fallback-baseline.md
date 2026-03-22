# verified_review_tk-050-cli-output-contract-and-non-tty-fallback-baseline

- Status: verified
- Date: 2026-03-22
- Task: `TK-050`
- Scope: `CLI output contract and non-tty fallback baseline`

## 1. 审核结论

1. 通过。`apps/cli` 已落地 `pretty/plain/json` 输出契约、`--output/--verbosity/--no-color` 行为与 non-TTY 自动降级，并在错误路径输出结构化字段 `error_code/hint/next_action`。

## 2. 已核验证据

1. `apps/cli/src/main.ts` 已接入输出参数解析、TTY 判定、降级策略与统一 success/error payload 组装。
2. `apps/cli/src/cli-output-presenter.ts` 已统一渲染三种输出模式并保证 plain/json 可解析输出。
3. `apps/cli/src/constants/cli-output.constant.ts` 与 `apps/cli/src/types/interfaces/cli-output.interface.ts` 已沉淀稳定 schema 与有限枚举。
4. `apps/cli/test/cli-output-contract.integration.test.ts` 已覆盖 json schema、non-TTY downgrade、`--no-color` 与结构化错误字段。
5. `packages/shared/src/i18n/locales/en-us.ts` 与 `packages/shared/src/i18n/locales/zh-cn.ts` 已补齐输出参数文案键。

## 3. 验证命令

1. `pnpm run typecheck`（通过）
2. `pnpm run test:packages -- apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `pnpm run check`（通过）

## 4. 风险与后续

1. `pretty` 模式当前仍为轻量可读渲染，后续可在保持契约稳定前提下增强阶段进度块与风险摘要块。
