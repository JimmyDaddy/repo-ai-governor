# Code Review: sprint-001 acp host-facing transport rollout clean recheck

- Status: resolved
- Date: 2026-04-15
- Reviewer: AI-Agent
- Task: `CR-008`
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
9. `apps/cli/src/constants/cli-acp-host.constant.ts`
10. `apps/cli/test/runtime/adapter-routing-runtime.test.ts`
11. `apps/cli/test/runtime/adapter-verification-runtime.test.ts`
12. `apps/cli/test/runtime/agent-onboarding-runtime.test.ts`
13. `apps/cli/test/runtime/agent-projection-runtime.test.ts`
14. `apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
15. `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
16. `packages/config/test/config.unit.test.ts`
17. `packages/core-agent-projection/src/agent-projection-service.ts`
18. `packages/core-agent-projection/src/index.ts`
19. `packages/core-agent-projection/src/types/index.ts`
20. `packages/core-agent-projection/src/types/interfaces/agent-projection.interface.ts`
21. `packages/core-agent-projection/src/types/interfaces/index.ts`
22. `packages/core-agent-projection/test/agent-projection-service.unit.test.ts`
23. `packages/shared/src/constants/adapter-runtime.constant.ts`

## 2. Findings
### 2.1 [P2] Missing ACP role-delegate unsupported-continuation regression coverage
- 位置: `apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
- 问题描述: `resolveRoleDelegatePreflightContinuationMutations()` 已为 role-delegate preflight 新增 `acp_exec` / continuation-unsupported 清理分支，但当前只锁住了 direct-answer preflight；single-role fallback、repository-review guard、serial fallback、parallel fallback 仍缺 ACP-specific regression coverage。
- 影响: 若 role-delegate preflight 在后续变更中漏掉 `transport_not_continuation_capable` invalidation，role lane 可能重新残留 stale continuation truth，而现有测试仍会保持全绿。
- 建议: 为上述 4 条 role-delegate 分支补齐 ACP-specific regression，显式断言 stale slot 会被投影为 `UNSUPPORTED + transport_not_continuation_capable`。

### 2.2 [P3] ACP companion diagnostic-to-projection mapping is not regression-tested
- 位置: `apps/cli/test/runtime/agent-projection-runtime.test.ts`
- 问题描述: `resolveAcpHostCompanion()` 新增了对 `HOST_READINESS_STATUS`、`DISTRIBUTION_BOUNDARY`、`COMPANION_STATE_SUMMARY` diagnostics 的映射，但测试只覆盖 `healthCheck: null` fallback path，没有覆盖 diagnostics-present path。
- 影响: 若 diagnostics code mapping 后续漂移，`connect / doctor` 的 agent-view 可能静默回退为默认 companion facts，降低 ACP rollout readiness truth 的稳定性。
- 建议: 为 ACP companion 增加 diagnostics-present regression case，断言 presenter-facing fields 使用 health-check diagnostics detail，而不是 baseline defaults。

## 3. Notes
1. 本轮 reviewer 未再指出新的实现缺陷；当前阻止 sprint-001 closeout 的问题集中在新分支缺少回归锁定。
2. 两条 finding 都属于 stricter missing-branch-coverage bar 下的 risk-based inference，已由 main agent 复核后接受。

## 4. Verification
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过，reviewer replay）
2. `pnpm run build`（通过，reviewer replay）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，reviewer replay）

## 复核结论（2026-04-15）

- 整体结论：**认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：`session-main-supervisor-runtime.ts` 的新 preflight cleanup 分支面向 role-delegate preferred surface 不再安全时的 continuation invalidation，但测试仍只覆盖 direct-answer ACP preflight；role collaboration 的 single-role、guard、serial、parallel 4 条路径都可能在后续重构时丢失该 mutation 而无回归警报。
   - 处理：接受，补齐 ACP role-delegate unsupported-continuation regression coverage。
2. `2.2`
   - 判定：**认可**
   - 证据：`agent-projection-runtime.ts` 已把 ACP diagnostics detail 映射到 `acpHostCompanion`，但现有测试只证明了默认 fallback，不证明 diagnostics-present path；这会让投影回退为默认值的回归缺少自动发现手段。
   - 处理：接受，补齐 ACP companion diagnostic-mapping regression coverage。

### 验证命令
1. `pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`（通过，reviewer replay）
2. `pnpm run build`（通过，reviewer replay）
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`（通过，reviewer replay）

## 修复执行记录（2026-04-15）

1. `2.1`：已完成
   - 变更文件：`apps/cli/test/runtime/session-main-supervisor-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：新增 ACP-specific regression coverage，锁定 single-role fallback、repository-review guard、serial fallback、parallel fallback 这 4 条 role-delegate preflight 分支上的 `transport_not_continuation_capable` mutation 与 summary 投影。
2. `2.2`：已完成
   - 变更文件：`apps/cli/test/runtime/agent-projection-runtime.test.ts`
   - 验证：`pnpm exec vitest run apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts apps/cli/test/runtime/session-main-supervisor-runtime.test.ts packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts`、`pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
   - 说明：新增 diagnostics-present regression case，锁定 `HOST_READINESS_STATUS`、`DISTRIBUTION_BOUNDARY`、`COMPANION_STATE_SUMMARY` 到 `acpHostCompanion` 的映射不会静默回退为默认值。

## 处置结果与剩余风险（2026-04-15）

1. 当前 round 的 2 条 accepted finding 均已修复，并通过同窗 focused vitest、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 重验。
2. `CR-008` 已达到 `resolved` 条件，但 sprint-001 closeout 仍依赖下一轮 fresh reviewer 返回 clean 结论。
