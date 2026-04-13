# DA-846 cli-exec launch authoring contract tests promotion cutover

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Task: `TK-846`
- Project: `project-101-cli-exec-followup-solution-review-and-promotion`
- Sprint: `sprint-001-launch-authoring-contract-tests`

## 1. Summary

1. `technical-solution.cli-exec-adapter-launch-authoring-contract-tests` 已从 `approved` 推进为 `active` lifecycle-managed solution。
2. `runtime.agent-projection` 已 additive formalize adapter-authored launch-plan ownership guardrail、probe / invoke preserved-fact split 与新的 launch-authoring ADR。
3. lifecycle `final_paths` 固定为新 ADR；shared overview 与两份 contract 作为共用 formal docs 在同窗同步更新，但不重复占有其他 active solution 的专属 `final_paths`。
4. delivery ownership 已固定为 `followup_required + internal_governance + execution_status=planned + rollout_status=not_required`，并指向新的 `project-102` planned rollout skeleton。

## 2. Immediate Operating Boundary

1. 本轮 formalize 的是 shared ownership invariant 与 contract-test governance，而不是新的 runtime behavior truth。
2. `selected_entrypoint`、`request_cancellation_mode`、`shell_wrapped`、`process_tree_policy` 与 `spawn_error_code` 仍保持 additive / optional boundary；缺失时不得被升级为新的 minimum field。
3. 本轮不把 launch-authoring contract tests 扩大成全量 adapter test strategy，也不把 compatibility/runtime guidance 升格为 `governance.execution-gates` formal truth。

## 3. Outputs

1. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/adapter-authored-launch-plan-ownership-and-contract-tests.md`
2. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
3. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
5. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
6. `.repo-ai-governor/context/dev/project-102-cli-exec-launch-authoring-contract-tests-rollout/plan.md`
