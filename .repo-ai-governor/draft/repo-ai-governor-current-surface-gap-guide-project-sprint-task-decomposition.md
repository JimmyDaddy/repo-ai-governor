# Repo AI Governor 当前端面缺口的 Project / Sprint / Task 拆解草案

- Status: draft
- Date: 2026-04-08
- Scope: 将 `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md` 进一步拆解为可执行的 future project / sprint / task packages
- Upstream:
  - `.repo-ai-governor/draft/repo-ai-governor-current-surface-status-usage-validation-and-gap-guide.md`
  - `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-overall-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/repo-ai-governor-architecture-and-repo-layering.md`
  - `docs/support-matrix.md`
- Numbering Notes:
  - 当前实体任务编号上界已进入 `TK-660`
  - 本草案建议 future execution tasks 从 `TK-661` 开始分配
  - 本草案将 future execution projects 建议编号为 `project-062` 到 `project-068`

## 1. 拆解原则

这次拆解不是机械地把 2026-04-06 的分析稿逐段转成任务，而是按 2026-04-08 当前真值重新归并：

1. `current-surface-status-usage-validation-and-gap-guide` 继续作为结构性输入，负责告诉我们“有哪些 surface”。
2. `current-app-feature-implementation-vs-baseline-priority-assessment` 负责修正其中已经过时的 gap 判断。
3. `docs/support-matrix.md` 负责定义当前正式支持边界，避免把已支持能力继续拆成“补缺任务”。
4. 对 host-native distribution，继续承认 `project-050` 已完成 baseline；但新的 formal triad 已把 Codex / Claude Code plugin / skill / agent lifecycle 与 adopter consumption 升级为正式 follow-up，因此必须为其保留独立承载位与明确优先级。

因此，本草案不会再把以下事项当成“当前待实现主线”：

1. `GitLab CI / Jenkins` 模板补齐
2. standards runtime loader 落地
3. host-native distribution 主体建设
4. `codex / claude-code / github-copilot` 从 fixture-only 走向 real-path 的第一次实现

## 2. 总体建议

### 2.1 建议的下一条 primary stream

建议下一条真正激活的主执行流是：

`project-062-cli-continuity-and-adapter-truthfulness-hardening`

原因：

1. CLI 仍是当前最成熟、最关键的主产品面。
2. 用户近期反馈也集中在会话连续性与 probe truthfulness。
3. 这条主线收口后，packaged distribution 与 secondary surface 的后续产品化才更稳。

### 2.2 建议登记为 planned follow-up streams 的项目

建议先规划但不立即激活的 follow-up 项目：

1. `project-063-packaged-distribution-and-install-surface-closeout`
2. `project-067-host-plugin-skill-agent-lifecycle-and-adopter-consumption`
3. `project-064-vscode-packaged-secondary-surface-rollout`
4. `project-065-desktop-secondary-surface-productization-decision`
5. `project-066-standards-and-language-pack-ecosystem-expansion`

建议继续保持为 `P2` follow-up 的项目：

1. `project-068-p2-fallback-and-reserved-target-followups`

## 3. 推荐执行顺序

1. 先收 CLI 主入口真值：
   - provider-native continuity
   - connect/doctor/verify/transcript truth-source alignment
2. 再收 adopter-facing distribution truth：
   - packaged install support contract
   - host-native plugin / skill / agent lifecycle and support-truth
3. 再推进 secondary surface productization：
   - VS Code packaged secondary surface
   - desktop secondary-surface decision
4. 最后再扩 ecosystem 与 `P2` follow-up。

## 4. project-062：CLI Continuity And Adapter Truthfulness Hardening

- Recommended Status: `planned -> next primary`
- Recommended Priority: `P0`
- Suggested Stage Mapping: cli hardening follow-up
- Suggested Phase Mapping: provider-native continuity + adapter truth-source alignment

### 4.1 目标

1. 把当前 CLI 从“fallback 能保住部分连续性”推进到更稳定的 provider-native continuity 能力面。
2. 收敛 `connect -> doctor -> verify -> transcript` 的同一真值源，减少“本机可用但探测失败”或“fallback 已生效但提示像故障”的失真。
3. 为后续 packaged/adopter/productization 主线建立更稳的 CLI truth base。

### 4.2 建议 Sprint 切分

#### sprint-001-provider-continuation-state-model-and-fallback-boundary

- Suggested Status: `planned`
- Sprint Goal: 冻结 provider continuation 生命周期与 fallback-active 的 truthful 表达边界。
- Task Package: `TK-661`、`TK-662`、`TK-663`

#### sprint-002-adapter-probe-verify-truth-source-alignment

