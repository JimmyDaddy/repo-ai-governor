# TK-035 sprint-001 出口验收与 sprint-002 输入约束

- Status: planned
- Date: 2026-03-21
- Owner: TBD
- Priority: P0
- Project: `project-004-agent-adapter-runtime`
- Sprint: `sprint-001-agent-protocol-and-adapter-sdk`

## 1. 任务目标

形成 sprint-001 验收基线并沉淀 sprint-002 输入约束清单。

## 2. Depends On

1. `TK-032`
2. `TK-033`
3. `TK-034`
4. `DA-041`
5. `DA-042`
6. `DA-043`

## 3. 预期产物

1. `DA-044` sprint-001 exit acceptance baseline 文档。
2. `DA-045` sprint-002 输入约束清单。

## 4. Input References

1. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-032-role-registry-and-role-profile-lifecycle-baseline.md` (`DA-041`)
2. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-033-agent-protocol-and-capability-matrix-baseline.md` (`DA-042`)
3. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-034-adapter-sdk-and-routekey-fallback-baseline.md` (`DA-043`)
4. `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`（`CS-021`、`CS-023`）

## 5. 实施计划

1. 汇总 sprint-001 关键能力的契约完整性与验证证据。
2. 给出 sprint-002 的输入边界，包括首批 adapters、受限网络、IDE 接线的前置条件。
3. 对接 artifact registry，补齐 `DA-044` 与 `DA-045` 的登记与回链。
4. 产出可直接消费的任务启动命令与风险分级基线。

## 6. 验证计划

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. `pnpm run check`

## 7. 执行记录

1. 2026-03-21：任务创建，状态初始化为 `planned`。
