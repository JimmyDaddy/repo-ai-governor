# TK-931 align deliver discoverability rollout guidance and runtime evidence

- Status: completed
- Date: 2026-04-16
- Owner: AI-Agent
- Priority: P1
- Project: `project-110-requirement-to-cr-delivery-orchestration-rollout`
- Sprint: `sprint-004-discoverability-rollout-and-project-closeout`

## 1. 任务目标

统一 conversational deliver explainer、optional /deliver alias 与 docs/playbook/runtime rollout evidence

## 2. Depends On

1. DA-915

## 3. 预期产物

1. discoverability and rollout evidence artifact for TK-931
2. task card update for TK-931
3. aligned checklist/tasks.csv ledger views

## 4. Required Inputs

1. .repo-ai-governor/context/dev/project-109-requirement-to-cr-delivery-solution-review-and-promotion-prep/sprint-001-solution-review-and-promotion-handoff/tasks/DA-915-requirement-to-cr-delivery-promotion-and-rollout-decomposition-handoff.md
2. .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md
3. .repo-ai-governor/context/current-context.md
4. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/plan.md

## 5. Traceback References

1. /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/plan.md
2. .repo-ai-governor/normative_knowledge_sources/governance/task-card-template.md

## 6. 实施计划

1. 确认本任务边界、依赖与预期产物。
2. 按标准模板推进实现或治理动作。
3. 完成 ledger sync 与必要验证后更新产出。

## 7. Development Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
2. `pnpm run build`
3. `node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks" --task-id TK-931`

## 8. Delivery Verification

1. node ./scripts/governance/sync-task-ledger.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks" --task-id TK-931
2. node ./scripts/governance/check-task-required-inputs.js --tasks-dir "/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks" --task-id TK-931
3. node ./scripts/governance/check-task-ledger-sync.js
4. node ./scripts/governance/check-sprint-plan-status-sync.js

## 9. 执行记录

1. 2026-04-16：任务创建，状态初始化为 `planned`。
2. 2026-04-17：随着 `TK-930` 完成 sprint-003 closeout 与 sprint-004 activation handoff，本任务已切换为 `in_progress`，开始承接 conversational deliver explainer、optional `/deliver` alias、CLI/session-shell discoverability 与 rollout evidence 收口。
3. 2026-04-17：已完成 discoverability rollout implementation：`deliver` 进入 full discoverability/help appendix，explainer/help wording 从 reserved alias 收紧为 optional alias，launcher shortlist 继续保持 chat-first 不展示 `/deliver`；同窗口 `4` 个定向测试文件与 `pnpm run build` 均已通过，证据汇总见 `DA-931`。
4. 2026-04-17：已完成 `CR-003` 接受问题修复：session-shell AI workflow prompt 现已统一走 shared locale key，`/deliver` 在 `zh-CN` 下不再回退为英文 handoff prompt；同窗口定向 vitest、`pnpm run build` 与 governance gates 均已通过，等待 fresh clean reviewer round。
5. 2026-04-17：fresh reviewer round `CR-004` 返回 `no actionable findings`；`TK-931` 已达到 clean state，并切换为 `completed`，可进入 sprint-004 closeout。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks/DA-931-deliver-discoverability-rollout-runtime-evidence.md`
2. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
3. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
4. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/main.ts`
5. `/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
6. `/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
7. `/Users/jimmydaddy/study/ai-governor/apps/cli/test/runtime/session-slash-command-registry.test.ts`
8. `/Users/jimmydaddy/study/ai-governor/packages/shared/src/i18n/locales/en-us.ts`
9. `/Users/jimmydaddy/study/ai-governor/packages/shared/src/i18n/locales/zh-cn.ts`
10. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/review/resolved_code_review_working-tree-20260417-0702.md`
