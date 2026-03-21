# TK-039 project-004 出口验收与 project-005 输入约束

- Status: planned
- Date: 2026-03-21
- Owner: TBD
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
5. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`、`CS-023`、`CS-024`）

## 5. 实施计划

1. 汇总 Stage 5 能力验收证据，形成 project-004 出口验收基线。
2. 输出 project-005 启动前输入约束，包括审计回放、依赖产物运行时与 CLI 输出契约前置条件。
3. 对接 artifact registry，补齐 `DA-049` 与 `DA-050` 的登记与回链。
4. 回写 project 里程碑入口并完成台账同步。

## 6. 验证计划

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
