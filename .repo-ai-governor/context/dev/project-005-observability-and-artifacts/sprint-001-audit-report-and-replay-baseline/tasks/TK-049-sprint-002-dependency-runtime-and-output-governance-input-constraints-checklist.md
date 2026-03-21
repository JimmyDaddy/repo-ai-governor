# TK-049 sprint-002 dependency-runtime/output-governance 输入约束清单

- Status: active
- Date: 2026-03-21
- Owner: AI-Agent
- Scope: `sprint-001 -> sprint-002` handoff

## 1. 目标

确保 `sprint-002-dependency-runtime-and-output-governance` 启动前具备可消费输入、可阻断门禁与可回放约束，避免输出契约、i18n 门禁与隐私治理阶段出现语义漂移。

## 2. 输入就绪检查

1. 审计、报告与回放基础能力
   - `DA-057` 已固化审计事件最小字段、执行上下文回链与 `AuditRecorder` 写入查询契约。
   - `DA-058` 已提供 execution 维度报告聚合与 replay/explain 定位链路。
2. 依赖产物运行时基础能力
   - `DA-059` 已提供 Artifact Registry + Dependency Resolver，并对齐 `resolved/warned/escalated/blocked` 语义。
   - 依赖处置与审计字段联动可作为 sprint-002 输出与隐私治理能力的上游事实来源。
3. 台账与生命周期治理约束
   - 任务卡、`checklist.md`、`tasks.csv` 必须保持字段一致并通过 `check-task-ledger-sync`。
   - 依赖产物仅允许消费 `active/frozen` 状态，`dependent_tasks` 由脚本自动回填。
4. Sprint-002 任务输入映射
   - `TK-050` 必须消费 `DA-060/DA-061`，以建立 `pretty/plain/json` 与 non-TTY 降级的一致输出契约。
   - `TK-051` 必须消费 `DA-061` 与 `DA-062`，将 i18n parity/fallback 失败映射到 replay 可定位字段。
   - `TK-052` 必须消费 `DA-061` 与 `DA-062`，在输出契约已稳定的前提下落地 retention/masking/export-delete。
   - `TK-053` 必须回链 `DA-062/DA-063/DA-064`，形成 project-005 统一出口验收与 project-006 输入约束。

## 3. Stage 6 风险分级输入基线

1. 阻断型（BLOCK）
   - `DA-060/DA-061` 不可检索，或 `artifact_id + artifact_path` 回链不一致。
   - 输出模式契约字段与回放字段发生破坏性变更且未提供兼容迁移。
   - i18n fallback 或隐私治理策略缺失导致审计输出不可控。
2. 确认型（CONFIRM）
   - 输出文案与本地化文案调整但字段键和语义不变。
   - 保留期、脱敏规则阈值调整但不改变状态机语义。
3. 自动型（AUTO_APPLY）
   - 产物索引回链补齐。
   - 无语义变化的门禁命令、路径与台账字段同步修正。

## 4. Sprint-002 启动前推荐命令

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/reconcile-artifact-dependencies.js`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
7. `pnpm run check`
