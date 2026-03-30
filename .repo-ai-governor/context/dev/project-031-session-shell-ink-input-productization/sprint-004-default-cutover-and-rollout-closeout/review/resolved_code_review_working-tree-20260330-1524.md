# Code Review: working-tree-20260330-1524

- Status: resolved
- Date: 2026-03-30
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: working tree review
- Normative References:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 1. Review Scope
1. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts`
3. `apps/cli/src/runtime/interactive-shell/session-shell-ink-runner.ts`
4. `apps/cli/src/react-cli/views/session-shell-live-app.tsx`
5. `apps/cli/src/react-cli/views/slash-command-palette.tsx`
6. `apps/cli/test/runtime/session-shell-runner.test.ts`
7. `apps/cli/test/runtime/session-shell-ink-controller.test.ts`
8. `apps/cli/test/runtime/session-shell-ink-runner.test.ts`
9. `apps/cli/test/runtime/session-shell-live-app.test.ts`
10. `README.md`
11. `README.zh-CN.md`
12. `docs/local-adoption-playbook.md`
13. `docs/local-adoption-playbook.zh-CN.md`
14. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 2. Findings
### 2.1 [P1] `/clear` and `Ctrl+L` hide a pending handoff preview without cancelling it
- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:537`
- 问题描述: `/clear` and the Ink `Ctrl+L` path both route through `clearLocalTranscriptView()`, which resets the visible shell state via `resetPromptState()` but never clears `runtimeState.pendingCommand` (`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:1154`). After previewing a confirm-gated command such as `/workspace dry-run`, the preview banner disappears and the shell looks idle again, yet a later `/confirm` still executes the previously hidden command.
- 影响: 这破坏了 command handoff preview 的确认语义。用户会把 `Esc`/`Ctrl+L`/`/clear` 理解为“只清理本地界面”，但实际上它可以把待确认命令藏起来，再由后续 `/confirm` 意外执行，属于确认面与真实执行面脱钩。
- 建议: clear-screen/reset 分支要么同步清空 `pendingCommand`，要么保留 preview 可见直到用户显式 `/confirm` 或 `/cancel`；并补一条回归用例覆盖 `/workspace dry-run -> /clear/Ctrl+L -> /confirm`。

### 2.2 [P2] `Esc` does not really close the live slash palette
- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts:158`
- 问题描述: `Esc` emits `PALETTE_CLOSED`, but `closePalette()` only sets `slashQuery=''` and `slashSuggestions=[]`. The palette component is still always rendered (`apps/cli/src/react-cli/views/slash-command-palette.tsx:26`), so the user sees `query=none` plus the “No slash commands matched.” empty state instead of a closed palette or the default command list. This directly conflicts with the updated README / playbook / module overview wording that says `Esc` “closes the palette”.
- 影响: live keyboard contract is user-visible and now drifts from both docs and operator expectations. The current behavior looks like a failed filter state, not a closed palette, which makes the new `Esc` affordance misleading.
- 建议: introduce an explicit closed/hidden palette state, or restore the default suggestion list when `Esc` closes the filtered palette; add a regression test for the `Esc` branch in the live-app/controller path before keeping the docs’ “tested closeout” language.

## 3. Notes
1. 现有相关单测都通过了，但 `Esc` close 和 `clear -> stale pending command` 这两条实际风险没有被回归用例覆盖，说明当前绿灯不足以证明 live Ink keyboard contract 已经闭环。
2. 初版 `review_pending` 报告未执行 `pnpm run build`；本次复核已补充 build 与定向回归验证。

## 4. Verification
1. `pnpm run test:packages -- apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-ink-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/runtime/react-cli-runner.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
3. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
5. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）

## 复核结论（2026-03-30）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:1159-1203` 现在在 `pendingCommand` 仍然存在时，不再把 clear-screen 路径直接落回 `resetPromptState()`，而是恢复 `command_handoff_preview` 状态与 prompt-bar preview。对应回归覆盖在 `apps/cli/test/runtime/session-shell-runner.test.ts:637-678` 和 `apps/cli/test/runtime/session-shell-runner.test.ts:777-843`。
   - 处理：接受该 finding，并已完成修复。

2. `2.2`
   - 判定：**认可**
   - 证据：`apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts:153-173` 新增了显式 `slashPaletteVisible` close 语义；`apps/cli/src/react-cli/views/session-shell-app.tsx:55-64` 现在只在 presenter 允许时渲染 palette，因此 `Esc` 不会再留下一个“query=none + empty state”的伪关闭界面。对应回归覆盖在 `apps/cli/test/runtime/session-shell-ink-controller.test.ts:163-188` 和 `apps/cli/test/runtime/react-cli-runner.test.ts:225-260`。
   - 处理：接受该 finding，并已完成修复。

### 复核补充验证
1. `pnpm run build`（通过）
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-ink-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）

## 修复执行记录（2026-03-30）

1. `2.1`
   - 修复：`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:644-653` 统一在 confirm-gated handoff preview 进入时关闭 palette 并显式标记 `slash_command` 输入模式；`apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:1159-1203` 新增 `restorePendingCommandPreviewState()`，让 `/clear` 与 `Ctrl+L` 只清理本地视口，不再把 armed preview 隐藏成 idle 外观。
   - 回归：`apps/cli/test/runtime/session-shell-runner.test.ts:637-678` 覆盖 `/clear -> /confirm`；`apps/cli/test/runtime/session-shell-runner.test.ts:777-843` 覆盖 `Ctrl+L -> /confirm`。

2. `2.2`
   - 修复：`apps/cli/src/types/interfaces/cli-session-shell.interface.ts:72-79` 新增 `slashPaletteVisible` presenter contract；`apps/cli/src/runtime/interactive-shell/session-shell-ink-controller.ts:110-173` 让 `Esc` 只关闭 palette、不清空 slash composer 文本；`apps/cli/src/react-cli/views/session-shell-app.tsx:55-64` 切成按可见性条件渲染。
   - 回归：`apps/cli/test/runtime/session-shell-ink-controller.test.ts:163-188` 钉住 `Esc` close 语义；`apps/cli/test/runtime/react-cli-runner.test.ts:225-260` 钉住 palette hidden 时不会继续渲染空态 section。

### 修复后验证
1. `pnpm run build`（通过）
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-shell-ink-controller.test.ts apps/cli/test/runtime/session-shell-ink-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-live-app.test.ts apps/cli/test/cli-output-contract.integration.test.ts`（通过）
