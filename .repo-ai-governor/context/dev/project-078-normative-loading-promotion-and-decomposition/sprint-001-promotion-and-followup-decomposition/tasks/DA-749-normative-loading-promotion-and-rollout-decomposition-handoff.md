# DA-749 normative-loading promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-11
- Owner: AI-Agent
- Task: `TK-749`
- Project: `project-078-normative-loading-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.normative-loading-manifest-lifecycle-compaction-and-staged-sharding` 已进入 `active` lifecycle-managed solution。
2. formal landing 已固定为新的 `governance.normative-loading` module。
3. implementation follow-up 已拆解为 `project-079-normative-loading-lifecycle-compaction-rollout`。
4. 当前 formal scope 仍只覆盖 archive split、deprecated compact 与 root bootstrap truth preservation；active sharding 继续 deferred。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-079 / sprint-001-archive-split-and-bootstrap-truth-preservation`。
2. 第一批必须优先冻结：
   - archive manifest schema 与 archived catalog boundary
   - root bootstrap truth preservation 与 single-file parser compatibility
   - archived-entry zero-baseline migration path
3. 在 sprint-001 clean 收口前，不建议抢跑 deprecated auto-compaction hardening、active sharding follow-up 或 sqlite projection discussion。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-001-archive-split-and-bootstrap-truth-preservation/plan.md`
3. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-002-deprecated-compact-and-archive-integrity-automation/plan.md`
4. `.repo-ai-governor/context/dev/project-079-normative-loading-lifecycle-compaction-rollout/sprint-003-parser-compatibility-and-project-closeout/plan.md`
