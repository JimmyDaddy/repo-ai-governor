# TK-053 project-006 输入约束清单

- Status: completed
- Date: 2026-03-22
- Owner: AI-Agent
- Scope: `project-005 -> project-006` handoff

## 1. 目标

确保 `project-006-hardening-and-release` 启动前具备可消费输入、可阻断门禁与可回滚发布前置条件，避免 Stage 7（契约测试/稳定性/发布治理）出现语义漂移。

## 2. 输入就绪检查

1. Stage 6 产物可消费性
   - `DA-062` 已固化 `pretty/plain/json` 输出契约与 non-TTY 自动降级语义。
   - `DA-063` 已固化 i18n parity/fallback 门禁与 `output_locale` 回放定位链路。
   - `DA-064` 已固化审计隐私治理（90 天保留、写入前脱敏、按范围导出/删除）。
   - `DA-065` 已固化 project-005 出口验收结论，可作为 Stage 7 启动基线。
2. 质量与门禁链路
   - `pnpm run check` 门禁链路可稳定通过，`task ledger/sprint plan/artifact lifecycle` 三类治理脚本可阻断漂移。
   - 包级测试与集成测试分层遵循 `CS-024`，后续 Stage 7 可直接叠加 `contract/e2e/perf` 维度。
3. 生命周期与依赖治理
   - Artifact Registry 主/归档分层治理有效，`dependent_tasks` 由 reconcile 自动回填与清理。
   - 非 `active/frozen` 产物不进入默认依赖注入链路。
4. 发布治理前置条件
   - Stage 7 必须在现有 lockstep/independent 包边界上补齐契约测试，避免发布策略先行而契约缺失。
   - `canary -> rc -> ga` 发布流程必须可回滚，并回链到审计/回放证据。

## 3. Stage 7 风险分级输入基线

1. 阻断型（BLOCK）
   - `DA-065/DA-066` 任一不可检索，或 `artifact_id + artifact_path` 回链不一致。
   - 未建立跨包契约测试即推进发布通道（canary/rc/ga）自动化。
   - 受限网络/离线降级回归缺失即声明发布完成态。
2. 确认型（CONFIRM）
   - 输出契约字段新增但保持 JSON 机器字段兼容。
   - 隐私治理阈值调整（retention 天数/脱敏规则）但不改变生命周期状态机。
3. 自动型（AUTO_APPLY）
   - 产物依赖回填、索引补齐、台账字段同步修正。

## 4. project-006 启动前推荐命令

1. `pnpm run typecheck`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`
4. `node ./scripts/governance/reconcile-artifact-dependencies.js`
5. `node ./scripts/governance/check-task-ledger-sync.js`
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`
7. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
8. `pnpm run check`
