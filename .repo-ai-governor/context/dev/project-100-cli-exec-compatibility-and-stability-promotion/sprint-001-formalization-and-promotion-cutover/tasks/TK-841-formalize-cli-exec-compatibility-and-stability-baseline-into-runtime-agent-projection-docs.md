# TK-841 formalize cli-exec compatibility and stability baseline into runtime.agent-projection docs

- Status: completed
- Date: 2026-04-13
- Owner: AI-Agent
- Priority: P0
- Project: `project-100-cli-exec-compatibility-and-stability-promotion`
- Sprint: `sprint-001-formalization-and-promotion-cutover`

## 1. 任务目标

将 approved draft 的 compatibility taxonomy、focused verification guidance 与 additive boundary 正式投影到 `runtime.agent-projection` module overview、两份 contract 和新的 producer ADR。

## 2. Depends On

1. `TK-840`
2. `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
3. `.repo-ai-governor/context/dev/project-099-cli-exec-compatibility-and-stability-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-compatibility-and-stability-productization.md`

## 3. 预期产物

1. updated `runtime.agent-projection` module overview
2. updated additive clarifications in liveness / route-probe contracts
3. `native-cli-exec-compatibility-and-stability-productization` formal ADR
4. `DA-841`

## 4. Required Inputs

1. `.repo-ai-governor/draft/cli-exec-compatibility-and-stability-productization-technical-solution.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/project-098-cli-exec-runtime-rollout-completion-audit-summary.md`
2. `.repo-ai-governor/context/dev/project-097-cli-exec-runtime-promotion-and-decomposition/plan.md`

## 6. 实施计划

1. 新增兼容性产品化 ADR，锁定 `scenario class x required preserved facts` taxonomy 和 focused verification profiles。
2. 在 `module-overview` 中补入 native `cli_exec` compatibility baseline 的 producer truth 和 loading guidance。
3. 对 `agent-invoke-liveness-contract` 与 `adapter-health-and-route-probe-contract` 只做 additive clarification，不改 minimum fields、不引入 gate truth。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-module-graph.js`
2. `node ./scripts/governance/check-normative-loading-manifest.js --mode block`

## 8. Delivery Verification

1. `node ./scripts/governance/check-docs-triad-sync.js`
2. `node ./scripts/governance/check-code-review-status-sync.js`

## 9. 执行记录

1. 2026-04-13：任务创建，状态初始化为 `planned`。
2. 2026-04-13：状态切换为 `in_progress`，开始将 approved solution 投影为 `runtime.agent-projection` formal docs。
3. 2026-04-13：已完成 overview / contract / ADR formal landing，并形成 `DA-841`。

## 10. 产出

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/native-cli-exec-compatibility-and-stability-productization.md`
5. `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/sprint-001-formalization-and-promotion-cutover/tasks/DA-841-cli-exec-compatibility-and-stability-formal-docs-baseline.md`
