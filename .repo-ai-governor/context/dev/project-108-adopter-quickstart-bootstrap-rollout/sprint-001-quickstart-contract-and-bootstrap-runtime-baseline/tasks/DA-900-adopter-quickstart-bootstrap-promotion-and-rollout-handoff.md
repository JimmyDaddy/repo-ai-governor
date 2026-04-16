# DA-900 adopter quickstart bootstrap promotion and rollout handoff

- Status: completed
- Date: 2026-04-15
- Owner: AI-Agent
- Task: `TK-900`
- Project: `project-108-adopter-quickstart-bootstrap-rollout`
- Sprint: `sprint-001-quickstart-contract-and-bootstrap-runtime-baseline`

## 1. Summary

1. `technical-solution.adopter-quickstart-bootstrap-command` 已从 `approved` 推进为 `active` lifecycle-managed solution。
2. `runtime.governance-clients` 已 additive formalize `adopt bootstrap` convenience boundary、explicit `check` follow-up、default built-in selector 与 clean rerun redirect semantics。
3. delivery ownership 已固定为 `followup_required + adopter_cli/docs_playbook + execution_status=in_progress + rollout_status=planned`，并指向已激活的 `project-108 / sprint-001` execution surface，同时保持 `sprint-002` / `sprint-003` 为 planned follow-up ownership。

## 2. Immediate Operating Boundary

1. 本轮 formalize 的是 quickstart governance direction，而不是宣称 `apps/cli` command/runtime、help copy、consumer docs 或 clean-room evidence 已全部完成。
2. `check` 继续是 explicit broader governance audit follow-up；`adopt bootstrap` success 不等于 broader governance audit completed。
3. `README.md`、`docs/local-adoption-playbook.md` 与 `docs/support-matrix.md` 仍属于 rollout follow-up consumer surface，不在本轮 `final_paths` 内声明已同步。

## 3. Frozen Selector And Rerun Baseline

1. omitted selector 只允许回落到官方 built-in pack，不得猜测 repo-local/global pack 或其他非官方 distribution source。
2. explicit selector 继续复用现有 `adopt apply` 的 `pack-id -> profile-id` fallback semantics；若目标不唯一，必须保持 fail-closed，不得推断 pack/profile。
3. clean rerun 只允许在 `pack_id/applied_profile_id` 匹配且 managed files 干净时复用 convenience bootstrap；出现 drift、pack mismatch 或 profile mismatch 时，必须显式重定向到 `adopt diff/upgrade/remove`。
4. bootstrap summary 只允许作为 additive handoff artifact，记录 stage result、selector resolution、reentry mode 与 redirect reason；install receipt 与 verification summary 继续保持 canonical truth。

## 4. Sprint Queue Freeze

1. `sprint-002` 负责 `adopt bootstrap` runtime orchestrator、default built-in resolution、summary output、help copy 与 consumer docs baseline。
2. `sprint-003` 负责 orchestration tests、selector ambiguity coverage、clean-room evidence、truthfulness closeout 与 project final audit。
3. consumer docs truthfulness 不得先于 runtime/help behavior 宣称；`check` 必须继续保持 explicit broader governance follow-up wording。

## 5. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-adoption-pack-install-contract.md`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-quickstart-bootstrap-command-and-install-convenience-surface.md`
4. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
5. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
7. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
8. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/plan.md`
9. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-001-quickstart-contract-and-bootstrap-runtime-baseline/plan.md`
10. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-002-cli-bootstrap-command-and-consumer-surface-followthrough/plan.md`
11. `.repo-ai-governor/context/dev/project-108-adopter-quickstart-bootstrap-rollout/sprint-003-cleanroom-evidence-and-rollout-closeout/plan.md`
