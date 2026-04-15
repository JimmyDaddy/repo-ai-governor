# TK-837 remediate cli-exec compatibility and stability productization draft against blocking review findings

- Status: completed
- Date: 2026-04-13
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-099-cli-exec-compatibility-and-stability-solution-review`
- Sprint: `sprint-002-draft-remediation-and-rereview`

## 1. 任务目标

按上一轮 canonical technical-solution review 的两条 blocking finding 直接修订 draft，使其在 compatibility taxonomy 与 canonical focused verification profile 上形成可 promotion-ready 的明确方案。

## 2. Depends On

1. `TK-835`
2. `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-compatibility-and-stability-productization.md`

## 3. 预期产物

1. 修订后的 `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
2. 明确的 `scenario class x required preserved facts` 矩阵
3. 明确的 `profile_id + exact command + trigger matrix + evidence write-back` guidance

## 4. Required Inputs

1. `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-compatibility-and-stability-productization.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/module-overview.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/governance-execution-gates/contracts/gate-execution-profile-contract.md`
7. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/project-098-cli-exec-runtime-rollout-completion-audit-summary.md`

## 5. Traceback References

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/plan.md`

## 6. 实施计划

1. 把 compatibility taxonomy 从单一平铺列表改成 `scenario class x required preserved facts` 的二维表达。
2. 把 `project-098` 的证据命令收敛成具名 compatibility verification profiles，并补齐 trigger matrix。
3. 补齐 evidence write-back contract，明确 profile 执行结果应写到哪些 canonical governance surface。

## 7. Development Verification

1. docs/source cross-check：draft、review artifact、liveness contract、route-probe contract、governance-execution-gates docs、project-098 completion audit

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-837 --tasks-dir ".repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-002-draft-remediation-and-rereview/tasks" --result "Revised the draft to define a scenario/invariant matrix and canonical compatibility verification profiles." --verify "docs/source cross-check: review artifact + runtime contracts + governance-execution-gates docs + project-098 completion audit" --review-delta "Prepared the draft for re-review-after-updates without changing runtime code or formal docs."`
2. docs-only remediation window：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `in_progress`，目标是按 `TK-835` 的两条 blocking finding 直接修订 draft。
2. 2026-04-13：已把 compatibility taxonomy 改写为 `scenario class x required preserved facts`，并补齐 owner / surface / evidence mapping。
3. 2026-04-13：已定义 `cli_exec_compatibility_full / runtime_foundation / adapter_slice` 三档 profile、trigger matrix 与 evidence write-back contract；任务完成。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
