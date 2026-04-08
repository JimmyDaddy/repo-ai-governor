# Host Skill Distribution And Target-Repository Bootstrap Follow-Up Technical Solution (Draft)

- Status: draft
- Date: 2026-04-08
- Scope: adoption-pack distribution / target-repo bootstrap / host materialization / skill discovery / source resolution
- Related Inputs:
  - `.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/contracts/governance-host-distribution-contract.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/host-native-distribution-and-target-specific-consumption.md`
  - `apps/cli/src/runtime/host-distribution-runtime.ts`
  - `packages/standards/src/constants/host-distribution.constant.ts`
  - `docs/local-adoption-playbook.md`
  - `docs/support-matrix.md`
- External References:
  - <https://github.com/google-labs-code/stitch-skills>

## 0. 外部参考边界

本 follow-up 对 `stitch-skills` 的借鉴，不再只限于“安装 UX”，而是明确借鉴它的两层分发思路：

1. 一个仓库本身可以被当作 skill catalog / capability source。
2. 用户可以通过统一命令把该仓库里的能力 materialize 到当前 agent 或当前项目可消费的位置。

截至 `2026-04-08`，`stitch-skills` README 可确认的关键事实是：

1. 它支持类似 `npx skills add google-labs-code/stitch-skills --list` 的 catalog 发现方式。
2. 它支持从远端 skill 仓库选择具体 skill 进行安装。
3. 它强调工具自动检测 active coding agents，并把 skill 放到对应目录。

对 `Repo AI Governor` 来说，真正值得借的不是某个 skill 内容本身，而是：

1. “把一整组能力当作可分发包”的产品抽象。
2. “从一个 source 把能力植入目标消费面”的安装模型。
3. “用户不需要先理解内部目录结构”这一 adopter 体验。

## 1. 本 follow-up 的重新定位

上一个版本的草稿把问题收得过窄，主要聚焦在：

1. `.codex/skills` 是否应该继续作为 `host export/pack` 的硬依赖。
2. 如何把 source resolution 从单一路径升级成 builtin/global/repo 三层。

这两个判断仍然成立，但它们只覆盖了“怎么找到 skill source”，没有覆盖你这次真正强调的目标：

1. 把 `Repo AI Governor` 已具备的 skill、workflow、host-native projection、governed flow 管理能力，作为一整套能力包应用到目标仓库。
2. 让 adopter 使用时更像“给目标仓库安装一套治理能力”，而不是“先手工准备 maintainer 目录，再自己拼 export/apply/pack 步骤”。

因此，本 follow-up 的正式定位应调整为：

1. 解决 `.codex/skills` 强依赖问题。
2. 更进一步，把 `Repo AI Governor` 的宿主技能、流程治理和 bootstrap 能力收敛成一个可分发、可安装、可升级、可移除的 `adoption pack` 模型。

## 2. 当前缺口

### 2.1 已经具备的基础

当前仓库已经具备不少可复用能力：

1. `init / doctor / check`
2. `connect / verify`
3. `plan / run / review / review-verify`
4. `workflow / upgrade`
5. `host export / host verify / host pack`
6. `service-host` 根包导出
7. 仓库内已有一批 self-host skill / workflow 资产

这意味着我们缺的并不是“底层能力不存在”，而是“如何把这些能力整套交付给目标仓库”。

### 2.2 当前体验仍偏 maintainer baseline

现在 adopter 若想把 host/native skill 体验带到目标仓库，仍然面临几个问题：

1. `host export/pack` 当前直接从 `.codex/skills/**` 扫描 source。
2. `.codex/skills` 既是 self-host authoring 目录，又被当成 distribution input。
3. 用户需要自己理解 staged export、apply、pack 和不同 host target 的关系。
4. 用户拿到的更像是若干离散命令，而不是“给目标仓库装一套治理能力”的整体体验。

### 2.3 真正缺的是 target-repo bootstrap / materialization model

当前正式 contract 已经定义了：

1. host target matrix
2. staged export -> apply/sync -> pack -> verify 生命周期
3. host assets 只是 canonical workflow truth 的薄投影

但还没有正式定义下面这层产品抽象：

1. 什么是“面向 adopter 的完整治理能力包”。
2. 这套能力包如何安装到目标仓库。
3. 它如何记录 provenance、版本、apply receipt、upgrade path 和 remove path。
4. 它如何把 skill、workflow、instructions、agent descriptors、MCP wiring、workspace bootstrap 串成同一条安装链路。

## 3. 目标与非目标

### 3.1 目标

1. 把 `Repo AI Governor` 的 adopter-facing skill 与流程管理能力抽象为可分发的 `adoption pack`。
2. 允许用户把某个 adoption pack 应用到目标仓库，而不是只生成一个 staged export 目录。
3. 保持 `host export/verify/pack` 仍可作为底层机制存在，但在更高层提供“整套植入”的入口。
4. 让 `.codex/skills` 从 mandatory prerequisite 降级为 repo-local override 或 authoring input。
5. 支持安装、差异检查、升级、移除和 provenance 回链。
6. 保持现有 canonical truth 边界不变，避免把目标仓库里的宿主文件误升格为 runtime truth。
7. adopter-first 的正式 pack 内容应一次性定义为完整范围，而不是以“MVP 只装部分能力”的方式长期悬置公开能力面。

### 3.2 非目标

1. 不在本轮把产品做成开放式 marketplace。
2. 不允许目标仓库内的 skill/instruction 文件直接取代 governor runtime 的 canonical workflow truth。
3. 不绕过 `cli_wrapper`、`mcp`、audit、policy gate、verify 的既有治理边界。
4. 不要求首轮就支持任何第三方远端仓库的任意安装；remote source 应先有 trust/allowlist 约束。

## 4. 推荐模型

### 4.1 以 installer-layer `adoption pack` 作为分发单元

建议正式引入 `adoption pack` 这一 installer-layer 产品抽象。

它不是单个 skill，也不是单次 host export 结果，而是“可应用到目标仓库的一整套治理能力包”。

这里必须先和现有 `Standards Pack` 划清职责：

1. `Standards Pack`
   - 继续作为现有正式 pack family，负责结构化规则、`human/ai/agents` 渲染和 `AGENTS` 投影。
   - 继续由 `StandardsPackRegistry` / `StandardsRuntimeLoader` 持有。
2. `adoption pack`
   - 是 installer-layer 组合物。
   - 它消费既有 `Standards Pack`、workflow assets、host distribution metadata、bootstrap scaffolding 与 managed lifecycle metadata。
   - 它不新增平行 rule registry，也不取代 `StandardsPackRegistry`。
3. 换句话说：
   - `Standards Pack` 解决“规则和投影”
   - `adoption pack` 解决“如何把多种 adopter-facing 资产作为一套可安装能力植入目标仓库”

一个 `adoption pack` 至少应描述：

1. pack id / version / owner
2. 内含的 workflow assets / command entrypoints / guide entrypoints
3. 支持的 host families 与 targets
4. 默认 bootstrap profile，例如 `adopter-complete`、`code-review-only`、`delivery-only`
5. canonical source refs / source pack refs
6. handoff bridge 策略，例如 `cli_wrapper` / `mcp`
7. 安装后需要 materialize 到目标仓库的文件和目录种类

#### 4.1.1 完整 adoption-pack manifest 草案

本方案不建议只定义一个“够用就行”的最小包描述，然后把大量 adopter-facing 能力留到未来再补。更合适的做法是：

1. 首版 manifest 就把完整 adopter 内容范围声明清楚。
2. 实现可分期，但 content contract 不应以 MVP 理由长期残缺。

因此首版 manifest 建议直接覆盖以下字段：

1. `schema_version`
2. `pack_id`
3. `pack_version`
4. `status`
5. `owner_module`
6. `source_kind`
7. `source_ref`
8. `profiles[]`
9. `workflow_asset_ids[]`
10. `command_entrypoints[]`
11. `guide_entrypoints[]`
12. `standards_pack_refs[]`
13. `host_targets[]`
14. `managed_asset_groups[]`
15. `bootstrap_actions[]`
16. `managed_paths[]`
17. `tooling_prerequisites[]`
18. `canonical_source_refs[]`
19. `source_pack_refs[]`
20. `handoff_bridge`
21. `verification_profile_refs[]`
22. `upgrade_policy`
23. `remove_policy`
24. `docs_entrypoints[]`

建议的完整形态示意如下：

