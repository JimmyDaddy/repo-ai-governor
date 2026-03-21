# TK-052 审计隐私治理（保留/脱敏/导出删除）基线

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Priority: P0
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-002-dependency-runtime-and-output-governance`

## 1. 任务目标

落地审计日志 90 天保留策略可配置与敏感信息脱敏并支持按范围导出删除。

## 2. Depends On

1. `TK-049`
2. `TK-050`
3. `DA-061`
4. `DA-062`

## 3. 预期产物

1. `DA-064` audit privacy governance baseline 文档。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-001-audit-report-and-replay-baseline/tasks/TK-049-sprint-002-dependency-runtime-and-output-governance-input-constraints-checklist.md` (`DA-061`)
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-050-cli-output-contract-and-non-tty-fallback-baseline.md` (`DA-062`)
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-master-execution-plan.md`（`4.7` 第 7 项）
4. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`（`13.1` 数据隐私与日志保留策略）

## 5. 实施计划

1. 定义 retention、masking、export/delete 的策略模型与配置入口。
2. 明确按 `execution_id/project/sprint/date range` 的导出/删除语义。
3. 建立隐私治理与审计回放的一致性约束。
4. 输出隐私治理门禁与验收检查项。

## 6. 验证计划

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-22：任务启动，状态切换为 `in_progress`，开始落地 retention/masking/export/delete 策略模型、运行时契约与测试基线。
3. 2026-03-22：在 `core-session` 落地审计隐私治理契约，新增 `AuditPrivacyGovernanceConfig`、`exportEvents/deleteEvents/applyRetentionPolicy` API，并支持 `projectId/sprintId` 维度过滤。
4. 2026-03-22：完成写入前敏感信息脱敏（字段名规则 + 文本模式规则）与默认 `90` 天保留策略实现，补齐 `audit-recorder.unit` 范围导出/删除/保留策略回归测试。
5. 2026-03-22：完成 `pnpm run typecheck`、`pnpm exec vitest run packages/core-session/test/audit-recorder.unit.test.ts` 与 `pnpm run check` 验证，任务切换为 `completed`。

## 8. 产出

1. `DA-064` `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-052-audit-privacy-governance-retention-masking-export-delete-baseline.md`
2. `packages/core-session/src/audit-recorder.ts`
3. `packages/core-session/src/constants/audit-privacy-governance.constant.ts`
4. `packages/core-session/src/constants/index.ts`
5. `packages/core-session/src/index.ts`
6. `packages/core-session/src/types/interfaces/audit-recorder.interface.ts`
7. `packages/core-session/src/types/interfaces/index.ts`
8. `packages/core-session/src/types/index.ts`
9. `packages/core-session/test/audit-recorder.unit.test.ts`
10. `packages/core-session/README.md`
