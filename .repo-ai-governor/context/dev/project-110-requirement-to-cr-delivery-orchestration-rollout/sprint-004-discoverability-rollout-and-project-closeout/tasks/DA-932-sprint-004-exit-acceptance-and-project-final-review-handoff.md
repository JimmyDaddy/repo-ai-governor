# DA-932 sprint-004 exit acceptance and project-final review handoff

- Status: active
- Date: 2026-04-17
- Owner: AI-Agent
- Artifact ID: `DA-932`
- Produced By: `TK-932`
- Scope: `project-110-requirement-to-cr-delivery-orchestration-rollout`

## 1. 出口结论

`accept`

`project-110 / sprint-004-discoverability-rollout-and-project-closeout` 的实现边界已满足当前 sprint 的退出条件。`TK-931` 已在 fresh reviewer `CR-004` clean round 后达到 `completed`，说明 `deliver` discoverability rollout、optional alias wording、localized slash handoff prompt 与 runtime evidence 已形成可回放的 clean 证据链。

但由于本项目还要求额外执行一次 `project-final` fresh reviewer scoped CR loop，当前 sprint 仍需继续保留为 active review surface。换言之，sprint-level exit acceptance 已完成，project-level final closeout 仍待下一轮 clean reviewer round 之后再执行。

本次 sprint closeout 窗口包含 `apps/**`、`packages/**` 与 `test/**` 下的代码改动，因此 build evidence 是必需项；当前 closeout packet 明确复用了同窗口通过的 targeted vitest 与 `pnpm run build` 结果，并将在 project-final closeout 前补 `pnpm run check`。

## 2. 验收范围

1. discoverability rollout：
   - `/deliver` 现已进入 full/help discoverability surface
   - launcher shortlist 继续保持 chat-first，不把 `/deliver` 升格为默认入口
2. alias semantics：
   - public help、capability explainer 与 slash handoff prompt 现在统一表达“optional alias”
   - `/deliver` handoff prompt 已改为 locale-aware，不再绕过 shared i18n
3. sprint-level CR closure：
   - `CR-001`、`CR-002`、`CR-003`、`CR-004` 均已 `resolved`
   - latest sprint-level fresh reviewer round 未留下 actionable finding
4. project-final handoff：
   - 当前 sprint 继续保留在 `current-context.md` 的 active surface，用于 project-final scoped CR loop
   - project-level completion audit summary 与 delivery-registry completed write-back 必须等待 project-final clean 后再执行

## 3. 出口判定

1. Exit Criteria 1：通过
   - `deliver` discoverability、optional alias wording 与 runtime truth 已对齐。
2. Exit Criteria 2：通过
   - localized slash handoff prompt 与 shared i18n baseline 已收口，不再存在 `CS-033` 漏洞。
3. Exit Criteria 3：通过
   - `DA-931` 已形成 sprint-004 rollout evidence packet，且 review/task ledger 与 sprint plan 真值同步。
4. Review Closure：通过
   - `CR-001 ~ CR-004` 已全部 `resolved`，latest fresh reviewer round clean。

## 4. project-final review handoff 约束

1. 下一边界必须是 `project-110` 的 project-final scoped CR loop，review surface 需要覆盖 project 范围内的 remaining truth packet，而不只限于单个 `TK-931` 代码切片。
2. 在 project-final latest fresh reviewer round clean 之前，不得把 `project-110` project plan、sprint-004 sprint plan、delivery registry 或 `current-context.md` promote 为最终 `completed` / next-stream truth。
3. `project-112 / sprint-001` 仍保持 planned follow-up stream；只有 `project-110` project-final closeout 完成后，才允许把它切换为新的 active primary stream。

## 5. 关键产物

1. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/plan.md`
3. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks/DA-931-deliver-discoverability-rollout-runtime-evidence.md`
4. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/review/resolved_code_review_working-tree-20260417-0623.md`
5. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/review/resolved_code_review_working-tree-20260417-0637.md`
6. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/review/resolved_code_review_working-tree-20260417-0644.md`
7. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/review/resolved_code_review_working-tree-20260417-0702.md`
8. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks/TK-931-align-deliver-discoverability-rollout-guidance-and-runtime-evidence.md`
9. `.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks/TK-932-finalize-project-110-rollout-closeout-and-delivery-evidence-handoff.md`
10. `.repo-ai-governor/context/current-context.md`

## 6. 验证

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
2. `pnpm run build`
3. `node ./scripts/governance/check-task-required-inputs.js --tasks-dir /Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-110-requirement-to-cr-delivery-orchestration-rollout/sprint-004-discoverability-rollout-and-project-closeout/tasks --task-id TK-931`
4. `node ./scripts/governance/check-task-ledger-sync.js`
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`
6. `node ./scripts/governance/check-code-review-status-sync.js`
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
