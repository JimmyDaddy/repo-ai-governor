# Monorepo Workspace 骨架与构建入口基线（TK-101）

- Status: active
- Date: 2026-03-19
- Milestone: `M1`
- Sprint: `sprint-001`
- Task: `TK-101`

## 1. 目标

在不破坏现有 CLI 可运行性的前提下，先固化 monorepo 的目录骨架、包边界和构建入口规范，作为 `TK-102~TK-106` 的统一输入。

## 2. 适用范围与非目标

1. 适用范围：
   - `apps/**` 与 `packages/**` 的目录和命名基线。
   - M1 阶段核心包抽离的构建入口与依赖方向约束。
2. 非目标：
   - 本任务不直接完成 `core-process/core-policy/core-role-registry/adapter-sdk` 的代码迁移。
   - 本任务不启用新的发布流水线，只定义入口与验收口径。

## 3. Workspace 骨架基线

### 3.1 目录结构（M1 基线）

```text
apps/
  cli/
    src/
    test/
    README.md
packages/
  core-process/
    src/
    test/
    README.md
  core-policy/
    src/
    test/
    README.md
  core-role-registry/
    src/
    test/
    README.md
  adapter-sdk/
    src/
    test/
    README.md
  shared-types/
    src/
    test/
    README.md
  shared-utils/
    src/
    test/
    README.md
```

### 3.2 命名与文件规则

1. 目录必须使用小写 kebab-case（对齐 `CS-014`）。
2. 包内源文件默认 kebab-case；入口允许 `index.ts`。
3. 测试命名固定：
   - 单测：`*.test.ts`
   - 契约：`*.contract.test.ts`
   - 集成：`*.integration.test.ts`
   - E2E：`*.e2e.test.ts`

## 4. 构建入口基线

### 4.1 根级命令入口（建议）

1. `npm run build`：串联 workspace 核心包构建 + `apps/cli` 构建。
2. `npm run test`：按包执行单测与关键契约测试。
3. `npm run check:code-standards`：保持当前治理命令集合不退化。
4. `npm run check`：作为交付门禁聚合入口。

### 4.2 包级入口（建议）

1. 每个核心包至少提供：
   - `build`
   - `test`
   - `typecheck`
2. `adapter-sdk` 发生主版本变化时，必须触发 adapter 契约回归（后续由 `TK-105/TK-405/TK-501` 接入）。

## 5. 依赖方向基线（M1）

1. `apps/cli` 仅依赖核心包 public API，不反向被核心包依赖。
2. `core-process/core-policy/core-role-registry` 不依赖 `apps/**`。
3. `adapter-sdk` 为适配器契约层，不依赖具体 provider 实现。
4. 违反方向的依赖在 `TK-115` 以 warning 纳入自动检查，`TK-503` 切换为 blocking。

## 6. 对后续任务的输入映射

1. `TK-102`：按本骨架抽离 `core-process`。
2. `TK-103`：按本骨架抽离 `core-policy`。
3. `TK-104`：按本骨架抽离 `core-role-registry`。
4. `TK-105`：按本基线收敛 `adapter-sdk` 包入口与契约边界。
5. `TK-106`：按本基线完成 CLI 对新核心包的桥接回归。

## 7. 验收标准

1. 基线文档可直接指导 `TK-102~TK-106` 任务落地，不需要重复定义目录与入口规则。
2. 规则口径与 `code_standards.md`、架构文档 Step 2 保持一致。
3. 产物已登记到依赖产物注册表并在下游任务卡建立回链。
