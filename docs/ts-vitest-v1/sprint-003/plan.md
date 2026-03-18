# TS Vitest V1 Sprint 003 Plan

- Status: draft
- Date: 2026-03-17
- Project: `ts-vitest-v1`
- Sprint: `sprint-003`

## Goal

完成 TypeScript/Vitest/Biome 迁移后的工程硬化：收敛 JS 白名单边界，提升测试稳定性与覆盖率约束，并形成可持续执行的长期治理规范。

## In Scope

1. 收敛 TS-only 审计白名单与目录边界，明确新增 `.js` 的准入规则。
2. 将 Biome `format/lint` 更稳妥接入默认质量门禁链路。
3. 建立 Vitest 稳定性基线（并发策略、慢测分层、波动排查路径）。
4. 建立覆盖率基线与阈值策略，优先覆盖核心模块。
5. 完成发布与运行时 JS 残留白名单最终收口。
6. 产出迁移收官文档与长期开发约束说明。
7. 明确导入规范：相对导入保持显式扩展名，非相对导入禁止 `*.js/*.mjs/*.cjs` 结尾。
8. 明确有限集合业务值规范：默认集中到 `src/constants` 管理，一次性局部判断需注释说明。
9. 明确工具函数新增规范：新增前必须复用评估，新增函数需在 `execution_notes` 记录结论。
10. 明确类型语义与目录规范：对象结构契约使用 `interface`，`type` 与 `interface` 分目录治理并接入门禁。

## Out Of Scope

1. 新增与迁移治理无关的业务功能。
2. 大规模重写现有命令行为或用户协议。
3. 引入新的测试框架或格式化/静态检查工具。

## Acceptance

1. TS-only 白名单可审计、可解释、可追踪。
2. `check` 与 `release` 门禁覆盖 TS/Vitest/Biome 关键约束。
3. 测试稳定性与覆盖率基线形成并可重复执行。
4. JS 残留边界被限制在明确的必要目录与用途。
5. 迁移收官文档可指导后续迭代持续遵循 TS-first 规范。

## Verification Path

1. `npm run typecheck`
2. `npm run test`
3. `npm run test:coverage`
4. `npm run check`
5. `npm run release:ga-check`

## Tasks

1. `TK-3001` 收敛 TS-only 白名单并扩展关键目录审计边界
2. `TK-3002` 将 Biome format/lint 接入默认 gate 与 CI 质量门禁
3. `TK-3003` 建立 Vitest 稳定性基线与慢测分层策略
4. `TK-3004` 建立覆盖率基线并引入阈值门禁
5. `TK-3005` 收口发布与运行时 JS 白名单边界
6. `TK-3006` 完成迁移收官文档与长期约束落盘
7. `TK-3007` 收敛 literal-set whitelist 存量并分批迁移
8. `TK-3008` 收敛 type-governance whitelist 存量并分批迁移
9. `TK-3009` 收敛 utils-reuse whitelist 存量并清零 legacy util 豁免
