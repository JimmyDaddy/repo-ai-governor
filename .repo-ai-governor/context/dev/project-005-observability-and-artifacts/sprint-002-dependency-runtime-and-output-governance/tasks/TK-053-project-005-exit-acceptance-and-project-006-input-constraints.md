# TK-053 project-005 出口验收与 project-006 输入约束

- Status: planned
- Date: 2026-03-21
- Owner: TBD
- Priority: P0
- Project: `project-005-observability-and-artifacts`
- Sprint: `sprint-002-dependency-runtime-and-output-governance`

## 1. 任务目标

形成 project-005 统一验收基线并沉淀 project-006 输入约束清单。

## 2. Depends On

1. `TK-050`
2. `TK-051`
3. `TK-052`
4. `DA-062`
5. `DA-063`
6. `DA-064`

## 3. 预期产物

1. `DA-065` project-005 exit acceptance baseline 文档。
2. `DA-066` project-006 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-050-cli-output-contract-and-non-tty-fallback-baseline.md` (`DA-062`)
2. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-051-i18n-parity-fallback-gate-and-output-locale-replay-baseline.md` (`DA-063`)
3. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/sprint-002-dependency-runtime-and-output-governance/tasks/TK-052-audit-privacy-governance-retention-masking-export-delete-baseline.md` (`DA-064`)
4. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/plan.md`
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`、`CS-023`、`CS-024`）

## 5. 实施计划

1. 汇总 Stage 6 能力验收证据并形成 project-005 出口结论。
2. 输出 project-006 启动前输入约束，覆盖契约测试、稳定性与发布治理前置条件。
3. 对接 artifact registry，补齐 `DA-065` 与 `DA-066` 的登记与回链。
4. 回写 project 里程碑入口并完成台账同步。

## 6. 验证计划

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
