# Code Review: project-033 working tree 20260331-1328

- Status: resolved
- Date: 2026-03-31
- Reviewer: AI-Agent
- Task: `TK-455 / TK-456`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 1. Review Scope

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts`
2. `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
4. `packages/orchestration-service-client/src/constants/orchestration-service.constant.ts`
5. `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`
6. `apps/cli/test/runtime/session-shell-transcript-store.test.ts`
7. `packages/shared/src/i18n/locales/en-us.ts`
8. `packages/shared/src/i18n/locales/zh-cn.ts`
9. `project-033` sprint/project planning artifacts and related contract-registry sync files in `.repo-ai-governor/**`

## 2. Findings

### 2.1 [P1] Generic `session.main` turns lost the only content-specific assistant recap, and the existing shell suite is already red

- 位置:
  - `apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts:213-239`
  - `packages/core-orchestration-service/src/local-orchestration-service-session-main-agent-dispatcher.ts:175-185`
- 问题描述:
  `TURN_COMPLETED` 的默认 transcript 分支现在只渲染 `mainTurnAccepted + executionIntent + routing + backlinks`。与此同时，dispatcher 的默认 `ANSWER` 分支没有提供 `assistantMessage`，所以普通主 agent turn 最终不会留下任何与实际输入内容相关的 assistant recap。这个回归已经不是理论问题：`pnpm run test:packages -- packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1` 会把 `apps/cli/test/runtime/session-shell-runner.test.ts` 一并跑红，失败点正是 multiline flow 里原先存在的 `echo=...` assistant recap 消失了。
- 影响:
  现有 session shell 交互基线已经退化。普通 turn 在 transcript 中只剩“accepted/intent/routing”框架信息，用户看不到本轮 assistant 对输入的任何 recap，而现有 package test 也已经不能通过。
- 建议:
  在 richer answer renderer 真正落地前，至少恢复一个 backward-compatible recap 路径：要么让 `ANSWER` 分支产出真实 `assistantMessage`，要么在 transcript fallback 分支继续保留 `mainTurnEcho` 或等价的 command-recap 文本。

### 2.2 [P2] Failed and cancelled turns do not consume `turnIndex`, so later turns can reuse the same canonical number

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts:150-153,227-246,575-578`
- 问题描述:
  `turnIndex` 目前来自 `countCompletedTurns(existingSession) + 1`，而 `countCompletedTurns(...)` 只统计 `TURN_COMPLETED`。这意味着某一轮如果落到 `TURN_FAILED` 或 `TURN_CANCELLED`，它虽然会把 `turnIndex` 和 `turnCount` 写进事件/context，但不会增加下一轮的基数；后续 turn 会复用同一个 index。
- 影响:
  canonical session truth 的 turn numbering 在失败/取消后不再单调递增。后续 transcript、resume、analytics 或 backlink consumer 一旦把 `turnIndex` 当作稳定的 per-turn 标识，就会得到重复编号和含义模糊的 turn 历史。
- 建议:
  下一轮索引应基于“已提交 turn 总数”或持久化 `turnCount` 递增，而不是只数 completed 事件；同时补一条 `failure/cancel -> next turn` 的回归测试来锁住编号单调性。

## 3. Notes

1. 这次 review 按你的指向落在 `project-033 / sprint-003`，没有沿用 `current-context.md` 当前仍保留的 `project-032` closeout review surface。
2. `pnpm run build` 能通过，说明类型/构建面没有断；但 package-level runtime test 目前不全绿，所以这轮不能视为无风险收口。
3. 与 `project-033` 同窗口一起出现的 `project-032` output-presentation promotion/registry 变更我只做了同步性核对，没有把它们当作本次 CR 的主要 finding 面。

## 4. Verification

1. `pnpm run build`（通过）
2. `pnpm run test:packages -- packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts --maxWorkers=1 --maxConcurrency=1`（失败：`apps/cli/test/runtime/session-shell-runner.test.ts > supports multiline capture, history/search inspection, and shell passthrough summaries`）
3. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`（通过）
4. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
5. `node ./scripts/governance/check-technical-solution-module-graph.js`（通过）
6. `node ./scripts/governance/run-normative-loading-manifest-gate.js`（通过）
7. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
8. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）

## 复核结论（2026-03-31）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 `TURN_COMPLETED` fallback transcript 分支确实只保留了 accepted/intent/routing/backlinks，而普通 `responseMode='answer'` payload 没有 `assistantMessage`。`apps/cli/test/runtime/session-shell-runner.test.ts` 仍显式要求 multiline turn 保留 `echo=...` recap。
   - 处理：已在 [session-shell-transcript-store.ts](/Users/jimmydaddy/study/ai-governor/apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts) 的 fallback 分支恢复 `mainTurnEcho(latestUserMessage)`，并新增 transcript-store regression test 锁住 plain answer recap。
2. `2.2`
   - 判定：**认可**
   - 证据：原实现把 `turnIndex` 基数绑定到 `TURN_COMPLETED` 数量，失败/取消 turn 不会推进下一轮索引，确实存在编号复用风险。
   - 处理：已在 [local-orchestration-service-session-runtime.ts](/Users/jimmydaddy/study/ai-governor/packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts) 改为优先消费持久化 `turnCount`，缺省时回退到 `TURN_SUBMITTED` 计数，并补了 `failure/cancel -> next success` 单调递增测试。

### 验证命令
1. `pnpm run build`（通过）
2. `/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-03-31）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-shell-transcript-store.ts`、`apps/cli/test/runtime/session-shell-transcript-store.test.ts`
   - 验证：`pnpm run build`（通过）；`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：恢复 plain completed turn 的兼容式 `echo` recap，避免 session shell 只剩框架元数据而丢失本轮输入相关内容。
2. `2.2`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-runtime.ts`、`packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts`
   - 验证：`pnpm run build`（通过）；`/opt/homebrew/bin/node ./node_modules/vitest/vitest.mjs run packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --maxWorkers=1 --maxConcurrency=1`（通过）
   - 说明：turn numbering 现以持久化 `turnCount` / submitted-turn 基数单调递增，失败与取消不会复用后续 turn 的 canonical index。
