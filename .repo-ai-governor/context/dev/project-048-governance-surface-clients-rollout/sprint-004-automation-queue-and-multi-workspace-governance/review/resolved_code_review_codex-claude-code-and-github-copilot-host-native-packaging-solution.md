# Code Review: codex/claude code/github copilot host-native packaging technical solution draft

- Status: resolved
- Date: 2026-04-06
- Reviewer: AI-Agent
- Task: `n/a`
- Review Type: targeted draft technical solution review
- Normative References:
  - `AGENTS.md`
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/normative-loading-manifest.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`
  - `.repo-ai-governor/context/technical-solution-delivery-registry.yaml`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/technical-solution-module-registry.yaml`

## 1. Review Scope
1. `.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`
2. `package.json`
3. `packages/standards/README.md`
4. `integrations/ide/README.md`
5. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md`
6. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md`

## 2. Findings
### 2.1 [P1] Project-local export path is only a staging directory, not a host-discoverable asset
- 位置: `.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md:471-482`
- 问题描述: 方案把 project-local assets 的默认输出写到 `.repo-ai-governor/generated/hosts/**`，然后再让用户选择是否同步到真正的宿主目录。这样 Phase 1 实际先产出的是 staging files，而不是 Codex、Claude Code、GitHub Copilot 会直接扫描的 repository-local assets；后文的 MVP 与完成定义却把这一步视为已经跑通 project-local host assets。
- 影响: 容易出现“导出成功但宿主完全不消费”的伪成功，MVP 验收口径和真实 adopter 体验会脱节。
- 建议: 为 project-local 路径补一个正式 `apply/sync` 契约与 verify 语义，或直接允许 `host export` 以受控模式落到目标仓库的宿主发现路径。

### 2.2 [P1] Proposed package layout does not reconcile with the current architecture seams
- 位置: `.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md:446-455`
- 问题描述: 文档直接新增 `packages/host-distribution` 和三类 `packages/host-*`，但当前正式分层已把宿主 surface 放在 `packages/adapters/*`，把投影链放在 `packages/standards`，把 surface boundary 收口到 `runtime.governance-clients` / `runtime.agent-projection` 模块。草案没有先说明这些新包究竟属于 adapter、projection renderer 还是 client surface，因此会和现有模块职责发生重叠。
- 影响: promotion 时会卡在 module registry、architecture layering 与依赖边界收口上，后续实现也容易把 adapter / projection / distribution 三类职责重新混写。
- 建议: 先明确该方案落在哪个正式 module，优先论证是否扩展现有 `adapters/*`、`standards` 与 governance client seams；只有确认现有 seam 不足时，再引入新的包族与模块登记。

### 2.3 [P1] Workflow asset schema is too thin to become the single source of truth
- 位置: `.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md:414-442`
- 问题描述: 草案希望用 workflow asset 避免三宿主正文漂移，但最小字段只有展示信息、handoff 类型和 host overrides，没有定义 canonical source、version/lifecycle、projection metadata、source refs 或 parity 校验方式。这样会新造一层 authoring truth，而不是把现有 runtime/standards/skills 统一到同一事实源。
- 影响: `host verify` 无法真正证明“source semantics = exported assets”，长期仍会回到多份手工文本并行演进的问题。
- 建议: 把 workflow asset 与现有 standards projection / registry 机制对齐，至少补齐 source refs、version、lifecycle、projection metadata、parity / drift checks 和 host-specific target matrix。

### 2.4 [P2] Copilot target dimension is missing from the export contract
- 位置: `.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md:337-389`
- 问题描述: 文档已经承认 GitHub Copilot 至少分为 repository assets、Copilot CLI plugins、GitHub.com coding agent assets 三个消费面，但导出设计仍只有 `--host github-copilot` 这一维。renderer 因此无法判断 `.github/mcp.json`、repository skills/agents 与 coding-agent-specific metadata 哪些适用于当前目标。
- 影响: 容易生成“某个 Copilot surface 根本不消费”的资产组合，导致导出物看似齐全但实际不可用。
- 建议: 在 export manifest 与 CLI 参数里显式引入 Copilot target 维度，例如 `repo-local | cli-plugin | github-com-agent`，并让 verify 基于 target 做消费面校验。

## 3. Notes
1. 当前 draft 尚未登记到 `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`，也没有确定 `solution_id`、`target_module_ids`、`final_paths` 与 delivery handoff，因此当前状态更适合视为 pre-promotion review input，而不是可直接 formalize 的方案。
2. 现有仓库已经具备部分相关基线，例如 `package.json` 已对外暴露 `./service-host`，并把 `.codex/skills` 作为当前分发内容之一；后续修订建议把这些既有能力明确写进“当前基线 / gap / target state”三段式叙述，避免给人“从零开始做 host distribution”的印象。

## 4. Verification
1. `sed -n '1,320p' .repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`（通过）
2. `rg -n "^## |^### " .repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`（通过）
3. `rg -n "packages/adapters/(codex|claude-code|github-copilot)|host-distribution|integrations/hosts|\\.github/skills|\\.claude/skills|\\.agents/skills|\\.codex-plugin|\\.claude-plugin" -S .`（通过）
4. `git status --short`（通过）
5. `pnpm run build`（未执行：本次仅评审 draft 文档，未修改可执行代码，因此 build not required）

## 复核结论（2026-04-06）

- 整体结论：**部分认可**

