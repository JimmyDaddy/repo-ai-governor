# project-023-workspace-migration-artifact-locality-and-scratch-cleanup 计划

- Status: completed
- Date: 2026-03-27
- Stage Mapping: Post-Stage-9 workspace migration ergonomics follow-up
- Phase Mapping: Workspace Migration / Adoption Ergonomics / Artifact Locality / Cleanup

## 1. 目标

1. 将 workspace migration 的 plan/execution/rollback 产物位置从“行为真值已成立但人体工程学不足”收敛为 adopter 可预测、可定位的正式 contract。
2. 消除 rollback 后 `.repo-ai-governor-migration/<migration-id>/backup` 等 scratch 残留目录带来的“是否已完全回滚”认知负担。
3. 保持 `tool_managed -> repo_local -> rollback` 的 dry-run/execute/rollback 语义稳定，不把 artifact locality 或 cleanup 修复变成 workspace 生命周期回归。
4. 让 CLI 输出、playbook、README 与 workspace migration 真值保持同步，避免 external adopter 再次依赖文档外知识排障。

## 2. Sprint 细化

## 2.1 sprint-001-workspace-artifact-locality-and-scratch-cleanup-baseline

- Status: completed
- Sprint Goal: 收敛 workspace artifact locality target-root contract、rollback scratch cleanup 与 adopter-facing truthfulness baseline。
- Task Package: `TK-270`、`TK-271`、`TK-272`、`TK-273`、`TK-274`。
- Exit Criteria:
  1. `project-023` skeleton 已建立，`current-context.md` 已切换到新的 active primary stream，并将 `project-022 / sprint-003` 迁入 completed history。
  2. workspace migration 的 artifact locality 已形成明确的 canonical contract，而不是继续停留在 source `tool_managed` 侧的隐式行为。
  3. rollback 后的 scratch 目录清理语义已收敛为自动 cleanup 或显式、可验证的残留策略，而不是留给用户猜测。
  4. CLI 输出、文档与定向验证链路已与新的 locality/cleanup 真值保持一致。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-270 | sprint-001 | project-023 激活与 project-022 closeout handoff | bootstrap/governance | project-022 completion audit,project-022 sprint-003 completed | completed |
| TK-271 | sprint-001 | workspace artifact locality contract 与 target-root decision baseline | cli/contract | TK-270,DA-235,DA-236,project-020 completion audit | completed |
| TK-272 | sprint-001 | workspace artifact locality execute rollback cutover 与 CLI truthfulness | cli/implementation | TK-271,packages/config/src/workspace-migration-service.ts,apps/cli/src/commands/workspace-command.ts | completed |
| TK-273 | sprint-001 | rollback scratch cleanup 与 residual-state semantics hardening | cli/cleanup | TK-272,packages/config/src/workspace-migration-service.ts,apps/cli/src/commands/workspace-command.ts | completed |
| TK-274 | sprint-001 | sprint-001 出口验收与 project-023 完成态评估 | acceptance/baseline | TK-271,TK-272,TK-273 | completed |

## 4. 依赖产物策略

1. `project-023` 启动默认消费：
   - `project-020-adoption-productization-and-upgrade-ux-completion-audit-summary.md`
   - `DA-235-playground-adopter-pilot-baseline-and-gap-register.md`
   - `DA-236-react-native-image-marker-complex-adopter-pilot-and-gap-register.md`
   - `DA-237-sprint-004-exit-acceptance-and-project-020-completion-recommendation.md`
   - `project-022-memory-semantics-safety-and-consumer-hardening-completion-audit-summary.md`
   - `docs/local-adoption-playbook.md`
   - `README.zh-CN.md`
2. `sprint-001` 优先收敛 workspace migration 本身的 ergonomics，不将 scope 扩回 broader package-manager-neutral onboarding polish。
3. artifact locality 的 contract 决策必须先于 execute/rollback 实装与 cleanup 收口，避免后续再次迁移 artifact path。
4. scratch cleanup 修复必须保持 rollback 可恢复、可审计；不得为了“看起来干净”而删除仍承担恢复语义的目录。

## 5. DoD（project-023）

1. workspace migration 的 `plan / execution / rollback` 产物位置对 adopter 来说是 deterministic 且与 active/target workspace contract 一致。
2. rollback 成功后的 scratch 目录不会残留无语义的中间态痕迹，或残留策略已被正式 contract 化并在输出中说明。
3. `workspace` CLI 的 dry-run/execute/rollback 输出、定向测试、playbook 与 README 对 locality/cleanup 的口径一致。
4. task/review/master-plan/current-context truth 保持同步，后续若仍有 broader onboarding polish，必须以新 stream 显式承接。

## 6. 里程碑记录

1. 2026-03-27：创建 `project-023-workspace-migration-artifact-locality-and-scratch-cleanup`，并通过 `TK-270 / DA-270` 将 active execution surface 从 `project-022 / sprint-003` closeout 切换到新的 workspace migration ergonomics follow-up 主线。
2. 2026-03-27：通过 `TK-271 / DA-271` 明确 workspace migration artifact locality contract：dry-run 跟随当前 active root、execute 成功后 plan/execution 跟随 target root、rollback artifact 跟随恢复后的 source root。
3. 2026-03-27：通过 `TK-272 / DA-272` 将 execute 成功后的 plan/execution artifact cutover 到 target workspace root，并同步 CLI truthfulness、测试与 adopter 文档。
4. 2026-03-27：通过 `TK-273 / DA-273` 收敛 rollback scratch cleanup，移除成功 cleanup 后空的 `.repo-ai-governor-migration/<migration-id>` 目录，并显式暴露 cleanup 状态。
5. 2026-03-27：通过 `TK-274 / DA-274` 完成 sprint-001 验收，形成 [project-023 completion audit summary](./project-023-workspace-migration-artifact-locality-and-scratch-cleanup-completion-audit-summary.md)，并将 `project-023` 切换为 `completed`；`current-context` 暂保留本 sprint 作为 active closeout surface。
