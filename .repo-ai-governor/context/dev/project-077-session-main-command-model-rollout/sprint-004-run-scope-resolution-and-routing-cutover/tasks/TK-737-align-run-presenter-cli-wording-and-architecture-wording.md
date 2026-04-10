# TK-737 align run presenter CLI wording and architecture wording

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P1
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-004-run-scope-resolution-and-routing-cutover`

## 1. 任务目标

让 `run` 的 presenter、CLI 描述与 architecture wording 全部对齐到 task-driven DAG / reusable governed execution flow 的正式定位。

## 2. Depends On

1. `TK-736`
2. `apps/cli/README.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`

## 3. 预期产物

1. aligned run presenter copy
2. updated CLI/readme wording
3. architecture wording sync

## 4. Required Inputs

1. `apps/cli/README.md`
2. `packages/shared/src/i18n/locales/en-us.ts`
3. `packages/shared/src/i18n/locales/zh-cn.ts`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
2. `TK-736`

## 6. 实施计划

1. 对齐 run 的 CLI/readme/help copy。
2. 如有必要同步 architecture wording，避免 public semantics 与 north-star 文档漂移。
3. 用 regression/tests 固化最终表述。

## 7. Development Verification

1. `pnpm run build`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：同步 `apps/cli/README.md`、`product-requirements(.md/.brief.md)`、overall/architecture triad 与 run-related i18n wording，避免 presenter copy 与 north-star 文档继续漂移。
3. 2026-04-10：完成 `node ./scripts/governance/check-docs-triad-sync.js`，修复 triad date metadata mismatch，并确认 module-impact sync 保持通过。
4. 2026-04-10：完成 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`，确认 run wording / routing / shell discoverability 变更没有引入回归。

## 10. 产出

1. 已完成：aligned run presenter copy
2. 已完成：updated CLI/readme/architecture wording
