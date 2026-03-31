# Code Review: working tree 20260331-1438

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `TK-460` + `TK-461`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 1. Review Scope

1. `apps/cli/src/react-cli/views/transcript-pane.tsx`
2. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
4. `apps/cli/src/types/interfaces/cli-session-shell.interface.ts`
5. `apps/cli/test/runtime/react-cli-runner.test.ts`
6. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
7. `project-032` sprint-005 closeout artifacts under `.repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/**`

## 2. Findings

### 2.1 [P1] New transcript recap chrome bypasses the repository i18n contract

- 位置: `apps/cli/src/react-cli/views/transcript-pane.tsx:115-125`
- 问题描述: 新增的 `command_recap` renderer 直接把 `Summary` 和 `Related` 作为英文字符串写进 presenter，同时 `react-cli-runner.test.ts` 也按英文断言这些文案。仓库规则 `CS-033` 明确要求 `apps/**` 中所有用户可见文案都必须走 i18n key，而这里没有新增任何 locale key。
- 影响: 一旦 CLI locale 不是英文，这两个新区域会与现有已本地化的 transcript / prompt bar 混用，形成直接的用户可见语言漂移；同时这会让 session-shell transcript presenter 在后续 locale parity gate 下继续积累债务。
- 建议: 将 `Summary` / `Related` 以及必要的 command-recap/backlink 壳层文案迁移到 shared i18n key，并同步更新 `en-us` 与 `zh-cn` locale 以及对应测试断言。

### 2.2 [P2] `command_recap` renderer silently drops real recap lines whenever `backlinks` exist without duplicated backlink lines

- 位置:
  - `apps/cli/src/react-cli/views/transcript-pane.tsx:99-102`
  - `apps/cli/test/runtime/react-cli-runner.test.ts:171-217`
- 问题描述: `ReactCliCommandRecapTranscriptItem` 通过 `item.lines.length - item.backlinks.length` 推断最后几行一定是 backlink 文本，然后把这些行裁掉。但 `CliSessionShellTranscriptItem` contract 只声明 `lines[]` 与 `backlinks[]` 是并列字段，并没有要求 `lines[]` 必须重复包含 backlink lines。测试本身就构造了一个只有三条 recap lines、但额外带一个 `backlinks` 项的 item，结果 renderer 会把第三条真实 recap (`Intent: ...`) 误删，而且测试还把这个行为固化成了预期。
- 影响: 任何后续 producer 只要提供结构化 `backlinks` 而不重复拼接 backlink 文本，transcript 就会悄悄丢失最后几条真实 recap 内容。这个裁剪规则当前既不在 contract 中声明，也不具备自解释性，属于实际展示语义回归。
- 建议: 不要再通过 `backlinks.length` 反推需要裁掉多少 `lines`；应当让 recap 主体与 backlink 展示分离，或者显式增加独立 recap/body 字段，并把 `react-cli-runner.test.ts` 改成能保住 `Intent` 等真实 recap 行的断言。

## 3. Notes

1. 你消息里贴的 `single-tool-minimal` finding 在当前代码面没有复现：`apps/cli/src/runtime/agent-onboarding-runtime.ts` 已对 `SINGLE_TOOL_MINIMAL` 做提前返回，`apps/cli/test/runtime/agent-onboarding-runtime.test.ts` 也有对应防回归用例。
2. 本轮 review 主要针对当前未提交的 `project-032 / sprint-005` transcript renderer rollout；`.repo-ai-governor/**` closeout 台账只做同步性核对，没有发现单独的 ledger drift 问题。

## 4. Verification

1. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `git diff -- apps/cli/src/react-cli/views/transcript-pane.tsx apps/cli/src/runtime/interactive-shell/session-shell-runner.ts apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts apps/cli/src/types/interfaces/cli-session-shell.interface.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts`（已审阅）
3. `git diff -- .repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/plan.md .repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/sprint-005-session-shell-output-presentation-and-markdown-productization/plan.md .repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/sprint-005-session-shell-output-presentation-and-markdown-productization/tasks/TK-460-implement-structured-transcript-render-kind-and-session-shell-message-renderer-split.md .repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/sprint-005-session-shell-output-presentation-and-markdown-productization/tasks/TK-461-integrate-assistant-markdown-rendering-and-transcript-presentation-verification.md .repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/sprint-005-session-shell-output-presentation-and-markdown-productization/tasks/checklist.md .repo-ai-governor/context/dev/project-032-command-live-progress-react-shell-productization/sprint-005-session-shell-output-presentation-and-markdown-productization/tasks/tasks.csv .repo-ai-governor/context/current-context.md .repo-ai-governor/context/completed-streams-history.md .repo-ai-governor/context/technical-solution-delivery-registry.yaml .repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`（已审阅）

## 复核结论（2026-03-31）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P1] New transcript recap chrome bypasses the repository i18n contract`
   - 判定：**认可**
   - 证据：`transcript-pane.tsx` 当前直接输出了 `Summary` / `Related` 两个英文 presenter chrome，且没有对应 locale key；这与 `apps/**` 用户可见文案必须走 i18n 的仓库规则不一致。
   - 处理：采用最小安全修复，移除这两个硬编码 chrome，并让 `command_recap` 保持结构化正文 + backlinks 呈现，避免引入新的未本地化 presenter 文案。
2. `2.2 [P2] command_recap renderer silently drops real recap lines whenever backlinks exist without duplicated backlink lines`
   - 判定：**认可**
   - 证据：当前 renderer 通过 `item.lines.length - item.backlinks.length` 裁剪 recap 正文，确实会在 `lines[]` 与 `backlinks[]` 不重复时丢失最后几条真实 recap 内容。
   - 处理：让 recap renderer 直接渲染完整 `item.lines`，并把 backlinks 独立显示；同时让 transcript store 不再把 backlink text 重复拼回 `lines[]`，避免重复展示。

### 验证命令
1. `git diff -- apps/cli/src/react-cli/views/transcript-pane.tsx apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts`（已复核）

## 修复执行记录（2026-03-31）

1. `2.1 [P1] New transcript recap chrome bypasses the repository i18n contract`：已完成
   - 变更文件：`apps/cli/src/react-cli/views/transcript-pane.tsx`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/react-cli-runner.test.ts`（通过）
   - 说明：移除了 `Summary` / `Related` 这类硬编码英文 recap chrome，改为直接渲染结构化 recap 正文与 backlinks，避免在 presenter 层引入新的未本地化用户文案。
2. `2.2 [P2] command_recap renderer silently drops real recap lines whenever backlinks exist without duplicated backlink lines`：已完成
   - 变更文件：`apps/cli/src/react-cli/views/transcript-pane.tsx`、`apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`、`apps/cli/test/runtime/react-cli-runner.test.ts`、`apps/cli/test/runtime/session-shell-transcript-store.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）；`pnpm run build`（通过）
   - 说明：recap renderer 现直接渲染完整 `item.lines`，backlinks 独立显示；同时 transcript store 不再把 backlink text 再次拼回 `lines[]`，因此不会再因为 `backlinks.length` 裁剪而丢失 `Intent` 等真实 recap 行。
