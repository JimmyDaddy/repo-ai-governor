# TypeScript + Vitest + Biome Refactor Solution

- Status: proposed
- Date: 2026-03-17
- Project: `ts-vitest-v1`
- Sprint: `sprint-001`

## 1. 目标与原则

1. 源码优先 TypeScript：新代码默认 `.ts`，非必要不新增 `.js`。
2. 测试统一 Vitest：单测入口与断言风格统一，替代 `node:test`。
3. 代码规范统一 Biome：同时承担 formatter + linter 职责。
4. 行为稳定优先：迁移期间不改变 CLI 对外契约。
5. 小步快跑：按目录/模块批次迁移，每批次可独立回归。

## 2. 目录与产物策略

1. 源码：`src/**/*.ts`
2. 测试：`test/**/*.test.ts`
3. 构建产物：`dist/**`
4. 必要 JS 保留：`bin/repo-ai-governor.js`（shebang + 启动包装）

## 3. 构建方案

1. 新增 TypeScript 工程配置：
   - `tsconfig.json`（公共编译参数）
   - `tsconfig.build.json`（构建输出到 `dist`）
   - `tsconfig.test.json`（测试类型环境）
2. 推荐关键编译参数：
   - `target=ES2022`
   - `module=NodeNext`
   - `moduleResolution=NodeNext`
   - `strict=true`
   - `noEmit=true`（用于 typecheck）
   - 构建阶段单独 `emit` 到 `dist`
3. Script 规划：
   - `typecheck`: `tsc -p tsconfig.json --noEmit`
   - `build`: `tsc -p tsconfig.build.json`
   - `test`: `vitest run`
   - `test:watch`: `vitest`

## 4. 测试迁移方案（Vitest）

1. 依赖：`vitest`、`@vitest/coverage-v8`、`typescript`、`@types/node`。
2. 配置：
   - `vitest.config.ts`：`environment: node`
   - `include: ["test/**/*.test.ts"]`
   - `coverage.provider: "v8"`
3. 迁移规则：
   - `import test from "node:test"` -> `import { describe, it, test, expect } from "vitest"`
   - `node:assert/strict` 断言逐步迁移到 `expect`
   - 先迁移公共 helper，再迁移各模块测试用例。

## 5. 代码规范方案（Biome）

1. 参考基线：对齐 `/Users/jimmydaddy/study/camera_point/biome.json` 的核心配置模型。
2. 版本策略：`@biomejs/biome@^1.9.4`，保证与参考仓库规则兼容。
3. 能力范围：
   - formatter：统一缩进、引号、分号、逗号风格。
   - organizeImports：启用导入排序。
   - linter：启用 recommended + 增量强化规则。
4. 规则基线：
   - `complexity.noBannedTypes = error`
   - `style.useConst = error`
   - `suspicious.noExplicitAny = error`
   - `suspicious.noConsoleLog = warn`
5. 命令约定：
   - `npm run format`: `biome format --write .`
   - `npm run format:check`: `biome format .`
   - `npm run lint`: `biome check .`
6. 忽略策略：排除 `node_modules/dist/build/coverage` 与报告产物路径，避免噪音。

## 6. 分批迁移路径

1. Batch A（低风险基线）：`utils`、`config/schema`、`reporting`。
2. Batch B（核心引擎）：`workflow`、`slots`、`standards`、`skills`。
3. Batch C（命令层）：`commands`、`cli/runtime`、`cli/ui`、`adapters`。
4. Batch D（收口）：`bin` 包装层、脚本/CI、文档和模板同步。

## 7. 风险与应对

1. ESM 导入后缀风险：
   - 规则：源码统一写 `.js` 导入后缀（NodeNext 下由 TS 输出匹配运行时）。
2. CLI 发布路径风险：
   - 规则：发布前通过 `npm pack` + 本地执行 smoke 校验 `bin` 指向与 `dist` 一致。
3. 测试语义差异风险：
   - 规则：关键命令先保留快照/行为断言，迁移后对比输出。
4. Lint 首次接入噪音风险：
   - 规则：先完成工具接入，再按模块分批治理，逐步收敛历史告警/错误。

## 8. Definition Of Done

1. 新增功能默认在 TS + Vitest + Biome 下开发。
2. 现有核心命令至少覆盖一轮端到端回归。
3. JS 残留清单可审计且有保留理由。
4. `format` / `format:check` / `lint` 可被本地与 CI 稳定调用。
