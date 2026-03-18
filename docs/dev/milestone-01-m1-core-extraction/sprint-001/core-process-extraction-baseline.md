# Core-Process 抽离基线（TK-102）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-001`
- Task: `TK-102`

## 1. 目标

在 monorepo 骨架已固定的前提下，定义 `core-process` 的抽离边界、目录结构与迁移步骤，确保流程编排核心能力可独立演进并可被 CLI 稳定消费。

## 2. 范围与非目标

1. 范围：
   - `packages/core-process` 的职责边界与最小目录结构。
   - 与 `core-policy`、`core-role-registry`、`adapter-sdk` 的依赖方向约束。
   - 抽离期桥接策略与回归口径。
2. 非目标：
   - 本任务不实现完整 Process Compiler（由后续编排阶段迭代）。
   - 本任务不替换所有旧路径调用点，只定义可渐进迁移的桥接方案。

## 3. 包职责边界

### 3.1 `core-process` 负责

1. Process DSL/IR 的结构模型与版本字段。
2. 流程图的基础校验（节点、依赖、阶段合法性）。
3. 编排执行计划的标准化输出接口（供 runtime/cli 调用）。

### 3.2 `core-process` 不负责

1. 策略判定与门禁规则（属于 `core-policy`）。
2. 角色定义与角色实例装载（属于 `core-role-registry`）。
3. 具体 AI 提供方适配实现（属于 adapters，依赖 `adapter-sdk`）。

## 4. 依赖方向约束（M1 阶段）

1. `core-process` 可依赖：
   - `shared-types`
   - `shared-utils`
   - `config`（如后续拆出配置包）
2. `core-process` 不可依赖：
   - `apps/cli`
   - `adapters/*`
   - 具体通知/存储 provider 实现
3. `core-process` 与 `core-policy`/`core-role-registry` 在 M1 阶段保持“接口协作、实现解耦”。

## 5. 目录与入口基线

```text
packages/core-process/
  src/
    process-model.ts
    process-validator.ts
    process-runtime.ts
    index.ts
  test/
    process-validator.test.ts
    process-runtime.test.ts
  README.md
```

说明：
1. 文件命名遵循 `code_standards.md` 的 `CS-014`。
2. 若引入更多细分模块，保持 `*-model.ts / *-runtime.ts` 角色后缀一致。

## 6. 抽离执行步骤（建议）

1. 建包：
   - 创建 `packages/core-process` 基础结构与包入口。
2. 搬迁：
   - 将现有流程定义/校验核心逻辑迁移到包内。
3. 桥接：
   - CLI 先通过兼容层调用新包，保留旧入口一段时间用于回归对比。
4. 收口：
   - 删除重复实现，统一走 `core-process` public API。

## 7. 回归与验收口径

1. `build`：
   - 根级 `npm run build` 可完成 `core-process` 与 `apps/cli` 构建。
2. `test`：
   - 至少覆盖流程结构校验和计划输出两类单测。
3. `bridge`：
   - `TK-106` 中验证 CLI 调用新包后行为不回退。
4. `m1-exit`：
   - `TK-116` 退出回归必须包含 `core-process` 抽离验证证据。

## 8. 后续任务输入映射

1. `TK-103`：对齐 `core-policy` 与 `core-process` 的接口边界。
2. `TK-104`：对齐角色解析输入（角色元数据进入流程模型）。
3. `TK-106`：消费本基线完成 CLI 桥接回归。
4. `TK-116`：将本基线纳入 M1 退出回归证据包。

## 9. 验收标准

1. `core-process` 抽离范围和非目标明确，避免与策略/角色/适配层职责混淆。
2. 目录结构、命名规则、入口约束可直接用于后续实现任务。
3. 产物已登记依赖注册表并在至少两个后续任务建立回链。
