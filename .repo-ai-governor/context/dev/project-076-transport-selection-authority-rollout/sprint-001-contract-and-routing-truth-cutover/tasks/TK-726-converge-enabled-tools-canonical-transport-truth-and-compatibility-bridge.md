# TK-726 converge enabled-tools canonical transport truth and compatibility bridge

- Status: completed
- Date: 2026-04-09
- Owner: AI-Agent
- Priority: P0
- Project: `project-076-transport-selection-authority-rollout`
- Sprint: `sprint-001-contract-and-routing-truth-cutover`

## 1. 任务目标

将 onboarding transport truth 固定到 `enabled_tools[]`，并把 `tool_transport_matrix` 收敛为兼容期 derived bridge。

## 2. Depends On

1. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-718-transport-selection-authority-promotion-and-rollout-decomposition-handoff.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`

## 3. 预期产物

1. onboarding runtime truth convergence
2. compatibility bridge migration note
3. updated diagnostics payload shape

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
2. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
3. `apps/cli/src/runtime/agent-onboarding-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/plan.md`
2. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`

## 6. 实施计划

1. 把 `enabled_tools[]` 定为 transport truth 的唯一 canonical machine surface。
2. 将 `configured_remote_api` 与 `remote_api_candidate` alias 边界落到 runtime / presenter。
3. 产出 compatibility migration note 与 consumer owner。

## 7. Development Verification

1. `pnpm -s tsc -p tsconfig.json --noEmit`
2. `node ./scripts/governance/check-docs-triad-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已将 onboarding transport truth 收敛到结构化 `enabled_tools[]` machine surface，并把 `tool_transport_matrix` 改为从 canonical truth 派生的兼容 bridge。
3. 2026-04-09：已在 runtime payload 中补齐 `transport_kind`、`provider_kind`、`vendor_binding_kind`、`credential_mode`、`endpoint_source`、`transport_selection_source`、`transport_selection_locked` 与 `configured_remote_api` 等真值字段，同时保留 `remote_api_candidate` 兼容 alias。
4. 2026-04-09：已通过 `pnpm run build` 与 sprint-001 targeted vitest 回归集验证实现收口。

## 10. 产出

1. `apps/cli/src/runtime/agent-onboarding-runtime.ts`
2. `packages/shared/src/constants/adapter-runtime.constant.ts`
3. `packages/shared/src/constants/index.ts`
4. `packages/shared/src/index.ts`
