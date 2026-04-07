# project-064-vscode-packaged-secondary-surface-rollout 计划

- Status: active
- Date: 2026-04-08
- Stage Mapping: secondary surface productization
- Phase Mapping: VS Code packaged boundary + smoke gate
- Upstream:
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/adopter-productization-priority-and-surface-sequencing.md`
  - `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 1. 目标

1. 把 `apps/vscode-extension` 从 source-checkout-only companion MVP 推向更明确的 packaged secondary surface。
2. 补齐 VSIX/build/release/extension-host smoke 的最小产品化边界。
3. 更新 support matrix 与 adopter 文档，让其状态表达更直接。

## 2. Sprint 细化

## 2.1 sprint-001-packaged-distribution-and-extension-host-smoke

- Status: completed
- Sprint Goal: 为 VS Code secondary surface 建立 packaged distribution 与 smoke gate。
- Task Package: `TK-670`、`TK-671`、`TK-672`、`TK-704`。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
| --- | --- | --- | --- | --- | --- |
| TK-670 | sprint-001 | freeze VS Code packaged distribution contract and smoke gate | surface/contract | project-063 recommended | completed |
| TK-671 | sprint-001 | implement VSIX build release path and extension-host smoke follow-up | implementation/release | TK-670 | completed |
| TK-672 | sprint-001 | close VS Code packaged secondary-surface support declaration | docs/evidence/closeout | TK-670、TK-671 | completed |
| TK-704 | sprint-001 | sprint-001 exit acceptance and project-final review activation handoff | closeout/handoff | TK-670、TK-671、TK-672、CR-001 | completed |

## 4. 依赖产物策略

1. 先冻结 packaged distribution contract，再补 VSIX/build/release path。
2. closeout 必须同步更新 support matrix、packaged boundary 与 smoke evidence。

## 5. DoD（project-064）

1. VS Code extension 是否可 packaged 分发有清晰、可验证的答案。
2. secondary-surface 支持边界不再只停留在 source-checkout 叙事。
3. 文档、support matrix 与 smoke evidence 同步。

## 6. 里程碑记录

1. 2026-04-08：作为 `project-072` follow-up decomposition 产物创建，当前保持 `planned`。
2. 2026-04-08：`project-067` final closeout 完成后被激活为当前 primary project，`sprint-001 / TK-670` 进入执行窗口。
3. 2026-04-08：`TK-670 ~ TK-672` 的实现与验证窗口已完成，当前 project 进入 sprint CR loop 前的台账同步与复核收口阶段。
4. 2026-04-08：`CR-001` clean `resolved`；`TK-704 / DA-704` 已完成 sprint closeout handoff，当前下一边界固定为 `project-064` project-final delegated CR loop。
