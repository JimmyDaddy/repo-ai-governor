# project-050-governance-surface-clients-host-distribution-rollout 计划

- Status: completed
- Date: 2026-04-06
- Stage Mapping: governance surface clients host distribution rollout
- Phase Mapping: project-local export / Copilot repo-local verify / installable bundles / MCP bridge and advanced host integrations
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/host-native-distribution-and-target-specific-consumption.md`
  - `.repo-ai-governor/context/dev/project-049-governance-surface-clients-host-distribution-promotion-and-decomposition/sprint-001-promotion-and-followup-decomposition/tasks/DA-573-governance-surface-clients-host-distribution-promotion-and-rollout-decomposition-handoff.md`

## 1. 目标

1. 将 `technical-solution.governance-surface-clients` `v2` 从 formal direction 推进到真实 host-native distribution rollout。
2. 先补 structured projection registry、staged export/apply/verify baseline，再补 GitHub Copilot target-aware repo-local assets、installable bundles 与 MCP bridge。
3. 保持“governor 持有 canonical truth，host assets 只是薄投影”的长期边界，不让宿主资产长出平行 runtime。

## 2. Sprint 细化

## 2.1 sprint-001-structured-projection-and-project-local-export-baseline

- Status: completed
- Sprint Goal: 建立 structured projection registry 与 Codex / Claude Code project-local export baseline。
- Task Package: `TK-574`、`TK-575`、`TK-576`。

## 2.2 sprint-002-github-copilot-repo-local-assets-and-target-aware-verify

- Status: completed
- Sprint Goal: 落地 GitHub Copilot repo-local assets 与 target-aware verify。
- Task Package: `TK-577`、`TK-578`、`TK-579`。

## 2.3 sprint-003-installable-bundles-and-pack-verify

- Status: completed
- Sprint Goal: 为 Codex、Claude Code 与 Copilot CLI 打通 installable bundle 与 pack/verify。
- Task Package: `TK-580`、`TK-581`、`TK-582`。

## 2.4 sprint-004-mcp-bridge-and-advanced-host-integrations

- Status: completed
- Sprint Goal: 补齐 MCP bridge、hooks/subagents 与 advanced host integrations closeout。
- Task Package: `TK-583`、`TK-584`、`TK-585`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-574 | sprint-001 | freeze structured projection registry and host export manifest contract | contract/foundation | formal module docs | completed |
| TK-575 | sprint-001 | implement codex and claude-code project-local renderer plus staged export baseline | host-export/implementation | TK-574 | completed |
| TK-576 | sprint-001 | close structured projection and project-local export baseline with Codex and Claude Code smoke acceptance | host-export/acceptance | TK-574、TK-575 | completed |
| TK-577 | sprint-002 | freeze GitHub Copilot repo-local target matrix and apply contract | copilot/contract | TK-576 | completed |
| TK-578 | sprint-002 | implement GitHub Copilot repo-local instructions skills agents export and target-aware verify | copilot/repo-local-implementation | TK-577 | completed |
| TK-579 | sprint-002 | close repo-local host assets MVP with docs sync and acceptance smoke | copilot/repo-local-closeout | TK-577、TK-578 | completed |
| TK-580 | sprint-003 | freeze plugin bundle manifest contract and packaging matrix | bundle/contract | TK-579 | completed |
| TK-581 | sprint-003 | implement Codex and Claude Code bundles plus Copilot CLI plugin renderer | bundle/implementation | TK-580 | completed |
| TK-582 | sprint-003 | close installable bundles MVP with pack verify smoke and install docs | bundle/closeout | TK-580、TK-581 | completed |
| TK-583 | sprint-004 | freeze MCP bridge hooks subagents and advanced host enhancement boundary | mcp/contract | TK-582 | completed |
| TK-584 | sprint-004 | implement service-host MCP export plus Claude hooks Codex subagents and Copilot hook baselines | mcp/implementation | TK-583 | completed |
| TK-585 | sprint-004 | close host distribution rollout with advanced target gating and project audit | rollout/closeout | TK-583、TK-584 | completed |

## 4. 依赖产物策略

1. sprint-001 必须优先完成，因为后续 Copilot repo-local、bundle 与 MCP bridge 都依赖 structured projection registry 与 export manifest contract。
2. sprint-002 只在 sprint-001 稳定后启动，避免 Copilot renderer 在 target matrix 未冻结前混写 repo-local / CLI / GitHub.com 语义。
3. sprint-003 负责 installable bundle 的正式产品化，不提前抢跑到 phase 1。
4. sprint-004 最后承接 MCP bridge、hooks/subagents 与 advanced host integrations closeout，不反向扩大前面 sprint 的交付范围。

## 5. DoD（project-050）

1. 同一份 canonical workflow / standards source 可导出 Codex、Claude Code 与 GitHub Copilot 的 project-local host assets。
2. `host export/apply/verify` 能正式区分 staged export 与 host-discoverable assets。
3. `.codex-plugin`、`.claude-plugin` 与 Copilot CLI plugin 的 pack/verify baseline 可运行。
4. Copilot target-aware verify 能显式区分 `repo_local`、`cli_plugin` 与 reserved `github_com_agent`。
5. MCP bridge、hooks/subagents 等 advanced host enhancements 仍保持“优化层而非 canonical truth”边界。

## 6. 里程碑记录

1. 2026-04-06：基于 `technical-solution.governance-surface-clients` `v2` promotion cutover 创建 `project-050`，作为新的 planned follow-up stream。
2. 2026-04-06：已将 `sprint-001 ~ sprint-004` 与 `TK-574 ~ TK-585` 全量拆解写入 project / sprint / task surface，待后续窗口按顺序激活。
3. 2026-04-06：已激活 `sprint-001-structured-projection-and-project-local-export-baseline` 作为 active primary sprint，开始执行 host distribution rollout implementation 与 delegated reviewer-loop closeout。
4. 2026-04-06：已完成 Codex / Claude Code / GitHub Copilot 的 project-local export、plugin pack、reserved target gating 与 advanced host artifact acceptance smoke。
5. 2026-04-06：`TK-574 ~ TK-585` 已全部收口为 `completed`，当前窗口进入 project final rollup、completion audit 与 delivery registry closeout。
6. 2026-04-06：项目完成态审计摘要已落盘：`.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/project-050-governance-surface-clients-host-distribution-rollout-completion-audit-summary.md`。
7. 2026-04-06：project final rollup review 已落盘：`.repo-ai-governor/context/dev/project-050-governance-surface-clients-host-distribution-rollout/sprint-004-mcp-bridge-and-advanced-host-integrations/review/resolved_code_review_project-050-final-rollup.md`。
