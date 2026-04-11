# project-081-session-shell-actionable-error-guidance 计划

- Status: completed
- Date: 2026-04-11
- Stage Mapping: session shell diagnostics guidance
- Phase Mapping: structured error recovery + docs/ledger closeout
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/contracts/cli-session-shell-contract.md`

## 1. 目标

1. 让 session shell 在 nested governed command 返回结构化错误时，不再把原始 JSON 直接回显给用户，而是优先恢复 `cli_output_v1` 并展示可执行的恢复建议。
2. 对用户实际遇到的 `connect requires adapters baseline in source config` 场景，直接在壳层提示“先 /init，或 /workspace clear-config 后再 /init”。
3. 同步相关 shell 规范、adoption playbook 与任务台账，并将本次变更收口到 completed / idle 真值。

## 2. Sprint 细化

## 2.1 sprint-001-connect-config-recovery-guidance

- Status: completed
- Sprint Goal: 修复 session shell 对重复 JSON 错误输出的解析，并将 `connect` adapters baseline 缺失场景转换为用户可执行的恢复提示。
- Task Package: `TK-763`、`TK-764`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-763 | sprint-001 | add actionable session-shell recovery guidance for structured connect errors | runtime/i18n/tests/docs | current session-shell error presentation baseline | completed |
| TK-764 | sprint-001 | finalize project-081 closeout and completion audit | closeout/final-audit | TK-763 | completed |

## 4. 依赖产物策略

1. 先修 session shell 对 nested CLI stdout 的结构化错误恢复，再补 connect-specific 恢复文案，避免只在单个错误码上打补丁。
2. `TK-763` 同时覆盖错误解析、i18n、测试与用户文档同步，但不扩张到 CLI 主输出 contract 本身。
3. `TK-764` 只在 `TK-763` 拿到同窗口测试/build 证据后推进，用于收口 plan、task ledger、current-context 与 completed history。

## 5. DoD（project-081）

1. stdout 中即使出现重复 JSON 错误行，session shell 仍能恢复 `cli_output_v1`，而不是把整段原始 JSON 直接回显到 transcript。
2. `inspect_governor_config` 这类 machine next_action 已转换成用户可读提示。
3. `connect` 缺少 adapters baseline 时，shell 会直接给出 `/init` / `/workspace clear-config` 的恢复建议。
4. 相关规范、adoption playbook 与任务 ledger 已同步更新，并具备同窗口测试/build 证据。

## 6. 里程碑记录

1. 2026-04-11：基于用户追加反馈“遇到这类 connect 失败时应该怎么处理”创建 `project-081`，范围聚焦到 session shell 结构化错误恢复提示。
2. 2026-04-11：已确认现状问题由两层叠加造成：重复 JSON stdout 无法被 shell 结构化解析，以及 `next_action` 仍以机器枚举直接展示。
3. 2026-04-11：`TK-763` 已完成重复 JSON 恢复、human-readable next_action、connect-specific recovery guidance、i18n/测试/规范同步。
4. 2026-04-11：`TK-764` 已完成 completion audit、completed history 回写与 idle context 恢复，并在此里程碑回链 [project-081 completion audit summary](./project-081-session-shell-actionable-error-guidance-completion-audit-summary.md)。
