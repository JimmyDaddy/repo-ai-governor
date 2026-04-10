# Code Review: sprint-003-review-workflow-and-verify-removal working tree round 2

- Status: resolved
- Date: 2026-04-10
- Reviewer: AI-Agent
- Task: `CR-002`
- Review Type: delegated post-fix recheck
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-scoped-cr-loop/SKILL.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope

1. `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`
2. `apps/cli/src/runtime/interactive-shell/session-slash-command-registry.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`

## 2. Findings

### 2.1 [P1] `/review` 与 `/review verify` 的 session-shell AI workflow 会被误路由到 `/workflow`

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:217`
- 问题描述: session shell 为 `/review` 与 `/review verify` 生成的 AI-workflow prompt 都包含 `workflow` 字样，而 skill registry 在 review 分支之前就先检查 `SESSION_MAIN_WORKFLOW_KEYWORDS`。结果这两个 public review slash surface 会在 dispatcher 中被错误识别为 `workflow.preview`，不再进入 review / review verify 的受治理执行流。
- 影响: 这直接破坏了 `sprint-003` 的核心目标，用户在 shell 中输入 `/review` 或 `/review verify` 时会掉到错误命令面。
- 建议: 把 workflow routing 优先级下移到 review 之后，并让 `review_verify` 显式识别 `review-verification` 这类 AI-workflow prompt 句式，再补一条针对这两段 prompt 的回归测试。

## 3. Notes

1. 本轮 fresh reviewer 只发现这一项阻塞回归，未发现其他新的 actionable finding。
2. 问题来自 session-shell AI-workflow prompt 与 skill-registry keyword priority 的交互，不是 CLI `workflow preview` 本身的行为错误。

## 4. Verification

1. `pnpm run build`（通过，进入本轮 recheck 前的同窗口基线）
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，进入本轮 recheck 前的同窗口基线）
3. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过，进入本轮 recheck 前的同窗口基线）
4. `node ./scripts/governance/check-task-ledger-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
5. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
6. `node ./scripts/governance/check-code-review-status-sync.js`（通过，进入本轮 recheck 前的同窗口基线）
7. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过，进入本轮 recheck 前的同窗口基线）
8. `node ./scripts/governance/check-worktree-review-target.js`（通过，进入本轮 recheck 前的同窗口基线）

## 5. 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts` 现已把 `workflow` routing 下移到 review 分支之后，并把 review 匹配从 substring 提升为 pattern matching，避免 `preview` / `workflow` 字样误伤 review surface；同时 `review_verify` 现在显式识别 `review verification / review-verification`。`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts` 新增了针对 `/review` 与 `/review verify` AI-workflow prompt 的回归测试。
   - 处理：`/review` 与 `/review verify` 的 shell prompt 不再落到 `/workflow`，而是稳定回到 review/review verify 的受治理执行流。

### 验证命令

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
4. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
6. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
7. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
8. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
9. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 6. 修复执行记录（2026-04-10）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`（通过）
   - 说明：修复后，review shell AI-workflow prompt 会稳定命中 review/review verify，不再被 workflow keyword 抢占。

## 7. 处置结果与剩余风险

1. 本轮发现已修复并通过同窗口 `build + packages/integration tests + governance gates` 验证。
2. 下一步仍需起 fresh reviewer round，确认当前 working tree 已无新的 actionable finding，才能把 `sprint-003` 视为 clean。
