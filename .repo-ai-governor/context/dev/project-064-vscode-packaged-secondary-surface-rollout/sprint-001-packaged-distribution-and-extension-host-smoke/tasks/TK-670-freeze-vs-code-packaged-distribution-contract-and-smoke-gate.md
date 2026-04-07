# TK-670 freeze VS Code packaged distribution contract and smoke gate

- Status: completed
- Date: 2026-04-08
- Owner: `AI-Agent`
- Priority: `P1`
- Project: `project-064-vscode-packaged-secondary-surface-rollout`
- Sprint: `sprint-001-packaged-distribution-and-extension-host-smoke`

## 1. 任务目标

冻结 VS Code packaged distribution contract 与 extension-host smoke gate，为 secondary-surface rollout 建立单一支持边界。

## 2. Depends On

1. `project-063` recommended
2. `DA-696`

## 3. 预期产物

1. VS Code packaged contract
2. smoke gate definition
3. implementation input

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/plan.md`
2. `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-governance-clients/adrs/current-surface-baseline-classification-and-followup-decomposition.md`
3. `.repo-ai-governor/context/dev/project-072-current-surface-priority-promotion-and-decomposition/sprint-001-promotion-and-formal-followup-decomposition/tasks/DA-696-current-surface-priority-promotion-and-followup-decomposition-handoff.md`

## 5. Traceback References

1. `.repo-ai-governor/draft/repo-ai-governor-current-app-feature-implementation-vs-baseline-priority-assessment.md`
2. `.repo-ai-governor/context/dev/project-054-vscode-secondary-surface-rollout/project-054-vscode-secondary-surface-rollout-completion-audit-summary.md`

## 6. 实施计划

1. 冻结 VSIX/build/release 和 extension-host smoke 的正式边界。
2. 明确 packaged secondary-surface 的 acceptance 口径。
3. 把 implementation worklist 交给 `TK-671`。

## 7. Development Verification

1. VS Code packaging contract review
2. smoke gate checklist review

## 8. Delivery Verification

1. extension-host smoke
2. `pnpm run build`

## 9. 执行记录

1. 2026-04-08：任务创建，状态初始化为 `planned`。
2. 2026-04-08：`project-067` final closeout 完成后，本任务作为 `project-064` 起始边界被激活并切换为 `in_progress`。
3. 2026-04-08：已冻结正式 contract truth：VS Code secondary surface 的正式支持从“已构建 governor 源码仓”开始，可走 `apps/vscode-extension` 的 extension-development host，或从同一源码仓本地生成一份 VSIX / packaged extension root；已发布 npm/tgz 安装面与 Marketplace 分发继续排除在正式支持范围之外，trust-sensitive action 仍受 `Workspace Trust` 保护。

## 10. 产出

1. `apps/vscode-extension/README.md`
2. `README.md`
3. `README.zh-CN.md`
4. `docs/support-matrix.md`
5. `docs/support-matrix.zh-CN.md`
