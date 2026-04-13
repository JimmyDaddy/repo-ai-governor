# DA-804 session-shell secure secret input promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-12
- Owner: AI-Agent
- Task: `TK-804`
- Project: `project-091-session-shell-secure-secret-input-promotion-and-decomposition`
- Sprint: `sprint-001-review-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.session-shell-secure-secret-input-and-redacted-command-handoff` 已进入 `active` lifecycle-managed solution。
2. formal landing 已固定为 `runtime.cli-interactive-shell` + `runtime.governance-clients`。
3. 当前 active truth 只覆盖 Phase A：explicit `/secret set <keyName>` secure local capture、pre-commit suffix rejection 与 redacted local mutation handoff。
4. implementation follow-up 已拆解为 `project-092-session-shell-secure-secret-input-rollout`。

## 2. Immediate Activation Recommendation

1. 下一条真正建议激活的 implementation stream 固定为 `project-092 / sprint-001-secure-local-capture-and-redacted-secret-mutation`。
2. 第一批必须优先冻结：
   - secure route parsing 与 pre-commit extra-token rejection
   - `secure_local_capture` 前台 mode/focus/buffer lifecycle
   - 本地 secret mutation seam 与 transcript/error redaction baseline
3. 在 `sprint-001` 未收口前，不建议抢跑 `session.main` secure-input outcome、desktop secure dialog 或 VS Code secure prompt。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-092-session-shell-secure-secret-input-rollout/sprint-001-secure-local-capture-and-redacted-secret-mutation/plan.md`