```yaml
schema_version: adoption-pack-manifest-v1
pack_id: adopter-complete
pack_version: 1.0.0
status: active
owner_module: runtime.governance-clients
source_kind: built_in
source_ref: "@cjhdev/repo-ai-governor/adoption-packs/adopter-complete"
profiles:
  - profile_id: complete
    display_name: Adopter complete
    workflow_asset_ids:
      - workspace-code-review-workflow
      - workspace-delivery-finisher
    command_entrypoints:
      - init
      - doctor
      - check
      - connect
      - verify
      - plan
      - run
      - review
      - review-verify
      - workflow
      - upgrade
      - workspace
      - resume
      - set-ui-theme
      - host-export
      - host-verify
      - host-pack
      - service-host
    guide_entrypoints:
      - onboarding
      - workflow-lifecycle
      - workspace-operations
      - host-distribution
      - troubleshooting
    standards_pack_refs:
      - workflowReviewGovernancePack
    host_targets:
      - codex.project_local
      - claude_code.project_local
      - github_copilot.repo_local
managed_asset_groups:
  - command_guides
  - instructions
  - skills
  - agents
  - hooks
  - wrappers
  - mcp_bridge
  - bootstrap_templates
  - runtime_handoff_metadata
  - management_metadata
bootstrap_actions:
  - seed_repo_local_bootstrap_template
  - seed_host_assets
  - seed_runtime_handoff_metadata
  - seed_install_receipt
managed_paths:
  - AGENTS.md
  - .agents/**
  - .claude/**
  - .github/copilot-instructions.md
  - .github/instructions/**
  - .github/skills/**
  - .github/agents/**
  - .mcp.json
  - .repo-ai-governor/adoption/**
tooling_prerequisites:
  - repo-ai-governor CLI
  - selected host runtimes
canonical_source_refs:
  - packages/standards/**
  - .codex/skills/workspace-code-review-workflow/SKILL.md
  - .codex/skills/workspace-delivery-finisher/SKILL.md
source_pack_refs:
  - built-in-adoption-pack:adopter-complete
  - official-standards-pack:workflowReviewGovernancePack
handoff_bridge: cli_wrapper
verification_profile_refs:
  - host.verify
  - adapters.verify
upgrade_policy: managed_clean_only
remove_policy: managed_clean_only
docs_entrypoints:
  - README.md
  - docs/local-adoption-playbook.md
```

这里最关键的不是字段数量，而是明确四件事：

1. pack 必须能回链 canonical source。
2. `adoption pack` 必须组合现有 `Standards Pack`，而不是创建新的平行规则事实面。
3. pack 必须默认覆盖完整 adopter 内容，而不是只装一小部分 prompts。
4. pack 必须能声明 profile，而不是只声明一坨文件。
5. pack 必须把“将要管理哪些资产组”和“将要写入哪些路径”说清楚，便于后续 upgrade/remove。

#### 4.1.2 完整内容范围

`adopter-complete` 不应只是一个名称，它需要明确覆盖以下完整内容：

1. 初始化与审计面
   - `init`
   - `doctor`
   - `check`
   - 对应的使用说明、host handoff 指引和 readiness 提示
2. 多工具接入面
   - `connect`
   - `verify`
   - 多 host 的 onboarding instructions、agent hints、MCP wiring
3. 受治理执行面
   - `plan`
   - `run`
   - `review`
   - `review-verify`
   - 与这些命令对应的 workflow skills / agents / wrappers
4. 流程与生命周期面
   - `workflow`
   - `upgrade`
   - 流程变更和升级 handoff 的说明入口
5. workspace 与交互辅助面
   - `workspace`
   - session shell / `resume` 的入口说明
   - 必要的 theme / shell preference handoff guidance
6. 宿主分发与桥接面
   - `host export`
   - `host verify`
   - `host pack`
   - `service-host` / MCP / host-specific bridge
7. repo management 面
   - install metadata
   - apply receipt
   - upgrade/remove ownership
   - docs entrypoints 和 troubleshooting guidance

换句话说，完整 pack 交付的不是“几个 skill”，而是：

1. 命令面说明
2. workflow assets
3. host-native projected assets
4. bridge wiring
5. bootstrap templates / runtime handoff metadata
6. install lifecycle metadata
7. adopter-facing 文档入口

#### 4.1.3 标准 profiles

虽然本方案要求完整内容优先，但这不等于只允许一个 profile。更合理的做法是：

1. 把 `adopter-complete` 作为默认且完整的正式 profile。
2. 允许围绕同一 pack 衍生若干裁剪 profile，服务特定 adoption 场景。

建议标准 profiles 如下：

1. `complete`
   - 默认 profile。
   - 覆盖完整 adopter 内容与全部正式公开命令面。
2. `complete-codex`
   - 内容仍完整，但 host materialization 仅写入 Codex project-local assets。
3. `complete-claude`
   - 内容仍完整，但 host materialization 仅写入 Claude Code project-local assets。
4. `complete-copilot`
   - 内容仍完整，但 host materialization 仅写入 GitHub Copilot repo-local assets。
5. `code-review-only`
   - 裁剪到 review 生命周期与相关 bootstrap。
6. `delivery-only`
   - 裁剪到 delivery / closeout / verification 相关能力。
7. `self-host-complete`
   - 面向“希望在目标仓库内直接采用与本仓库同类治理 authoring/workspace 模型”的高级 profile。
   - 除 host/project-local assets 外，还需要显式启用 repo-local canonical workspace bootstrap、规范知识源模板、registry/template seed 与治理 authoring surface。

这里的原则是：

1. `complete` 是正式主契约。
2. 其他 profile 是同一 pack 的受控子集，而不是首版能力缺口的替代说法。

#### 4.1.4 `self-host-complete` 作为官方参考 / 治理模板

如果目标不是“只把 governor 能力接入一个业务仓库”，而是“让目标仓库本身采用与本仓库相似的自托管治理开发流”，那么仅有 `adopter-complete` 还不够。

因此本方案建议把 `self-host-complete` 明确建模为：

1. 官方参考 profile。
2. 官方治理方案模板 profile。
3. 显式高级路径，而不是所有 adopter 的默认轻量安装路径。

它与 `adopter-complete` 的差异在于：

1. `adopter-complete`
   - 目标是让外部仓库获得完整治理能力入口。
   - 默认仍偏“consumer of governance runtime”。
2. `self-host-complete`
   - 目标是让目标仓库具备“author governance artifacts and run repo-local canonical workspace” 的能力。
   - 更接近“把本仓库这种治理工作流模型模板化安装进去”。

但这里必须明确一个边界：

1. `self-host-complete` 可以复刻“结构、契约和流程模型”。
2. 它不应复制本仓库当前活跃的真实数据面，例如现有 `project-056`、当前 open review、历史 artifact rows 或其他仓库特定 execution trace。
3. 更准确的说法是：
   - 它提供的是 `governance-authoring template`
   - 不是 `live-state snapshot clone`

因此 `self-host-complete` 应要求显式激活条件，例如：

1. `workspace.mode=repo_local`
2. 明确选择 `self-host-complete`
3. 允许 installer 在 install 后触发一次 repo-local canonical workspace bootstrap

这条路径可以同时作为：

1. 高级 adopter 的正式参考实现。
2. 官方默认治理方案模板。
3. 后续 team-specific governance template 的派生基线。

### 4.2 两阶段安装模型：resolve -> materialize

借鉴 `stitch-skills` 的思路，本方案推荐把 adopter 体验从“手工拼命令”升级成“两阶段安装模型”：

1. `resolve`
   - 从 builtin/global/repo source 中解析某个 adoption pack。
   - 得到 pack metadata、`workflow_asset_ids[]`、`command_entrypoints[]`、`guide_entrypoints[]`、`standards_pack_refs[]`、host capability matrix 与 source provenance。
   - `standards_pack_refs[]` 的规则加载仍交给现有 `StandardsRuntimeLoader` 处理，而不是在 installer 层复制一套 rule registry。
2. `materialize`
   - 把 pack 中声明的能力按所选 profile 和 host target 物化到目标仓库。
   - 生成 install manifest、apply receipt、drift baseline 与 future upgrade/remove 所需的管理元数据。

这样，`host export` 就不再是用户心智中的最终动作，而是 materialization pipeline 中的一个底层步骤。

#### 4.2.1 install receipt 与 managed ownership

若要把能力真正植入目标仓库，仅有 export manifest 还不够，必须补齐 install receipt。

建议每次 `adopt apply` 或等价 materialization 都生成一份 receipt，至少包含：

