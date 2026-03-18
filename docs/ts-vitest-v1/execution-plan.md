# TS Vitest V1 Execution Plan

- Status: done
- Date: 2026-03-17
- Basis:
  - [../../README.md](../../README.md)
  - [../../package.json](../../package.json)
  - [./sprint-001/typescript-vitest-refactor-solution.md](./sprint-001/typescript-vitest-refactor-solution.md)

## Goal

在不破坏现有 CLI 行为与发布链路的前提下，完成从 JS 到 TS 的工程迁移，将单测框架从 `node:test` 迁移为 `vitest`，并统一使用 Biome 作为 formatter + linter。

## Current Baseline

1. 源码与测试文件主要为 `.js`。
2. 单测命令使用 `node --test`。
3. 发布产物通过 Node ESM 直接执行源码路径。
4. 仓库已接入 Biome 基线，但全量历史文件尚未完成风格与规则收敛。

## Technical Strategy

1. 采用“分层迁移 + 双轨验证”策略：
   - 先建立 TS、Vitest、Biome 基线并保持行为一致。
   - 再按模块批次迁移源码与测试。
   - 最后收口 JS 残留与发布链路。
2. TypeScript 目标：
   - 源码统一迁移到 `.ts`（非必要不保留 `.js` 源文件）。
   - 开启严格类型检查（至少 `strict=true`，按批次处理遗留类型风险）。
   - 输出 `dist/` 供 CLI 运行与发布。
3. Vitest 目标：
   - 新增 `vitest` 与覆盖率配置（`@vitest/coverage-v8`）。
   - 全量迁移 `test/**/*.test.js` 到 Vitest 语法。
   - 将 `npm test` 切换为 `vitest run`。
4. Biome 目标：
   - 参考 `camera_point` 仓库配置，统一 formatter + linter 能力。
   - 提供 `npm run format`、`npm run format:check`、`npm run lint` 标准命令。
   - 在迭代后期将 `lint/format:check` 纳入 CI/Gate。
5. JS 保留边界（默认允许）：
   - `bin/repo-ai-governor.js`（shebang 入口包装层，可保持 JS）。
   - JSON/YAML/Schema/Workflow 等非 JS 源文件。
   - TypeScript 编译输出的 `dist/**/*.js`。

## Engineering Constraints

1. 所有导入关系保持 ESM 语义一致，避免运行时 CJS 回退。
2. 每个迁移批次必须通过类型检查 + 单测 + 现有治理门禁。
3. 优先保持命令行入参与输出协议稳定，减少使用方感知变更。

## Iteration Plan

### Sprint 001: Baseline And Pilot Migration (done)

目标：

1. 建立 TS 构建链路与 Vitest 测试链路。
2. 建立 Biome formatter + linter 基线。
3. 完成核心基础模块与关键测试的试点迁移。
4. 产出统一迁移规范，确保后续批次可复制。

任务：

1. `TK-1001` 建立 TS 工程与构建基线。
2. `TK-1002` 接入 Vitest 并迁移测试运行基线。
3. `TK-1003` 迁移基础模块与对应单测（试点批次）。
4. `TK-1004` 对齐 CI/Gate 与发布入口的 TS/Vitest 约束。
5. `TK-1005` 接入 Biome formatter 与格式化命令基线。
6. `TK-1006` 参考 `camera_point` 启用 Biome linter 规则与 lint 命令。
7. `TK-1007` 清理试点双轨 JS 残留并收敛 TS-only 入口。

### Sprint 002: Full Source Migration (done)

目标：

1. 迁移剩余命令与业务模块到 TypeScript。
2. 清理迁移期间的临时兼容层。
3. 完成主要路径的类型完善与错误处理统一。
4. 将 Biome 规则稳定纳入日常开发流程。

任务：

1. `TK-2001` 清理试点模块临时类型豁免并收敛强类型。
2. `TK-2002` 迁移 `workflow/slots/standards/config` 到 TypeScript。
3. `TK-2003` 迁移 `adapters/skills` 与 examples 脚本到 TypeScript。
4. `TK-2004` 迁移 `cli/runtime/commands` 到 TypeScript。
5. `TK-2005` 迁移测试层到 `.test.ts` 并保持 Vitest 稳定。
6. `TK-2006` 增加 TS-only 审计门禁并收口发布约束。

### Sprint 003: Hardening And Closure (done)

目标：

1. 完成 JS 残留审计，仅保留必要 JS 入口包装层。
2. 提升测试覆盖与执行稳定性，明确回归基线。
3. 收口迁移文档并形成长期约束（新增代码默认 TS + Vitest + Biome）。

任务：

1. `TK-3001` 收敛 TS-only 白名单并扩展关键目录审计边界。
2. `TK-3002` 将 Biome format/lint 接入默认 gate 与 CI 质量门禁。
3. `TK-3003` 建立 Vitest 稳定性基线与慢测分层策略。
4. `TK-3004` 建立覆盖率基线并引入阈值门禁。
5. `TK-3005` 收口发布与运行时 JS 白名单边界。
6. `TK-3006` 完成迁移收官文档与长期约束落盘。
7. `TK-3007` 收敛 literal-set whitelist 存量并分批迁移。
8. `TK-3008` 收敛 type-governance whitelist 存量并分批迁移。
9. `TK-3009` 收敛 utils-reuse whitelist 存量并清零 legacy util 豁免。
10. `TK-3010` 收敛 command/runtime 显式 `any` 存量并分批类型化。

## Exit Criteria

1. `src/` 默认源文件为 TypeScript，新增功能不再以 JS 实现。
2. `npm test` 使用 Vitest，并可稳定通过现有测试集。
3. 仓库提供 Biome 的 `format` 与 `lint` 命令并可在本地执行。
4. 发布后的 CLI 行为与迁移前一致（关键命令回归通过）。
5. 保留 JS 文件有明确白名单与理由，且数量最小化。
