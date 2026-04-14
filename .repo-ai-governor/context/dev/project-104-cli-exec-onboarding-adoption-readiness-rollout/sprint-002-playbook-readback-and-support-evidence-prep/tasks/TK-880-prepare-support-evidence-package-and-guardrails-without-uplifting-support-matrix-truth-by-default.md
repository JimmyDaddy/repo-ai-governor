# TK-880 prepare support-evidence package and guardrails without uplifting support-matrix truth by default

- Status: completed
- Date: 2026-04-14
- Owner: AI-Agent
- Priority: P1
- Project: `project-104-cli-exec-onboarding-adoption-readiness-rollout`
- Sprint: `sprint-002-playbook-readback-and-support-evidence-prep`

## 1. 任务目标

准备 support-evidence package 与 guardrails，同时保持 support-matrix truth 继续受 evidence gate 控制，不在默认路径提前 uplift。

## 2. Depends On

1. `TK-879`
2. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`

## 3. 预期产物

1. support-evidence package plan
2. support guardrails and rollout notes
3. synced task ledger once activation begins

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-104-cli-exec-onboarding-adoption-readiness-rollout/sprint-002-playbook-readback-and-support-evidence-prep/tasks/TK-879-apply-the-readiness-evidence-chain-to-local-adoption-readback-and-playbook-consumer-surfaces.md`
2. `.repo-ai-governor/context/dev/project-103-cli-exec-additive-diagnostics-consumer-rollout/plan.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/cli-exec-five-direction-dependency-and-sequencing-analysis-technical-solution.md`

## 6. 实施计划

1. 将 support-evidence package 拆成真实 rollout-owned preparation scope。
2. 固定 support guardrails，避免未清洁 evidence 就 uplift support-matrix truth。
3. 为 `TK-881` final closeout 准备 delivery-ready evidence surface。

## 7. Development Verification

1. `pnpm run build`
2. `pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`
3. `node ./scripts/governance/check-code-review-status-sync.js`
4. `node ./scripts/governance/check-worktree-review-target.js`

## 9. 执行记录

1. 2026-04-14：任务创建，状态初始化为 `planned`。
2. 2026-04-14：已将 support-evidence handoff 最小包与“无证据不 uplift support truth”的 guardrail 写入 `docs/support-matrix*.md`，同时保持现有 support row 与 public support wording 不变。
3. 2026-04-14：当前任务与 `TK-879` 共享同一 docs-only rollout window，并复用 `pnpm run build`、`pnpm run test:packages -- --maxWorkers=1 --maxConcurrency=1` 与 ledger/governance sync evidence；实现边界已完成，等待 fresh reviewer loop。

## 10. 产出

1. `docs/support-matrix.md`
2. `docs/support-matrix.zh-CN.md`