- Suggested Status: `planned`
- Sprint Goal: 收敛 `connect/doctor/verify/transcript` 对 adapter readiness 的真值来源与对外表达。
- Task Package: `TK-664`、`TK-665`、`TK-666`

### 4.3 建议任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | suggested_status |
|---|---|---|---|---|---|
| TK-661 | sprint-001 | freeze provider continuation lifecycle and presenter truth contract | contract/runtime | project-058 / project-059 traceback | planned |
| TK-662 | sprint-001 | implement provider-native continuation slot lifecycle and fallback-active separation | runtime/implementation | TK-661 | planned |
| TK-663 | sprint-001 | close continuity hardening with session-shell regression and build evidence | acceptance/closeout | TK-661、TK-662 | planned |
| TK-664 | sprint-002 | freeze connect doctor verify transcript truth-source contract | contract/diagnostics | TK-663 | planned |
| TK-665 | sprint-002 | implement adapter probe outcome classification and presenter-safe diagnostics alignment | adapter/implementation | TK-664 | planned |
| TK-666 | sprint-002 | close CLI truthfulness hardening with cross-adapter evidence refresh | project/closeout | TK-664、TK-665 | planned |

### 4.4 建议 DoD

1. CLI 能清楚区分 provider-native continuation、fallback-active continuity、unsupported/no-fallback。
2. adapter readiness 的 probe/verify/transcript 不再轻易互相打架。
3. 至少有一轮 targeted regression + 同窗口 build evidence。

## 5. project-063：Packaged Distribution And Install-Surface Closeout

- Recommended Status: `planned follow-up`
- Recommended Priority: `P1`
- Suggested Stage Mapping: adopter distribution truth refresh
- Suggested Phase Mapping: packaged install contract + clean-room acceptance

### 5.1 目标

1. 收口 `tgz`/packaged install 的正式支持边界。
2. 决定是要继续维持 `online packaged rehearsal` 口径，还是补齐更完整的 packaged adopter delivery。
3. 将 install-mode narrative、support matrix 与 clean-room evidence 拉齐。

### 5.2 建议 Sprint 切分

#### sprint-001-packaged-install-contract-and-acceptance-refresh

- Suggested Status: `planned`
- Sprint Goal: 明确 packaged install contract，并完成文档与 acceptance evidence 刷新。
- Task Package: `TK-667`、`TK-668`、`TK-669`

### 5.3 建议任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | suggested_status |
|---|---|---|---|---|---|
| TK-667 | sprint-001 | freeze packaged install support contract and acceptance matrix | contract/docs | project-062 recommended | planned |
| TK-668 | sprint-001 | implement packaged installer runtime layout follow-up or explicit online-only boundary hardening | implementation/docs | TK-667 | planned |
| TK-669 | sprint-001 | close packaged adoption boundary with clean-room rehearsal and support-matrix refresh | acceptance/closeout | TK-667、TK-668 | planned |

### 5.4 建议 DoD

1. adopter 能明确知道 packaged install 到底支持什么、不支持什么。
2. `README`、playbook、support matrix 与 clean-room evidence 一致。
3. 不再保留模糊的“看起来像支持，但实际上只做 rehearsal”的叙事漂移。

## 6. project-064：VS Code Packaged Secondary-Surface Rollout

- Recommended Status: `planned follow-up`
- Recommended Priority: `P1`
- Suggested Stage Mapping: secondary surface productization
- Suggested Phase Mapping: VS Code packaged boundary + smoke gate

### 6.1 目标

1. 把 `apps/vscode-extension` 从 source-checkout-only companion MVP 推向更明确的 packaged secondary surface。
2. 补齐 VSIX/build/release/extension-host smoke 的最小产品化边界。
3. 更新 support matrix 与 adopter 文档，让其状态表达更直接。

### 6.2 建议 Sprint 切分

#### sprint-001-packaged-distribution-and-extension-host-smoke

- Suggested Status: `planned`
- Sprint Goal: 为 VS Code secondary surface 建立 packaged distribution 与 smoke gate。
- Task Package: `TK-670`、`TK-671`、`TK-672`

### 6.3 建议任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | suggested_status |
|---|---|---|---|---|---|
| TK-670 | sprint-001 | freeze VS Code packaged distribution contract and smoke gate | surface/contract | project-063 recommended | planned |
| TK-671 | sprint-001 | implement VSIX build release path and extension-host smoke follow-up | implementation/release | TK-670 | planned |
| TK-672 | sprint-001 | close VS Code packaged secondary-surface support declaration | docs/evidence/closeout | TK-670、TK-671 | planned |

### 6.4 建议 DoD

