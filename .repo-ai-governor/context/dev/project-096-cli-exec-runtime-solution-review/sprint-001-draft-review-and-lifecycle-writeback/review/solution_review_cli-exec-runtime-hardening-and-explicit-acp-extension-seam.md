# Technical Solution Review

- Status: approved
- Date: 2026-04-13
- Solution ID: `technical-solution.cli-exec-runtime-hardening-and-explicit-acp-extension-seam`
- Draft Path: `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md`
- Reviewer: `AI-Agent`
- Verdict: `approved`
- Related Lifecycle Entry: `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## Review Scope

1. Review mode: `approve-reviewed-solution`
2. Target module:
   - `runtime.agent-projection`
3. Primary comparison surfaces:
   - `.repo-ai-governor/context/current-context.md`
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
   - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-onboarding-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-projection-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/adapter-health-and-route-probe-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/contracts/agent-invoke-liveness-contract.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/transport-selection-authority-and-strict-transport-routing.md`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/adrs/agent-invoke-liveness-and-timeout-governance.md`
   - `packages/adapter-sdk/src/agent-cli-exec-operations-runtime.ts`
   - `packages/adapters/codex/src/codex-agent-adapter.ts`
   - `packages/adapters/claude-code/src/claude-code-agent-adapter.ts`
   - `packages/adapters/github-copilot/src/github-copilot-agent-adapter.ts`
4. Canonical artifact path:
   - `.repo-ai-governor/context/dev/project-096-cli-exec-runtime-solution-review/sprint-001-draft-review-and-lifecycle-writeback/review/solution_review_cli-exec-runtime-hardening-and-explicit-acp-extension-seam.md`
5. Re-review focus:
   - whether the shared runtime now defines a concrete `resolved launch plan + lifecycle observer` seam
   - whether entrypoint / shell-wrapping / process-tree ownership stays adapter-authored instead of collapsing into a new God object
   - whether ACP remains an explicit, additive future transport seam rather than an implicit `cli_exec` fallback

## Blocking Findings

1. None. 本轮 re-review 未发现新的阻断性问题；上一轮的两条 blocking finding 已全部收口。

## Disposition Of Prior Blocking Findings

1. `[resolved 2026-04-13]` shared native `cli_exec` runtime 现在已经显式定义 lifecycle observer / snapshot seam，不再只是终态 spawn helper。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:131`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:139`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:160`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:188`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:191`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:237`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:273`
   - Re-review note:
     - draft 现在明确 shared runtime 除了终态 `process result` 之外，还要输出 `onLifecycleEvent(event)`、`onLifecycleSnapshot(snapshot)`，并允许 adapter parser 通过 `markSemanticProgress()` 回灌真实语义推进。这使 `last_transport_activity_at`、`last_semantic_progress_at`、`terminate_phase`、suspect 状态迁移与 partial snapshot 保留都有了明确 owner，也让 `Codex` 已有的 liveness 行为可以按同一 seam 收敛到其他 adapter。

2. `[resolved 2026-04-13]` entrypoint / shell-wrapping / process-tree ownership 现在已经通过 `resolved launch plan` 明确绑定到 adapter 侧，不再依赖 promotion 时临时拍板。
   - Updated draft evidence:
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:160`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:175`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:212`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:218`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:229`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:279`
     - `.repo-ai-governor/draft/cli-exec-runtime-hardening-and-explicit-acp-extension-seam-technical-solution.md:294`
   - Re-review note:
     - draft 现在明确 adapter 负责 `resolved_entrypoint`、`shell_strategy`、`process_tree_policy` 与 `request_cancellation_mode`，shared runtime 只执行已解析 plan 并投影结构化诊断。这样既避免了 `entrypoint_resolution / shell_wrapped / process_tree_policy` owner 漂移，也和 `CS-027` 要求的“不要把 command resolution、runtime lifecycle 与 route policy 糅成单个跨层对象”保持一致。

## Non-Blocking Suggestions

1. `acp_exec` 仍建议在 formal promotion 前保留为 provisional naming，避免 consumer 误读为已定版公开 transport 名称。

## Promotion Interlocks

1. promotion 前必须明确 formal producer truth 仍归 `runtime.agent-projection`；`packages/adapter-sdk` 只能是实现级共享载体，不能演变成第二条技术方案事实源。
2. 若后续真的引入 host-facing ACP surface 或 distribution contract，必须拆到显式 follow-up solution，并按需要补载 `runtime.governance-clients` 或其他正式 module truth；不能在本方案 promotion 窗口中隐式扩 scope。
3. 若 Phase A/B 最终只引入 additive diagnostics，而不提升 `adapter-health-and-route-probe-contract` 或 `agent-invoke-liveness-contract` 的 minimum fields，则 promotion 时应继续把这些字段明确为 optional/additive truth，避免 consumer 误升为 hard requirement。

## Verification

1. Review baseline refreshed from:
   - updated draft file
   - lifecycle registry
   - module registry
   - PRD brief
   - overall technical solution + architecture blueprint
   - `runtime.agent-projection` overview + onboarding/projection/health/liveness contracts + transport/liveness ADRs
   - current CLI adapter implementation surfaces for `codex` / `claude-code` / `github-copilot`
   - prior canonical review artifact findings
2. Docs-only re-review window:
   - no executable code changed
   - build not required

## Decision

1. Review outcome: `approved`
2. Lifecycle recommendation:
   - update solution to `approved`
   - keep this canonical artifact path in `review_paths`
   - fill `approved_at` / `approved_by`
   - keep `final_paths` empty
   - hand off to `technical-solution-promotion` for later formal cutover
