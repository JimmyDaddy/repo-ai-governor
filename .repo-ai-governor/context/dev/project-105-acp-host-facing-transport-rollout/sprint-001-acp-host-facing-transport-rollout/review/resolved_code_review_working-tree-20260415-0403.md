# Code Review: sprint-001 acp host-facing transport rollout clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-007`
- Review Type: working tree review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/cr-lifecycle-threshold-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/execution-gate-layering-spec.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`

## 1. Review Scope
1. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
2. `apps/cli/src/runtime/adapter-routing-runtime.ts`
3. `apps/cli/src/cli-governance-runtime.ts`
4. `apps/cli/src/runtime/session-main-supervisor-runtime.ts`
5. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
6. `apps/cli/src/runtime/agent-projection-runtime.ts`
7. `apps/cli/src/runtime/local-model-probe-runtime.ts`
8. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
9. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
10. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
11. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
12. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
13. `apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
14. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
15. `packages/config/test/config.unit.test.ts`
16. `packages/core-agent-projection/src/agent-projection-service.ts`
17. `packages/core-agent-projection/test/agent-projection-service.unit.test.ts`

## 2. Findings
### 2.1 [P1] Role-delegate preflight left stale continuation state behind
- 位置: `apps/cli/src/runtime/session-main-supervisor-runtime.ts:1055`
- 问题描述: direct-answer 的 preflight cleanup 已补齐，但 single-role、serial、parallel 这三条 role-collaboration 路径仍然只在真正 dispatch 的 fallback surface 上处理 continuation；当 preferred role surface 在 preflight 被 guard 掉或降级到 `ollama` 时，旧的 role lane continuation slot 仍会残留。
- 影响: role lane 从 `remote_api` 切换到 `cli_exec/acp_exec/local fallback` 后，canonical session state 仍可能保留过期 handle，后续 role turn 可能展示或误复用错误 transport 的 continuation truth。
- 建议: 把 role-delegate preflight cleanup 做成和 direct-answer 对称的模式，并用 single-role fallback、single-role guard、serial fallback、parallel fallback 回归测试锁定。

## 3. Notes
1. 本轮 findings 来自 fresh reviewer round 7；main agent 已复核并接受该 finding。
2. reviewer 未在 scoped surface 中发现第二条 actionable issue。
3. 本文件只记录 round-7 finding 修复与验证结果；sprint closeout 仍取决于下一轮 fresh reviewer 是否 clean。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：role-delegate 的 preferred surface 一旦在 preflight 被 guard 掉或降级到 fallback，之前的 role continuation slot 仍然不会被回收；这和 direct-answer 已建立的 preflight cleanup 语义不一致。
   - 处理：已接受，改为在 role-delegate preflight 结束后，为 preferred role surface 统一尝试 continuation invalidation，并把 preflight mutations 合并到 single-role、serial、parallel 的最终 outcome；同时补齐四条 role-side regression coverage。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过）
2. `pnpm run build`（通过）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/src/runtime/session-main-supervisor-runtime.ts`、`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：role-delegate 现在会在 preflight 阶段就为 preferred role surface 解析 continuation invalidation，并把该 mutation 合并到 single-role、serial、parallel 的 guard/fallback outcome；新增回归测试覆盖 planner/reviewer 的 single-role fallback、reviewer guard、serial fallback、parallel fallback 分支。

## 处置结果与剩余风险（2026-04-15）

1. 当前 round 的 accepted finding 已全部修复，并通过同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-007` 已达到 `resolved` 条件，但 sprint closeout 仍需新的 fresh reviewer round 返回 clean 结论后才能继续推进。
