# TK-743 promote solution and decompose rollout into project-077 implementation sprints

- Status: completed
- Date: 2026-04-10
- Owner: AI-Agent
- Priority: P0
- Project: `project-077-session-main-command-model-rollout`
- Sprint: `sprint-001-solution-review-promotion-and-rollout-decomposition`

## 1. 任务目标

在 review approved 前提下执行 `technical-solution-promotion`，把 formal docs、registries 与 rollout decomposition 一次性落地到 `project-077 / sprint-002 ~ sprint-005`。

## 2. Depends On

1. `TK-742`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 3. 预期产物

1. `runtime.orchestration` formal ADR + contract
2. `runtime.cli-interactive-shell` module / contract amendments
3. `project-077 / sprint-002 ~ sprint-005` plan/tasks/checklist/tasks.csv/task cards
4. delivery handoff artifact 与 current-context primary switch

## 4. Required Inputs

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/module-overview.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`

## 5. Traceback References

1. `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
2. `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
3. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
4. `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
5. `.repo-ai-governor/context/dev/project-075-transport-selection-authority-promotion-and-decomposition/plan.md`

## 6. 实施计划

1. promotion 时以 `runtime.orchestration` 为主承载新增 command-model ADR 与 capability interaction model contract。
2. 同步删除 public `/verify` 的 formal discoverability，并把 PRD / brief / overall / architecture wording 改写到新的 readiness 表述。
3. 生成 `project-077 / sprint-002 ~ sprint-005` rollout package、`DA` handoff artifact，并在 sprint-001 收口后切换 primary 到 `project-077 / sprint-002`。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-lifecycle-registry.js`
2. `node ./scripts/governance/check-technical-solution-delivery-registry.js`
3. `node ./scripts/governance/check-technical-solution-module-graph.js`
4. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`
5. `node ./scripts/governance/check-docs-triad-sync.js`
6. `node ./scripts/governance/check-task-ledger-sync.js`
7. `node ./scripts/governance/check-sprint-plan-status-sync.js`
8. `node ./scripts/governance/check-artifact-registry-lifecycle.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-code-review-status-sync.js`
2. docs-only promotion window 默认不要求 `pnpm run build`；若同窗意外修改 `apps/**`、`packages/**`、`bin/**` 或 `test/**`，则补跑 build/tsc

## 9. 执行记录

1. 2026-04-10：任务创建，状态初始化为 `planned`。
2. 2026-04-10：完成 `runtime.orchestration` command-model ADR + capability interaction model contract，以及 `runtime.cli-interactive-shell` consumer-facing formal amendments。
3. 2026-04-10：lifecycle 已将 solution 推进为 `active` 并写入 `final_paths`；delivery registry 已固定为 `followup_required` 指向 `project-077 / sprint-002`。
4. 2026-04-10：完成 `project-077 / sprint-002 ~ sprint-005` decomposition、`DA-719` handoff artifact、artifact registry write-back 与 `current-context.md` primary stream 切换。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/contracts/session-main-capability-interaction-model-contract.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-orchestration/adrs/session-main-prompt-first-command-model-and-deterministic-workflow-split.md`
3. `.repo-ai-governor/context/dev/project-077-session-main-command-model-rollout/sprint-001-solution-review-promotion-and-rollout-decomposition/tasks/DA-719-session-main-command-model-promotion-and-rollout-decomposition-handoff.md`
