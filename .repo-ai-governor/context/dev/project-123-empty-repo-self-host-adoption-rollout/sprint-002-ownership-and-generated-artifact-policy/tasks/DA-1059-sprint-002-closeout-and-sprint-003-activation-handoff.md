# DA-1059 sprint-002 closeout and sprint-003 activation handoff

- Status: active
- Date: 2026-05-14
- Owner: AI-Agent
- Task: `TK-1059`
- Project: `project-123-empty-repo-self-host-adoption-rollout`
- Sprint: `sprint-002-ownership-and-generated-artifact-policy`

## 1. Summary

1. `sprint-002-ownership-and-generated-artifact-policy` 已完成 self-host ownership taxonomy、receipt provenance、drift/upgrade/remove semantics 与 generated artifact `.gitignore` opt-in recommendation 的 formal implementation baseline。
2. `CR-005` 作为 fresh clean recheck 未发现新的 actionable findings；`CR-004` 修复的 `adopt upgrade --force` canonical truth overwrite 与 task-ledger row-gap 覆写问题已通过 targeted vitest 与 `pnpm run build` 验证。
3. `project-123` primary execution surface 现切换到 `sprint-003-activation-and-readiness-ux`；`sprint-004-clean-room-evidence-and-docs-truthfulness` 继续保持 planned follow-up，adopter-facing public docs truth 仍不得提前 uplift。

## 2. Handoff Boundary

1. `sprint-003` 必须直接消费 `sprint-002` 已冻结的 ownership truth，不得再把 `starter_editable`、`canonical_runtime_writable` 与 `generated_ephemeral` 重新收敛回单一 managed drift bucket。
2. `adopt verify` 需要成为 self-host activation/readiness 的单一 canonical producer；`doctor` 只追加 diagnostics，`check` 只消费 phase truth 做更广义治理审计，不再并列生成 competing readiness verdict。
3. `sprint-003` 的 phase model 必须能覆盖当前 readiness matrix 中已经存在的 placeholder/readiness group 事实，并把 `execution_preflight_signal`、verification summary 与 operator next-actions 统一到同一 truth path。
4. `sprint-004` 之前不得更新 adopter-facing docs truth。任何 README、support matrix、local-adoption playbook 的对外表述，仍需等待 `/Users/jimmydaddy/study/deepseekian` clean-room rehearsal 证据包完成后再 uplift。

## 3. Outputs

1. `.repo-ai-governor/context/current-context.md`
2. `.repo-ai-governor/context/completed-streams-history.md`
3. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
4. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/plan.md`
5. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/review/resolved_code_review_working-tree-20260514-0519.md`
6. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/plan.md`
