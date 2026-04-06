# DA-573 governance surface clients host distribution promotion and rollout decomposition handoff

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Task: `TK-573`
- Project: `project-049-governance-surface-clients-host-distribution-promotion-and-decomposition`
- Sprint: `sprint-001-promotion-and-followup-decomposition`

## 1. Summary

1. `technical-solution.governance-surface-clients` 已升级为 `v2` active lifecycle-managed solution。
2. host-native distribution follow-up 已拆解为 `project-050-governance-surface-clients-host-distribution-rollout`。
3. rollout 顺序正式冻结为：
   - sprint-001：structured projection registry + Codex / Claude Code project-local export baseline
   - sprint-002：GitHub Copilot repo-local assets + target-aware verify
   - sprint-003：installable bundles + pack/verify baseline
   - sprint-004：MCP bridge + hooks/subagents + advanced host integrations closeout

## 2. Immediate Activation Recommendation

1. 先激活 `sprint-001-structured-projection-and-project-local-export-baseline`。
2. 第一批必须优先冻结：
   - structured projection registry
   - `host-export.manifest.json`
   - `staged export -> apply/sync` contract
   - `Codex / Claude Code project-local` target matrix
3. 在 `sprint-001` 未收口前，不建议抢跑 Copilot CLI bundle、MCP bridge 或 advanced hooks/subagents。

## 3. Outputs

1. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/plan.md`
2. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/sprint-001-structured-projection-and-project-local-export-baseline/plan.md`
3. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/sprint-002-github-copilot-repo-local-assets-and-target-aware-verify/plan.md`
4. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/sprint-003-installable-bundles-and-pack-verify/plan.md`
5. `.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/sprint-004-mcp-bridge-and-advanced-host-integrations/plan.md`
