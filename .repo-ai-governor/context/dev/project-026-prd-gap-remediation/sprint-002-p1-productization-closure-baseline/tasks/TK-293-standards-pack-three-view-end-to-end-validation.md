# TK-293 Standards Pack 三视图端到端链路验证

- Status: completed
- Date: 2026-03-28
- Owner: AI-Agent
- Priority: P1
- Project: `project-026-prd-gap-remediation`
- Sprint: `sprint-002-p1-productization-closure-baseline`

## 1. 任务目标

验证 `StandardsPackRegistry -> RuleRenderer -> AgentsProjector -> AGENTS.md` 三视图投影链路闭环，并明确当前仓库根级 `AGENTS.md` 的维护方式。

## 2. Depends On

1. `TK-292`
2. `packages/standards/`

## 3. 预期产物

1. 覆盖 pack → renderer → projector → `AGENTS.md` 落盘链路的集成测试
2. 对当前仓库根级 `AGENTS.md` 渲染来源的明确说明
3. 通过的定向验证命令记录

## 4. 实施计划

1. 核对现有 `packages/standards/test/standards-projection-parity.integration.test.ts` 的覆盖边界。
2. 补齐 `projectedContent` 写入 `AGENTS.md` 文件的端到端断言。
3. 在 `packages/standards/README.md` 说明当前根级 `AGENTS.md` 是否由 projector 自动产出。
4. 运行定向测试与类型检查。

## 5. 验证命令

1. `pnpm vitest run --config vitest.packages.config.ts packages/standards/test/standards-projection-parity.integration.test.ts`
2. `pnpm run typecheck`

## 6. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-28：状态切换为 `in_progress`，开始核对 `StandardsPackRegistry -> RuleRenderer -> AgentsProjector -> AGENTS.md` 投影链路缺口与当前根级 `AGENTS.md` 维护方式。
3. 2026-03-28：已完成端到端投影集成测试补强（含 `AGENTS.md` 文件落盘断言），并在 `packages/standards/README.md` 明确当前仓库根级 `AGENTS.md` 为手工维护入口而非 projector 自动渲染产物。
