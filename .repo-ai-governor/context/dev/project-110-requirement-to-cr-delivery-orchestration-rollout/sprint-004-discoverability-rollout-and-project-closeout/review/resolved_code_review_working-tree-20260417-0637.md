# Code Review: TK-931 round 2

- Status: resolved
- Date: 2026-04-17
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: scoped task recheck review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`

## 1. Review Scope

1. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
2. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
3. `apps/cli/src/main.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
5. `packages/shared/src/i18n/locales/en-us.ts`
6. `packages/shared/src/i18n/locales/zh-cn.ts`
7. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks/TK-931-align-deliver-discoverability-rollout-guidance-and-runtime-evidence.md`
8. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks/DA-931-deliver-discoverability-rollout-runtime-evidence.md`

## 2. Findings

1. accepted round-2 finding has been fixed in-window.

## 3. Notes

1. capability explainer alias wording is now aligned with top-level help: `deliver` keeps the optional alias, while `help` stays chat-first without alias wording.
2. This resolves the round-2 finding set; `TK-931` now needs a fresh clean recheck to prove there are no remaining actionable issues.

## 4. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 修复执行记录（2026-04-17）

1. `2.1 [P2] help capability explainer still advertised /help as an optional alias`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
   - 处理：explainer alias 文案现在显式限定为 `deliver`，并新增 `tell me about help` regression assertion，防止 `/help` 再次被误标注为 optional alias。
