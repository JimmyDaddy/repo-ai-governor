# Code Review: project-077 sprint-002 capability-model-and-plan-workflow-cutover

- Status: resolved
- Date: 2026-04-10
- Reviewer: AI-Agent
- Task: `CR-001`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`

## 1. Review Scope
1. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
2. `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts`
3. `apps/cli/test/runtime/session-slash-command-registry.test.ts`
4. `apps/cli/test/runtime/session-shell-runner.test.ts`
5. `packages/shared/src/i18n/locales/en-us.ts`
6. `packages/shared/src/i18n/locales/zh-cn.ts`

## 2. Findings
### 2.1 [P1] Slash parser lowercases `/plan` goals and `/plan sync` artifact paths before routing
- 位置: `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
- 问题描述: slash registry 在解析 `/plan` 与 `/plan sync` 时，先把整条 query lower-case 再切 token。这样命令关键字虽然能正确命中，但参数也会一起被改写，导致 planner 收到被降成小写的 goal 文本，`/plan sync commit <artifact>` 也会把大小写敏感路径破坏掉。
- 影响: planning workflow 会丢失用户原始目标文本，deterministic ledger bridge 也可能因为 artifact path 被改写而找不到 preview/commit 文件。
- 建议: 只对命令关键字做大小写不敏感匹配，参数 token 保留原样并按原文回传给 AI workflow prompt 与 bridge argv。

## 3. Notes
1. delegated reviewer 还提出了 `/plan` transcript/history 泄露内部 prompt 与 `planSync` locale 缺失两条问题；主 agent 复核当前工作树后确认这两处已经在本轮之前修复完成，因此未作为本次 actionable finding 保留。
2. `node ./scripts/governance/check-sprint-plan-status-sync.js` 在本轮验证中失败，但失败来源是并行流 `project-076 / sprint-003` 的既有状态漂移，不是本次 sprint-002 代码修复引入的问题。

## 4. Verification
1. `pnpm run build >/tmp/project077-sprint002-build.log && echo BUILD_OK`（通过）
2. `pnpm vitest apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --run`（通过）
3. `pnpm vitest packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --run`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（失败：`.repo-ai-governor/context/dev/project-076-transport-selection-authority-rollout/sprint-003-evidence-gated-docs-and-adopter-truth` 的 sprint/checklist 状态与最新 `tasks.csv` 漂移，属并行 stream 既有问题）

## 复核结论（2026-04-10）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：当前 `session-slash-command-registry` 已改为基于原始 query token 做命令匹配；只有命令关键字按大小写不敏感处理，参数 token 原样保留并继续流向 `/plan` AI workflow prompt 与 `/plan sync` bridge argv。
   - 处理：已接受并修复，同时补上 mixed-case `/PLAN ...` 与 `/PLAN SYNC commit ./Context/...` 回归覆盖。
2. delegated-finding-2
   - 判定：**不认可**
   - 证据：`session-shell-runner` 当前已经通过 `displayUserMessage` override 保留 `/plan ...` 原始 transcript/history，而内部 planning template 仅作为 service turn payload 发送，不再暴露到用户 transcript。
   - 处理：视为 stale finding，不重复修复。
3. delegated-finding-3
   - 判定：**不认可**
   - 证据：`packages/shared/src/i18n/locales/en-us.ts` 与 `packages/shared/src/i18n/locales/zh-cn.ts` 均已包含 `cli.sessionShell.commands.planSync.summary` 文案。
   - 处理：视为 stale finding，不重复修复。

### 验证命令
1. `pnpm run build >/tmp/project077-sprint002-build.log && echo BUILD_OK`（通过）
2. `pnpm vitest apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --run`（通过）
3. `pnpm vitest packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --run`（通过）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
5. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
6. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 修复执行记录（2026-04-10）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
   - 验证：`pnpm vitest apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts --run`（通过）
   - 说明：slash registry 改为保留原始参数 token，只对命令关键字执行大小写不敏感匹配。
2. `2.1`：已完成
   - 变更文件：`apps/cli/test/runtime/session-slash-command-registry.test.ts`
   - 验证：`pnpm vitest packages/core-orchestration-service/test/local-orchestration-service-session-main-capability-catalog.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-shell.unit.test.ts apps/cli/test/runtime/session-slash-command-registry.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/session-main-parity.integration.test.ts apps/cli/test/cli-output-contract.integration.test.ts --run`（通过）
   - 说明：补上 mixed-case `/plan` goal 与 `/plan sync commit` artifact path 的回归覆盖，防止未来再次把用户输入降成小写。
