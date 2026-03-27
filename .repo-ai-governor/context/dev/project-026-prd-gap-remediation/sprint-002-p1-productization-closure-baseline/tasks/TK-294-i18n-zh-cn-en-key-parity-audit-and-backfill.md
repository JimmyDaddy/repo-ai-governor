# TK-294 i18n zh-CN/en 键集覆盖度核查与补齐

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-002-p1-productization-closure-baseline`

## 1. 任务目标

核查 `zh-CN` / `en` 两套 i18n 资源的键集覆盖度，并补齐缺失翻译键与 gate 可阻断性验证。

## 2. Depends On

1. `TK-292`
2. i18n parity gate 现有脚本与资源文件

## 3. 预期产物

1. 键集 parity 差异清单
2. 缺失翻译键补齐
3. 通过的 parity 验证记录

## 4. 实施计划

1. 汇总 CLI/runtime 用户可见文案资源入口。
2. 对比 `zh-CN` / `en` 语义键差异。
3. 补齐缺失键并验证 parity gate。

## 5. 验证命令

1. `node ./scripts/governance/check-i18n-parity-fallback.js`
2. `pnpm vitest run --config vitest.integration.config.ts test/i18n-parity-fallback-gate.integration.test.ts test/i18n-translation-key-coverage.integration.test.ts`
3. `pnpm run typecheck`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始核对 shared locale 资源、CLI `i18nRuntime.t(...)` 调用点与 parity gate 覆盖边界。
3. 2026-03-28：已完成 `zh-CN/en-US` 资源 parity 审计，新增 CLI 翻译键覆盖集成测试并确认当前 key 使用全部命中双语资源。
