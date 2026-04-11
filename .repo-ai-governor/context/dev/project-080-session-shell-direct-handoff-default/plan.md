# project-080-session-shell-direct-handoff-default 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: session shell interaction simplification
- Phase Mapping: direct handoff baseline + docs/ledger closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 1. 目标

1. 去掉 session shell 对 `connect / run / workflow / plan sync / workspace switch-branch` 这类受治理命令默认附加的壳层 `preview + confirm` 冗余步骤，让默认路径回到 `direct_execute`。
2. 保留真正高风险确认的边界，但将其下沉到具体命令契约或 service-owned policy / HITL gate，而不是继续由 shell 额外发明一层确认门。
3. 同步 shell/orchestration 相关规范、用户说明、测试与任务台账，并把本次变更收口到 completed / idle 真值。

## 2. Sprint 细化

## 2.1 sprint-001-remove-shell-preview-confirm-default

- Status: completed
- Sprint Goal: 验证 `connect` 失败根因、移除 session shell 默认 preview-confirm 冗余交互，并完成规范/测试/ledger closeout。
- Task Package: `TK-761`、`TK-762`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-761 | sprint-001 | remove shell-owned preview-confirm default for governed session commands | runtime/docs/tests | current shell + session.main baseline | completed |
| TK-762 | sprint-001 | finalize project-080 closeout and completion audit | closeout/final-audit | TK-761 | completed |

## 4. 依赖产物策略

1. 先确认用户案例中 `connect` 的失败根因，避免把配置缺失问题误诊为 preview-confirm 交互本身的问题。
2. `TK-761` 只收口默认 handoff 模式、discoverability、文案与规范同步，不扩张到新的命令能力设计。
3. `TK-762` 只在 `TK-761` 完成并拥有同窗口 build/test evidence 后推进，用于收口 project/sprint/context/history/audit 真值。

## 5. DoD（project-080）

1. session shell 对 `connect`、`workspace switch-branch`、`run`、`workflow`、`plan sync` 的默认 governed handoff 不再强制先 preview 再 `/confirm`。
2. `/confirm` 与 `/cancel` 仅保留为兼容性 builtin，不再作为默认 discoverable 快捷入口。
3. shell/orchestration 相关规范文档与 adoption playbook 已同步更新，不再继续把 preview-confirm 作为默认基线。
4. 相关 targeted vitest 与 `pnpm run build` 在同一变更窗口内通过，任务 ledger 与 completed history 已完成收口。

## 6. 里程碑记录

1. 2026-04-11：基于用户提供的 `connect` 执行案例创建 `project-080`，范围聚焦到“失败根因解释 + 默认直执交互收口”。
2. 2026-04-11：已确认 `connect` 失败根因来自 source config 缺少 `adapters` baseline，而不是 `/confirm` 本身出错。
3. 2026-04-11：`TK-761` 已完成 direct handoff baseline、hidden compatibility builtins、i18n/规范/adoption 文档同步与回归测试。
4. 2026-04-11：`TK-762` 已完成 completion audit、completed history 回写与 idle context 恢复，并在此里程碑回链 [project-080 completion audit summary](./project-080-session-shell-direct-handoff-default-completion-audit-summary.md)。
