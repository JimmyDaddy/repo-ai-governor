# Repo AI Governor 面向 Codex、Claude Code 与 GitHub Copilot 的 Host-Native Packaging 技术方案（Draft）

- Status: draft
- Date: 2026-04-06
- Scope: host-native distribution / skill export / plugin packaging / agent packaging / MCP bridge / standards projection
- Related Inputs:
  - `.repo-ai-governor/draft/cli-borrowing-analysis-against-claude-code-and-codex.md`
  - `.repo-ai-governor/draft/cli-borrowed-capabilities-productization-technical-solution.md`
  - `.repo-ai-governor/draft/multi-ai-tools-onboarding-with-role-agent-projection-technical-solution.md`
  - `.repo-ai-governor/draft/layered-adapter-health-check-and-route-probe-technical-solution.md`
  - `.repo-ai-governor/draft/api-key-remote-adapter-invocation-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `README.md`
  - `package.json`
  - `packages/standards/README.md`
  - `integrations/ide/README.md`
  - `.codex/skills/workspace-code-review-workflow/SKILL.md`
  - `.codex/skills/workspace-delivery-finisher/SKILL.md`
  - `.codex/skills/technical-solution-promotion/SKILL.md`
- External References:
  - <https://developers.openai.com/codex/skills>
  - <https://developers.openai.com/codex/plugins>
  - <https://developers.openai.com/codex/plugins/build>
  - <https://developers.openai.com/codex/guides/agents-md>
  - <https://developers.openai.com/codex/subagents>
  - <https://developers.openai.com/codex/mcp>
  - <https://code.claude.com/docs/en/skills>
  - <https://code.claude.com/docs/en/plugins>
  - <https://code.claude.com/docs/en/hooks>
  - <https://code.claude.com/docs/en/mcp>
  - <https://docs.github.com/en/copilot/reference/customization-cheat-sheet>
  - <https://docs.github.com/en/copilot/how-tos/copilot-cli/customize-copilot/add-custom-instructions>
  - <https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/create-custom-agents>
  - <https://docs.github.com/en/copilot/how-tos/use-copilot-agents/coding-agent/extend-coding-agent-with-mcp>
  - <https://docs.github.com/en/copilot/concepts/agents/copilot-cli/about-cli-plugins>
  - <https://docs.github.com/en/copilot/reference/cli-command-reference>
  - <https://docs.github.com/en/copilot/reference/cli-plugin-reference>
  - <https://docs.github.com/en/copilot/reference/copilot-extensions/copilot-extensions-faq>

## 0. 外部事实边界

本方案里关于宿主扩展机制的判断，依赖 2026-04-06 当天查阅的官方文档，而不是仅凭历史记忆。

当前可确认的宿主边界如下：

1. **Codex**
   - 支持 `AGENTS.md`、repository-scoped skills、custom subagents、MCP。
   - 官方 plugin 是可安装分发单元，manifest 位于 `.codex-plugin/plugin.json`，可同时携带 `skills/`、`.mcp.json`、`.app.json`。
   - repository-scoped skill 官方扫描路径是 `.agents/skills/`。
2. **Claude Code**
   - 支持 `.claude/skills/`、`.claude-plugin/plugin.json`、`agents/`、`hooks/` 与 `.mcp.json`。
   - plugin 是宿主原生的 installable bundle。
3. **GitHub Copilot**
   - 支持 repository custom instructions：`.github/copilot-instructions.md`
   - 支持 path-specific instructions：`.github/instructions/**/*.instructions.md`
   - 支持 `AGENTS.md`
   - 支持 project skills：`.github/skills/`
   - 支持 custom agents：`.github/agents/*.agent.md`
   - 支持 hooks、MCP、Copilot CLI plugins 与 GitHub.com coding agent custom agents
4. **GitHub Copilot 的重要时间边界**
   - GitHub 官方文档明确写明：GitHub App 形态的 Copilot Extensions 已在 `2025-11-10` 全面停用。
   - 因此在 `2026-04-06` 这个时间点，把 `GitHub App Copilot Extension` 当作本方案主分发路线已经不成立。
5. **因此本方案的宿主策略必须分化**
   - Codex 与 Claude Code 可以主打 `project-local assets + installable plugins`
   - GitHub Copilot 应主打 `repository assets + Copilot CLI plugins + custom agents + MCP`
   - 不应把三者强行映射成同一种插件目录模型

## 1. 目的

把 `Repo AI Governor` 从“仅以仓库本地 CLI / 治理运行时存在”推进为“可被 Codex、Claude Code 与 GitHub Copilot 原生消费的 host-native distribution 产品形态”，同时保持产品主线不变：

1. 主目标仍然是治理接入本工具的目标仓库中的 AI 开发流程。
2. host-native assets 只是新的宿主接入面，不是新的 canonical runtime。
3. 所有治理真值仍应回落到 `repo-ai-governor` 自己的 workspace、policy、audit、ledger 与 standards pack。

本方案解决的不是“怎样把几个 prompt 拆开存目录”，而是：

1. 怎样把现有治理能力拆成可安装、可导出、可校验的宿主原生资产。
2. 怎样避免 host assets 和 governor core 形成两套逐步漂移的系统。
3. 怎样在不牺牲 audit、HITL、policy correctness 的前提下，降低多宿主 adoption friction。

## 2. 背景与问题

当前仓库已经具备以下基础：

1. 产品定位本来就面向把 `Codex / Claude Code / GitHub Copilot` 接到同一套受治理流程里。
2. npm 分发面已经存在，`repo-ai-governor` 本身是一个 repository-local AI governance CLI。
3. `packages/standards` 已具备同源规则资产到 `human / ai / agents` 三视图与 `AGENTS.md` 投影能力。
4. 仓库内已存在 `.codex/skills/` 形式的 workflow 资产与 `integrations/ide` 的 wrapper baseline。
5. `connect / doctor / verify / run / review / review-verify` 已形成真实治理命令面。
6. GitHub Copilot 适配器、诊断和支持矩阵也已经在现有仓库里占据正式位置，而不是概念占位。
7. `package.json` 已对外暴露 `./service-host`，并把 `.codex/skills`、`integrations/ide` 等 self-host/runtime assets 纳入当前分发内容。

换句话说，当前缺口不是“完全没有 host 相关资产”，而是：

1. 这些资产仍偏 self-host / maintainer baseline。
2. 它们还没有被收敛成 adopter-facing 的 `export -> apply -> verify -> pack` 正式链路。
3. 它们与现有 `packages/standards`、`packages/adapters/*`、`runtime.agent-projection`、`runtime.governance-clients` 之间的 seam owner 尚未被方案层显式写清。

但如果把当前产品粗暴地“等价改写成 skill / plugin”，会立刻出现五类问题：

1. **真值漂移**
   - workflow 一份写在 core runtime，一份写在宿主 skill/plugin 文本里，后续很快失配。
2. **能力降级**
   - audit、policy gate、HITL、workspace canonical state 很难仅靠宿主 skill 自身保持一致。
3. **宿主异构**
   - Codex、Claude Code、GitHub Copilot 三者的 asset primitive 并不相同。
4. **过度 plugin 化**
   - 如果把产品重心过早转成“手工维护若干宿主目录树”，会反向拖慢 runtime 主线。
5. **错误选路**
   - 如果忽略 GitHub Copilot 在 `2025-11-10` 已停用 GitHub App Copilot Extensions 的事实，就会把方案建立在失效分发面上。

所以，这个问题的正确解法不是：

1. 把整个产品改写成纯宿主 prompt 包。

而是：

1. 保留 `Governor Core` 作为治理与运行时内核。
2. 新增 `Host Distribution Layer`，把同源 workflow 与 standards assets 导出成宿主可消费产物。
3. 针对 GitHub Copilot 单独采用“repo assets / CLI plugin / custom agents / MCP”为主的路径。

## 3. 核心结论

推荐采用“**Core Runtime 不变 + Host-Native Distribution 增量叠加**”的路线。

也就是说：

1. `repo-ai-governor` 继续作为唯一治理内核和 canonical source。
2. Codex、Claude Code、GitHub Copilot 的 host-native assets 只负责：
   - 宿主原生接入
   - workflow discoverability
   - 宿主生命周期集成
   - handoff / tool bridge
3. 这些 host assets 中的真正执行动作，优先通过两类桥接方式回到 core：
   - 命令包装：调用 `repo-ai-governor` CLI
   - MCP 桥接：调用 `repo-ai-governor` 的 service-host / MCP server
4. 与宿主强绑定的能力只作为优化层：
   - Codex subagents
   - Claude hooks / agents
   - GitHub Copilot custom agents / hooks / Copilot CLI plugins
5. GitHub App Copilot Extension 不应进入本方案主路径。

一句话收敛：

`Repo AI Governor` 应该被产品化为“一套可导出的多宿主原生入口层”，而不是被重写成“只剩宿主入口层”。

## 4. 设计原则

### 4.1 核心原则

1. **治理真值在 governor，不在宿主 markdown**
   - policy、risk、audit、ledger、workspace 状态必须继续由 governor 持有。
2. **workflow 先标准化，再投影到宿主**
   - 先形成宿主无关的 workflow asset，再生成 Codex / Claude / Copilot 版本。
3. **同一宿主语义可投影为不同 primitive**
   - 某条 workflow 在 Codex 上可能是 skill + plugin
   - 在 Claude 上可能是 skill + hook
   - 在 Copilot 上可能是 custom instruction + skill + agent + plugin
4. **host assets 只做薄投影，不做平行重写**
   - 尽量 handoff 到统一命令或 MCP，而不是在宿主层重写所有业务语义。
5. **project-local 与 installable bundle 分阶段交付**
   - 先支持 repo-scoped assets 直出，再支持插件 / bundle 分发。
6. **fail-closed**
   - 当 hook、MCP、wrapper 或宿主 capability 缺失时，应退回 governor CLI baseline，而不是静默绕过治理。

### 4.2 明确非目标

1. 不把整个 governance runtime 重写进 Codex / Claude / Copilot 的宿主资产内部。
2. 不在本阶段做插件市场、自动更新服务或组织级云端分发控制平面。
3. 不让 Codex subagents、Claude agents 或 Copilot custom agents 变成 role registry 的唯一表达。
4. 不让 Claude hooks、Copilot hooks 或其他宿主 lifecycle hook 直接取代统一 policy gate。
5. 不再以 GitHub App Copilot Extensions 作为 GitHub Copilot 的产品化主路径。

## 5. 目标架构

推荐采用四层结构。

### 5.1 Layer A: Governor Core

这是现有产品核心，不因 host-native packaging 而被替换。

职责：

1. workflow orchestration
2. policy gate / risk evaluator
3. audit / reporting / replay
4. workspace canonical state
5. standards packs
6. `connect / doctor / verify / run / review / review-verify` 等正式命令

### 5.2 Layer B: Workflow And Standards Projection

这是本方案新增的关键层，用于把宿主无关资产变成宿主相关产物。

这里的“层”是逻辑层，不预设必须新增一整族独立 package。当前更合理的做法是优先复用现有 seam：

1. `packages/standards`
   - 承接 standards / instructions / `AGENTS.md` projection、`source_pack_refs` 与 parity/drift 校验。
2. `packages/adapters/codex`
   - 承接 Codex-specific host asset rendering、manifest validation 与 capability metadata。
3. `packages/adapters/claude-code`
   - 承接 Claude-specific host asset rendering、hooks/plugin validation 与 capability metadata。
4. `packages/adapters/github-copilot`
   - 承接 Copilot-specific instructions/skills/agents/CLI-plugin rendering 与 target matrix validation。
5. `integrations/ide`
   - 承接 command wrapper / standards injection baseline 与 example contracts。
6. `./service-host` + `runtime.agent-projection`
   - 承接 MCP / tool bridge 与 capability/handoff seam。
7. `runtime.governance-clients`
   - 承接跨 CLI / IDE / GitHub.com consumer surface 的 target boundary。

职责：

1. 把 repository-local workflow 定义提纯成统一 workflow assets。
2. 把 standards packs 渲染为宿主可理解的 instructions / skill metadata / agent prompt metadata。
3. 生成 host-specific skill/plugin manifests、wrapper metadata、MCP wiring 与 export manifest。

### 5.3 Layer C: Host Distributions

这是用户可安装、可提交到仓库、可发给他人的产物层。

分成三类 host family：

1. **Codex distributions**
   - project-local：`AGENTS.md` + `.agents/skills/`
   - plugin：`.codex-plugin/plugin.json` + `skills/` + 可选 `.mcp.json`
2. **Claude Code distributions**
   - project-local：`.claude/skills/`
   - plugin：`.claude-plugin/plugin.json` + `skills/` + `agents/` + `hooks/` + `.mcp.json`
3. **GitHub Copilot distributions**
   - project-local：`.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/skills/`、`.github/agents/`、`AGENTS.md`、可选 `.github/mcp.json`
   - plugin/bundle：Copilot CLI `plugin.json` + `skills/` + `agents/` + `hooks.json` + `.mcp.json`

### 5.4 Layer D: Host Execution Bridge

负责把宿主原生交互回接到 governor core。

提供两条执行桥：

1. **CLI wrapper bridge**
   - host assets 内部最终调用 `repo-ai-governor` 命令
2. **MCP bridge**
   - host 通过 `.mcp.json` 或宿主 MCP 配置连接到 `repo-ai-governor` service-host

## 6. 产物边界与职责拆分

### 6.1 哪些能力适合导出成宿主原生 assets

优先导出当前已经成熟、稳定、且本来就高度 workflow 化的能力：

1. code review workflow
2. delivery finisher / closeout workflow
3. technical solution promotion workflow
4. repo onboarding guidance
5. standards explain / capability explain / troubleshooting guidance

这些能力的共同特征是：

1. 输入输出清晰
2. 容易投影为 skill / instruction / agent profile
3. 更像“让宿主知道什么时候触发哪条流程”

### 6.2 哪些能力必须留在 Governor Core

以下能力不应搬进宿主 assets 成为唯一实现：

1. policy decisioning
2. risk classification
3. audit event recording
4. task ledger sync
5. review lifecycle state transitions
6. workspace migration and rollback
7. `connect / doctor / verify` 的正式检测语义

这些必须继续由 `repo-ai-governor` 命令或 service-host 提供。

### 6.3 哪些能力适合做宿主原生增强

这些是 host-native affordance，适合做优化层：

1. Codex custom subagents
2. Claude custom agents
3. Claude hooks
4. GitHub Copilot custom agents
5. GitHub Copilot hooks
6. GitHub Copilot CLI plugins
7. Codex / Claude / Copilot 的 MCP wiring

但它们都不是 canonical business truth。

## 7. Host Mapping 设计

### 7.1 Codex 目标形态

按官方文档，Codex skills 是 reusable workflow authoring format，repository-scoped 扫描路径是 `.agents/skills/`，plugin 的可安装入口是 `.codex-plugin/plugin.json`。

因此 Codex 侧推荐两条正式路径：

1. **Path A: project-local**
   - `AGENTS.md`
   - `.agents/skills/<skill-name>/SKILL.md`
   - 可选 custom subagents
2. **Path B: installable plugin**
   - `.codex-plugin/plugin.json`
   - `skills/<skill-name>/SKILL.md`
   - 可选 `.mcp.json`
   - 可选 `.app.json`

同时要明确一个迁移决策：

1. 当前仓库已有 `.codex/skills/` 资产。
2. 但 Codex 官方 skill 发现路径是 `.agents/skills/`。
3. 因此不建议长期把 `.codex/skills/` 作为最终用户可发现路径。
4. 推荐将 `.codex/skills/` 保留为过渡期 authoring / self-host 兼容资产，再新增导出链路稳定生成 `.agents/skills/`。

### 7.2 Claude Code 目标形态

按官方文档，Claude Code 支持：

1. project skills：`.claude/skills/<skill-name>/SKILL.md`
2. plugin skills：`<plugin>/skills/<skill-name>/SKILL.md`
3. plugin manifest：`.claude-plugin/plugin.json`
4. hooks：`hooks/hooks.json`
5. agents：`agents/`
6. `.mcp.json`

因此 Claude Code 侧推荐两条正式路径：

1. **Path A: project-local**
   - `.claude/skills/<skill-name>/SKILL.md`
   - 可选 `.claude/settings.json` 或 hooks 片段
2. **Path B: installable plugin**
   - `.claude-plugin/plugin.json`
   - `skills/<skill-name>/SKILL.md`
   - `agents/`
   - `hooks/hooks.json`
   - `.mcp.json`

Claude 侧的优势是 hooks 语义更丰富，因此更适合作为宿主优化层承接：

1. destructive command pre-check
2. stop-time validation
3. subagent lifecycle notification
4. worktree create/remove hook

但这些 hooks 只应做“预警 / 阻断 / 回接 governor”，不应承载完整治理逻辑。

### 7.3 GitHub Copilot 目标形态

GitHub Copilot 不能简单等同为“第三种和 Codex / Claude 完全相同的 plugin 目录模型”，因为它当前是三层并存：

1. **repository assets**
2. **Copilot CLI plugins**
3. **GitHub.com coding agent custom agents / MCP**

并且 GitHub App Copilot Extension 路径已在 `2025-11-10` 停用。

因此 GitHub Copilot 侧推荐三条路径，但只保留两条主路径。

#### 7.3.1 主路径 A：repository-local assets

用于目标仓库内直接消费的最小闭环，推荐生成：

1. `.github/copilot-instructions.md`
2. `.github/instructions/**/*.instructions.md`
3. `.github/skills/<skill-name>/SKILL.md`
4. `.github/agents/<agent-name>.agent.md`
5. `AGENTS.md`
6. 可选 `.github/mcp.json`

这一层的角色分工如下：

1. `copilot-instructions.md`
   - 承接 repo-wide governance baseline
2. `instructions/**/*.instructions.md`
   - 承接 path-specific guidance
3. `.github/skills/`
   - 承接离散 workflow skills
4. `.github/agents/`
   - 承接角色化 custom agents，例如 reviewer / delivery / solution-promoter
5. `AGENTS.md`
   - 作为跨宿主共用入口，与 Copilot CLI 同时兼容

#### 7.3.2 主路径 B：Copilot CLI plugin

GitHub 官方文档当前已经把 Copilot CLI plugins 定义为 installable packages，并明确支持：

1. `plugin.json`
2. `skills/`
3. `agents/`
4. `hooks.json`
5. `.mcp.json`
6. `lsp.json`

因此 Copilot CLI 其实是本方案里最适合做“skill/plugin 包”这一表达的 GitHub Copilot surface。

推荐的 plugin 目录最小形态：

1. `plugin.json`
2. `skills/<skill-name>/SKILL.md`
3. `agents/<agent-name>.agent.md`
4. `hooks.json`
5. `.mcp.json`

其中：

1. skills 适合承接 discrete workflow
2. agents 适合承接 reviewer / verifier / delivery specialist
3. hooks 适合承接 pre-tool / post-tool / stop-time validation
4. MCP 适合承接 `repo-ai-governor` 的结构化 tool bridge

#### 7.3.3 次路径：GitHub.com coding agent assets

GitHub.com coding agent 当前支持：

1. repository custom agents
2. repository MCP configuration
3. target-specific custom agent frontmatter

但这条路径不应成为本产品的主分发形态，原因有三点：

1. 本产品主线仍然是“目标仓库本地治理工具”，不是 GitHub-only cloud control plane。
2. GitHub.com coding agent 的部分 agent properties 与 VS Code / CLI 语义并不完全一致。
3. cloud agent 更适合作为已导出 repo assets 的附加消费面，而不是新的 canonical host。

#### 7.3.4 明确不选：GitHub App Copilot Extensions

GitHub 官方 FAQ 已明确：

1. 新建 Copilot Extensions 在 `2025-09-23` 后被阻止
2. 所有已有 Copilot Extensions 在 `2025-11-10` 被禁用

所以本方案明确不再以 GitHub App Copilot Extensions 作为产品化主路径。

#### 7.3.5 当前 MVP 的收口边界

为避免在 MVP 阶段把不同 Copilot 消费面混写成同一种导出契约，当前阶段先明确：

1. `Phase 1` 只把 `repository-local assets` 作为 GitHub Copilot 的正式 project-local target。
2. `Phase 2` 再把 `Copilot CLI plugin` 作为正式 installable target。
3. `GitHub.com coding agent assets` 保留为 `Phase 4` follow-up consumer surface，不纳入当前 MVP 必达项。
4. 即便 `github-com-agent` 暂不进入 MVP，workflow/export manifest 仍需预留 target matrix 字段，避免后续追加该 target 时破坏契约。

## 8. 统一工作流资产模型

为避免 Codex / Claude / Copilot 三侧各自手工维护，推荐新增宿主无关 workflow asset 层。

但这个 asset 层不能再变成另一份手写正文真值。它应该被定义为“**structured projection registry**”，用来引用现有 canonical source，而不是平行改写它们。

当前应优先引用的 canonical source 包括：

1. `.codex/skills/**/SKILL.md` 等现有 workflow prompt / maintainer source assets
2. `packages/standards` 的 standards pack、projection metadata 与 `source_pack_refs`
3. `integrations/ide` 的 command wrapper / standards injection contracts
4. `./service-host` 暴露的 MCP / service tool surface
5. `packages/adapters/*` 暴露的 host capability metadata 与 validation rules

每条 workflow asset 最小字段建议如下：

1. `workflow_id`
2. `workflow_version`
3. `workflow_status`
4. `semantic_owner_module`
5. `display_name`
6. `description`
7. `canonical_source_refs[]`
8. `standards_pack_refs[]`
9. `trigger_hints[]`
10. `inputs[]`
11. `artifacts[]`
12. `risk_tier`
13. `handoff_kind`
   - `command`
   - `mcp`
14. `handoff_target`
   - 例如 `repo-ai-governor review`
   - 或 `governor.runReviewWorkflow`
15. `projection_metadata`
    - `source_pack_refs[]`
    - `projection_profile_id`
    - `parity_rule_refs[]`
16. `host_target_matrix`
    - `codex`
    - `claude_code`
    - `github_copilot`
17. `verification_profile_refs[]`
18. `drift_checks[]`

其中 `host_target_matrix` 不应只停留在“哪个 host 有 override”，而应显式枚举：

1. `codex.project_local`
2. `codex.plugin`
3. `claude_code.project_local`
4. `claude_code.plugin`
5. `github_copilot.repo_local`
6. `github_copilot.cli_plugin`
7. `github_copilot.github_com_agent`

这个 asset 层的意义是：

1. workflow 语义通过 `canonical_source_refs[]` 与 `semantic_owner_module` 只定义一次
2. 三个宿主只做 frontmatter、命名空间、安装结构、宿主提示的差异化渲染
3. `host verify` 可以基于 `projection_metadata / verification_profile_refs / drift_checks` 做 source-to-export 一致性校验
4. 后续再接其他宿主时，不需要继续复制 workflow 正文

## 9. 建议的仓库落位

### 9.1 现有 seam owner 与仓库落位

当前 draft 不引入新的正式 technical solution module，也不默认新增 `packages/host-*` 包族。优先使用以下现有 seam owner：

1. `packages/standards`
   - 负责 standards / instructions / `AGENTS.md` projection、`source_pack_refs`、parity 与 drift baseline。
2. `packages/adapters/codex`
   - 负责 Codex-specific rendering、plugin manifest validation 与 capability metadata。
3. `packages/adapters/claude-code`
   - 负责 Claude-specific rendering、hooks/plugin validation 与 capability metadata。
4. `packages/adapters/github-copilot`
   - 负责 Copilot-specific instructions/skills/agents/CLI-plugin rendering 与 target matrix validation。
5. `integrations/ide`
   - 负责 wrapper templates、standards injection contracts、host examples 与 install guidance baseline。
6. `./service-host` + `runtime.agent-projection`
   - 负责 MCP/tool bridge、handoff seam 与 host capability truth。
7. `runtime.governance-clients`
   - 负责 CLI / IDE / GitHub.com 这类 consumer surface 的 target boundary 与 phased rollout。

只有当这些 seam 被证明无法承接时，才考虑在后续迭代里抽出薄的 `host-distribution` helper；届时必须同步更新 technical solution module registry 与 architecture docs。

### 9.2 模板与集成目录

1. `integrations/hosts/codex/`
2. `integrations/hosts/claude-code/`
3. `integrations/hosts/github-copilot/`

用于放置：

1. plugin manifest templates
2. `.mcp.json` templates
3. hook templates
4. host smoke examples
5. install docs

这些目录只承接 template/example/doc 角色，不持有 canonical workflow truth。

### 9.3 staged export 与 applied repo assets

推荐默认把 staged export 写到：

1. `.repo-ai-governor/generated/hosts/codex/`
2. `.repo-ai-governor/generated/hosts/claude-code/`
3. `.repo-ai-governor/generated/hosts/github-copilot/`

但这里必须明确：

1. `.repo-ai-governor/generated/hosts/**` 只是 **staging/export workspace**，不是宿主会直接发现的 project-local 路径。
2. 对 `project-local assets` 而言，只有在 apply/sync 步骤把 staged export 物化到目标仓库真实宿主路径后，资产才进入“host-discoverable”状态。
3. 对 `plugin/bundle` 而言，staged export 可以直接作为打包输入，并不要求再执行 repo apply。

staged export 目录中建议至少保留：

1. 渲染后的 staged host tree
2. `host-export.manifest.json`
3. `host-apply.report.json` 或等价 apply report
4. rollback reference / diff summary
5. verification summary

这样可以避免把生成物和手工 authoring 文件混在一起。

### 9.4 这些产物如何被宿主实际消费

这里需要明确一条总原则：

1. `staged export` 目录本身不直接被 Codex、Claude Code 或 GitHub Copilot 消费。
2. 宿主真正消费的是两类产物：
   - `apply` 后落到目标仓库真实宿主路径的 `project-local assets`
   - `pack` 后安装到宿主插件/扩展机制中的 `plugin/bundle`

按宿主拆开看：

1. **Codex**
   - `project-local`：把 staged export apply 到目标仓库根级 `AGENTS.md`、`.agents/skills/`，以及可选 `.mcp.json`。
   - 使用方式：用户在 Codex 中打开该仓库，或对仓库做一次 reload / rescan，Codex 通过 repo-local 路径发现这些 assets 并开始消费。
   - `plugin`：把 staged export 进一步打成 `.codex-plugin/plugin.json` + `skills/` + 可选 `.mcp.json` / `.app.json` 的 installable bundle。
   - 使用方式：用户把 bundle 安装到 Codex 的插件机制后，Codex 通过插件容器消费其中的 skills / MCP wiring，而不要求目标仓库自带这些文件。

2. **Claude Code**
   - `project-local`：把 staged export apply 到目标仓库 `.claude/skills/`，以及可选 `.claude/settings.json` / hooks 片段。
   - 使用方式：用户在 Claude Code 中打开该仓库，Claude Code 通过 project-local 路径发现这些 skills / settings / hooks。
   - `plugin`：把 staged export 打成 `.claude-plugin/plugin.json` + `skills/` + `agents/` + `hooks/` + `.mcp.json` 的 installable bundle。
   - 使用方式：用户安装该 plugin 后，Claude Code 通过插件容器消费对应的 skills、agents、hooks 与 MCP 配置。

3. **GitHub Copilot**
   - `repo-local`：把 staged export apply 到目标仓库 `.github/copilot-instructions.md`、`.github/instructions/**/*.instructions.md`、`.github/skills/`、`.github/agents/`、`AGENTS.md`，以及可选 `.github/mcp.json`。
   - 使用方式：用户在 VS Code / IDE / Copilot 仓库级消费面中打开该仓库，Copilot 通过这些 repo-local assets 提供 instructions、skills、agents 与 MCP wiring。
   - `cli-plugin`：把 staged export 打成 Copilot CLI `plugin.json` + `skills/` + `agents/` + `hooks.json` + `.mcp.json` 的 installable bundle。
   - 使用方式：用户把 bundle 安装到 Copilot CLI 的插件机制后，Copilot CLI 通过插件容器消费这些技能、agent 与 hook 资产。
   - `github-com-agent`
   - 使用方式：这条路径当前不纳入 MVP；后续若正式支持，应单独导出到 GitHub.com coding agent 认可的 repo surface / metadata 形态，而不是默认复用 `cli-plugin` 目录树。

因此对 adopter 来说，标准使用链路应理解为：

1. `host export` 先产生 staged export，供 review、diff、verify、rollback reference 使用。
2. `host export --mode project --apply-to-repo <repo>` 或等价 `host apply` 再把 project-local assets 写入目标仓库真实宿主路径。
3. `host pack` 把 plugin target 打成 installable bundle，交给对应宿主的插件机制消费。

## 10. CLI 产品面建议

不建议为每个宿主再开一套碎片命令，建议只补三个统一 host distribution 命令。

### 10.1 `repo-ai-governor host export`

职责：

1. 读取 governor config、standards packs、workflow assets
2. 渲染指定宿主的 staged export tree
3. 生成 `host-export.manifest.json` 记录版本、来源、产物、target 与兼容信息
4. 当目标是 project-local assets 且显式开启 apply 时，把 staged export 受控同步到目标仓库真实宿主路径，并生成 `host-apply.report.json`

建议参数：

1. `--host codex|claude-code|github-copilot`
2. `--mode project|plugin`
3. `--copilot-target repo-local|cli-plugin|github-com-agent`
4. `--output-dir <path>`
5. `--apply-to-repo <path>`
6. `--with-mcp`
7. `--with-hooks`
8. `--with-agents`
9. `--with-instructions`

其中：

1. `--output-dir` 指向 staged export 目录。
2. `--apply-to-repo` 只在 `--mode project` 时有效，用于把产物写入目标仓库真实宿主路径。
3. `--copilot-target` 在 `--host github-copilot` 时用于区分 `repo-local`、`cli-plugin` 与后续 `github-com-agent` 的消费面；当前 MVP 至少要求支持前两者，并对第三者保留 schema。

### 10.2 `repo-ai-governor host verify`

职责：

1. 校验导出的宿主目录是否满足宿主目录规范
2. 校验 workflow / standards / manifest 的版本关联与 `canonical_source_refs` 回链
3. 校验 staged export 与 applied repo assets 是否与 source assets 一致
4. 校验 `projection_metadata / parity / drift checks` 是否通过
5. 对 Copilot 额外检查 target 与消费面是否匹配，并阻断已停用的 GitHub App Copilot Extension 形态

### 10.3 `repo-ai-governor host pack`

职责：

1. 把已导出的 plugin 目录打包成正式分发单元
2. 产出校验摘要与版本清单

## 11. 执行桥接设计

### 11.1 命令包装桥接

这是最稳的 MVP 路径。

host assets 最终触发：

1. `repo-ai-governor review`
2. `repo-ai-governor review-verify`
3. `repo-ai-governor plan`
4. `repo-ai-governor connect`
5. `repo-ai-governor verify`
6. `repo-ai-governor upgrade`

优点：

1. 与当前产品最贴近
2. 真值统一
3. adoption 最直接

缺点：

1. 宿主里看到的仍然是“调用外部 CLI”
2. 结构化交互不如 MCP 自然

### 11.2 MCP 桥接

这是中期更优雅的路径。

让 host assets 通过宿主自己的 MCP 能力调用 governor service-host，暴露结构化工具，例如：

1. `governor.plan_workflow`
2. `governor.run_review`
3. `governor.verify_review`
4. `governor.delivery_closeout`
5. `governor.read_current_context`

优点：

1. 更贴近宿主原生 tool invocation 模型
2. 更适合未来桌面端、IDE、CLI 共用 orchestration service
3. 更容易把 `execution_id / artifacts / nextAction` 结构化返回给宿主

缺点：

1. 需要补齐 service-host / MCP surface 稳定性
2. 初期接入成本高于纯命令包装

### 11.3 GitHub Copilot 的额外桥接约束

GitHub Copilot 要特别区分三种消费面：

1. Copilot CLI
   - 最适合 plugin + skills + agents + hooks + MCP
2. VS Code / IDE chat
   - 更适合 repository instructions、custom agents、prompt files、MCP
3. GitHub.com coding agent
   - 更适合 repository custom agents + MCP

因此 Copilot renderer 必须显式标记 target，不允许默认假设所有自定义 agent 字段可以在所有 surface 上等价工作；当前 MVP 若只支持 `repo-local` 与 `cli-plugin`，也应在 export manifest 与 verify 结果里明确写出这一点，而不是把 `github-com-agent` 默认为“未来可能也能吃”。

### 11.4 推荐决策

采用“两阶段桥接”：

1. Phase 1 先用 CLI wrapper 跑通 project-local assets 与 plugin packaging
2. Phase 2 为高价值 workflow 补 MCP tools，逐步把 host 体验升级成真正的 host-native tool surface

## 12. 现有 skill 的迁移与复用

当前仓库已有三条 repository-local Codex skill：

1. `workspace-code-review-workflow`
2. `workspace-delivery-finisher`
3. `technical-solution-promotion`

建议不要直接原样复制到三个宿主目录里，而是做一次 workflow asset 提纯：

1. 把与当前仓库路径强耦合的作者说明保留为 source asset
2. 把宿主无关的 workflow 语义提取为统一 workflow definition
3. 再分别生成：
   - Codex 版本
   - Claude Code 版本
   - GitHub Copilot skills / instructions / agents 版本
   - 各宿主 plugin/bundle 版本

第一批迁移优先级建议如下：

1. `workspace-code-review-workflow`
   - 最成熟、最适合被三宿主共同消费
2. `workspace-delivery-finisher`
   - 价值高，但与 git/push 风险相关，需要更严格 host permission 提示
3. `technical-solution-promotion`
   - 更偏内部治理流程，第二批接入更稳

## 13. 版本与兼容治理

为避免 host assets 与 governor core 漂移，导出产物必须附带版本元数据。

建议新增 `host-export.manifest.json`，最小字段包括：

1. `host`
2. `mode`
3. `target`
4. `generated_at`
5. `governor_version`
6. `semantic_owner_module`
7. `canonical_source_refs[]`
8. `source_pack_refs[]`
9. `workflow_ids[]`
10. `requires`
   - `repo_ai_governor_min_version`
   - `codex_min_version`
   - `claude_code_min_version`
   - `github_copilot_min_version`
11. `artifacts[]`
12. `apply_state`
13. `verification_summary`

并要求：

1. plugin manifest、apply report 与 export manifest 的版本必须可回链
2. skill / instruction / agent profile 不自行维护业务版本，统一引用 export manifest
3. `host verify` 必须检查产物与 `canonical_source_refs[]` 是否仍同步
4. GitHub Copilot 的 `target` 必须显式记录为 `repo-local | cli-plugin | github-com-agent` 之一，避免不同 surface 的语义混写

## 14. 分阶段实施计划

### Phase 1：Project-Local Host Assets MVP

目标：

1. 输出 Codex `AGENTS.md + .agents/skills/`
2. 输出 Claude `.claude/skills/`
3. 输出 GitHub Copilot：
   - `.github/copilot-instructions.md`
   - `.github/instructions/**/*.instructions.md`
   - `.github/skills/`
   - `.github/agents/`
4. 跑通 staged export -> controlled apply -> verify 的最小 project-local 闭环
5. GitHub Copilot 的 MVP target 明确收口为 `repo-local`

范围：

1. 建立 structured projection registry 形态的 workflow asset 层
2. 导出三宿主 staged project-local assets
3. 为 project-local assets 建立 apply/sync contract
4. 复用现有 CLI wrapper

### Phase 2：Installable Bundles MVP

目标：

1. 输出 `.codex-plugin/plugin.json`
2. 输出 `.claude-plugin/plugin.json`
3. 输出 GitHub Copilot CLI `plugin.json`
4. 支持把 skill / agent / hook / MCP 资产打包为 installable bundle
5. GitHub Copilot 的 MVP target 扩展到 `cli-plugin`

范围：

1. host-specific manifest renderer
2. packaging / verify / smoke
3. 基础 install docs 与 examples
4. Copilot target-aware verify

### Phase 3：MCP And Host-Native Enhancements

目标：

1. host assets 不仅能“调 CLI”，还能“调 governor tools”
2. Copilot custom agents、Copilot CLI plugins、Claude hooks、Codex subagents 开始发挥真正价值

范围：

1. `.mcp.json` 产物
2. service-host tool surface
3. Claude hooks baseline
4. Copilot hooks baseline
5. Codex optional host metadata

### Phase 4：Advanced Host Integrations

目标：

1. 三宿主的高级定制面都收敛为 governor 的优化层
2. workflow、hooks、agents、MCP 联动
3. GitHub.com coding agent assets 作为附加 consumer surface 正式进入导出矩阵

范围：

1. reviewer / explorer / docs-researcher 类 custom agents
2. stop-time review closeout hooks
3. richer host UI metadata
4. richer Copilot target-specific agent exports

## 15. 风险与缓解

### 15.1 风险：形成三套 workflow 真值

缓解：

1. 先有 workflow asset，再投影 host assets
2. 禁止手工维护三宿主正文
3. `host verify` 默认阻断 drift

### 15.2 风险：宿主 hooks 反向取代 core policy

缓解：

1. hooks 只负责早拦截、提示、回接 governor
2. 最终 `allow / confirm / block / escalate` 仍由 governor policy 决定

### 15.3 风险：当前 `.codex/skills` 与官方 `.agents/skills` 并存导致混乱

缓解：

1. 将 `.codex/skills` 明确标记为过渡期 authoring / self-host 资产
2. 正式对外导出与文档统一转向 `.agents/skills`
3. 后续再决定是否把 source asset 目录本身迁移

### 15.4 风险：GitHub Copilot 路径选错到已停用的 GitHub App Copilot Extensions

缓解：

1. 在方案层明确禁用该路线
2. `host verify` 发现该输出模式时直接报错
3. 文档统一指向 repo assets / Copilot CLI plugins / custom agents / MCP

### 15.5 风险：plugin/bundle packaging 扩大范围，拖慢 core 主线

缓解：

1. 先做 project-local，再做 installable bundle
2. 只迁移最成熟 workflow
3. 优先做导出与验证，不先做 marketplace

## 16. 完成定义

满足以下条件时，可认为本方案的 MVP 落地成立：

1. 能从同一份 workflow / standards source 生成：
   - Codex staged export + host-discoverable project-local assets
   - Claude Code staged export + host-discoverable project-local assets
   - GitHub Copilot staged export + host-discoverable project-local assets
2. 能生成：
   - `.codex-plugin/plugin.json` + `skills/`
   - `.claude-plugin/plugin.json` + `skills/`
   - GitHub Copilot CLI `plugin.json` + `skills/` + `agents/`
3. 至少 2 条现有 workflow 完成三宿主导出
4. `host export/apply/verify` 能区分 staged export 与 host-discoverable assets，不再把二者混为一层
5. host assets 最终能稳定回接 governor core，而不是绕开治理主链
6. 产物带版本回链、`canonical_source_refs` 与 verify 能力
7. GitHub Copilot 的 MVP target 明确收口为 `repo-local + cli-plugin`，且 schema 已预留 `github-com-agent`
8. GitHub Copilot 的导出路径不再依赖已停用的 GitHub App Copilot Extensions
9. 宿主增强层缺失时仍能回退到 governor CLI baseline

## 17. 最终建议

最终建议不是“把产品改成三份宿主 prompt 包”，而是：

`把产品补成同时具备 core runtime、project-local host assets、installable bundles、MCP bridge 的多层分发体系。`

优先级上，最稳的路线是：

1. 先把现有 workflow 提纯成宿主无关 workflow assets
2. 先输出：
   - Codex `.agents/skills`
   - Claude `.claude/skills`
   - Copilot `.github/copilot-instructions.md + .github/skills + .github/agents`
3. 再补：
   - `.codex-plugin`
   - `.claude-plugin`
   - GitHub Copilot CLI `plugin.json`
4. 最后把高价值 workflow 升级到 MCP、hooks、custom agents 与 richer host-native affordance

这样既能回答“我们是否能转成 Codex、Claude Code 与 GitHub Copilot 的 skill 包或插件”，也不会牺牲 `Repo AI Governor` 作为治理产品本体的长期架构正确性。
