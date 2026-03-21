# TK-051 i18n parity/fallback 门禁与 output_locale 回放定位基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-002-dependency-runtime-and-output-governance`

## 1. 任务目标

落地 i18n key parity 与 fallback 可用性门禁并纳入 `output_locale` 回放定位链路。

## 2. Depends On

1. `TK-049`
2. `TK-050`
3. `DA-061`
4. `DA-062`

## 3. 预期产物

1. `DA-063` i18n parity fallback gate and output locale replay baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-049-sprint-002-dependency-runtime-and-output-governance-input-constraints-checklist.md` (`DA-061`)
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-050-cli-output-contract-and-non-tty-fallback-baseline.md` (`DA-062`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.7` 第 6 项）
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`（i18n 阶段落位与门禁）

## 5. 实施计划

1. 定义 locale key parity 检查策略与失败语义。
2. 建立 fallback 可用性检查与门禁触发点。
3. 将 `output_locale` 问题接入回放定位字段与报告链路。
4. 输出可回归的 i18n 门禁验证样例。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `in_progress`，开始落地 i18n parity/fallback 门禁与 `output_locale` 回放定位链路。
3. 2026-03-22：完成 `check-i18n-parity-fallback` 门禁脚本与 gate 接线，并补齐脚本集成测试覆盖。
4. 2026-03-22：完成 replay explain `outputLocale` 过滤与 `output_locale` 输出增强，并补齐 reporting/core-session 单测。
5. 2026-03-22：完成 `pnpm run typecheck`、`pnpm run test:packages -- packages/core-session/test/audit-recorder.unit.test.ts packages/reporting/test/report-builder.unit.test.ts packages/reporting/test/replay-explainer.unit.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run test:integration -- test/i18n-parity-fallback-gate.integration.test.ts --maxWorkers=1 --maxConcurrency=1`、`pnpm run check` 验证并切换任务为 `completed`。

## 8. 产出

1. `DA-063` `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-051-i18n-parity-fallback-gate-and-output-locale-replay-baseline.md`
2. `scripts/governance/check-i18n-parity-fallback.js`
3. `test/i18n-parity-fallback-gate.integration.test.ts`
4. `packages/reporting/src/replay-explainer.ts`
5. `packages/reporting/src/types/interfaces/reporting.interface.ts`
6. `packages/reporting/test/replay-explainer.unit.test.ts`
7. `packages/reporting/test/report-builder.unit.test.ts`
8. `packages/core-session/test/audit-recorder.unit.test.ts`
9. `package.json`
10. `turbo.json`
