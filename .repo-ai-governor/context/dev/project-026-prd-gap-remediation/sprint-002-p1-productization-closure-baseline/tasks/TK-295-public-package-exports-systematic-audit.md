# TK-295 6 个 public 包 package.json exports 系统性核查

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-002-p1-productization-closure-baseline`

## 1. 任务目标

逐包核查 6 个 public 包的 `package.json -> exports` 声明，确认公开 API 入口完整、稳定且与实际发布面一致。

## 2. Depends On

1. `TK-292`
2. 6 个 public 包 `package.json`

## 3. 预期产物

1. exports 覆盖面核查清单
2. 缺失或漂移入口修复
3. 对应验证记录

## 4. 实施计划

1. 确认 6 个 public 包清单与公开入口。
2. 对比源代码导出面与 `exports` 配置。
3. 补齐缺口并运行定向验证。

## 5. 验证命令

1. `pnpm vitest run --config vitest.integration.config.ts test/public-package-exports.integration.test.ts`
2. `pnpm run typecheck`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始按 GAP-06 定义审计 `adapter-sdk / memory-store-adapter / notification-dispatcher / orchestration-service-client / reporting / shared` 六个 public 包。
3. 2026-03-28：已完成六个 public 包的 `exports` / `src/index.ts` / root import 边界审计，并新增集成测试阻断深层路径隐式导入回退。
