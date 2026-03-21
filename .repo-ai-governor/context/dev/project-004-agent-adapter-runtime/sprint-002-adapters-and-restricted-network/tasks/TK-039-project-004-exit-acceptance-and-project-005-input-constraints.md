# TK-039 project-004 出口验收与 project-005 输入约束

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-002-adapters-and-restricted-network`

## 1. 任务目标

形成 project-004 出口验收基线并沉淀 project-005 输入约束清单。

## 2. Depends On

1. `TK-036`
2. `TK-037`
3. `TK-038`
4. `DA-046`
5. `DA-047`
6. `DA-048`

## 3. 预期产物

1. `DA-049` project-004 exit acceptance baseline 文档。
2. `DA-050` project-005 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-036-first-batch-adapters-baseline.md` (`DA-046`)
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-037-restricted-network-mode-baseline.md` (`DA-047`)
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-038-ide-integration-skeleton-baseline.md` (`DA-048`)
4. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/plan.md`
5. `.repo-ai-governor/context/dev/project-005-observability-and-artifacts/plan.md`
6. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`、`CS-023`、`CS-024`）

## 5. 实施计划

1. 汇总 Stage 5 能力验收证据，形成 project-004 出口验收基线。
2. 输出 project-005 启动前输入约束，包括审计回放、依赖产物运行时与 CLI 输出契约前置条件。
3. 对接 artifact registry，补齐 `DA-049` 与 `DA-050` 的登记与回链。
4. 回写 project 里程碑入口并完成台账同步。

## 6. project-004 出口验收基线（DA-049）

1. 首批多工具适配器基线
   - 验收结果：通过
   - 验证证据：`DA-046`、`resolved_code_review_working-tree-20260321-1906.md`
2. Restricted Network Mode 降级执行基线
   - 验收结果：通过
   - 验证证据：`DA-047`、`resolved_code_review_working-tree-20260321-2009.md`
3. `integrations/ide` 骨架与命令包装契约
   - 验收结果：通过
   - 验证证据：`DA-048`、`resolved_code_review_working-tree-20260321-2009.md`
4. 台账一致性与产物生命周期治理
   - 验收结果：通过
   - 验证证据：`node ./scripts/governance/reconcile-artifact-dependencies.js`、`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. 项目完成态审计入口
   - 验收结果：通过
   - 验证证据：`.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/project-004-completion-audit-summary.md`

## 7. project-005 输入约束总览

1. 已输出 `DA-050` 作为 `project-005-observability-and-artifacts` 启动前统一输入约束清单。
2. 约束覆盖范围：
   - Stage 5 产物可消费性（`DA-046` ~ `DA-049`）；
   - 审计回放与依赖产物运行时的前置契约边界；
   - CLI `pretty/plain/json` 输出契约与治理门禁前置条件。
3. `project-005` 启动时应优先消费 `DA-049` 与 `DA-050`，避免在 Stage 6 重复定义 Stage 5 已完成的治理语义。

## 8. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `pnpm run check`（通过）

## 9. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
2. 2026-03-21：任务启动，状态切换为 `in_progress`，开始汇总 project-004 验收证据并生成 project-005 输入约束清单。
3. 2026-03-21：产出 `DA-050`，完成 `DA-049/DA-050` 在 artifact registry 与索引台账的登记与回链。
4. 2026-03-21：完成 project-004 完成态审计摘要、门禁复核与台账同步，状态切换为 `completed`。

## 10. 产出

1. `DA-049` `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-039-project-004-exit-acceptance-and-project-005-input-constraints.md`
2. `DA-050` `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/tasks/TK-039-project-005-input-constraints-checklist.md`
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/project-004-completion-audit-summary.md`
4. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
5. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
6. `.repo-ai-governor/context/dev/index.md`
7. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-002-adapters-and-restricted-network/review/verified_review_tk-039-project-004-exit-acceptance-and-project-005-input-constraints.md`
