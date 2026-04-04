# TK-551 close desktop artifact pane query contract and typed renderer consumption

- Status: completed
- Date: 2026-04-05
- Owner: AI-Agent
- Priority: P1
- Project: `project-046-p1-product-surface-and-delivery-closure`
- Sprint: `sprint-001-p1-five-gap-closure`

## 1. 任务目标

补齐 desktop `artifact / review / transcript` query contract，使 `apps/desktop` 的 renderer 与 runtime 通过 service-owned typed seam 消费真实查询结果，并继续禁止 filesystem bypass。

## 2. Depends On

1. `apps/desktop/**`
2. `packages/orchestration-service-client/**`
3. `packages/core-orchestration-service/**`

## 3. 预期产物

1. orchestration service client query DTO / request / response contract
2. desktop runtime/service-owner method surface
3. desktop governance console artifact pane typed view-model

## 4. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 5. 执行记录

1. 2026-04-05：任务创建，状态初始化为 `planned`；承接 desktop artifact pane query gate 的正式收口。
2. 2026-04-05：完成 `packages/orchestration-service-client`、`packages/core-orchestration-service`、`apps/desktop` 与 `scripts/examples/check-desktop-entry-smoke.js` 的 `queryArtifactPane` / artifact-pane ready-state 收口。
3. 2026-04-05：验证通过 `pnpm run build`、`pnpm vitest run apps/desktop/test/desktop-governance-console-view-model-builder.test.ts apps/desktop/test/desktop-shell-bootstrap.test.ts apps/desktop/test/desktop-session-bridge.test.ts test/desktop-entry-smoke.integration.test.ts --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run check:desktop-entry-smoke`。
