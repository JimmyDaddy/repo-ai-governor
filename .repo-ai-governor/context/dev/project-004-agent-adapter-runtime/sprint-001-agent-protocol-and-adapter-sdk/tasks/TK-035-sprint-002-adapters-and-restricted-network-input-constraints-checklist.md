# TK-035 sprint-002 adapters/restricted-network 输入约束清单

- Status: active
- Date: 2026-03-21
- Owner: AI-Agent
- Scope: `sprint-001 -> sprint-002` handoff

## 1. 目标

确保 `sprint-002-adapters-and-restricted-network` 启动前具备可消费输入、可阻断门禁与可回放约束，避免适配器实现、受限网络降级与 IDE 集成三条工作流出现语义漂移。

## 2. 输入就绪检查

1. Role Registry 与角色生命周期基线
   - `DA-041` 已提供默认角色与自定义角色生命周期契约，可作为 adapter 角色装配的事实源。
2. Agent 协议与 capability matrix 基线
   - `DA-042` 已提供 `probe/invokeStage/streamEvents/requestConfirmation/cancel` 统一协议与能力矩阵语义。
3. Adapter SDK 与 routeKey 主备路由基线
   - `DA-043` 已提供 route registry/runner、能力降级回退与标准化错误映射链路。
   - `resolved_code_review_working-tree-20260321-1634.md` 已收敛 capability requirement 坏输入场景的标准错误出口。
4. sprint-002 启动前输入映射
   - `TK-036` 必须显式消费 `DA-044` 与 `DA-045`。
   - `TK-037` 必须显式消费 `DA-045`，并在 restricted network 策略中复用 `DA-043` 的路由降级语义。
   - `TK-038` 必须显式消费 `DA-045`，保证 IDE 集成入口不绕开 sprint-001 的输入边界。

## 3. Stage 5 风险分级输入基线

1. 阻断型（BLOCK）
   - `DA-044/DA-045` 任一不可检索，或 `artifact_id + artifact_path` 回链不一致。
   - 适配器协议实现与 `DA-042` 契约不一致（缺失 `probe` 或 `invokeStage` 关键字段）。
   - restricted network 模式下无法维持本地门禁、流程编排或台账写入。
2. 确认型（CONFIRM）
   - capability matrix 参数阈值调整但不改变协议字段语义。
   - IDE 入口参数命名调整但输出契约保持 `pretty/plain/json` 一致。
3. 自动型（AUTO_APPLY）
   - 依赖回链字段补齐与排序。
   - 非语义文案与索引引用同步修正。

## 4. sprint-002 启动前推荐命令

1. `pnpm run typecheck`
2. `node ./scripts/governance/reconcile-artifact-dependencies.js`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-artifact-registry-lifecycle.js`
6. `pnpm run check`