1. VS Code extension 是否可 packaged 分发有清晰、可验证的答案。
2. secondary-surface 支持边界不再只停留在 source-checkout 叙事。
3. 文档、support matrix 与 smoke evidence 同步。

## 7. project-065：Desktop Secondary-Surface Productization Decision

- Recommended Status: `planned follow-up`
- Recommended Priority: `P1`
- Suggested Stage Mapping: desktop productization decision
- Suggested Phase Mapping: surface decision + packaging/support boundary

### 7.1 目标

1. 决定 desktop 是否真的进入正式 secondary-surface 产品化路径。
2. 若继续保留 foundation-only，则把非目标与 public support claim 说得更硬；若升级，则收最小 packaged/support boundary。
3. 避免 desktop 在“基础能力不少”与“产品口径很保守”之间长期含混。

### 7.2 建议 Sprint 切分

#### sprint-001-secondary-surface-decision-and-packaging-boundary

- Suggested Status: `planned`
- Sprint Goal: 冻结 desktop 的产品化决策与最小支持边界。
- Task Package: `TK-673`、`TK-674`、`TK-675`

### 7.3 建议任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | suggested_status |
|---|---|---|---|---|---|
| TK-673 | sprint-001 | freeze desktop secondary-surface productization decision and packaging boundary | product/contract | project-064 recommended | planned |
| TK-674 | sprint-001 | implement minimum desktop productization seam or reaffirm foundation-only guardrails with explicit evidence | implementation/boundary | TK-673 | planned |
| TK-675 | sprint-001 | close desktop surface recommendation with support-truth refresh | docs/evidence/closeout | TK-673、TK-674 | planned |

### 7.4 建议 DoD

1. desktop 的正式支持口径有明确答案。
2. 若仍保留 foundation-only，也有更强的 public support boundary 和 evidence。
3. 若升级 secondary surface，则至少具备最小 packaged/support story。

## 8. project-066：Standards And Language-Pack Ecosystem Expansion

- Recommended Status: `planned follow-up`
- Recommended Priority: `P1`
- Suggested Stage Mapping: ecosystem expansion
- Suggested Phase Mapping: official pack roadmap + first-wave expansion

### 8.1 目标

1. 把官方 standards pack 从“minimal baseline”推进到更有 adoption 价值的生态面。
2. 先定义哪些语言/流程 pack 属于官方维护范围，再做首批扩展。
3. 避免继续把 loader 做得更深，而 pack 内容本身长期停留在 minimal baseline。

### 8.2 建议 Sprint 切分

#### sprint-001-official-pack-expansion-matrix-and-first-wave

- Suggested Status: `planned`
- Sprint Goal: 定义官方 pack 扩展矩阵，并完成第一波扩展与验证。
- Task Package: `TK-676`、`TK-677`、`TK-678`

### 8.3 建议任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | suggested_status |
|---|---|---|---|---|---|
| TK-676 | sprint-001 | freeze official pack expansion matrix and acceptance contract | product/contract | project-062 recommended | planned |
| TK-677 | sprint-001 | implement first-wave official pack expansion and runtime/docs examples | standards/implementation | TK-676 | planned |
| TK-678 | sprint-001 | close ecosystem expansion baseline with validation evidence and support narrative refresh | acceptance/closeout | TK-676、TK-677 | planned |

### 8.4 建议 DoD

1. 官方维护的 pack 范围明确。
2. 至少一波新的 official pack 扩展与 runtime/docs example 完成。
3. support narrative 不再只剩 minimal baseline 描述。

## 9. project-067：Host Plugin Skill Agent Lifecycle And Adopter Consumption

- Recommended Status: `planned follow-up`
- Recommended Priority: `P1`
- Suggested Stage Mapping: formal host-native lifecycle follow-up
- Suggested Phase Mapping: Codex / Claude Code plugin-skill-agent lifecycle + support-truth + adopter consumption

### 9.1 目标

1. 为已完成 baseline 的 Codex / Claude Code host-native assets 补齐后续生命周期承载位。
2. 把 `.codex-plugin`、`.claude-plugin`、`.codex/skills`、`.claude/skills`、Codex subagents、Claude hooks / MCP 这些 host ergonomics 能力，从“已完成 baseline”推进到“可升级、可验证、可对外解释”的 follow-up 轨道。
3. 这条 follow-up 现在有正式 triad 回链，不再只是 draft 中的补位修订。
4. 避免未来所有 host follow-up 都只能被迫挂到 `github-com-agent` reserved target 下。

### 9.2 建议 Sprint 切分

#### sprint-001-codex-claude-host-ergonomics-lifecycle-and-upgrade

