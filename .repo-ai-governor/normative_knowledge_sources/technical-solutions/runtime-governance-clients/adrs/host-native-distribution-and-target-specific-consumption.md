# ADR: Host-Native Distribution And Target-Specific Consumption

- Status: active
- Date: 2026-04-06
- Module: `runtime.governance-clients`

## 1. Context

`project-048` 已完成 desktop / VS Code governance surface rollout，但随后形成的 host-native packaging draft 又提出了新的正式化问题：

1. `Codex`、`Claude Code` 与 `GitHub Copilot` 是否应该被当作同一种 plugin 目录模型来处理。
2. `staged export` 是否可以直接等价为宿主已经开始消费的 project-local assets。
3. GitHub Copilot 的 `repo-local`、`Copilot CLI plugin` 与 `GitHub.com coding agent` 三个消费面是否需要进入显式 target contract。
4. 当前方案应新增并行 module / package 族，还是作为 `runtime.governance-clients` 的 `v2` refinement 落地。

## 2. Decision

正式采用以下收口决策：

1. 本轮不新增并行 technical solution module；host-native distribution 作为 `runtime.governance-clients` 的 `v2` refinement 落地。
2. 优先复用现有 seam owner：
   - `packages/standards`
   - `packages/adapters/codex`
   - `packages/adapters/claude-code`
   - `packages/adapters/github-copilot`
   - `integrations/ide`
   - `runtime.agent-projection`
   - `service-host`
3. 正式区分三层资产状态：
   - `staged export`
   - `host-discoverable project-local assets`
   - `installed bundle`
4. 对 `GitHub Copilot` 引入 target-aware contract：
   - `github_copilot.repo_local`
   - `github_copilot.cli_plugin`
   - `github_copilot.github_com_agent`
5. 当前 MVP 只承诺 `Codex/Claude Code` 的 `project_local + plugin`，以及 `GitHub Copilot` 的 `repo_local + cli_plugin`；`github_com_agent` 保留为后续 follow-up consumer surface。
6. Host-native workflow 仍然通过 `cli wrapper -> MCP bridge` 的两阶段路径回接 `repo-ai-governor` canonical runtime，而不是在宿主资产内重写治理逻辑。

## 3. Rationale

1. 这与既有 module boundary 一致：`runtime.governance-clients` 本来就负责 CLI / IDE / GitHub.com 这类 consumer surface 的 boundary，而不是只负责桌面 UI。
2. 这保住了“governor 持有 canonical workflow truth，host assets 只是 projection”这一长期架构正确性。
3. `staged export` 与 `host-discoverable` 分离后，可以把 diff、rollback、verify 与真实 adopter 消费路径讲清楚，避免伪成功。
4. 为 `GitHub Copilot` 增加 target dimension 后，renderer 与 verify 才能知道当前产物是给 repo-local、CLI plugin 还是 future coding agent 消费。
5. 复用现有 seam owner 能避免在 promotion 时平白引入新的 module registry / layering 复杂度。

## 4. Consequences

1. `runtime.governance-clients` 增加第二份正式 contract：`contract.runtime.governance-host-distribution.v1`。
2. `runtime.governance-clients` 的 module overview 从“surface split”扩展为“surface split + host distribution boundary”。
3. delivery handoff 从已完成的 `project-048` 切换为新的 planned follow-up stream `project-050-governance-surface-clients-host-distribution-rollout`。
4. 后续实现不得把 `.repo-ai-governor/generated/hosts/**` 误写成宿主直接发现路径。
5. GitHub Copilot 的 exported assets 不得再混写成单一 `--host github-copilot` 维度。

## 5. Follow-Up

1. `project-050` sprint-001：structured projection registry 与 Codex / Claude Code project-local export baseline
2. `project-050` sprint-002：GitHub Copilot repo-local assets 与 target-aware verify
3. `project-050` sprint-003：installable bundles 与 pack/verify baseline
4. `project-050` sprint-004：MCP bridge、hooks/subagents 与 advanced host integrations closeout
