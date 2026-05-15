# DA-1052 empty-repo self-host adoption promotion and rollout decomposition handoff

- Status: completed
- Date: 2026-05-13
- Owner: AI-Agent
- Task: `TK-1052`
- Project: `project-122-empty-repo-self-host-adoption-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.empty-repo-self-host-adoption-follow-up` 已进入 `active` lifecycle-managed solution。
2. formal landing 已固定为 `runtime.governance-clients` 下的 installer contract clarifications 与 adoption/self-host ADR 增量更新。
3. rollout 已拆解为 `project-123-empty-repo-self-host-adoption-rollout` 的四个 planned sprint。
4. 当前 active truth 只 formalize empty-repo `self-host-complete + repo_local` follow-up 的 contract / ownership / readiness direction，不宣称 runtime、diagnostics、docs consumer surfaces 已在本窗口代码交付完成。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-123 / sprint-001-bootstrap-transaction-and-self-host-baseline`。
2. 第一批必须优先冻结：
   - bootstrap transaction 内的 `governor.yaml` seed/apply 一致性
   - self-host template 的最小 `adapters` baseline 与 storage default 对齐
   - first-run path 的 fail-closed / noisy diagnostics 基线
3. 在 `sprint-001` clean 收口前，不建议抢跑 ownership taxonomy、phase projection 或 docs truthfulness refresh。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-001-bootstrap-transaction-and-self-host-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-002-ownership-and-generated-artifact-policy/plan.md`
4. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-003-activation-and-readiness-ux/plan.md`
5. `.repo-ai-governor/context/dev/project-123-empty-repo-self-host-adoption-rollout/sprint-004-clean-room-evidence-and-docs-truthfulness/plan.md`
