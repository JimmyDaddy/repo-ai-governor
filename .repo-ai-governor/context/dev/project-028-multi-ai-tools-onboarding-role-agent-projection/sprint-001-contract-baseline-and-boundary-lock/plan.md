# sprint-001-contract-baseline-and-boundary-lock 计划

- Status: planned
- Date: 2026-03-28
- Project: `project-028-multi-ai-tools-onboarding-role-agent-projection`

## 1. Sprint Goal

完成 multi-tool onboarding 与 role-agent projection 的正式化契约、module skeleton 与 follow-up handoff。

## 2. Task Package

1. `TK-304` 定义 onboarding / projection / runtime 三层契约并冻结 `governor.yaml` schema v2。
2. `TK-305` 冻结 agent descriptor 最小字段集。

## 3. Exit Criteria

1. `runtime.agent-projection` formal docs 已建立。
2. `technical-solution.multi-ai-tools-onboarding-role-agent-projection` 已进入 active 生命周期并完成 registry/manifest 接线。
3. follow-up project skeleton 已登记到 current-context 并可继续承接后续 implementation。

## 4. Execution Notes

1. 本 sprint 只 formalize 技术方案与治理真值，不直接实现 draft 里的后续代码改造 phases。
2. 当前 sprint 的 delivery ownership 采用 `followup_required`，以便明确后续 implementation 仍需独立承接。
