# project-085-command-based-remote-api-configuration 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: connect remote_api command authoring follow-up
- Phase Mapping: connect option authoring + onboarding runtime synthesis + docs/test closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/task-ledger-single-write-source-contract.md`
  - `docs/local-adoption-playbook.zh-CN.md`

## 1. 目标

1. 让用户在首次启用 `codex` / `claude-code` 的 `remote_api` 时，可以通过 `connect` 命令直接提供必要配置，而不必先手写 `governor.yaml`。
2. 保持现有 `connect` family，不新增新的 public command family；命令只补齐 remote-api authoring 参数，并继续走现有 candidate -> apply 工作流。
3. 同步更新 CLI help、用户文档与回归测试，确保“命令式配置 remote_api”成为可发现、可验证的正式能力。

## 2. Sprint 细化

## 2.1 sprint-001-connect-command-remote-api-authoring

- Status: completed
- Sprint Goal: 为 `connect` 增加首次 remote_api 命令式配置能力，并完成回归验证与 closeout。
- Task Package: `TK-773`、`TK-774`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-773 | sprint-001 | add command-based remote_api authoring to connect onboarding flow | cli/runtime/docs/tests | connect onboarding runtime + config schema baseline | completed |
| TK-774 | sprint-001 | finalize project-085 closeout after connect remote_api command authoring | closeout/final-audit | TK-773 | completed |

## 4. 依赖产物策略

1. 本项目不新增新的顶层命令家族，优先在现有 `connect` 入口内补齐 remote_api authoring 参数。
2. provider/vendorBinding 真值继续由 surface 约束与 runtime 默认值收口，不把用户暴露到不必要的低层细节。
3. closeout 必须同步 project/sprint plan、`current-context.md`、sqlite canonical ledger、`checklist.md` 与 `tasks.csv`。

## 5. DoD（project-085）

1. 用户无需手写 `governor.yaml`，即可通过 `connect` 命令首次生成 `remote_api` 配置候选。
2. 相关 help、文档与回归测试覆盖新的命令配置路径。
3. 指定验证命令与 `pnpm run build` 通过，台账与 closeout 同步完成。

## 6. 里程碑记录

1. 2026-04-11：基于用户“能否通过命令方式配置 remote api”的明确需求创建 `project-085`。
2. 2026-04-11：范围锁定为“connect 内补齐 remote_api authoring 参数”，不扩张到新的 secrets store 或新的 command family。
3. 2026-04-11：`TK-773` 已完成，实现 `connect` 的命令式 remote_api authoring、回归测试与文档同步。
4. 2026-04-11：`TK-774` 已完成 closeout，本项目在此里程碑回链 [project-085 completion audit summary](./project-085-command-based-remote-api-configuration-completion-audit-summary.md)。