1. `installation_id`
2. `pack_id`
3. `pack_version`
4. `profile_id`
5. `target_repo_root`
6. `resolved_source`
7. `applied_at`
8. `applied_by`
9. `written_files[]`
10. `file_hashes{}`
11. `host_targets[]`
12. `verification_receipts[]`

更重要的是，receipt 需要具备 managed ownership 语义。建议把被 materialize 的文件分为以下状态：

1. `managed_clean`
   - 由本工具写入，且与上次安装记录一致。
2. `managed_modified`
   - 原本由本工具写入，但用户后来改过。
3. `detached`
   - 原受工具管理，但用户明确声明退出管理。
4. `unmanaged`
   - 不在本工具管理范围内。

这四种状态会直接决定升级和移除策略：

1. `managed_clean` 可自动 upgrade/remove。
2. `managed_modified` 默认只给 diff，不直接覆盖或删除。
3. `detached` 不再被自动修改，但可继续显示 drift。
4. `unmanaged` 完全不参与本工具的 install lifecycle。

#### 4.2.2 管理元数据建议落点

为了支持目标仓库级的 upgrade/remove，本方案建议至少保留一份 repo-visible 的管理元数据，而不是只存在 tool-managed workspace。

更稳妥的做法是双写：

1. 目标仓库内保留轻量 install metadata，用于 portability 和 repo-level lifecycle。
2. workspace 内保留镜像 receipt，用于 diagnostics、audit 和回放。

repo-visible 位置可先在 draft 阶段预留为：

1. `.repo-ai-governor/adoption/installed-packs/<pack-id>.json`
2. `.repo-ai-governor/adoption/install-history/<installation-id>.json`

这里存放的是 install lifecycle 元数据，而不是完整 canonical runtime truth，因此不违背当前产品边界。

### 4.3 source resolution 仍然重要，但它只是子问题

此前讨论的三层 source resolution 仍应保留，只是需要明确它属于 `resolve` 阶段，并且服务的是 adoption-pack source，而不是重建一套 `Standards Pack` 规则分发系统：

1. `repo-local override`
2. `global installed packs`
3. `built-in official packs`

默认优先级建议仍为：

`repo-local override > global installed packs > built-in official packs`

但这里的目标不再只是“让 host export 找得到 source”，而是：

1. 让 adoption pack 可以来自官方内置能力。
2. 让团队可以做全局复用。
3. 让特定仓库可以对某个 pack 做 repo-local overlay。
4. 让 `standards_pack_refs[]` 继续沿用现有 `official / team / repository` layering 与 `StandardsRuntimeLoader`，避免 installer 层制造第二套规则事实面。

### 4.4 materialize 到目标仓库的内容边界

一个 adoption pack 应该能把以下内容按需 materialize 到目标仓库：

1. host-native skill / instruction / agent 资产
   - `AGENTS.md`
   - `.agents/skills/**`
   - `.claude/**`
   - `.github/copilot-instructions.md`
   - `.github/instructions/**`
   - `.github/skills/**`
   - `.github/agents/**`
2. MCP / service-host bridge wiring
   - `.mcp.json`
   - host-specific mcp config
3. adoption bootstrap reference 与治理 handoff wiring
   - repo-local bootstrap template，或在显式选择 `workspace.mode=repo_local` 时写入 applied config
   - connect/verify/run/review/review-verify 的 handoff guidance
   - upgrade/workspace guidance entrypoints
   - installer -> runtime 的 provenance / ownership metadata
4. install and management metadata
   - pack manifest
   - apply receipt
   - source provenance
   - upgrade/remove ownership metadata

这里的关键是：

1. 目标仓库拿到的不只是若干 prompt 文件。
2. 而是一套“能把 host 体验和 governor 主链真正接上”的治理能力植入结果。
3. installer 默认写入的是 consumer-facing projection、repo-visible adoption metadata 与 guide/template/reference；运行态 canonical state 仍需服从 `workspace.mode=tool_managed|repo_local` 的现有 truth boundary。

#### 4.4.1 `adopter-complete` 的目标仓库落地清单

为了让“完整内容”不流于抽象，本方案建议把默认 `complete` profile 的落地路径直接写成显式清单。

共享 managed files：

1. `AGENTS.md`
2. `.mcp.json`
3. `.repo-ai-governor/adoption/installed-packs/adopter-complete.json`
4. `.repo-ai-governor/adoption/install-history/<installation-id>.json`
5. `.repo-ai-governor/adoption/export-manifests/<host>/<timestamp>/host-export.manifest.json`
6. `.repo-ai-governor/adoption/verification/<host>/<timestamp>/host-verification.summary.json`
7. `.repo-ai-governor/adoption/docs/README.adoption.md`
8. `.repo-ai-governor/adoption/docs/troubleshooting.md`
9. `.repo-ai-governor/adoption/bootstrap/governor.repo-local.template.yaml`
10. `.repo-ai-governor/adoption/guides/connect.md`
11. `.repo-ai-governor/adoption/guides/verify.md`
12. `.repo-ai-governor/adoption/guides/run.md`
13. `.repo-ai-governor/adoption/guides/review.md`
14. `.repo-ai-governor/adoption/guides/upgrade.md`
15. `.repo-ai-governor/adoption/guides/workspace.md`

Codex project-local assets：

1. `.agents/skills/<workflow-id>/SKILL.md`
2. `.agents/subagents/<workflow-id>.json`
3. `AGENTS.md` 中的 Codex-facing workflow guidance
4. `.mcp.json` 中的 Codex bridge wiring

Claude Code project-local assets：

1. `.claude/settings.json`
2. `.claude/hooks/hooks.json`
3. `.claude/skills/<workflow-id>/SKILL.md`
4. `.claude/agents/<workflow-id>.agent.md`
5. `.mcp.json` 中的 Claude bridge wiring

GitHub Copilot repo-local assets：

1. `.github/copilot-instructions.md`
2. `.github/instructions/<workflow-id>.instructions.md`
3. `.github/skills/<workflow-id>/SKILL.md`
4. `.github/agents/<workflow-id>.agent.md`
5. `.github/mcp.json`
6. 当 target 为 `github_copilot.github_com_agent` 时，再额外写入 `.github/hooks/hooks.json`

这份清单有三个边界需要说清楚：

1. project-local host assets 是默认落地面。
2. repo-visible `adoption/**` 目录存放的是 installer metadata、guide 与 bootstrap template，不直接充当 runtime canonical state。
3. plugin bundle 不是默认写入 repo 根目录，而是由安装链路在需要时额外生成 managed bundle artifacts。

#### 4.4.2 workspace-mode truth table

为了避免 installer 和 runtime 事实源发生冲突，必须把“repo-visible 安装产物”和“workspace canonical state”显式拆开。

| 路径 / 资产类 | `tool_managed` 默认安装 | `repo_local` 安装/激活 | Canonical owner / 注意事项 |
|---|---|---|---|
| host-native assets（`AGENTS.md`、`.agents/**`、`.claude/**`、`.github/**`、`.mcp.json`） | 允许 materialize | 允许 materialize | 永远只是 host-consumable projection；canonical workflow truth 不在这些文件里。 |
| `.repo-ai-governor/adoption/installed-packs/**`、`install-history/**`、`export-manifests/**`、`verification/**`、`docs/**` | 允许 materialize | 允许 materialize | installer-owned metadata/docs；可 repo-visible，但不是 runtime operational truth。 |
| `.repo-ai-governor/governor.yaml` | 默认不写 repo-visible canonical file；如需提示用户，只提供 `adoption/bootstrap/**` template/reference | 仅在明确选择 `workspace.mode=repo_local` 的 bootstrap/profile 时写入，并从此成为 repo-local workspace config truth | config truth 由 workspace mode 决定，而不是由 pack 自己强行落盘。 |
| `.repo-ai-governor/context/workflow/*.definition.json` | 不作为 install-time output 落到 repo | 只能在 repo_local workspace 已激活后，由 `workflow preview/create/edit` 或等价 runtime command 生成/更新 | runtime-owned operational state，不是静态 install asset。 |
| connect/verify diagnostics、active config、readiness facts | 保留在 tool-managed workspace；repo 只保留 guide/reference | 可由后续 runtime commands 写入 repo_local workspace，但不由 installer 静态下发 | 这些是运行态事实，不能被 install receipt 冒充。 |
| `.repo-ai-governor/adoption/guides/**` 与 bootstrap templates | 允许 materialize | 允许 materialize | guide/template/reference only，永不作为 canonical operational state。 |
| `.repo-ai-governor/normative_knowledge_sources/**` | 默认不写 repo-visible canonical norm sources；最多只保留 template/index refs | 仅在显式选择 `self-host-complete` 并启用 repo-local bootstrap 时 seed，随后成为 repo-local normative truth surface | 这是 self-host template 的核心面，不属于普通 adopter-complete 默认 payload。 |
| `.repo-ai-governor/context/current-context.md`、`context/dev/**`、`plan.md`、`tasks/**`、`review/**` | 默认不写 repo-visible canonical execution state | 仅在 `self-host-complete + repo_local bootstrap` 下 seed initial empty/template-backed execution surfaces，之后由 runtime 写入与推进 | 允许初始化模板，但不得复制源仓库当前活态 stream 数据。 |
| `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite` | 默认不 materialize | 仅在 `self-host-complete + repo_local bootstrap` 下初始化 canonical sqlite ledger | sqlite 文件可被 bootstrap 创建，但 canonical rows 仍应由 runtime / sync pipeline 生成。 |
| `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite` 与 rendered CSV views | 默认不 materialize | 仅在 `self-host-complete + repo_local bootstrap` 下初始化 canonical registry 与空渲染视图 | 允许 seed schema/empty registry；不得复制源仓库现有 artifact entries。 |
| `.repo-ai-governor/draft/**`、`context/technical-solution-*.yaml`、technical-solution module registry/template docs | 默认不 materialize | 仅在 `self-host-complete + repo_local bootstrap` 下 seed authoring template / lifecycle registry baseline | 这是 governance authoring surface，而非普通 adopter runtime baseline。 |

