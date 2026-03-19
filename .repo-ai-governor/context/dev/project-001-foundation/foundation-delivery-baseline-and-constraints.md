# project-001-foundation Delivery Baseline And Constraints

- Status: active
- Date: 2026-03-19
- Scope: `project-001-foundation`
- Type: baseline/constraints

## 1. Baseline Scope

1. 仅覆盖 Stage 0-1 能力，不前置实现 Stage 2+ 运行时能力。
2. 目标是“可安装、可初始化、可治理接线”，不是“全流程自动化完成态”。

## 2. Hard Constraints

1. 目录结构必须使用 `pnpm workspace` 的 `apps/ + packages/`。
2. 结构化配置是唯一事实源，`AGENTS.md` 仅为投影视图。
3. 开发语言基线为 TypeScript，测试框架基线为 Vitest，格式化与 lint 基线为 Biome。
4. i18n 基线至少支持 `zh-CN/en`，机器可读字段不得因 locale 变化漂移。
5. 依赖边界检查先 warning 后 blocking，切换 blocking 前必须有白名单与回归依据。

## 3. Definition Of Ready For Stage 2

1. `packages/config` 已具备 loader/schema/profile 最小契约。
2. `apps/cli` 命令骨架与基础 smoke 检查可运行。
3. `integrations/ci` 可执行统一门禁命令。
4. workspace 模式解析与升级流程骨架具备最小可用形态。

## 4. Consumption Guidance

1. 后续任务在引用 project-001 约束时，优先引用本文件。
2. 进入 Stage 2 任务前，必须核对本文件第 3 节条件。
