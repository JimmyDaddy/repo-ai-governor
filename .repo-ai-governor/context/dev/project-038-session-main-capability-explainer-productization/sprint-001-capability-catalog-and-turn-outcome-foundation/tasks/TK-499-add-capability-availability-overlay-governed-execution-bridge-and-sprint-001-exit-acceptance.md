# TK-499 add capability availability overlay governed execution bridge and sprint-001 exit acceptance

- Status: completed
- Date: 2026-04-03
- Owner: AI-Agent
- Priority: P1
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-001-capability-catalog-and-turn-outcome-foundation`

## 1. 任务目标

补齐 capability availability overlay 与 explainer-to-skill governed bridge，并完成 `sprint-001` 的 exit acceptance，冻结后续实现是否继续扩展 comparison/examples、多语言与动态刷新。

## 2. Depends On

1. `TK-496`
2. `TK-497`
3. `TK-498`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`

## 3. 预期产物

1. `SessionMainCapabilityAvailabilityResolver` baseline
2. explanation -> `direct_execute` / `preview_confirm` governed bridge baseline
3. `sprint-001` exit acceptance 结论与后续输入约束

## 4. 实施计划

1. 让 explainer 同时消费静态 catalog 与动态 availability overlay，明确“现在能做什么 / 需要先 connect 什么 / 为什么要 preview”。
2. 让 split-intent 输入可以在 explanation 之后平滑桥接到既有 governed skill seam。
3. 在 sprint closeout 中冻结 comparison/examples richer follow-up、动态刷新与多语言扩展是否进入下一轮实现。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-orchestration-service/test apps/cli/test --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
6. `pnpm run check`

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；等待 `TK-496`、`TK-497` 与 `TK-498` 完成后执行。
2. 2026-04-03：状态切换为 `active`；开始实现 capability availability overlay baseline、同轮 explain->execute bridge，以及 `sprint-001` exit acceptance 收口。
3. 2026-04-03：完成 availability overlay、同轮 governed bridge、bridged transcript recap 与 `sprint-001` exit acceptance summary；验证通过 targeted vitest、`pnpm run build`、`pnpm run check` 与治理门禁，任务收口为 `completed`。
4. 2026-04-03：CR 复核认可 local-only `plan` / `review_verify` 被错误纳入 surface gating 的问题；已将二者从 surface-dependent gating 中移出并新增未接入 workspace 的回归测试，验证通过 targeted vitest 与 `pnpm run build`，CR 已收口为 `resolved_code_review_working-tree-20260403-2349.md`。
