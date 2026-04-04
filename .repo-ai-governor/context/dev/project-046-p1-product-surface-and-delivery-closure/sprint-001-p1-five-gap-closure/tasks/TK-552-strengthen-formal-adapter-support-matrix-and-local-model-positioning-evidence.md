# TK-552 strengthen formal adapter support matrix and local-model positioning evidence

- Status: completed
- Date: 2026-04-05
- Owner: AI-Agent
- Priority: P1
- Project: `project-046-p1-product-surface-and-delivery-closure`
- Sprint: `sprint-001-p1-five-gap-closure`

## 1. 任务目标

补强 adapter 正式支持矩阵，明确 `codex / github-copilot / claude-code / local-model` 的正式支持口径、限制说明与证据来源，避免继续维持模糊的 conditional 表述。

## 2. Depends On

1. `docs/support-matrix.md`
2. `docs/support-matrix.zh-CN.md`
3. `packages/adapters/**`

## 3. 预期产物

1. refreshed support matrix docs
2. adapter README truth alignment
3. local-model positioning statement

## 4. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 5. 执行记录

1. 2026-04-05：任务创建，状态初始化为 `planned`；承接 adapter 正式支持矩阵与 local-model 产品定位收口。
2. 2026-04-05：完成 `docs/support-matrix*.md`、`packages/adapters/{github-copilot,claude-code,local-model}/README.md` 与 `apps/desktop/README.md` 的正式口径收口。
3. 2026-04-05：验证通过 `pnpm vitest run packages/adapters/github-copilot/test/github-copilot-agent-adapter.smoke.test.ts packages/adapters/claude-code/test/claude-code-agent-adapter.smoke.test.ts packages/adapters/local-model/test/local-model-agent-adapter.smoke.test.ts test/first-batch-adapters-route.integration.test.ts --maxWorkers=1 --maxConcurrency=1`。
