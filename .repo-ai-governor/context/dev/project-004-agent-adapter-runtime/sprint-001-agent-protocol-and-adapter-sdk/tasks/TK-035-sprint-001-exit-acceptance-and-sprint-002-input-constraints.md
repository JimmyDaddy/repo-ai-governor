# TK-035 sprint-001 出口验收与 sprint-002 输入约束

- Status: completed
- Date: 2026-03-21
- Owner: AI-Agent
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

## 6. sprint-001 出口验收基线（DA-044）

1. Role Registry 与角色生命周期契约
   - 验收结果：通过
   - 验证证据：`DA-041`、`verified_review_tk-032-role-registry-and-role-profile-lifecycle-baseline.md`
2. Agent 协议与 Capability Matrix 契约
   - 验收结果：通过
   - 验证证据：`DA-042`、`verified_review_tk-033-agent-protocol-and-capability-matrix-baseline.md`
3. Adapter SDK 与 routeKey 主备路由/降级回退
   - 验收结果：通过
   - 验证证据：`DA-043`、`verified_review_tk-034-adapter-sdk-and-routekey-fallback-baseline.md`、`resolved_code_review_working-tree-20260321-1634.md`
4. 台账一致性与产物生命周期治理
   - 验收结果：通过
   - 验证证据：`node ./scripts/governance/check-task-ledger-sync.js`、`node ./scripts/governance/check-sprint-plan-status-sync.js`、`node ./scripts/governance/check-artifact-registry-lifecycle.js`
5. 综合门禁
   - 验收结果：通过
   - 验证证据：`pnpm run check`

## 7. sprint-002 输入约束总览

1. 已输出 `DA-045` 作为 sprint-002 启动前统一输入约束清单。
2. `TK-036` 显式依赖 `TK-035/DA-044/DA-045`，作为多工具 adapters 首批落地的前置入口。
3. `TK-037` 显式依赖 `DA-045`，确保 restricted network 模式不绕开 sprint-001 验收结论。
4. 生命周期与依赖注入约束：
   - 仅消费 `active/frozen` 状态产物；
   - 任务完成后由 `reconcile-artifact-dependencies` 清理已关闭任务的 `dependent_tasks`，避免上下文膨胀。
5. 风险分级基线：
   - `BLOCK`：`DA-044/DA-045` 不可检索、协议契约与 adapter 行为不一致、受限网络降级缺失。
   - `CONFIRM`：适配器能力矩阵参数调整但不改变协议语义。
   - `AUTO_APPLY`：台账路径、回链字段、非语义文案同步修复。

## 8. 验证

1. `node ./scripts/governance/reconcile-artifact-dependencies.js`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
4. `node ./scripts/governance/check-artifact-registry-lifecycle.js`（通过）
5. `pnpm run check`（通过）

## 9. 执行记录

1. 2026-03-21：任务启动，状态切换为 `in_progress`，开始汇总 sprint-001 验收证据并生成 sprint-002 输入约束清单。
2. 2026-03-21：产出 `DA-045` 并完成 `DA-044/DA-045` 在 artifact registry 与索引台账的登记。
3. 2026-03-21：完成依赖回填与门禁复核，状态切换为 `completed`。

## 10. 产出

1. `DA-044` `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-035-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
2. `DA-045` `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/tasks/TK-035-sprint-002-adapters-and-restricted-network-input-constraints-checklist.md`
3. `.repo-ai-governor/context/artifact-registry/artifacts.csv`
4. `.repo-ai-governor/context/dev/dependency-artifact-registry.md`
5. `.repo-ai-governor/context/dev/index.md`
6. `.repo-ai-governor/context/dev/project-004-agent-adapter-runtime/sprint-001-agent-protocol-and-adapter-sdk/review/verified_review_tk-035-sprint-001-exit-acceptance-and-sprint-002-input-constraints.md`
