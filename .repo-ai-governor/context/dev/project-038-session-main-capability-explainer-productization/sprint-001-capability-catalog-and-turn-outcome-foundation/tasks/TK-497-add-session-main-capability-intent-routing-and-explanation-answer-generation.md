# TK-497 add session.main capability intent routing and explanation answer generation

- Status: completed
- Date: 2026-04-03
- Owner: AI-Agent
- Priority: P0
- Project: `project-038-session-main-capability-explainer-productization`
- Sprint: `sprint-001-capability-catalog-and-turn-outcome-foundation`

## 1. 任务目标

为 `session.main` 增加 capability intent classification 与 structured explanation answer generation，让 overview/detail/examples/comparison 问句成为正式 answer route，而不是继续被 skill intent 误吞。

## 2. Depends On

1. `TK-495`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
3. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`

## 3. 预期产物

1. capability intent classifier / explainer route
2. overview/detail/examples/comparison answer generation baseline
3. 与现有 greeting/social chat、role collaboration、skill handoff taxonomy 的优先级对齐

## 4. 实施计划

1. 在既有 supervisor taxonomy 中插入 capability explanation 分支，而不是替换原有 direct answer / skill / social chat 语义。
2. 让 detail/explanation 问句优先走 explainer route，再决定是否桥接到 governed execution。
3. 输出结构化 `SessionMainCapabilityAnswer`，为 shared session payload 投影准备稳定字段。

## 5. 验证

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `pnpm exec vitest run packages/core-orchestration-service/test --maxWorkers=1 --maxConcurrency=1`
3. `pnpm run check`

## 6. 执行记录

1. 2026-04-02：任务创建，状态初始化为 `planned`；等待 `TK-495` 完成后执行。
2. 2026-04-03：状态切换为 `active`；开始实现 capability explainer classifier、dispatcher precedence 与 `SessionMainCapabilityAnswer` baseline。
3. 2026-04-03：完成 overview/detail/examples/comparison explainer answer、dispatcher answer route 优先级与 shared turn outcome structured answer baseline。
4. 2026-04-03：验证通过 `vitest(core-orchestration-service/test)`、`pnpm run build` 与 `pnpm run check`；任务收口为 `completed`。
