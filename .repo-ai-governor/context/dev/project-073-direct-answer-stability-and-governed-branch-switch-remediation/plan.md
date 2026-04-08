# project-073-direct-answer-stability-and-governed-branch-switch-remediation 计划

- Status: active
- Date: 2026-04-08
- Stage Mapping: session.main remediation
- Phase Mapping: direct-answer stability hardening + governed workspace action follow-up
- Upstream:
  - `.repo-ai-governor/context/current-context.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/governance/code_standards.md`

## 1. 目标

1. 修复 `session.main` direct-answer 路径在 surface 预检与 invoke liveness 上的脆弱行为，减少“连接不稳定 / 回答失败 / transport-idle”这类误伤。
2. 将“切换到 `main` 分支”这类常见工作区动作从 chat-only 拒绝升级为受治理的可执行能力，避免自由对话路径持续暴露明显能力缺口。
3. 用 fresh reviewer CR loop、边界验证与本地提交把这两个改动收敛到可回放、可审计的完成态。

## 2. Sprint 细化

## 2.1 sprint-001-direct-answer-stability-and-branch-switch

- Status: active
- Sprint Goal: 先稳定 direct-answer，再补齐受治理分支切换能力，并在同一 sprint 内完成 closeout 与 project-final review 激活。
- Task Package: `TK-714`、`TK-715`、`TK-716`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-714 | sprint-001 | stabilize session.main direct-answer preflight and liveness degradation handling | runtime/stability | current session.main baseline | completed |
| TK-715 | sprint-001 | add governed branch-switch execution path for session.main | governed command/capability | TK-714 | planned |
| TK-716 | sprint-001 | sprint-001 closeout and project-final review activation handoff | closeout/handoff | TK-714、TK-715、CR rounds | planned |

## 4. 依赖产物策略

1. `TK-714` 先只解决 direct-answer 预检阻塞、可用 surface 选择与 invoke liveness 误判，不顺手扩张到新的命令能力。
2. `TK-715` 在 `TK-714` clean 后再进入，避免“稳定性修复”和“能力补齐”互相污染边界。
3. `TK-716` 只在 sprint 内全部实现任务与对应 CR rounds clean 后推进，用于收口 sprint 真值并激活 project-final review。

## 5. DoD（project-073）

1. 用户触发 direct-answer 时，不再因为慢 probe 或脆弱 liveness 诊断而高频落入误导性失败结论。
2. “帮我切到 main” 这类请求已进入受治理执行路径，不再只能返回 chat-only 拒绝文案。
3. 两个边界都完成 fresh reviewer CR loop，并各自拥有边界级本地提交。

## 6. 里程碑记录

1. 2026-04-08：基于用户报告的新建 `project-073`，当前 primary boundary 固定为 `TK-714` direct-answer 稳定性修复。
2. 2026-04-08：`TK-714` 已完成 direct-answer preflight 快路径、invoke failure auto-fallback 与更保守的 Codex liveness suspect 调整，并已拿到 targeted tests + `pnpm run build` 证据；下一边界进入 fresh reviewer CR loop。
3. 2026-04-08：`CR-001` 已接受并收口了 reviewer 指出的 relay-state fallback 可见性问题；`TK-714` 当前边界已 clean，下一边界切换到 `TK-715` 受治理分支切换能力。
