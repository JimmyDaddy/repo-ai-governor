# TK-1068 implement adopt backfill-receipt command and receipt reconstruction runtime

- Status: in_progress
- Date: 2026-05-15
- Owner: AI-Agent
- Priority: P0
- Project: `project-125-adopt-backfill-receipt-command-rollout`
- Sprint: `sprint-001-backfill-receipt-command-and-receipt-reconstruction`

## 1. 任务目标

实现 `adopt backfill-receipt` 命令，使手工初始化但缺失 adoption receipt 的仓库能够回填 canonical install receipt，并立即解除 `adopt verify` 的 receipt 前置阻塞。

## 2. Depends On

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `apps/cli/src/runtime/adoption-pack-runtime.ts`
3. `packages/standards/src/built-in-adoption-pack-catalog.ts`

## 3. 预期产物

1. `adopt backfill-receipt` CLI 子命令与帮助/i18n 接线
2. receipt 重建 runtime 与摘要输出
3. adopt 集成测试与 build 验证证据

## 4. Required Inputs

1. `apps/cli/src/commands/adopt-command.ts`
2. `apps/cli/src/runtime/adoption-pack-runtime.ts`
3. `apps/cli/src/runtime/adoption-pack-bootstrap-runtime.ts`
4. `packages/standards/src/types/interfaces/adoption-pack.interface.ts`
5. `packages/standards/src/built-in-adoption-pack-catalog.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `/Users/jimmydaddy/.codex/memories/MEMORY.md`

## 6. 实施计划

1. 扩展 adopt action、CLI 子命令、消息映射与 i18n 文案。
2. 基于 init-manifest 与 source catalog 实现 managed file 扫描、分类与 receipt 写入。
3. 为手工初始化仓库补齐 backfill 集成测试并执行 build/targeted verification。

## 7. Development Verification

1. `pnpm vitest run apps/cli/test/adopt-command.integration.test.ts`
2. `pnpm run build`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `pnpm run check`

## 9. 执行记录

1. 2026-05-15：任务创建，状态初始化为 `in_progress`。

## 10. 产出

1. 待执行：`adopt backfill-receipt` 命令实现与测试。
2. 待执行：同窗口验证证据与 receipt 回填摘要。
