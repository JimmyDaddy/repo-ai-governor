# TS Vitest V1 Sprint 002 Plan

- Status: done
- Date: 2026-03-17
- Project: `ts-vitest-v1`
- Sprint: `sprint-002`

## Goal

在已完成基线与试点迁移的基础上，推进剩余源码与测试的 TypeScript 化，并将 TS-only 规则纳入可执行门禁，形成可长期维护的迁移收口版本。

## In Scope

1. 清理试点模块的临时类型豁免（如 `@ts-nocheck`）。
2. 迁移 `workflow/slots/standards/config` 相关源码到 TypeScript。
3. 迁移 `adapters/skills` 相关源码与示例脚本到 TypeScript。
4. 迁移 `cli/commands` 主链路到 TypeScript。
5. 分批迁移测试文件到 `.test.ts` 并保持 Vitest 通过。
6. 增加 TS-only 约束门禁与 JS 残留白名单审计。

## Out Of Scope

1. 新增与迁移目标无关的功能特性。
2. 一次性重写全部测试断言风格。
3. 新增新的发布渠道或变更包管理策略。

## Acceptance

1. `src/` 中核心模块默认以 `.ts` 维护，JS 残留有白名单和理由。
2. `test/` 关键路径完成 `.test.ts` 迁移并通过 Vitest 回归。
3. `npm run typecheck`、`npm run test`、`npm run check` 稳定通过。
4. `npm run release:ga-check` 在迁移后持续通过。
5. 任务与 CR 台账完整可追踪。

## Verification Path

1. `npm run typecheck`
2. `npm run test`
3. `npm run check`
4. `npm run release:ga-check`

## Tasks

1. `TK-2001` 清理试点模块临时类型豁免并收敛强类型
2. `TK-2002` 迁移 `workflow/slots/standards/config` 到 TypeScript
3. `TK-2003` 迁移 `adapters/skills` 与 examples 脚本到 TypeScript
4. `TK-2004` 迁移 `cli/runtime/commands` 到 TypeScript
5. `TK-2005` 迁移测试层到 `.test.ts` 并保持 Vitest 稳定
6. `TK-2006` 增加 TS-only 审计门禁并收口发布约束
