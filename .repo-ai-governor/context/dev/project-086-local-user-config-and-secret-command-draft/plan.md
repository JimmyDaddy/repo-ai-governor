# project-086-local-user-config-and-secret-command-draft 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: local user config + secret-backed command configuration draft
- Phase Mapping: draft authoring + lifecycle registration + docs-only closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/long-term-maintenance-guide.md`
  - `.repo-ai-governor/context/technical-solution-lifecycle-registry.yaml`

## 1. 目标

1. 把“隐藏用户配置文件 + 命令式 secret/apikey 管理”的想法沉淀为一份新的技术草案，明确它与现有 `governor.yaml`、tool-managed workspace、`credentialRef` 能力的关系。
2. 对比互联网已有做法，给出多个方案、权衡、推荐与渐进式落地路径，便于后续正式 review 或 promotion。
3. 将该 draft 登记到 technical-solution lifecycle registry，避免草案只存在于 `.repo-ai-governor/draft/` 而缺少结构化发现入口。

## 2. Sprint 细化

## 2.1 sprint-001-local-user-config-and-secret-storage-technical-solution-draft

- Status: completed
- Sprint Goal: 保存并登记“本地用户配置 + secret-backed command configuration”技术草案，然后完成 docs-only closeout。
- Task Package: `TK-775`、`TK-776`。

## 2.2 sprint-002-solution-c-api-key-flow-clarification

- Status: completed
- Sprint Goal: 基于 draft comment 补齐“方案 C 下用户如何设置 apikey”的实际操作流与存储边界说明，然后完成 docs-only follow-up closeout。
- Task Package: `TK-777`、`TK-778`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-775 | sprint-001 | draft local user config and secret-backed command configuration technical solution | draft/docs/lifecycle | existing remote_api transport + workspace/config seams | completed |
| TK-776 | sprint-001 | finalize project-086 closeout after draft handoff | closeout/final-audit | TK-775 | completed |
| TK-777 | sprint-002 | clarify solution-c api-key setup flow in the local-user-config technical draft | draft/docs/clarification | TK-775 | completed |
| TK-778 | sprint-002 | finalize project-086 closeout after solution-c clarification follow-up | closeout/final-audit | TK-777 | completed |

## 4. 依赖产物策略

1. 本项目只沉淀 draft，不把草案误写成正式规范源，也不把 `.repo-ai-governor/draft/**` 注册进 manifest。
2. 草案必须显式说明：共享仓库真值仍是 `governor.yaml`，私有密钥不得直接落入可共享配置面。
3. 若登记 lifecycle registry，仅登记为 `draft`，不改 module registry、delivery registry 或 final docs。

## 5. DoD（project-086）

1. 新的 technical solution draft 已落盘到 `.repo-ai-governor/draft/**`。
2. draft 中包含方案对比、推荐方案、命令契约、优先级规则与安全边界。
3. lifecycle registry、task ledger、project/sprint plan 与 current-context 完成同步。

## 6. 里程碑记录

1. 2026-04-11：基于用户“能否有隐藏配置文件并通过命令设置 apikey/mode”的需求创建 `project-086`。
2. 2026-04-11：范围锁定为 docs-only draft + lifecycle registration，不在本窗口直接实现新的 `config/secret` command family。
3. 2026-04-11：`TK-775` 已完成，新的本地用户配置 / secret-backed command configuration 技术草案已落盘并登记 lifecycle draft entry。
4. 2026-04-11：`TK-776` 已完成 closeout，本项目在此里程碑回链 [project-086 completion audit summary](./project-086-local-user-config-and-secret-command-draft-completion-audit-summary.md)。
5. 2026-04-11：基于 draft diff comment 重新打开 `project-086`，范围收敛为补齐“方案 C 下用户如何设置 apikey”的 end-to-end 操作流，不扩张到实现窗口。
6. 2026-04-11：`TK-777` 已完成，draft 现已明确 `secret set/import -> config set credentialRef -> connect/runtime consume` 的用户路径，以及 secret value / selector / shared truth 的落盘边界。
7. 2026-04-11：`TK-778` 已完成 follow-up closeout，本项目在此里程碑回链 [project-086 follow-up completion audit summary](./project-086-local-user-config-and-secret-command-draft-followup-completion-audit-summary.md)。
