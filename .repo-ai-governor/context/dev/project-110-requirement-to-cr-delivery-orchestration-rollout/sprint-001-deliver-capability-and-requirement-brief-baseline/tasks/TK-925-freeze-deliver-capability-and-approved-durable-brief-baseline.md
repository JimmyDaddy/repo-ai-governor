# TK-925 freeze deliver capability and approved durable brief baseline

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P1
- Project: `project-110-requirement-to-cr-delivery-orchestration-rollout`
- Sprint: `sprint-001-deliver-capability-and-requirement-brief-baseline`

## 1. 任务目标

冻结 deliver AI fixed workflow、approved durable brief export 与 requirement review gate 的 Phase A baseline

## 2. Depends On

1. DA-915

## 3. 预期产物

1. runtime contract baseline artifact for TK-925
2. task card update for TK-925
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/tasks/DA-915-requirement-to-cr-delivery-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/requirement-to-cr-governed-delivery-orchestration.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. pnpm run build
2. pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-delivery-workflow-runtime.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts
3. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks" --task-id TK-925

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks" --task-id TK-925
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-001-deliver-capability-and-requirement-brief-baseline/tasks" --task-id TK-925
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js
5. node ./scripts/governance/check-technical-solution-delivery-registry.js

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-16：已激活 `project-110 / sprint-001` primary stream，任务状态切换为 `in_progress`，开始冻结 deliver capability、approved durable brief export boundary 与 requirement review gate baseline。
3. 2026-04-16：已完成 deliver capability catalog、chat-first explainer/help discoverability、shared-session delivery workflow gate runtime 与对应单测的 Phase A baseline 落地。
4. 2026-04-16：已完成 `pnpm run build`、定向 vitest、task-ledger/sprint-status/delivery-registry gates，当前进入 fresh reviewer CR round 准备窗口。
5. 2026-04-16：已修复 fresh reviewer 提出的 deliver conversational routing 缺口；新增 chat-first deliver intent matcher、dispatcher `deliveryWorkflow` state 初始化与 explain-plus-execute bridge 回归测试，当前等待下一轮 fresh reviewer clean recheck。
6. 2026-04-16：已完成 round-2 reviewer 提出的 matcher 误伤与 resume 文案漂移修复；当前 deliver intent 仅匹配 start-style phrasing，resume 回复会跟随既有 phase/pendingAction，同窗口 build、定向 vitest 与治理 gates 已重跑通过。
7. 2026-04-16：已完成 round-3 reviewer 提出的 approved durable brief receipt/backlink gate 与 child capability explainer 吞边界问题修复；当前等待新的 fresh reviewer clean round。
8. 2026-04-16：已完成 round-4 reviewer 提出的 deliver explain-plus-execute availability drift 修复；当前等待新的 fresh reviewer clean round。
9. 2026-04-16：已完成 round-5 reviewer 提出的 generic English `deliver` matcher 误伤修复；当前等待新的 fresh reviewer clean round。
10. 2026-04-16：已完成 round-6 reviewer 提出的 generic repo/repository/workflow deliver matcher 误伤修复；当前等待新的 fresh reviewer clean round。
11. 2026-04-16：已完成 round-7 reviewer 提出的 generic requirement delivery wording 误伤与 deliver locale cache drift 修复；同窗口 `pnpm run build`、扩展后的 deliver/CLI 定向 vitest 与治理 gates 已重跑，当前等待新的 fresh reviewer clean round。
12. 2026-04-16：已完成 round-8 reviewer 提出的 delivery workflow shared-session persistence/resume shell-level coverage 修复；同窗口 `pnpm run build`、扩展后的 deliver/shell/CLI 定向 vitest 与治理 gates 已重跑，当前等待新的 fresh reviewer clean round。
13. 2026-04-16：已完成 round-9 reviewer 提出的 Chinese deliver explainer over-capture 修复；同窗口 `pnpm run build`、扩展后的 deliver/shell/CLI 定向 vitest 与治理 gates 已重跑，当前等待新的 fresh reviewer clean round。
14. 2026-04-16：已完成 round-10 reviewer 提出的 deliver child workflow routing 与 `TURN_COMPLETED` delivery presenter metadata 修复；同窗口 `pnpm run build`、扩展后的 deliver/shell/CLI 定向 vitest 与治理 gates 已重跑通过，当前等待新的 fresh reviewer clean round。
15. 2026-04-16：已完成 round-11 reviewer 提出的 public CLI help alias-only deliver contract coverage 修复；同窗口 `pnpm run build`、扩展后的 deliver/shell/CLI help 定向 vitest 与治理 gates 已重跑通过，当前等待新的 fresh reviewer clean round。
16. 2026-04-16：已完成 round-12 reviewer 提出的 deliver-vs-run matcher 误伤修复；当前 deliver 英文 start-style 仅匹配 delivery-specific wording，generic start-style delivery asks 会继续 fall through，explicit reusable governed workflow ask 会稳定保留在 `/run`，同窗口 `pnpm run build` 与扩展后的 deliver shell/registry 定向 vitest 已重跑通过，当前等待新的 fresh reviewer clean round。
17. 2026-04-17：已完成 round-13 reviewer 提出的 preview-style delivery workflow 误启动与 generic English delivery prose explainer 误捕获修复；当前 preview-style asks 会稳定回到 `/workflow` preview route，generic English delivery prose 不再被 Deliver capability explainer 抢答，同窗口 `pnpm run build` 与扩展后的 deliver shell/registry/explainer 定向 vitest 已重跑通过，当前等待新的 fresh reviewer clean round。
18. 2026-04-17：已完成 round-14 reviewer 提出的 generic `delivery workflow` English phrasing 误捕获修复；当前 generic start/run `delivery workflow` phrasing 不会再启动 Deliver parent workflow，generic `delivery workflow` detail/examples 也不会再被 Deliver/Workflow capability surface 抢答，同窗口 `pnpm run build` 与扩展后的 deliver shell/registry/explainer 定向 vitest 已重跑通过，当前等待新的 fresh reviewer clean round。
19. 2026-04-17：已完成 round-15 reviewer 提出的 explain-style `deliver + governed path` English prompt 误启动修复；当前 governed-path explain/example prompts 已稳定回到 Deliver capability explainer，不再创建 `deliveryWorkflowState`，同窗口三组定向回归、`pnpm run build`、9-file deliver/CLI bundle 与 task-ledger/review-status/delivery-registry gates 已重跑通过，当前等待新的 fresh reviewer clean round。
20. 2026-04-17：已完成 round-16 reviewer 提出的 English `what does ... do` governed-path explain prompt 误启动修复；当前 English governed-path `what does ... do` prompts 已稳定回到 Deliver capability explainer，不再创建 `deliveryWorkflowState`，同窗口三组定向回归、`pnpm run build`、9-file deliver/CLI bundle 与 task-ledger/review-status/delivery-registry gates 已重跑通过，当前等待新的 fresh reviewer clean round。
21. 2026-04-17：已完成 round-17 reviewer 提出的 English governed-path help/detail paraphrase family 误启动修复；当前 `what can`、`when/why should I use`、`tell me what ... does`、`how should I use` 等 governed-path English prompts 已稳定回到 Deliver capability explainer，不再创建 `deliveryWorkflowState`，同窗口三组定向回归、`pnpm run build` 与 9-file deliver/CLI bundle 已重跑通过，当前等待新的 fresh reviewer clean round。
22. 2026-04-17：为避免 English fallback 持续被新 paraphrase 复用，已把 deliver fallback execution matcher 进一步收窄到“带明确交付对象的执行句式”；`Please deliver this requirement through the governed path.` 仍可稳定启动 Deliver workflow，而 explain/help-style governed-path prompts 不再依赖无限扩充 suppression pattern 才能避开执行路径，同窗口三组定向回归、`pnpm run build` 与 9-file deliver/CLI bundle 已重跑通过，当前等待新的 fresh reviewer clean round。
23. 2026-04-17：已完成 round-18 reviewer 提出的 help-style governed-path deliver guidance prompt 误启动修复；`how do I`、`show me how`、`what steps`、`walk me through` 等 English guidance prompts 已稳定回到 Deliver capability explainer example path，不再创建 `deliveryWorkflowState`，同窗口三组定向回归、`pnpm run build` 与 9-file deliver/CLI bundle 已重跑通过，当前等待新的 fresh reviewer clean round。
24. 2026-04-17：fresh reviewer `Gauss` 的 round-19 clean recheck 未发现新的 actionable finding；当前实现、tests、delivery registry 与 sprint ledger surface 已满足本任务完成态前置条件，任务状态切换为 `completed`，下一步进入 `TK-926` sprint closeout。

## 10. 产出

1. `packages/core-orchestration-service` 已新增 `deliver` capability baseline，以及 shared-session `deliveryWorkflow` gate/runtime truth。
2. `apps/cli` 与 i18n/help surfaces 已按 chat-first 语义消费 `deliver`，同时保持 `/deliver` 只作为预留 discoverability alias，不进入 public slash catalog。
