# Code Review: TK-496 TK-497 Working Tree

- Status: resolved
- Date: 2026-04-03
- Reviewer: AI-Agent
- Task: `TK-496/TK-497`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-supervisor-and-role-subagent-collaboration.md`

## 1. Review Scope

1. `apps/cli/src/main.ts`
2. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
3. `apps/cli/src/runtime/session-main-capability-discoverability-runtime.ts`
4. `apps/cli/test/cli-output-contract.integration.test.ts`
5. `apps/cli/test/cli-skeleton.integration.test.ts`
6. `apps/cli/test/runtime/session-shell-runner.test.ts`
7. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
8. `packages/core-orchestration-service/src/index.ts`
9. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
10. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-catalog.ts`
11. `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts`
12. `packages/core-orchestration-service/src/types/index.ts`
13. `packages/core-orchestration-service/src/types/interfaces/index.ts`
14. `packages/core-orchestration-service/src/types/interfaces/session-main-capability-explainer.interface.ts`
15. `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`
16. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
17. `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`
18. `packages/shared/src/i18n/locales/en-us.ts`
19. `packages/shared/src/i18n/locales/zh-cn.ts`
20. `packages/shared/src/index.ts`

## 2. Findings

### 2.1 [P2] Suggested `/workflow` affordances still resolve to the failing no-subcommand CLI path

- 位置: `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts:258`
- 问题描述: catalog/help/explainer 现在都把 workflow 的建议入口写成 `/workflow`，但 slash registry 对无参 `/workflow` 仍然生成 `bridgeArgv=['workflow']`。session shell 会把它直接执行成 `repo-ai-governor workflow`，而真实 CLI 入口明确报错“workflow requires an explicit subcommand; use workflow create/edit/preview”。也就是说，新加的 suggested slash command、suggested actions 和 help appendix 会把用户引导到一个确定失败的命令。
- 影响: `TK-496` 新引入的 discoverability surface 对 workflow capability 不 truthful；用户按提示点击或输入 `/workflow` 会立即撞到错误，而不是进入 preview/read-only baseline。
- 建议: 要么把 canonical suggested slash command 改成 `/workflow preview`，要么让 slash registry 把无参 `/workflow` 默认桥接到 `workflow preview`；同时补一条回归测试，覆盖无参 `/workflow` 的真实执行结果。

### 2.2 [P2] Capability explainer ignores the active locale and guesses output language from the prompt script

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts:455`
- 问题描述: ADR 明确要求 `runtime.orchestration` 通过 i18n runtime 把 locale-neutral capability seed 渲染成“当前 locale”的 descriptor view，但 explainer 现在直接 import `EN_US_TRANSLATIONS` / `ZH_CN_TRANSLATIONS`，再用 `SESSION_MAIN_CJK_PATTERN` 根据用户消息里是否含 CJK 决定输出语言。这样 capability explanation 的语言不再跟当前 CLI/desktop locale 绑定，而是跟用户输入脚本绑定；同一个 `zh-CN` session 里只要用户用英文提问，就会拿到英文 explainer answer，反过来也一样。
- 影响: 新增的 service-owned capability explanation 无法保证与当前 locale、CLI help appendix 和后续 shared-session consumer 保持一致，直接偏离了 capability explanation 的本地化边界契约。
- 建议: 把 locale/translate seam 从当前 i18n runtime 显式传进 explainer（例如挂到 turn context / dispatcher 依赖），不要再从用户输入脚本推断语言；同时补一条回归用例，验证 locale 与提示词语言不一致时仍按 active locale 输出。

## 3. Notes

1. `TK-495` 的前一轮 CR 已经收口为 `resolved_code_review_working-tree-20260403-2003.md`；本报告仅针对当前继续推进的 `TK-496/TK-497` 工作树。
2. 这批改动的 build 与定向 vitest 均通过，所以发现集中在 contract truthfulness / user-visible branch behavior，而不是基础构建失败。
3. 当前测试覆盖了 help appendix、discoverability metadata 和 explainer 的 overview/detail/comparison baseline，但没有撞到无参 `/workflow` 的真实执行路径，也没有覆盖“locale 与提示词语言不一致”的 explainer 本地化分支。

## 4. Verification

1. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm run build`（通过）
2. `PATH="/opt/homebrew/bin:/Users/jimmydaddy/Library/pnpm:$PATH" pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/cli-output-contract.integration.test.ts apps/cli/test/cli-skeleton.integration.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
3. `/opt/homebrew/bin/node ./dist/bin/repo-ai-governor.js --locale en-US --output json --no-interactive workflow`（失败：`workflow requires an explicit subcommand; use workflow create, workflow edit, or workflow preview.`）
4. `/opt/homebrew/bin/node ./dist/bin/repo-ai-governor.js --locale en-US --output json --no-interactive workflow preview`（通过）

## 5. Recheck Conclusion (2026-04-03)

1. Finding 2.1: accepted and fixed. Bare `/workflow` now bridges to `workflow preview`, so the canonical suggested slash command, discoverability palette, and session-shell execution path stay truthful.
2. Finding 2.2: accepted and fixed. Capability explanation no longer infers language from the user prompt script; the active locale is now carried from CLI -> session client -> orchestration turn context -> capability explainer and rendered through shared i18n runtime.

## 6. Repair Log (2026-04-03)

1. Updated `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts` so `/workflow` resolves to `bridgeArgv=['workflow', 'preview']` when no explicit subcommand is present.
2. Added user-visible regressions in `apps/cli/test/runtime/session-slash-command-registry.test.ts` and `apps/cli/test/runtime/session-shell-runner.test.ts` to cover bare `/workflow` resolution and real direct execution from the session shell.
3. Introduced an explicit locale seam in `apps/cli/src/runtime/interactive-shell/session-shell-service-client.ts`, `apps/cli/src/main.ts`, `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`, and `packages/core-orchestration-service/src/types/interfaces/session-main-supervisor-runtime.interface.ts`.
4. Updated `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts` and `packages/core-orchestration-service/src/local-orchestration-service-session-main-capability-explainer.ts` so capability answers render via shared `I18nRuntime` using the active locale instead of prompt-script detection.
5. Added locale mismatch regressions in `packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts`, `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`, and refreshed `apps/cli/test/runtime/session-main-parity.integration.test.ts` for the new locale field.
6. Verification completed with:
   - `pnpm exec vitest run apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-explainer.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm exec vitest run apps/cli/test/runtime/session-main-parity.integration.test.ts --maxWorkers=1 --maxConcurrency=1`
   - `pnpm run build`
   - `pnpm run check`
