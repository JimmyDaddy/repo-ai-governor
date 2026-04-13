# DA-819 cli-exec runtime promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Task: `TK-819`
- Project: `project-097-cli-exec-runtime-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.cli-exec-runtime-hardening-and-explicit-acp-extension-seam` 已进入 `active` lifecycle-managed solution。
2. formal landing 已固定为 `runtime.agent-projection` producer truth：`module-overview`、additive/optional liveness + probe contract notes，以及新的 producer ADR。
3. implementation follow-up 已拆解为 `project-098-cli-exec-runtime-rollout`。
4. 当前 active truth 只锁定 native `cli_exec` runtime convergence 与 explicit ACP extension seam guardrail；`cli_exec` 仍是 canonical transport，ACP 仍是 explicit、non-default、non-public seam。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-098 / sprint-001-native-cli-runtime-foundation-and-codex-convergence`。
2. 第一批必须优先冻结：
   - shared native `cli_exec` process runtime 与 adapter-authored `resolved launch plan`
   - shared `lifecycle observer`、partial-output checkpoint 与 `terminate_phase` convergence
   - `Codex` baseline 先完成公共 seam cutover，再进入跨 adapter 扩展
3. 在 sprint-001 clean 收口前，不建议抢跑 `Claude Code` / `GitHub Copilot` 全量 cutover、public ACP support wording、或新的 canonical transport value formalization。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/sprint-001-native-cli-runtime-foundation-and-codex-convergence/plan.md`
3. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/sprint-002-cross-adapter-runtime-hardening-and-diagnostics-evidence/plan.md`
4. `.repo-ai-governor/context/dev/project-098-cli-exec-runtime-rollout/sprint-003-explicit-acp-extension-seam-guardrails-and-rollout-closeout/plan.md`
