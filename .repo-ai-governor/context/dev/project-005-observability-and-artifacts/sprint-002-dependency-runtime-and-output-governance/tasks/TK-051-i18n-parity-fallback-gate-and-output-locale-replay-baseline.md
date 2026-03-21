# TK-051 i18n parity/fallback 门禁与 output_locale 回放定位基线

- Status: planned
- Date: 2026-03-21
- Owner: TBD
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
