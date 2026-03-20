# Review: TK-013 Process DSL 与 Compiler IR v1 基线

- Status: resolved
- Date: 2026-03-20
- Reviewer: AI-Agent
- Task: `TK-013`
- Scope:
  - `packages/core-process/src/**`
  - `packages/core-process/README.md`
  - `packages/shared/src/errors/error-code.constant.ts`
  - `test/process-compiler.smoke.test.ts`
  - `tasks/TK-013-process-dsl-and-compiler-ir-v1-baseline.md`

## Findings

1. 未发现阻断性问题。

## Risks And Follow-Ups

1. 当前 IR 兼容策略按主版本阻断（`major=1`）；后续引入 `2.x` 时需同步提供迁移提示与 runtime 降级策略。
2. `compiled-ir` 快照目前由编译器直接写盘；在接入 `core-runtime` 时需补齐“失败重试 + 审计事件”联动。

## Verify Append

- Verify Date: 2026-03-20
- Verifier: AI-Agent
- Verify Command: `pnpm run test -- --maxWorkers=1 --maxConcurrency=1 && pnpm run build && pnpm run check`
- Verify Result: pass
- Conclusion: TK-013 的 Process DSL、Compiler IR v1 契约、版本兼容校验与快照落盘基线已形成，可供 TK-014/TK-015 直接消费。

## 复核结论（2026-03-20）

- Overall: 部分认可（可执行问题已修复，非问题项保留说明）

1. `2.1 tasks.csv TK-013 两条记录`：不认可（不作为缺陷）
   - 说明：当前仓库 `tasks.csv` 设计为“执行记录追加”模型，允许同一 `task_id` 存在 `planned -> completed` 历史轨迹。`CS-021` 的 canonical 对齐由 `check-task-ledger-sync` 以“最新同标题记录”为准，本次门禁已通过。
2. `2.2 vitest globals 超出 TK-013 范围`：部分认可
   - 说明：该点在最初提交窗口确属扩展变更，但后续已收到用户明确需求“希望 vitest 工具无需显式 import”，因此该变更已转为用户确认范围内需求，保留不回退。
3. `2.3 IR 快照字段名与技术方案 snake_case 偏差`：认可并已修复
   - 修复：`persistCompiledIrSnapshot` 序列化落盘改为 `snake_case` 契约（含根字段、node、edge、issue）。
4. `2.4 ProcessDslNode 必填声明与运行时缺失校验不一致`：认可并已修复
   - 修复：将 `ProcessDslNode` 字段改为可选，并新增 `nodeType` 显式校验逻辑（含 required/invalid 两类诊断码）。
5. `2.5 同步 I/O`：保留为后续优化
   - 说明：基线阶段可接受，后续在 TK-014 runtime 热路径接入时评估异步化。
6. `2.6 compiledAt 本地时钟`：保留为后续优化
   - 说明：当前阶段可接受，后续在多节点执行时引入统一时间源。

## 修复执行记录（2026-03-20）

1. 已完成：IR 快照 `snake_case` 契约落盘
   - 文件：
     - `packages/core-process/src/process-compiler.ts`
     - `packages/core-process/src/types/interfaces/process-compiled-ir-snapshot.interface.ts`
     - `packages/core-process/src/types/interfaces/process-ir-node-snapshot.interface.ts`
     - `packages/core-process/src/types/interfaces/process-ir-edge-snapshot.interface.ts`
     - `packages/core-process/src/types/interfaces/process-compiler-issue-snapshot.interface.ts`
     - `packages/core-process/src/types/interfaces/process-ir-node-limits-snapshot.interface.ts`
     - `packages/core-process/src/types/interfaces/index.ts`
     - `packages/core-process/src/types/index.ts`
     - `packages/core-process/src/index.ts`
     - `test/process-compiler.smoke.test.ts`
2. 已完成：`ProcessDslNode` 类型契约与运行时校验一致化
   - 文件：
     - `packages/core-process/src/types/interfaces/process-dsl-node.interface.ts`
     - `packages/core-process/src/constants/compiler-ir.constant.ts`
     - `packages/core-process/src/process-compiler.ts`
3. 已完成：文档补充快照字段命名决策
   - 文件：
     - `packages/core-process/README.md`

## 复核验证附录（2026-03-20）

- Verify Command:
  - `pnpm run typecheck`
  - `pnpm run test -- --maxWorkers=1 --maxConcurrency=1`
  - `pnpm run check`
- Verify Result: pass
