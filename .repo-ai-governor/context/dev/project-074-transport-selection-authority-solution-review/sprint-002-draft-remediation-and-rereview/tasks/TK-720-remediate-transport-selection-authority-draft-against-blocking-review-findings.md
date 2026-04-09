# TK-720 remediate transport-selection-authority draft against blocking review findings

- Status: completed
- Date: 2026-04-09
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-074-transport-selection-authority-solution-review`
- Sprint: `sprint-002-draft-remediation-and-rereview`

## 1. 任务目标

按上一轮 canonical technical-solution review 的两条 blocking finding 直接修订 draft，使其在 onboarding canonical truth 与 support-truth evidence gate 上形成可 promotion-ready 的明确方案。

## 2. Depends On

1. `TK-718`
2. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`

## 3. 预期产物

1. 修订后的 `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
2. 明确的 onboarding canonical truth convergence plan
3. 明确的 public support wording evidence gate

## 4. Required Inputs

1. `.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
2. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_transport-selection-authority-and-strict-routing-followup.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/remote-api-transport-and-provider-binding-seam.md`
5. `apps/cli/src/runtime/agent-onboarding-runtime.ts`

## 5. Traceback References

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/plan.md`

## 6. 实施计划

1. 把 onboarding truth 的 canonical machine surface 明确收敛到单一 payload slot，并写清兼容期策略。
2. 把 `remote_api` 的 public support wording 升级改成 evidence-gated delivery follow-up，而不是自动文档切换。
3. 顺手补齐与既有 active solution 的关系说明，避免后续 promotion 时出现平行语义。

## 7. Development Verification

1. docs/source cross-check：draft、review artifact、onboarding contract、remote-api ADR、runtime payload、support docs

## 8. Delivery Verification

1. `node ./scripts/governance/sync-task-ledger.js --task-id TK-720 --tasks-dir ".repo-ai-governor/context/dev/project-074-transport-selection-authority-solution-review/sprint-002-draft-remediation-and-rereview/tasks" --result "Revised the draft to converge onboarding transport truth into one canonical machine surface and added an explicit evidence gate for public remote_api support wording." --verify "docs/source cross-check: review artifact + onboarding contract + remote-api ADR + current runtime payload" --review-delta "Prepared the draft for re-review-after-updates without changing runtime code or public support docs."`
2. docs-only remediation window：未修改 `apps/**`、`packages/**`、`bin/**`、`test/**`，因此 `pnpm run build` not required

## 9. 执行记录

1. 2026-04-09：任务创建，状态初始化为 `in_progress`，目标是按 `TK-718` 的两条 blocking finding 直接修订 draft。
2. 2026-04-09：已把 onboarding canonical truth slot 明确收敛到 `enabled_tools[]`，并把 `tool_transport_matrix` 写成 compatibility bridge，而不是新的 canonical surface。
3. 2026-04-09：已把 support-matrix / playbook uplift 改写为 evidence-gated delivery follow-up，并补齐与既有 active solution 的关系说明；任务完成。

## 10. 产出

1. `/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/draft/transport-selection-authority-and-strict-routing-follow-up-technical-solution.md`
