# DA-654 adoption-pack promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-09
- Owner: AI-Agent
- Task: `TK-654`
- Project: `project-060-adoption-pack-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.host-skill-distribution-and-discovery-followup` 已进入 `active` lifecycle-managed solution。
2. follow-up rollout 已拆解为 `project-061-adoption-pack-installer-and-self-host-bootstrap-rollout`。
3. 当前正式冻结的交付顺序为：
   - sprint-001：manifest / installer contract / layered resolver
   - sprint-002：`adopt apply` / managed ownership / install receipt
   - sprint-003：`adopter-complete` content coverage / host materialization
   - sprint-004：`diff/upgrade/remove` / adoption verify / managed bundle support
   - sprint-005：`self-host-complete` / repo-local template bootstrap / governance authoring surfaces
   - sprint-006：clean-room rehearsal / docs truthfulness / rollout audit

## 2. Immediate Activation Recommendation

1. 下一条真正激活的 implementation stream 固定为 `project-061 / sprint-001-manifest-resolver-and-installer-contract`。
2. 第一批必须优先冻结：
   - adoption-pack manifest v1
   - installer contract boundary
   - layered resolver and source provenance baseline
3. 在 `sprint-001` 未收口前，不建议抢跑 `adopt apply` materialization、self-host bootstrap 或 clean-room rehearsal。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-001-manifest-resolver-and-installer-contract/plan.md`
3. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-002-adopt-apply-and-managed-metadata/plan.md`
4. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-003-complete-pack-content-and-host-materialization/plan.md`
5. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-004-diff-upgrade-remove-and-adoption-verify/plan.md`
6. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-005-self-host-template-bootstrap-and-governance-authoring-surfaces/plan.md`
7. `.repo-ai-governor/context/dev/project-061-adoption-pack-installer-and-self-host-bootstrap-rollout/sprint-006-clean-room-rehearsals-and-docs-truthfulness/plan.md`
