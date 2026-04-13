# DA-842 cli-exec compatibility and stability promotion cutover

- Status: active
- Date: 2026-04-13
- Owner: AI-Agent
- Task: `TK-842`
- Project: `project-100-cli-exec-compatibility-and-stability-promotion`
- Sprint: `sprint-001-formalization-and-promotion-cutover`

## 1. Summary

1. `technical-solution.cli-exec-compatibility-and-stability-productization` 已从 `approved` 推进为 `active` lifecycle-managed solution。
2. lifecycle `final_paths` 已固定为新的 producer ADR；overview 与两份 contract 作为 shared formal docs 已在同窗同步更新，但不重复占有其他 active solution 的专属 `final_paths`。
3. delivery ownership 已固定为 `docs_only + internal_governance + not_required`，本轮不新建 rollout stream。
4. module registry、manifest 与 artifact handoff truth 已同步到 promotion 后状态。

## 2. Immediate Operating Boundary

1. 当前 active truth 只 formalize runtime guidance；`cli_exec_compatibility_*` profiles 仍不是 `governance.execution-gates` 的正式 contract。
2. additive diagnostics 继续保持 optional truth；缺失不能被升级为 failure 或 minimum field。
3. ACP host-facing transport、support wording 与 follow-up rollout decomposition 仍需独立 stream 承接。

## 3. Outputs

1. `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
2. `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
3. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
4. `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
