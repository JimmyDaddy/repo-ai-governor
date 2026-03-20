# TK-012 sprint-002 出口验收与回滚基线

- Status: completed
- Date: 2026-03-20
- Owner: AI-Agent
- Priority: P0
- Project: `project-001-foundation`
- Sprint: `sprint-002-workspace-and-upgrade`

## 1. 任务目标

完成 sprint-002 统一验收并固化升级冲突处置与回滚基线。

## 2. Depends On

1. `TK-009`
2. `TK-010`
3. `TK-011`
4. `DA-014`
5. `DA-003`
6. `DA-009`
7. `DA-010`
8. `DA-011`
9. `DA-012`
10. `DA-013`
11. `DA-015`
12. `DA-016`
13. `DA-017`

## 3. 预期产物

1. `DA-018` sprint-002 验收 baseline 文档。
2. `DA-019` 进入 Stage 2 的输入就绪清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-009-workspace-resolver-dual-mode-baseline.md` (`DA-014`)
2. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-010-workspace-migration-chain-baseline.md` (`DA-015`)
3. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-011-upgrade-schema-diff-baseline.md` (`DA-016`)
4. `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-011-upgrade-human-confirmation-policy-baseline.md` (`DA-017`)
5. `.repo-ai-governor/context/dev/project-001-foundation/foundation-delivery-baseline-and-constraints.md` (`DA-003`)
6. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-006-command-smoke-checklist.md` (`DA-009`)
7. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-warning-gate-baseline.md` (`DA-010`)
8. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-007-dependency-boundary-whitelist-and-regression-policy.md` (`DA-011`)
9. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-001-exit-acceptance-baseline.md` (`DA-012`)
10. `.repo-ai-governor/context/dev/project-001-foundation/sprint-001-foundation-bootstrap/tasks/TK-008-sprint-002-input-constraints-checklist.md` (`DA-013`)

## 5. 实施摘要

1. 完成 sprint-002 出口验收矩阵：
   - 验证 workspace 双模式解析与 CLI 接线路径（`TK-009`）可稳定复用。
   - 验证 `copy -> verify -> switch -> rollback` 迁移链路与失败恢复语义（`TK-010`）。
   - 验证 `schema diff -> 迁移建议 -> 人工确认` 升级契约及 v1.1 校验约束（`TK-011`）。
2. 固化升级冲突处置与回滚基线：
   - 将不支持升级路径（如 `1.1 -> 1.0`）归类为阻断型冲突，要求人工介入。
   - 将 `schemaVersion` 变更归类为确认型冲突，要求显式确认后写回。
   - 将 `workspace.migrationPolicy` 自动补齐归类为低风险自动建议，可在确认后统一落盘。
3. 落地 Stage 2 输入就绪清单：
   - 新增 `TK-012-stage-2-input-readiness-checklist.md`，明确 Stage 2 开始前的输入、门禁、回滚与审计要求。
4. 同步依赖产物生命周期：
   - 运行 `reconcile-artifact-dependencies` 清理对已完成任务的陈旧依赖引用。
   - 验证主/归档注册表满足生命周期约束，为 Stage 2 缩短默认上下文长度。

## 6. 产出

1. `DA-018` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-sprint-002-exit-acceptance-and-rollback-baseline.md`
2. `DA-019` `.repo-ai-governor/context/dev/project-001-foundation/sprint-002-workspace-and-upgrade/tasks/TK-012-stage-2-input-readiness-checklist.md`
3. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
5. `.repo-ai-governor/context/dev/index.md`

## 7. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js --dry-run`
2. `pnpm run artifacts:compact -- --dry-run`
3. `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
4. `pnpm run build`
5. `pnpm run check`
