# TK-860 implement ACP host-facing transport rollout baseline

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-105-acp-host-facing-transport-rollout`
- Sprint: `sprint-001-acp-host-facing-transport-rollout`

## 1. 任务目标

将 `technical-solution.acp-host-facing-transport-formalization` 的 formal direction 落成真实 rollout baseline，启动 `acp_exec` host-facing transport、`acp_host_companion` carry path、packaged distribution 与 clean-room verify 的 implementation planning。

## 2. Depends On

1. `DA-855`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 3. 预期产物

1. rollout implementation baseline
2. host-facing transport execution notes and verification evidence
3. updated task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/tasks/DA-855-acp-host-facing-transport-formalization-promotion-cutover.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/acp-host-facing-transport-formalization-and-distribution-boundary.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/acp-host-facing-transport-formalization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-101-cli-exec-followup-solution-review-and-promotion/sprint-004-acp-host-facing-transport-formalization/review/solution_review_acp-host-facing-transport-formalization.md`

## 6. 实施计划

1. 以 `acp_exec` distinct transport truth 与 `acp_host_companion` carrier 为前置，拆分 host-facing implementation、packaged distribution 与 runtime-service enablement scope。
2. 对齐 clean-room verify、support wording uplift 与 adopter guidance evidence，避免 rollout window 回退到 `cli_exec` alias 语义。
3. 激活时同步 task ledger、checklist、tasks.csv 与后续 CR loop surface。

## 7. Development Verification

1. `pnpm exec vitest run packages/config/test/config.unit.test.ts packages/core-agent-projection/test/agent-projection-service.unit.test.ts apps/cli/test/runtime/agent-projection-runtime.test.ts apps/cli/test/runtime/adapter-routing-runtime.test.ts apps/cli/test/runtime/agent-onboarding-runtime.test.ts apps/cli/test/runtime/adapter-verification-runtime.test.ts apps/cli/test/runtime/session-main-provider-continuation-runtime.test.ts`
2. `pnpm run build`
3. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`
3. `node ./scripts/governance/check-task-ledger-sync.js`
4. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`，作为 `followup_required` rollout skeleton 的 canonical task。
2. 2026-04-15：`project-104` final closeout 完成后，当前任务切换为 `in_progress`，并作为 `project-105 / sprint-001` 的 implementation 入口；下一步先本地预留 `CR-001`，再开始 `acp_exec` distinct transport 与 `acp_host_companion` carrier 实现。
3. 2026-04-15：已将 `acp_exec` 正式加入 shared transport truth，并在 CLI runtime 落下 fail-closed ACP host protocol baseline：routing 会显式返回 `acp_exec` protocol、local probe 不再把 ACP 误当 `cli_exec` 命令检查、projection 会保留 `acp_host_companion`、continuation seam 会对 ACP 直接返回 `null`。同窗 focused suites、`pnpm run build` 与 `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 已通过，当前 baseline implementation 完成并进入 `CR-001` review loop。

## 10. 产出

1. `packages/shared/src/constants/adapter-runtime.constant.ts`
2. `apps/cli/src/constants/cli-acp-host.constant.ts`
3. `apps/cli/src/runtime/cli-acp-host-protocol.ts`
4. `apps/cli/src/runtime/adapter-routing-runtime.ts`
5. `apps/cli/src/runtime/local-model-probe-runtime.ts`
6. `apps/cli/src/runtime/agent-projection-runtime.ts`
7. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
8. `apps/cli/src/runtime/session-main-provider-continuation-runtime.ts`