因此 installer 的职责应收敛为：

1. 写 host-consumable projection。
2. 写 adoption lifecycle metadata。
3. 在需要时写 repo-local bootstrap template。
4. 不预写 runtime active state。
5. 若用户显式选择 `self-host-complete`，允许执行一次“template bootstrap -> repo_local activation”，但仍只生成空白/模板化 canonical surface，而不是复制源仓库 live state。

#### 4.4.3 `repo_local` 模式下的后续运行态产物

如果用户显式选择 `workspace.mode=repo_local`，那么安装完成后，后续命令面可以继续把 runtime-owned 状态写回仓库；但这些文件属于运行态产物，不属于静态 pack install payload。

典型例子：

1. `.repo-ai-governor/governor.yaml`
2. `.repo-ai-governor/context/workflow/active-workflow.definition.json`
3. connect / verify / workflow 命令在 repo-local workspace 下产生的诊断与定义类产物

默认 `tool_managed` 路径则应把这些运行态事实保留在工具管理的 workspace root，而不是随 pack 安装直接下发到 repo。

#### 4.4.4 `self-host-complete` 的额外模板面

若要让目标仓库真正采用“像本仓库这样”的治理开发流，`self-host-complete` 还应在 `adopter-complete` 基础上补齐以下模板化 surface：

1. 规范知识源模板
   - `.repo-ai-governor/normative_knowledge_sources/**`
   - `normative-loading-manifest.yaml`
   - triad / governance / module-registry 等模板或官方参考副本
2. 执行态 bootstrap 模板
   - `.repo-ai-governor/context/current-context.md`
   - `.repo-ai-governor/context/dev/<project-xxx>/<sprint-xxx>/plan.md`
   - `.repo-ai-governor/context/dev/<project-xxx>/<sprint-xxx>/tasks/**`
   - `.repo-ai-governor/context/dev/<project-xxx>/<sprint-xxx>/review/**`
3. sqlite canonical resources
   - `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`
   - `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`
   - 必要时补齐空的 rendered compatibility views
