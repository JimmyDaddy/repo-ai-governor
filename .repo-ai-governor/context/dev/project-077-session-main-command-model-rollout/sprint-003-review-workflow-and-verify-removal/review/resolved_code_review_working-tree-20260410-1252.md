# Code Review: sprint-003-review-workflow-and-verify-removal working tree round 5

- Status: resolved
- Date: 2026-04-10
- Reviewer: AI-Agent
- Task: `CR-005`
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
2. `packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`
3. `packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
4. `apps/cli/test/runtime/session-shell-runner.test.ts`

## 2. Findings

### 2.1 [P2] Explicit `@reviewer` verify-style turns can still be stolen by governed routing

- 位置: `packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts:136`
- 问题描述: deterministic foreground skill routing 只对 `/review verify` 分支加了 role-mention guard，但同一语义下的 `verify -> doctor` migration 和其他 deterministic branches 仍会在 dispatcher 去掉 `@reviewer` mention 后重新抢占路由，导致显式 raw-role entry 不能稳定落到 supervisor collaboration path。
- 影响: expert 用户无法可靠使用 `@reviewer` 做 verify-style 原始协作，和 sprint-003 约定的 raw-role / AI fixed workflow 分层不一致。
- 建议: 只要检测到显式 configured role mention，skill registry 就整体退出 deterministic routing，并补齐 registry + dispatcher 覆盖保护这个 bypass。

### 2.2 [P3] Deleted `/verify` shell migration branch lacks direct regression coverage

- 位置: `apps/cli/src/runtime/interactive-shell/session-shell-runner.ts:1064`
- 问题描述: runner 已经对 `/verify*` 做 removed-command guidance 特判，但测试只覆盖了 resumed `/doctor` handoff，没有真正提交 `/verify` 或 `/verify ...` 来断言迁移提示文案。
- 影响: 后续重构时可能无声回退成 generic unknown slash command，导致 `/verify` 删除后的迁移入口失去保护。
- 建议: 增加 runner 回归测试，直接提交 `/verify adapters` 并断言 removal guidance 文案出现、command executor 不会被调用、generic unknown-command copy 不会误触发。

## 3. Notes

1. 本轮 fresh reviewer 未发现其他新的 actionable finding；问题集中在 raw-role bypass 优先级和 removed `/verify` migration branch coverage。

## 4. Verification

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 5. 复核结论（2026-04-10）

- 整体结论：**认可**

### 逐条复核

1. `2.1`
   - 判定：**认可**
   - 证据：`LocalOrchestrationServiceSessionMainSkillRegistry` 现在在显式 configured role mention 存在时直接返回 `null`，不再把 stripped message 重新抢成 `review verify`、`doctor` 或其他 deterministic command routing；skill-registry 与 dispatcher 单测都覆盖了 `@reviewer verify ...` raw-role bypass。
   - 处理：显式 `@reviewer` verify-style turns 重新回到 supervisor raw-role collaboration path。
2. `2.2`
   - 判定：**认可**
   - 证据：`apps/cli/test/runtime/session-shell-runner.test.ts` 新增 `/verify adapters` runner regression，直接断言 removed `/verify` migration guidance 出现、command executor 未触发、generic unknown-command copy 未出现。
   - 处理：removed `/verify` shell migration branch 现在有直接回归保护。

### 验证命令

1. `pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
2. `pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
3. `pnpm run build`（通过）
4. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）
5. `pnpm run test:integration -- --maxWorkers=1 --maxConcurrency=1`（通过）
6. `node ./scripts/governance/check-task-ledger-sync.js`（通过）
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`（通过）
8. `node ./scripts/governance/check-code-review-status-sync.js`（通过）
9. `node ./scripts/governance/check-technical-solution-delivery-registry.js`（通过）
10. `node ./scripts/governance/check-worktree-review-target.js`（通过）

## 6. 修复执行记录（2026-04-10）

1. `2.1`：已完成
   - 变更文件：`packages/core-orchestration-service/src/local-orchestration-service-session-main-skill-registry.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts`、`packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`
   - 验证：`pnpm exec vitest run packages/core-orchestration-service/test/local-orchestration-service-session-main-skill-registry.unit.test.ts packages/core-orchestration-service/test/local-orchestration-service-session-main-agent-dispatcher.unit.test.ts`（通过）
   - 说明：explicit raw-role entry 现在整体绕过 deterministic command routing，避免 verify-style asks 被 `/review verify` 或 `doctor` migration 抢走。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/runtime/session-shell-runner.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/session-shell-runner.test.ts`（通过）
   - 说明：`/verify` removal guidance 分支已被直接回归测试覆盖。

## 7. 处置结果与剩余风险

1. 本轮发现已修复，并通过同窗口 `build + packages/integration tests + governance gates` 验证。
2. 仍需再起一轮 fresh reviewer clean recheck，确认 sprint-003 当前 working tree 已无新的 actionable finding 后再进入 sprint closeout。
