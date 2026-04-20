# DA-931 deliver discoverability rollout runtime evidence

- Status: active
- Date: 2026-04-17
- Project: `project-110-requirement-to-cr-delivery-orchestration-rollout`
- Sprint: `sprint-004-discoverability-rollout-and-project-closeout`
- Task: `TK-931`

## 1. Summary

1. `deliver` 现已进入 full-surface discoverability：top-level CLI governed capability catalog、session-shell full slash palette、以及 slash command exact-resolution 都会显式暴露 `/deliver`。
2. `deliver` 的公开表述已从 “Reserved discoverability alias” 收紧为 “Optional discoverability alias”，与 sprint-004 对 optional `/deliver` alias 的 rollout 目标保持一致。
3. launcher shortlist 仍然不显示 `/deliver`，因此 `deliver` 继续保持 `conversational_answer` 作为 canonical primary entry；本轮只提供显式加速入口，不把 alias 升格为默认入口。
4. session-shell `/deliver` handoff 现在会展开成 locale-aware 的 chat-first workflow prompt，而不是让 presenter/registry 拥有第二套本地 workflow truth。

## 2. Evidence Packet

1. Full discoverability surfaces now include `/deliver`
   - files:
     - `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
     - `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
     - `apps/cli/src/main.ts`
   - result:
     - full governed slash discoverability order now includes `deliver`
     - top-level help appendix now shows the optional alias inline with the chat-first capability summary
     - launcher shortlist remains unchanged and still omits `/deliver`
2. Conversational explainer and help appendix wording are aligned
   - files:
     - `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
     - `packages/shared/src/i18n/locales/en-us.ts`
     - `packages/shared/src/i18n/locales/zh-cn.ts`
   - result:
     - deliver detail answers now say `Optional discoverability alias: /deliver`
     - CLI help appendix uses the same optional-alias wording instead of the earlier reserved/pre-release wording
3. Alias execution remains an acceleration path, not a new truth owner
   - files:
     - `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
     - `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
     - `packages/shared/src/i18n/locales/en-us.ts`
     - `packages/shared/src/i18n/locales/zh-cn.ts`
   - result:
     - `/deliver` now expands into a localized natural-language governed-workflow start prompt
     - prompt copy explicitly frames `/deliver` as an acceleration alias for the chat-first entry
     - shell-side AI workflow prompts now reuse shared locale keys instead of hardcoded English copy, so the alias rollout no longer bypasses `CS-033`
4. Current-window verification
   - `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-skeleton.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts` passed (`4` files / `98` tests)
   - `pnpm run build` passed
   - fresh reviewer round `CR-004` returned `no actionable findings`

## 3. Guardrails Preserved

1. `deliver` descriptor truth remains orchestration-owned with `primary_entry=conversational_answer`; no catalog seed or interaction model was changed.
2. `/deliver` is discoverable only on full/help surfaces, not on the launcher shortlist, so the shell still nudges users toward the canonical chat-first path.
3. No new local phase, pending-action, or artifact-backlink derivation was added in CLI/session-shell code; this window only changes discoverability/prompt wording around already-owned delivery truth.
4. child workflow ownership remains unchanged: `plan / review / review_verify / run` are still modeled as related governed capabilities instead of being collapsed into the `/deliver` alias path.

## 4. Output Paths

1. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
2. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
3. `apps/cli/src/main.ts`
4. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
5. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
6. `apps/cli/test/cli-skeleton.integration.test.ts`
7. `apps/cli/test/cli-output-contract.integration.test.ts`
8. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
9. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
10. `packages/shared/src/i18n/locales/en-us.ts`
11. `packages/shared/src/i18n/locales/zh-cn.ts`
