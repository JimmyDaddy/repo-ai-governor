# TK-665 bootstrap repo-local execution workspace sqlite registries and governance authoring surfaces

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P0`
- Project: `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`
- Sprint: `sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces`

## 1. 任务目标

在 `self-host-complete + repo_local` 路径下，模板化初始化 execution workspace、task-ledger / artifact-registry sqlite 与 governance authoring surfaces。

## 2. Depends On

1. `TK-664`

## 3. 预期产物

1. execution workspace bootstrap
2. sqlite registry bootstrap
3. governance authoring surface bootstrap

## 4. Required Inputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces/tasks/TK-664-publish-self-host-complete-profile-and-template-contract.md`
3. `.repo-ai-governor/draft/host-skill-distribution-and-discovery-follow-up-technical-solution.md`

## 5. Traceback References

1. `.repo-ai-governor/context/dev/project-060-adoption-pack-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/review/resolved_code_review_tk-652-655-host-skill-distribution-and-discovery-followup-promotion-and-decomposition.md`

## 6. 实施计划

1. 初始化 `current-context`、project/sprint/task/review skeleton。
2. 初始化 task-ledger sqlite、artifact-registry sqlite 与空 rendered views。
3. 初始化 draft、technical-solution lifecycle/delivery registry 与 technical-solution module template surfaces。

## 7. Development Verification

1. `node ./scripts/governance/check-technical-solution-delivery-registry.js`

## 8. Delivery Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `planned`。
2. 2026-04-09：已通过 `self-host-complete` bootstrap 初始化 repo-local execution workspace、task-ledger/artifact-registry sqlite、project/sprint/task/review templates 与 governance authoring surfaces。

## 10. 产出

1. 已完成：`apps/cli/src/runtime/adoption-pack-runtime.ts`
2. 已完成：`packages/standards/src/built-in-adoption-pack-catalog.ts`
3. 已完成：`.tmp/project-061-cleanroom-self-host/`
