# Code Review: working-tree-20260330-1815

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
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 1. Review Scope
1. `apps/cli/src/commands/connect-command.ts`
2. `apps/cli/src/react-cli/bridge/react-cli-command-view-model-builder.ts`
3. `apps/cli/src/react-cli/session/react-cli-session-controller.ts`
4. `apps/cli/src/react-cli/state/react-cli-view-model.interface.ts`
5. `apps/cli/src/react-cli/views/layout-shell.tsx`
6. `apps/cli/src/react-cli/views/agent-projection-panel.tsx`
7. `apps/cli/src/runtime/presentation/agent-projection-panel-view-model-builder.ts`
8. `apps/cli/src/runtime/presentation/agent-projection-presenter.ts`
9. `apps/cli/src/types/interfaces/cli-agent-projection-panel.interface.ts`
10. `apps/cli/test/commands/connect-command.test.ts`
11. `apps/cli/test/runtime/react-cli-runner.test.ts`
12. `apps/cli/test/runtime/react-cli-session-controller.test.ts`
13. `apps/cli/test/runtime/agent-projection-panel-view-model-builder.test.ts`
14. `integrations/desktop/README.md`
15. `integrations/desktop/examples/README.md`

## 2. Findings
### 2.1 [P2] `ReactCliSessionController` gained new panel-state ownership branches without regression coverage
- 位置: `apps/cli/test/runtime/react-cli-session-controller.test.ts:3`
- 问题描述: `ReactCliSessionController` now clones and carries `agentProjectionPanel` through both `snapshot()` and `update()`, including nested `summaryBadges` and `rows[].detailLines`, but the test suite still only covers clearing `attentionSection` and `helpSection`. There is no regression proving that `agentProjectionPanel` survives updates, can be explicitly cleared, or is defensively cloned instead of leaking caller-owned arrays into mutable session state.
- 影响: this controller is the mutation boundary between runtime facts and Ink rendering. If a later refactor accidentally keeps shared references or drops the panel during partial updates, the new formal UI consumer can render stale or silently missing projection data while the current package tests stay green.
- 建议: add controller tests that cover `agentProjectionPanel` set/keep/clear semantics and mutate the caller-provided panel after `snapshot()` / `update()` to verify defensive cloning of nested arrays.

### 2.2 [P2] The formal panel builder is only tested on one English happy path
- 位置: `apps/cli/test/runtime/agent-projection-panel-view-model-builder.test.ts:3`
- 问题描述: the new `CliAgentProjectionPanelViewModelBuilder` is documented as the transport-neutral seam for React and future desktop consumers, but its test coverage stops at one `en-US` happy path. The user-visible branches for `maxRows` truncation and `zh-CN` localized summary/detail rendering are currently untested, even though both behaviors are implemented in the builder and called out in the desktop-facing docs.
- 影响: regressions in truncation messaging or localized panel text can land without any failing test, which weakens the “formal UI consumer baseline” claim for the shared panel seam and increases drift risk between CLI and desktop-facing consumer docs.
- 建议: add targeted tests for `maxRows` footer truncation and `zh-CN` summary/detail output before treating this seam as fully closed over for rollout evidence.

## 3. Notes
1. 你贴出来的 `session-shell-ink-controller.ts` / `Esc` finding 不在当前 working-tree diff 范围内；本次报告按 `project-030 / sprint-004` 的实际改动面输出。
2. 这轮 code path 的 targeted package tests都通过了，但上述 panel-seam regression gaps 仍然存在，所以本报告保持 `review_pending`。
3. 本次是工作树评审，没有进行修复，因此未执行 `pnpm run build`。

## 4. Verification
1. `pnpm run test:packages -- apps/cli/test/commands/connect-command.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/react-cli-session-controller.test.ts apps/cli/test/runtime/agent-projection-panel-view-model-builder.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
2. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-03-30）

- 整体结论：**认可**

### 逐条复核
1. `2.1 [P2] ReactCliSessionController gained new panel-state ownership branches without regression coverage`
   - 判定：**认可**
   - 证据：`apps/cli/test/runtime/react-cli-session-controller.test.ts` 此前只覆盖 `attentionSection/helpSection` 清理，没有覆盖 `agentProjectionPanel` 的保留、显式清空和嵌套数组 defensive clone。
   - 处理：补充 `agentProjectionPanel` 的 snapshot/update/clear 回归测试，并显式验证 `summaryBadges` 与 `rows[].detailLines` 不泄露调用方数组引用。
2. `2.2 [P2] The formal panel builder is only tested on one English happy path`
   - 判定：**认可**
   - 证据：`apps/cli/test/runtime/agent-projection-panel-view-model-builder.test.ts` 原先只验证 `en-US` happy path；`zh-CN` 文字分支和 `maxRows` 截断 note 没有任何回归保护。
   - 处理：新增 `zh-CN` + `maxRows=1` 测试，覆盖 summary/detail 本地化和 footer truncation note。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/react-cli-session-controller.test.ts apps/cli/test/runtime/agent-projection-panel-view-model-builder.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/commands/connect-command.test.ts`（通过）
2. `pnpm run build`（通过）

## 修复执行记录（2026-03-30）

1. `2.1 [P2] ReactCliSessionController gained new panel-state ownership branches without regression coverage`：已完成
   - 变更文件：`apps/cli/test/runtime/react-cli-session-controller.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/react-cli-session-controller.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/commands/connect-command.test.ts`（通过）
   - 说明：新增 `agentProjectionPanel` set/keep/clear 与 defensive clone 回归。
2. `2.2 [P2] The formal panel builder is only tested on one English happy path`：已完成
   - 变更文件：`apps/cli/test/runtime/agent-projection-panel-view-model-builder.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-projection-panel-view-model-builder.test.ts apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/commands/connect-command.test.ts`（通过）
   - 说明：新增 `zh-CN` 本地化与 `maxRows` 截断说明的回归测试。