### 逐条复核
1. `2.1`
   - 判定：**认可**
   - 证据：draft 在 `9.3` 里把 project-local 默认输出定义为 `.repo-ai-governor/generated/hosts/*`，并在同段继续写“再由用户选择”是否同步到真实宿主路径；但 `Phase 1` 与 `完成定义` 又把这一步表述成已经输出三宿主 project-local assets。当前文本确实把 staging export 和 host-discoverable asset 混成了同一层。
   - 处理：保留该 finding。后续修订应补正式 `apply/sync` 契约，或允许 `host export --mode project` 受控落盘到宿主扫描路径。
2. `2.2`
   - 判定：**认可**
   - 证据：当前正式 seam 已经把 standards projection 收口到 `packages/standards`，把 onboarding / projection 收口到 `runtime.agent-projection`，把多表面 consumer boundary 收口到 `runtime.governance-clients`，同时现有宿主适配器真实落位在 `packages/adapters/*`。draft 直接新增 `packages/host-distribution` 与三类 `packages/host-*`，但没有先说明它们分别属于 projection、adapter 还是 governance client consumer，因此 promotion 时确实会卡在 module registry 与 layering 对齐上。
   - 处理：保留该 finding。修订版应先声明目标 module 与 seam owner，再决定是否需要新增包族。
3. `2.3`
   - 判定：**认可**
   - 证据：draft 的 workflow asset 最小字段只有展示、handoff 与 host overrides；而现有 `packages/standards` 已明确要求 source provenance、projection metadata 与 parity 校验，当前 technical solution 治理也要求 lifecycle / delivery / module graph 都有可回链真值。按现状，这套 asset schema 还不足以承担“单一事实源”角色。
   - 处理：保留该 finding。修订版至少应补齐 source refs、version、status/lifecycle、projection metadata、target matrix 与 drift/parity checks。
4. `2.4`
   - 判定：**部分认可**
   - 证据：draft 在 Copilot 部分明确区分了 repository assets、Copilot CLI plugin 与 GitHub.com coding agent 三个消费面；而 `host export` 当前只有 `--host github-copilot --mode project|plugin`，如果未来真的把 `github-com-agent` 作为正式导出目标，现有参数面确实不够。与此同时，draft 当前 `Phase 1 / Phase 2` 的 MVP 其实只正式承诺了 repo-local assets 与 Copilot CLI plugin，这两条主路径仍可被 `project|plugin` 覆盖；因此该问题目前更像“formalization 前应显式收口的缺口”，而不是已经与 MVP 表述等价冲突。补充外部证据方面，GitHub 官方 custom agents 文档也明确存在 `target: vscode | github-copilot` 等环境差异，且 GitHub.com coding agent 不支持部分 VS Code / IDE agent 属性，说明 target matrix 在后续正式导出时确实需要进入契约。
   - 处理：该 finding 调整为部分认可。修订版可以二选一：要么在 MVP 中明确声明 `github-com-agent` 暂不导出；要么把 Copilot target 维度正式纳入 export / verify 契约。

### 验证命令
1. `nl -ba .repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md | sed -n '330,520p'`（通过）
2. `nl -ba .repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md | sed -n '648,772p'`（通过）
3. `nl -ba .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-agent-projection/module-overview.md | sed -n '1,120p'`（通过）
4. `nl -ba .repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/module-overview.md | sed -n '1,120p'`（通过）
5. `nl -ba packages/standards/README.md | sed -n '1,160p'`（通过）
6. `find packages/adapters -maxdepth 2 -type d | sort`（通过）
7. `git status --short`（通过）

## 修复执行记录（2026-04-06）

1. `2.1`：已完成
   - 变更文件：`.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`
   - 验证：`rg -n "staged export|host-discoverable|apply-to-repo|host-apply.report.json" .repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md -S`（通过）
   - 说明：已把 `.repo-ai-governor/generated/hosts/**` 明确收口为 staging/export workspace，并补入 project-local apply/sync 契约与 host-discoverable 状态定义。
2. `2.2`：已完成
   - 变更文件：`.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`
   - 验证：`rg -n "现有 seam owner|packages/standards|packages/adapters/codex|packages/adapters/claude-code|packages/adapters/github-copilot|runtime.governance-clients|runtime.agent-projection" .repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md -S`（通过）
   - 说明：已删除“默认新增 `packages/host-*` 包族”的落位假设，改为显式声明现有 seam owner 与后续抽薄 helper 的前置条件。
3. `2.3`：已完成
   - 变更文件：`.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`
   - 验证：`rg -n "structured projection registry|canonical_source_refs|workflow_version|workflow_status|semantic_owner_module|host_target_matrix|verification_profile_refs|drift_checks" .repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md -S`（通过）
   - 说明：已把 workflow asset 改写为引用 canonical source 的 structured projection registry，并补齐 source/version/lifecycle/projection/drift 校验字段。
4. `2.4`：已完成
   - 变更文件：`.repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md`
   - 验证：`rg -n "copilot-target|github-com-agent|repo-local|cli-plugin|target-aware verify|MVP target" .repo-ai-governor/draft/codex-claude-code-and-github-copilot-host-native-packaging-technical-solution.md -S`（通过）
   - 说明：按“部分认可”的 accepted subset 收口为两步：先把 MVP 明确限制在 `repo-local + cli-plugin`，同时在 export manifest / CLI / verify 中预留并显式记录 `github-com-agent` target。
