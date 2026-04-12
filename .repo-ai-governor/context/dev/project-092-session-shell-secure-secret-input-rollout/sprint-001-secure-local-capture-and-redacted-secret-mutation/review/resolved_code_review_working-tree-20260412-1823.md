# Code Review: TK-807 delegated review loop round 3

- Status: resolved
- Date: 2026-04-12
- Reviewer: AI-Agent
- Delegated Reviewer: `spawn_agent` fresh reviewer for `CR-003`
- Task: `TK-807`
- CR Task: `CR-003`
- Review Type: delegated boundary code review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`

## 1. Review Scope

1. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`
3. `apps/cli/src/react-cli/views/session-shell-live-app.tsx`
4. `apps/cli/src/react-cli/views/composer-input.tsx`
5. `apps/cli/src/constants/cli-session-shell.constant.ts`
6. `apps/cli/src/types/interfaces/cli-session-shell.interface.ts`
7. `apps/cli/src/types/interfaces/index.ts`
8. `apps/cli/src/types/index.ts`
9. `apps/cli/src/runtime/interactive-shell/session-shell-entrypoint-runtime.ts`
10. `apps/cli/src/main.ts`
11. `apps/cli/test/runtime/session-shell-runner.test.ts`
12. `apps/cli/test/runtime/session-shell-live-app.test.ts`
13. `apps/cli/test/runtime/react-cli-runner.test.ts`
14. `apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts`
15. `packages/shared/src/i18n/locales/en-us.ts`
16. `packages/shared/src/i18n/locales/zh-cn.ts`

## 2. Findings

1. `[P1]` live Ink surface 在把 `COMPOSER_CHANGED` action 交给 controller 前，会先把 `nextComposerValue` 写进本地 `composerValueRef` / `displayComposerValue`；对 `/secret set <keyName> <secret>` 来说，这会让 forbidden suffix 在 controller 拒绝前短暂进入 presenter-local state。
2. `[P1]` secure capture submit 只输出 redacted notice 而没有调用本地 secret mutation seam，导致 Ink happy path 下 `/secret set <keyName>` 仍无法真正写入 secret backend。

## 3. Verification Verdict

1. Finding 1：`accepted`
   证据：delegated reviewer 指向 [session-shell-live-app.tsx](/Users/jimmydaddy/study/ai-governor/apps/cli/src/react-cli/views/session-shell-live-app.tsx#L165) 的 live keypress path；主 agent 复核后确认，在写入 local display state 前缺少 secure-route suffix suppress gate。
2. Finding 2：`accepted`
   证据：delegated reviewer 指向 [session-shell-runner.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-shell-runner.ts#L2318) 的 submit path；主 agent 复核后确认，secure capture submit 之前确实没有进入 `CliSecretService.setSecret()` 对应的本地 mutation seam。

## 4. Resolution

1. `session-shell-live-app.tsx` 增加 `shouldSuppressLiveComposerPreviewEcho()`，复用 slash registry 的 secure-route classifier，在 live Ink 本地 `composerValueRef` / `displayComposerValue` commit 前拦截 rejected suffix，避免 raw secret 进入 presenter-local state。
2. `session-shell-live-app.test.ts` 新增 secure suffix echo suppress regression，覆盖 live surface 在 controller reject 之前不回显 forbidden suffix 的约束。
3. `CliSessionShellRunOptions` 新增 `secureSecretMutator` seam，`CliSessionShellEntrypointRuntime.createRunOptions()` 与 `main.ts` 将现有 `CliSecretService` 注入到 session shell runner，避免 secure capture submit 停留在 no-op。
4. `submitSecureLocalSecretCapture()` 现在会在 redacted presenter state 之外直接调用本地 secret mutation seam，并输出 redacted success / failure / unavailable guidance；仍保持 raw secret 不进入 transcript、preview、history 或 localized recap。
5. `session-shell-runner.test.ts` 与 `session-shell-entrypoint-runtime.test.ts` 已补强，覆盖 secure submit happy path、cancel path 与 entrypoint mutator passthrough。

## 5. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-shell-entrypoint-runtime.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`

## 6. Remaining Risk

1. `CR-003` 的 accepted findings 已修复并通过当前验证。
2. 按 scoped CR loop 规则，下一步仍需发起一轮 fresh reviewer recheck，确认 `TK-807` 当前边界已进入 clean state。
