# TK-271 workspace artifact locality contract 与 target-root decision baseline

- Status: completed
- Date: 2026-03-27
- Owner: AI-Agent
- Priority: P0
- Project: `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`
- Sprint: `sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline`

## 1. 任务目标

明确 workspace migration 的 `plan / execution / rollback` 产物在 `tool_managed` 与 `repo_local` 切换场景中的 canonical location，并形成 adopter 可理解的 target-root contract。

## 2. Depends On

1. `TK-270`
2. `DA-235`
3. `DA-236`
4. `project-020-adoption-productization-and-upgrade-ux-completion-audit-summary.md`

## 3. 预期产物

1. `DA-271`
2. 更新后的 locality contract / plan truth
3. 若需要则补充 CLI 输出与文档约束

## 4. Required Inputs

1. `.repo-ai-governor/context/dev/project-023-workspace-migration-artifact-locality-and-scratch-cleanup/sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline/tasks/DA-270-project-023-activation-and-project-022-closeout-handoff.md`
2. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-235-playground-adopter-pilot-baseline-and-gap-register.md`
3. `.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-004-adopter-pilot-and-documentation-closure/tasks/DA-236-react-native-image-marker-complex-adopter-pilot-and-gap-register.md`
4. `packages/config/src/workspace-migration-service.ts`
5. `apps/cli/src/commands/workspace-command.ts`

## 5. Traceback References

1. `docs/local-adoption-playbook.md`
2. `README.zh-CN.md`

## 6. 实施计划

1. 对照 pilot gap register，明确 adopter 真正需要在哪个 workspace root 找到 migration 产物。
2. 输出“跟随 active/target workspace root / 保留 source root 但显式 contract 化”的正式决策，并冻结路径语义。
3. 同步 project/sprint truth，避免 locality 继续停留在文档已知限制层面。

## 7. Development Verification

1. `node ./scripts/governance/check-task-ledger-sync.js`
2. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 8. Delivery Verification

1. `node ./scripts/governance/run-normative-loading-manifest-gate.js`

## 9. 执行记录

1. 2026-03-27：任务创建，状态初始化为 `planned`。
2. 2026-03-27：状态切换为 `in_progress`，开始对照 `DA-235/DA-236` 与当前 workspace 命令行为，明确 migration artifact 的 canonical location contract。
3. 2026-03-27：已完成 locality contract 决策，结论为 dry-run 跟随当前 active root、execute 成功后 plan/execution 跟随 target root、rollback artifact 跟随恢复后的 source root，并形成 `DA-271`。

## 10. 产出

1. `DA-271`