4. governance authoring surfaces
   - `.repo-ai-governor/draft/**`
   - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
   - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
   - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/**` 的模板化骨架

这组 surface 的目标不是把本仓库“原样拷贝过去”，而是：

1. 让目标仓库拥有同类治理 authoring 能力。
2. 让后续 `init/connect/plan/run/review/workflow/upgrade/workspace` 能在 repo-local canonical workspace 中推进。
3. 让 task-ledger / artifact-registry / technical-solution lifecycle 这些 machine-readable source 在目标仓库里具备正式落点。

因此 `self-host-complete` 更适合被描述为：

1. 官方参考模板。
2. 官方默认治理方案模板。
3. team-level governance pack 的派生母版。

#### 4.4.5 可选 bundle artifacts

对于选择安装 installable bundle 的场景，本方案建议把 bundle 作为 managed artifact，而不是直接散落在仓库根目录。

推荐落点：

1. `.repo-ai-governor/adoption/bundles/codex/.codex-plugin/plugin.json`
2. `.repo-ai-governor/adoption/bundles/codex/skills/**`
3. `.repo-ai-governor/adoption/bundles/codex/agents/**`
4. `.repo-ai-governor/adoption/bundles/codex/.mcp.json`
5. `.repo-ai-governor/adoption/bundles/claude-code/.claude-plugin/plugin.json`
6. `.repo-ai-governor/adoption/bundles/claude-code/skills/**`
7. `.repo-ai-governor/adoption/bundles/claude-code/agents/**`
8. `.repo-ai-governor/adoption/bundles/claude-code/hooks/hooks.json`
9. `.repo-ai-governor/adoption/bundles/claude-code/.mcp.json`
10. `.repo-ai-governor/adoption/bundles/github-copilot/plugin.json`
11. `.repo-ai-governor/adoption/bundles/github-copilot/skills/**`
12. `.repo-ai-governor/adoption/bundles/github-copilot/agents/**`
13. `.repo-ai-governor/adoption/bundles/github-copilot/hooks/hooks.json`
14. `.repo-ai-governor/adoption/bundles/github-copilot/.mcp.json`

这样做的原因是：

1. repo root 只保留当前实际消费的 project-local assets。
2. installable bundles 作为受管理产物保存，方便打包、重放、校验与移除。

#### 4.4.6 adopter capability coverage 口径

默认 `adopter-complete` 不应只写少数 showcase workflows，而应覆盖当前公开命令面对应的正式 adopter 能力。

这里需要把覆盖口径拆成三类：

1. `workflow_asset_ids[]`
   - 只包含现有 host renderer 能消费的结构化 workflow assets。
   - installer 在下游 host-distribution pipeline 中，才把它们映射成现有 contract 的 `workflow_ids`。
   - raw CLI command ids 不得进入该字段。
2. `command_entrypoints[]`
   - 表达公开 adopter 命令面。
   - 它们可以落到 wrapper、guide、bootstrap flow 或 orchestration entry，而不是直接落成 skill 文件。
3. `guide_entrypoints[]`
   - 表达 adopter-facing 文档、handoff、troubleshooting 与 lifecycle 指引。
   - coverage gate 需要跨 `workflow_asset_ids[] + command_entrypoints[] + guide_entrypoints[]` 联合验证。

建议 coverage 口径如下：

1. bootstrap and audit
   - `init`
   - `doctor`
   - `check`
2. adapter onboarding
   - `connect`
   - `verify`
3. governed execution
   - `plan`
   - `run`
   - `review`
   - `review-verify`
4. workflow and lifecycle
   - `workflow`
   - `upgrade`
5. workspace and shell preferences
   - `workspace`
   - `resume`
   - `set-ui-theme`
6. host distribution and bridge
   - `host export`
   - `host verify`
   - `host pack`
   - `service-host`

这里的“覆盖”不要求每个命令都投影成单独 skill 文件，但要求：

1. 每个公开 adopter 能力都在 pack 中有明确入口。
2. 入口可以是 skill、instruction、agent、guide、wrapper 或 bootstrap template / activation flow 的组合。
3. 不允许出现“README 说是正式命令面，但 complete pack 里没有任何对应入口”的情况。

#### 4.4.7 当前实现覆盖与 follow-up 差距

为了避免本 draft 变成“全部重做”的误判，这里明确区分三类状态：

1. `Already supported`
   - 当前代码已经能直接生成或写入。
2. `Adjacent capability exists`
   - 当前仓库已有相邻能力，但还没有被纳入统一的 adoption installer。
3. `Follow-up required`
   - 当前代码没有对应产物或没有统一管理语义，需要新增实现。

下表按目标仓库落地内容逐项对齐：

| 路径 / 资产组 | 状态 | 当前依据 | 备注 |
|---|---|---|---|
| `host-export.manifest.json` | Already supported | `apps/cli/src/runtime/host-distribution-runtime.ts` 会在 staged export root 写出 manifest | 当前默认写入 staged export 目录，而不是 adoption metadata 目录。 |
| `host-verification.summary.json` | Already supported | `apps/cli/src/runtime/host-distribution-runtime.ts` 会在 staged export root 写出 verification summary | 当前 verify 已覆盖 schema/source/drift/target checks。 |
| `host-apply.report.json` | Already supported | `host export --apply-to-repo` 会生成 apply report | 仅在 project-local apply 路径存在时生成。 |
| `host-pack.report.json` | Already supported | `host pack` 会生成 pack report | 当前是 bundle pack 生命周期的正式产物。 |
| `AGENTS.md` | Already supported | Codex project-local 与 GitHub Copilot repo-local renderer 会生成 | Claude Code project-local 当前不生成统一 `AGENTS.md`，若 complete pack 要求所有安装都写入 shared `AGENTS.md`，需补统一 installer 策略。 |
| `.agents/skills/**` | Already supported | Codex renderer project-local target 已生成 | 当前来源仍依赖 `.codex/skills/**` workflow records。 |
| `.agents/subagents/**` | Already supported | Codex renderer project-local target 已生成 | 子 agent metadata 已存在。 |
| `.mcp.json` | Already supported | Codex/Claude Code project-local 与 plugin target 已生成 | 作为 shared root-level MCP wiring 已存在。 |
| `.codex-plugin/plugin.json` | Already supported | Codex plugin renderer 已生成 | 当前通过 `host pack` 产出。 |
| `skills/**` and `agents/**` in Codex bundle | Already supported | Codex plugin renderer 已生成 | 当前写入 bundle root。 |
| `.claude/settings.json` | Already supported | Claude Code project-local renderer 已生成 | 当前已经是正式 project-local asset。 |
| `.claude/hooks/hooks.json` | Already supported | Claude Code project-local renderer 已生成 | hook config 已具备。 |
| `.claude/skills/**` | Already supported | Claude Code project-local renderer 已生成 | 当前来源仍依赖 `.codex/skills/**` workflow records。 |
| `.claude/agents/**` | Already supported | Claude Code project-local renderer 已生成 | agent markdown 已具备。 |
| `.claude-plugin/plugin.json` | Already supported | Claude Code plugin renderer 已生成 | 当前通过 `host pack` 产出。 |
| `skills/**`, `agents/**`, `hooks/hooks.json`, `.mcp.json` in Claude bundle | Already supported | Claude Code plugin renderer 已生成 | 当前写入 bundle root。 |
| `.github/copilot-instructions.md` | Already supported | GitHub Copilot repo-local renderer 已生成 | 当前是 repo-local target 正式产物。 |
| `.github/instructions/**` | Already supported | GitHub Copilot repo-local renderer 已生成 | 每个 workflow 对应一个 instruction markdown。 |
| `.github/skills/**` | Already supported | GitHub Copilot repo-local renderer 已生成 | 当前来源仍依赖 `.codex/skills/**` workflow records。 |
| `.github/agents/**` | Already supported | GitHub Copilot repo-local renderer 已生成 | agent markdown 已具备。 |
| `.github/mcp.json` | Already supported | GitHub Copilot repo-local renderer 已生成 | repo-local Copilot MCP wiring 已具备。 |
| `.github/hooks/hooks.json` | Already supported | GitHub Copilot GitHub.com agent target 已生成 | 仅 reserved target 写入，不是 repo-local 默认产物。 |
| `plugin.json`, `skills/**`, `agents/**`, `hooks/hooks.json`, `.mcp.json` in Copilot CLI bundle | Already supported | GitHub Copilot CLI plugin renderer 已生成 | 当前通过 `host pack` 产出。 |
| `.repo-ai-governor/adoption/bootstrap/governor.repo-local.template.yaml` | Follow-up required | 当前无 adoption-managed bootstrap template surface | 需明确模板字段与 installer 写入策略。 |
| `.repo-ai-governor/governor.yaml` | Adjacent capability exists | 仓库本身已有正式 config path 与 `init/connect/apply` 相关能力 | 只应在显式 `repo_local` bootstrap 下成为 canonical config，不应作为默认 install-time 文件。 |
| `.repo-ai-governor/context/workflow/active-workflow.definition.json` | Adjacent capability exists | `workflow` surface 已有正式 definition path | 它应被视为 repo_local workspace 激活后的 runtime-owned 产物，而不是 installer 默认写入物。 |
| connect / verify readiness artifacts | Adjacent capability exists | 当前 `connect` 会生成 candidate config 与 diagnostics | installer 应只提供 guide/reference；真实诊断应继续由运行态命令产生。 |
| run / review / upgrade / workspace guides | Follow-up required | 当前有文档与命令面，但没有 adoption-managed guide files | 需决定 guide 模板与来源。 |
| `.repo-ai-governor/normative_knowledge_sources/**` | Follow-up required | 当前仓库拥有完整 norm-source 体系，但没有 official self-host template materializer | 这是 `self-host-complete` 的关键增量，不属于普通 adopter-complete 默认 payload。 |
| `.repo-ai-governor/context/current-context.md` 与 `context/dev/<project-xxx>/<sprint-xxx>/**` bootstrap | Adjacent capability exists | 当前 repo-local workspace contract 与执行流目录已成熟 | 需新增 template bootstrap，不应复制源仓库当前 active stream 数据。 |
| `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite` | Adjacent capability exists | canonical task-ledger sqlite 已存在，且有同步/校验脚本 | 需把 schema/bootstrap 纳入 self-host installer，而不是要求用户手工演化。 |
| `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite` | Adjacent capability exists | canonical artifact registry sqlite 已存在 | 需把 empty-registry bootstrap 与 rendered-view seed 收口到 self-host template。 |
| `.repo-ai-governor/draft/**` 与技术方案 lifecycle / delivery registries | Follow-up required | 当前仓库已自托管这些治理 surface，但 adoption installer 尚未覆盖 | 这是 governance authoring template 能否接近本仓库工作流的关键差距。 |
| `.repo-ai-governor/adoption/installed-packs/*.json` | Follow-up required | 当前无 installed-pack registry | 这是 installer lifecycle 的核心新增面。 |
| `.repo-ai-governor/adoption/install-history/*.json` | Follow-up required | 当前无 installation history receipt | 需新增 installation_id / file ownership 语义。 |
| `.repo-ai-governor/adoption/export-manifests/**` | Follow-up required | 当前 manifest 写在 staged export root | 若要 repo-visible persistent metadata，需要新增归档策略。 |
| `.repo-ai-governor/adoption/verification/**` | Follow-up required | 当前 verification summary 写在 staged export root | 若要 adoption-level verify history，需要新增持久化位置。 |
| `.repo-ai-governor/adoption/docs/**` | Follow-up required | 当前无 adoption-managed docs entrypoints | 需新增 installer-managed docs surface。 |
| `.repo-ai-governor/adoption/bundles/**` | Follow-up required | 当前 bundle 写入用户指定 bundle root | 若要变成 managed repo artifact，需要 installer 统一管理。 |
| builtin/global/repo layered source resolution | Follow-up required | 当前 workflow discovery 仅扫描 `.codex/skills/**` | 这是 complete pack installer 的前置能力。 |
| `adopt list/apply/diff/upgrade/remove` | Follow-up required | 当前无高层 installer command surface | 当前只能组合 `init/connect/host export/pack/verify`。 |

由此可以得到一个更准确的实现判断：

1. host-native projection renderer 并不是空白，反而已经相当完整。
2. 当前真正缺的不是“怎么渲染这些文件”，而是“怎么以完整 pack 的形式统一解析、安装、记录和管理它们”。
3. 如果要把 `self-host-complete` 作为官方治理模板发布，还需要把 norm-source、execution workspace、registry sqlite 与 governance authoring surfaces 都纳入 template bootstrap。
4. 因此 follow-up 的主实现重心应放在 installer lifecycle、managed metadata、source resolution、complete pack coverage 与 self-host template bootstrap，而不是重写 Codex / Claude / Copilot renderer。

### 4.5 不建议把完整 canonical state 直接塞进目标仓库

虽然要把能力应用到目标仓库，但仍需守住边界：

1. target repo 应接收 consumer-facing assets 和必要 bootstrap metadata。
2. canonical workflow truth、policy truth、audit truth 仍由 `Repo AI Governor` runtime / workspace 持有。
3. 目标仓库内的 materialized assets 应被视为 managed projection，而不是新的 authoring truth。

这意味着本方案不是“把 `.repo-ai-governor/**` 整个复制到目标仓库”，而是：

1. 将 adopter 消费面需要的那部分投影过去。
2. 再用 install manifest 和 verify contract 保持与 canonical source 的回链。

### 4.6 推荐的命令面

如果只复用现有命令，用户心智仍然会偏向低层步骤。因此更合理的方向是新增一个更高层的 adopter surface，例如 `adopt`。

推荐命令草案：

1. `repo-ai-governor adopt list`
   - 列出可用 adoption packs 与 profiles。
2. `repo-ai-governor adopt apply <pack-id> --repo <path>`
   - 将某个 pack 整体应用到目标仓库。
3. `repo-ai-governor adopt diff --repo <path>`
   - 查看当前 repo 的 managed assets 与目标 pack 的差异。
4. `repo-ai-governor adopt upgrade <pack-id> --repo <path>`
   - 升级已安装 pack。
5. `repo-ai-governor adopt remove <pack-id> --repo <path>`
   - 干净移除 managed projection。

如果首阶段不想立即扩 public surface，也可以先把这套体验折叠到现有命令里：

1. `init --preset <pack-profile>`
2. `connect --preset <tool-profile>`
3. `host export --apply-to-repo <target-repo>`

但长期仍建议有一个更高层的 `adopt` surface，因为它表达的是“安装整套治理能力”，而不是“执行某个 host export 子步骤”。

### 4.7 对现有 owner boundary 的影响

本方案不建议推翻已有 owner boundary：

1. CLI runtime 继续拥有 orchestration 和 installer pipeline。
2. `packages/standards` 继续拥有 instructions / standards projection。
3. `packages/adapters/*` 继续拥有 host-specific renderer。
4. `service-host` 继续作为 clean-room / desktop / MCP bridge 的正式导出面。
5. `runtime.governance-clients` 继续作为该能力的正式模块边界。

真正需要新增的，是“installer / materializer / managed-pack registry”这一层，而不是新的 host renderer owner。

### 4.8 与现有 contract 的关系

当前 draft 更接近新增一个“安装层事实面”，而不是替换现有 host-distribution contract。

因此更合适的演进路径是：

1. 保留 `contract.runtime.governance-host-distribution.v1`
   - 继续描述 host target、staged export、apply、pack、verify 这些投影行为。
   - 保留它现有的 `workflow_ids` 字段，用来表达已进入 host projection pipeline 的 workflow payload。
2. 后续若本方案进入 promotion，再评估新增一个 installer-focused contract
   - 例如 `contract.runtime.adoption-pack-install.v1`
   - 专门描述 adoption-pack manifest、install receipt、managed ownership、upgrade/remove 语义。
   - 该 installer contract 应原生使用 `workflow_asset_ids[]`、`command_entrypoints[]`、`guide_entrypoints[]`、`standards_pack_refs[]` 等拆分字段。

也就是说：

1. `host-distribution contract` 解决“如何投影到宿主”
2. `adoption-pack install contract` 解决“如何把整套能力安全植入目标仓库并持续管理”
3. installer 在进入 host projection 子链时，只把 `workflow_asset_ids[]` 转译成 `workflow_ids`；CLI command ids 不进入 renderer 输入契约

这两层职责应该显式分开，避免把 host projection 和 installer lifecycle 混成一个契约。

## 5. 推荐的用户路径

### 5.1 新 adopter 仓库一键植入

目标：一个全新目标仓库，希望尽快获得受治理的 Codex / Claude / Copilot 体验。

建议目标体验：

1. `repo-ai-governor adopt list`
2. `repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot`
3. `repo-ai-governor verify --adapters`
4. `repo-ai-governor host verify --repo .`

### 5.2 团队级 pack 复用

目标：组织内部多个 repo 复用同一套完整 skill/workflow/adoption pack。

建议目标体验：

1. 先安装或缓存一个 team adoption pack
2. 再对多个 repo 执行 `adopt apply`
3. 需要 repo 定制时通过 repo-local overlay 覆盖

### 5.3 仓库级 overlay

目标：目标仓库在官方或团队 complete pack 上做轻量定制。

建议目标体验：

1. 保留 repo-local override 入口
2. resolver 在 `resolve` 阶段自动选用 repo-local overlay
3. `adopt diff` 和 `host verify` 都能清楚说明当前 repo 消费的是 builtin、global 还是 repo-local source

### 5.4 官方治理模板初始化

目标：目标仓库希望采用与本仓库同类的自托管治理工作流，而不只是消费治理 runtime。

建议目标体验：

1. `repo-ai-governor adopt list`
2. `repo-ai-governor adopt apply adopter-complete --profile self-host-complete --repo . --workspace-mode repo_local`
3. `repo-ai-governor workspace execute --workspace-mode repo_local`
4. `repo-ai-governor doctor --output json`
5. `repo-ai-governor verify --adapters`

这条路径的预期结果是：

1. 目标仓库拿到 host/project-local assets。
2. 目标仓库拿到 repo-local canonical workspace bootstrap。
3. 目标仓库拿到规范知识源模板、task/review/project/sprint 模板面，以及 registry sqlite 的空白初始化。
4. 目标仓库随后可在自己的 repo-local workspace 中推进新的 `project-xxx / sprint-xxx`，而不是继承源仓库当前 live state。

## 6. 实施分期

### Phase 1: 先做完整内容的 target-repo materialization

1. 去掉 `host export/pack` 对 `.codex/skills` 的硬依赖。
2. 直接提供一个覆盖完整 adopter 内容的内置 `adoption pack`，例如 `adopter-complete`。
3. 支持把该 complete pack materialize 到目标仓库。
4. 为已安装 repo 写入 install manifest 与 apply receipt。
5. 文档从“host export 需要 `.codex/skills`”升级为“adopter 可直接安装完整 adoption pack”。

这里的“分期”只针对实现顺序，不针对内容缩水。换句话说：

1. 首个正式 pack 就应声明完整 adopter 内容。
2. 后续阶段是在 installer lifecycle、团队复用和远端信任模型上继续加固，而不是补回首版缺失的公开能力。

### Phase 2: 引入 managed lifecycle

1. `list/apply/diff/upgrade/remove` 能力成型。
2. global installed pack registry 成型。
3. verify 能显示 installed pack provenance、version 和 drift。

### Phase 3: 发布 `self-host-complete` 官方治理模板

1. 在 `adopter-complete` 之上新增 `self-host-complete`。
2. 把 norm-source templates、repo-local execution workspace bootstrap、registry sqlite bootstrap 与 governance authoring surfaces 纳入 installer。
3. 明确“模板化初始化”与“live-state clone”之间的边界。

### Phase 4: 逐步结构化 repo-local authoring

1. 评估是否把 repo-local authoring 从 `.codex/skills` 迁移到更 host-neutral 的 workflow pack source。
2. 必要时演进 host-distribution contract 或新增 managed-pack contract。
3. 在兼容前提下逐步弱化对 `.codex/skills` 的内部耦合。

## 7. 风险与约束

1. 一旦进入“整套能力植入目标仓库”，upgrade/remove 的幂等性会变成正式要求。
2. install manifest 需要能够区分“本工具生成的文件”和“用户后来手工修改的文件”，否则 remove/upgrade 风险很高。
3. remote source 若未来开放，必须先定义信任模型、allowlist 或签名校验。
4. adoption pack 不能把 host projection、workflow canonical source、workspace canonical state 三者混成一层。
5. 命令面若新增 `adopt`，需要避免和现有 `init/connect/host` 形成重复或心智冲突。
6. `self-host-complete` 若把“模板初始化”和“复制当前仓库 live state”混为一谈，会直接制造错误心智和高风险数据污染。

## 8. 验收标准

当以下条件成立时，本 follow-up 可视为被正确实现：

1. 一个全新的目标仓库无需预先具备 `.codex/skills/`，也能安装一套 `Repo AI Governor` adopter-complete pack。
2. 安装结果必须覆盖完整 adopter 内容，而不是只包含局部 workflow 或少量 host prompts。
3. 安装结果不仅包含 host skill/instruction 文件，还能把 governor 主链所需的 bootstrap wiring 一并植入目标仓库。
4. 安装后的 repo 具备可验证的 provenance、apply receipt、upgrade path 和 remove path。
5. 现有 self-host `.codex/skills` 工作流继续兼容，但其角色退化为 override/authoring input，而不是 adopter 前置条件。
6. renderer ownership、target matrix 和 canonical truth boundary 不发生回归。
7. 当用户显式选择 `self-host-complete + repo_local` 时，目标仓库能够得到：
   - `.repo-ai-governor/normative_knowledge_sources/**` 官方模板面
   - `.repo-ai-governor/context/current-context.md` 与 `context/dev/**` 初始模板面
   - `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`
   - `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`
   - `.repo-ai-governor/draft/**` 与技术方案 lifecycle baseline
8. 上述 `self-host-complete` 路径必须生成“空白/模板化 canonical surface”，而不是复制源仓库当前 `project/sprint/review/artifact` 活态数据。

## 9. 结论

如果只借 `stitch-skills` 的“skill 安装 UX”，这个 follow-up 仍然太窄。

更准确的借鉴应该是：

1. 把 `Repo AI Governor` 已有的 adopter-facing skill、workflow 和 host projection 抽象成 `adoption pack`。
2. 让用户能把这个 pack 应用到目标仓库，而不是只得到一个临时 staged export 目录。
3. 让 source resolution、host export、apply、verify 都变成 `adoption pack` 安装链路中的内部步骤。
4. 最终把“给目标仓库装一套受治理 AI 开发能力”做成正式产品面，而不是 maintainer 才能顺手用的底层能力。
5. 对需要更重治理模型的团队，还要把 `self-host-complete` 做成官方参考/治理模板，而不是要求他们手工模仿本仓库目录。

## 10. 实施拆解

### 10.1 Workstream A: Layered source resolution and adoption-pack registry

目标：

1. 把当前仅扫描 `.codex/skills/**` 的 workflow discovery 升级为 `builtin / global / repo-local` 三层解析。
2. 为 `adoption pack` 提供统一 registry，而不是让 renderer 直接依赖单一目录结构。

核心交付：

1. `adoption pack manifest` 解析器
2. layered source resolver
3. builtin pack catalog
4. global installation registry
5. repo-local override 解析规则
6. `standards_pack_refs[] -> StandardsRuntimeLoader` handoff 规则

完成标准：

1. 在无 `.codex/skills/` 的仓库中也能 resolve `adopter-complete`
2. resolve 结果能稳定输出 provenance
3. renderer 无需关心 source 来自 builtin/global/repo 哪一层
4. `Standards Pack` 继续由现有 loader/registry 解析，不在 installer 侧复制第二套规则加载链

### 10.2 Workstream B: Adoption installer and materialization pipeline

目标：

1. 在现有 `host export/apply/pack/verify` 之上增加 installer pipeline。
2. 让用户执行一次高阶命令后，目标仓库即可获得完整治理能力包。

核心交付：

1. `adopt apply` 或等价 installer command
2. `resolve -> materialize` pipeline
3. shared managed-path writer
4. project-local host asset writer
5. bundle artifact manager

完成标准：

1. installer 能把 shared assets、host assets、bootstrap metadata 一次性写入目标仓库
2. 同一 repo 的重复安装具备幂等性
3. install pipeline 能同时生成 staged manifest、apply receipt 与 verification baseline

### 10.3 Workstream C: Complete-pack content authoring

目标：

1. 把当前公开 adopter 命令面全部映射进 `adopter-complete`。
2. 不再只依赖少量 showcase workflow 作为 pack 内容。

核心交付：

1. `adopter-complete` pack manifest
2. complete profile 与 host-specific complete profiles
3. `workflow_asset / command / guide / wrapper` 对应关系表
4. adoption-managed docs entrypoints

完成标准：

1. `init/doctor/check/connect/verify/plan/run/review/review-verify/workflow/upgrade/workspace/resume/set-ui-theme/host export/host verify/host pack/service-host` 都有明确入口
2. complete pack 不出现“公开命令面存在，但 pack 中没有入口”的漂移
3. adopter-facing 文档入口与实际 pack 内容一致

### 10.4 Workstream D: Managed metadata, diff, upgrade, and remove

目标：

1. 让 adoption 不只是“一次性写文件”，而是可持续管理的 install lifecycle。
2. 把 file ownership、diff、upgrade、remove 都收进正式契约。

核心交付：

1. installed-pack registry
2. install-history receipt
3. managed ownership state machine
4. `adopt diff`
5. `adopt upgrade`
6. `adopt remove`

完成标准：

1. `managed_clean / managed_modified / detached / unmanaged` 四种状态可被真实判断
2. upgrade/remove 默认只作用于安全文件集合
3. 用户改过的 managed files 不会被静默覆盖或删除

### 10.5 Workstream E: Verification, docs truthfulness, and adopter rehearsals

目标：

1. 让新 installer surface 的验证和文档都与真实行为对齐。
2. 防止“文档说能装完整包，但实际只写了部分文件”的 truthfulness 漂移。

核心交付：

1. adoption-level verify checks
2. pack coverage assertions
3. docs/playbook/README truthfulness refresh
4. clean-room adopter rehearsal
5. upgrade/remove rehearsal

完成标准：

1. verify 能覆盖 source provenance、managed metadata、target materialization 与 drift
2. README / playbook / support matrix 与 installer 行为一致
3. 至少一条全新目标仓库的 complete-pack rehearsal 通过

### 10.6 Workstream F: Self-host template bootstrap and governance-authoring surfaces

目标：

1. 让 `self-host-complete` 成为真正可用的官方治理模板，而不是概念 profile。
2. 让目标仓库在显式 `repo_local` 路径下拥有与本仓库同类的 governance authoring/workspace surface。

核心交付：

1. `self-host-complete` profile manifest
2. norm-source template pack
3. repo-local execution workspace bootstrap
4. task-ledger / artifact-registry sqlite bootstrap
5. draft / technical-solution lifecycle template bootstrap
6. self-host-specific verify checks

完成标准：

1. 目标仓库可在不复制源仓库 live state 的前提下获得完整 self-host governance skeleton
2. bootstrap 之后可以立即创建自己的 `project-xxx / sprint-xxx`
3. canonical sqlite resources、rendered views 与 authoring templates 都有明确 owner boundary 与 drift strategy

## 11. 推荐实施顺序

### 11.1 推荐 sprint 切分

建议按下面顺序推进，而不是按文件类型切：

1. Sprint A: resolver and pack registry
   - 收口 builtin/global/repo 解析
   - 冻结 pack manifest v1
2. Sprint B: adopt apply and managed metadata
   - 打通 installer command、install receipt、managed ownership
   - 支持完整 pack materialization
3. Sprint C: complete-pack content and docs entrypoints
   - 把完整 adopter 内容映射进 complete pack
   - 补齐 guides / docs entrypoints
4. Sprint D: self-host template bootstrap
   - 发布 `self-host-complete`
   - 补齐 norm-source / context / sqlite / draft template 初始化
5. Sprint E: diff/upgrade/remove and verify
   - 补齐 installer lifecycle 的闭环
   - 强化 verify 与 drift 策略
6. Sprint F: clean-room rehearsals and truthfulness closeout
   - 执行真实目标仓库安装、升级、移除演练
   - 收口 README / playbook / support matrix

### 11.2 推荐 task 粒度

下表给出更接近执行层的任务切法：

| 建议任务 | 归属 workstream | 主要输出 | 前置依赖 |
|---|---|---|---|
| `freeze-adoption-pack-manifest-v1` | A | pack manifest schema、profile model、managed asset groups | 无 |
| `implement-layered-adoption-pack-resolver` | A | builtin/global/repo resolver、registry aggregation | manifest v1 |
| `publish-built-in-adopter-complete-pack` | C | complete pack source、coverage map、profile definitions | manifest v1 |
| `implement-adopt-apply-installer` | B | installer command、materialization pipeline、repo writer | resolver |
| `write-install-receipt-and-managed-ownership` | D | installed-pack registry、install-history、ownership state | installer |
| `materialize-shared-bootstrap-assets` | B/C | `AGENTS.md`、bootstrap metadata、docs entrypoints | installer |
| `materialize-host-specific-assets` | B | Codex/Claude/Copilot repo assets through installer | resolver + installer |
| `support-managed-bundle-artifacts` | B | managed bundle layout under `.repo-ai-governor/adoption/bundles/**` | installer |
| `publish-self-host-complete-profile` | F | self-host-complete manifest、profile contract、template alias | manifest v1 + installer |
| `seed-self-host-normative-knowledge-sources` | F | official norm-source templates and manifest bootstrap | self-host profile |
| `bootstrap-repo-local-execution-workspace` | F | current-context、project/sprint/task/review skeletons | self-host profile |
| `bootstrap-self-host-sqlite-registries` | F | task-ledger sqlite、artifact-registry sqlite、empty rendered views | self-host profile |
| `bootstrap-governance-authoring-surfaces` | F | draft / technical-solution lifecycle / delivery registry templates | self-host profile |
| `implement-adopt-diff-upgrade-remove` | D | lifecycle commands and safe update/remove logic | install receipt |
| `extend-verify-for-adoption-installs` | E | adoption verify checks、coverage assertions | installer + metadata |
| `extend-verify-for-self-host-template` | F | template bootstrap checks、sqlite seed checks、live-state isolation checks | self-host bootstrap |
| `refresh-adopter-docs-for-complete-pack` | E | README/playbook/support-matrix truthfulness sync | complete pack content |
| `run-clean-room-adopter-rehearsals` | E/F | clean-room install/upgrade/remove evidence | all above |

### 11.3 关键依赖关系

有三条依赖要尽量固定住：

1. 先冻结 pack manifest，再写 installer
   - 否则 receipt、managed metadata 和 verify 字段会反复返工。
2. 先完成 layered resolver，再推广 complete pack
   - 否则 complete pack 仍会被 `.codex/skills` 单一路径卡住。
3. 在发布 `self-host-complete` 之前，先冻结“模板初始化 != live-state clone”的 owner boundary
   - 否则 norm-source / context / sqlite surface 很容易被误实现成源仓库镜像。
4. 在 docs 大改之前，先跑一次 clean-room rehearsal
   - 这样 playbook 和 support matrix 会更贴近真实 adopters，而不是维护者视角。

### 11.4 不建议的拆法

以下拆法看起来省事，但风险很高：

1. 先做 `adopt apply` 命令，再回头补 receipt/ownership
   - 这样 upgrade/remove 很容易失控。
2. 先把文档改成 complete pack，再回头补 installer
   - 会产生 truthfulness 漂移。
3. 先把 complete pack 内容塞满，再回头做 layered resolver
   - 仍然无法摆脱 `.codex/skills` 强依赖。
4. 先把本仓库当前 `context/dev`、review、artifact rows 直接复制进模板
   - 这会把“官方治理模板”错误实现成“仓库快照克隆”。

## 12. Proposed README Copy

本节不是要求立即修改公开 `README`，而是提供一份“等 installer 落地后可直接迁入 README/README.zh-CN 的正式文案”。在功能未实现前，不应把下述文本直接当作当前能力对外宣称。

### 12.1 README.md Proposed Copy

Suggested section title:

`### Install A Complete Adoption Pack Into One Repository`

Suggested copy:

Use `repo-ai-governor` as an installer for one complete governed AI-development surface inside a target repository.

Instead of manually composing `init`, `connect`, `host export`, and host-specific file layouts, you install one managed adoption pack and let the tool materialize the supported repository assets for you.

Typical flow:

```bash
pnpm exec repo-ai-governor adopt list
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot
pnpm exec repo-ai-governor verify --adapters
pnpm exec repo-ai-governor host verify --repo .
```

What this installs into the target repository:

1. Shared governance entrypoints such as `AGENTS.md`, MCP wiring, and managed install metadata.
2. Host-native repository assets for the selected tools:
   - Codex: `.agents/skills/**`, `.agents/subagents/**`
   - Claude Code: `.claude/settings.json`, `.claude/hooks/hooks.json`, `.claude/skills/**`, `.claude/agents/**`
   - GitHub Copilot: `.github/copilot-instructions.md`, `.github/instructions/**`, `.github/skills/**`, `.github/agents/**`, `.github/mcp.json`
3. Adoption bootstrap guides and managed receipts, plus an optional repo-local config seed when the user explicitly selects `workspace.mode=repo_local`.

Use this flow when you want one repository to adopt the full governed workflow surface, not just generate staged host assets.

After installation, everyday work still goes through the normal command surface:

1. bootstrap and audit: `init`, `doctor`, `check`
2. adapter onboarding: `connect`, `verify`
3. governed execution: `plan`, `run`, `review`, `review-verify`
4. workflow lifecycle: `workflow`, `upgrade`
5. workspace and shell utilities: `workspace`, `resume`, `set-ui-theme`

For lifecycle management, use:

```bash
pnpm exec repo-ai-governor adopt diff --repo .
pnpm exec repo-ai-governor adopt upgrade adopter-complete --repo .
pnpm exec repo-ai-governor adopt remove adopter-complete --repo .
```

This keeps the installed repository assets source-aware, upgradeable, and removable without treating host files as the canonical runtime truth.

### 12.2 README.zh-CN.md Proposed Copy

建议的小节标题：

`### 在单个仓库里安装完整治理能力包`

建议文案：

可以把 `repo-ai-governor` 当成“把一整套受治理 AI 开发能力安装进目标仓库”的 installer 来使用。

你不需要再手工拼接 `init`、`connect`、`host export`，也不需要自己理解不同宿主的目录布局；只需要安装一个受管理的 adoption pack，由工具把对应的仓库资产物化出来。

典型流程：

```bash
pnpm exec repo-ai-governor adopt list
pnpm exec repo-ai-governor adopt apply adopter-complete --repo . --hosts codex,claude-code,github-copilot
pnpm exec repo-ai-governor verify --adapters
pnpm exec repo-ai-governor host verify --repo .
```

这会向目标仓库安装：

1. 共享治理入口，例如 `AGENTS.md`、MCP wiring、受管理的安装元数据。
2. 你所选宿主对应的 repo-local 资产：
   - Codex：`.agents/skills/**`、`.agents/subagents/**`
   - Claude Code：`.claude/settings.json`、`.claude/hooks/hooks.json`、`.claude/skills/**`、`.claude/agents/**`
   - GitHub Copilot：`.github/copilot-instructions.md`、`.github/instructions/**`、`.github/skills/**`、`.github/agents/**`、`.github/mcp.json`
3. adoption bootstrap guides 与安装 receipt，以及在显式选择 `workspace.mode=repo_local` 时可选的 repo-local config seed。

当你的目标是“让一个仓库完整接入受治理工作流”，而不只是导出 staged host assets 时，应优先使用这条路径。

安装完成后，日常使用仍然走现有正式命令面：

1. 初始化与审计：`init`、`doctor`、`check`
2. 多工具接入：`connect`、`verify`
3. 受治理执行：`plan`、`run`、`review`、`review-verify`
4. 流程与生命周期：`workflow`、`upgrade`
5. workspace 与 shell 工具：`workspace`、`resume`、`set-ui-theme`

后续如需查看差异、升级或移除，可使用：

```bash
pnpm exec repo-ai-governor adopt diff --repo .
pnpm exec repo-ai-governor adopt upgrade adopter-complete --repo .
pnpm exec repo-ai-governor adopt remove adopter-complete --repo .
```

这样安装进仓库里的宿主资产会始终保持 source-aware、可升级、可移除，同时不会被误当成新的 runtime canonical truth。

### 12.3 Self-Host Template Note

Suggested advanced-profile note for README / playbook:

For teams that want the target repository itself to adopt a repo-local governance workspace and authoring model similar to this repository, provide a `self-host-complete` profile.

Typical flow:

```bash
pnpm exec repo-ai-governor adopt apply adopter-complete --profile self-host-complete --repo . --workspace-mode repo_local
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local
pnpm exec repo-ai-governor doctor --output json
```

This profile should seed template-backed governance surfaces such as:

1. `.repo-ai-governor/normative_knowledge_sources/**`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/**`
4. `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`
5. `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`
6. `.repo-ai-governor/draft/**` and technical-solution lifecycle templates

Important boundary:

1. `self-host-complete` bootstraps the same governance model.
2. It does not copy the source repository's current live projects, sprint records, review artifacts, or artifact rows.

Suggested Chinese note:

对于希望让目标仓库本身采用与本仓库相似的 repo-local 治理工作区与治理 authoring 模型的团队，可以提供 `self-host-complete` profile。

典型流程：

```bash
pnpm exec repo-ai-governor adopt apply adopter-complete --profile self-host-complete --repo . --workspace-mode repo_local
pnpm exec repo-ai-governor workspace execute --workspace-mode repo_local
pnpm exec repo-ai-governor doctor --output json
```

该 profile 应 seed 一组模板化治理 surface，例如：

1. `.repo-ai-governor/normative_knowledge_sources/**`
2. `.repo-ai-governor/context/current-context.md`
3. `.repo-ai-governor/context/dev/**`
4. `.repo-ai-governor/context/dev/sqlite/task-ledger.sqlite`
5. `.repo-ai-governor/context/artifact-registry/sqlite/artifact-registry.sqlite`
6. `.repo-ai-governor/draft/**` 与技术方案 lifecycle 模板

关键边界：

1. `self-host-complete` 复刻的是治理模型，而不是源仓库当前活态数据。
2. 它不应复制当前 `project/sprint/review/artifact` 记录，只应初始化空白/模板化 surface。
