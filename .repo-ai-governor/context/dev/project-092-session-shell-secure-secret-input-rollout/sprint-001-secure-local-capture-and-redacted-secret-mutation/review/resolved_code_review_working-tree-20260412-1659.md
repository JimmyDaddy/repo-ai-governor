# Code Review: TK-806 delegated review loop round 1

- Status: resolved
- Date: 2026-04-12
- Reviewer: AI-Agent
- Delegated Reviewer: `spawn_agent` fresh reviewer for `CR-001`
- Task: `TK-806`
- CR Task: `CR-001`
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

1. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
4. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
5. `apps/cli/test/runtime/session-shell-ink-controller.test.ts`
6. `apps/cli/test/runtime/session-shell-runner.test.ts`
7. `packages/shared/src/i18n/locales/en-us.ts`
8. `packages/shared/src/i18n/locales/zh-cn.ts`

## 2. Findings

1. `[P1]` Ink 路径下，`/secret set <key> <secret>` 的拒绝提示只暂存在 `commandPreview`；如果用户随后按下 Enter，空提交分支会清空提示且不会像 readline 路径那样落入 transcript，导致反馈不持久且缺少对应端到端覆盖。

## 3. Verification Verdict

1. Finding 1：`accepted`
   证据：delegated reviewer 明确指出 [session-shell-ink-controller.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts#L144) 仅设置瞬时 `commandPreview`，而 [session-shell-runner.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-shell-runner.ts#L380) 的空输入提交路径会重置提示。

## 4. Resolution

1. `CliSessionShellInputActionResult` 增加可选 `systemNoticeLines` effect，让 controller 能把 secure suffix rejection 明确交给 runner 处理。
2. Ink controller 在拒绝 `/secret set <key> <secret>` 时，继续展示瞬时 `commandPreview`，同时把 redacted warning 作为 `systemNoticeLines` 返回。
3. runner 在消费 Ink action 时，会把 `systemNoticeLines` 立即追加为本地 `system_notice` transcript item，保证提示在 composer 被清空、甚至后续空提交后仍然可见。
4. `apps/cli/test/runtime/session-shell-runner.test.ts` 已补一条 Ink regression，覆盖“拒绝后空提交仍保留 transcript guidance”这一分支。

## 5. Verification

1. `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
2. `pnpm run build`

## 6. Remaining Risk

1. `CR-001` 的 accepted finding 已修复并通过当前验证。
2. 按 scoped CR loop 规则，下一步仍需发起 fresh reviewer recheck，确认本边界已进入 clean state。