- Suggested Status: `planned`
- Sprint Goal: 为 Codex / Claude Code plugin / skill / agent 资产冻结 lifecycle、upgrade、support-truth 与 adopter-consumption contract。
- Task Package: `TK-679`、`TK-680`、`TK-681`

### 9.3 建议任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | suggested_status |
|---|---|---|---|---|---|
| TK-679 | sprint-001 | freeze codex claude host asset lifecycle and support-truth contract | host/contract | project-050 closeout + project-070 triad sync + project-063 recommended | planned |
| TK-680 | sprint-001 | implement codex claude host asset apply verify upgrade and adopter-consumption follow-up | host/implementation/docs | TK-679 | planned |
| TK-681 | sprint-001 | close codex claude host ergonomics follow-up with README support-matrix playbook and packaging evidence refresh | host/closeout | TK-679、TK-680 | planned |

### 9.4 建议 DoD

1. Codex / Claude Code plugin / skill / agent 不再只是“生成过一次”的 baseline 资产，而有明确 lifecycle/upgrade/support-truth 约束。
2. adopter 若要消费这些 host assets，有清晰的 apply/verify/upgrade narrative。
3. `README`、support matrix、playbook 与 target-specific export / verify evidence 至少形成一条一致 narrative。
4. 该 future stream 不与 `github-com-agent` reserved target follow-up 混写。

## 10. project-068：P2 Fallback And Reserved-Target Follow-Ups

- Recommended Status: `planned deferred`
- Recommended Priority: `P2`
- Suggested Stage Mapping: constrained surfaces follow-up
- Suggested Phase Mapping: local-model capability ceiling + reserved host target follow-up

### 10.1 目标

1. 明确 `local-model` 的能力上限与 promoted use case，而不是模糊地等待“以后再看”。
2. 为 `github-com-agent` 这种 reserved target 准备后续 contract，但不抢占当前主线资源。

### 10.2 建议 Sprint 切分

#### sprint-001-local-model-capability-ceiling-and-promoted-use-case

- Suggested Status: `planned`
- Sprint Goal: 冻结 `local-model` 能力天花板与 promoted use case。
- Task Package: `TK-682`、`TK-683`

#### sprint-002-github-com-agent-target-followup

- Suggested Status: `planned`
- Sprint Goal: 为 `github-com-agent` target 建立 follow-up contract 与 exit criteria。
- Task Package: `TK-684`、`TK-685`、`TK-686`

### 10.3 建议任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | suggested_status |
|---|---|---|---|---|---|
| TK-682 | sprint-001 | freeze local-model capability ceiling and promoted use-case contract | product/contract | project-066 recommended | planned |
| TK-683 | sprint-001 | implement constrained local-model capability follow-up or explicit non-goal guardrails | implementation/boundary | TK-682 | planned |
| TK-684 | sprint-002 | freeze github-com-agent target contract and blocked-mode exit criteria | host/contract | TK-683 | planned |
| TK-685 | sprint-002 | implement github-com-agent export verify follow-up or reserved-boundary reinforcement | host/follow-up | TK-684 | planned |
| TK-686 | sprint-002 | close P2 follow-up recommendation and backlog handoff | closeout/backlog | TK-684、TK-685 | planned |

### 10.4 建议 DoD

1. `local-model` 不再长期停留在“知道是 fallback-only，但没有进一步产品判断”的状态。
2. reserved target 有清晰 follow-up contract，而不是只存在 blocked export 资产。

## 11. 为什么不建议直接重开旧项目

不建议把这些工作回灌到 `project-058`、`project-059`、`project-054` 等历史项目中，原因是：

1. `project-058 / project-059` 解决的是最近一轮 CLI 问题回归与 truthful degradation，不等于更广义的 continuity / truth-source productization。
2. `project-054` 已经冻结了 VS Code MVP 与 desktop foundation 边界；新一轮 packaged/productization 判断应有新的 closeout 边界。
3. `project-050` 已完成 host-native distribution baseline；若未来要推进 Codex / Claude Code plugin / skill / agent lifecycle，应该新开 follow-up，而不是把已完成 baseline 重新改写成 active 未完成态。
4. `project-070` 已把 host-native lifecycle carry slot 正式同步到 triad 真值层；后续 execution stream 应承接这条正式口径，而不是回写旧 baseline project。
5. 重新开新编号更有利于形成新的证据链与 completion audit summary。

## 12. 建议下一步

若你要我继续往下做，最顺的两条路径是：

1. 直接把 `project-062` 激活成新的 primary stream，并继续拆实体 `plan.md + TK-661~666`。
2. 如果你想先收 adopter-facing distribution truth，则先激活 `project-063`，随后直接接 `project-067`，形成 packaged install + host ergonomics 的连续 follow-up lane。
