# DA-840 cli-exec compatibility promotion activation handoff

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Task: `TK-840`
- Project: `project-100-cli-exec-compatibility-and-stability-promotion`
- Sprint: `sprint-001-formalization-and-promotion-cutover`

## 1. Summary

1. `project-100 / sprint-001` 已成为本轮 docs-only promotion 的唯一执行面。
2. canonical approval evidence 固定复用 `project-099` 已批准 review artifact，不再额外开启 `technical-solution-review` round。
3. 当前 scope 只允许 formalize `runtime.agent-projection` producer truth、registry/manifest/delivery cutover 与 closeout write-back。
4. `governance.execution-gates`、ACP host-facing transport 与 follow-up rollout decomposition 不在本轮范围内。

## 2. Immediate Execution Recommendation

1. 先完成 `runtime.agent-projection` overview / contract / ADR formal landing。
2. 随后一次性推进 lifecycle / delivery / module-registry / manifest。
3. 在 resolved review 与 closeout 完成前，不要把 `current-context.md` 长时间停留在 active 状态。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/plan.md`
2. `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/sprint-001-formalization-and-promotion-cutover/plan.md`
3. `.repo-ai-governor/context/dev/project-100-cli-exec-compatibility-and-stability-promotion/sprint-001-formalization-and-promotion-cutover/tasks/TK-840-activate-project-100-and-freeze-cli-exec-compatibility-promotion-scope.md`
