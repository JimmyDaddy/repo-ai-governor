# project-020-adoption-productization-and-upgrade-ux 计划

- Status: active
- Date: 2026-03-26
- Stage Mapping: Post-Stage-9 external adoption/productization closure
- Phase Mapping: Packaging Truthfulness / Upgrade UX / Adopter Pilot

## 1. 目标

1. 将 `project-019` 识别出的最高优先级 adoption/productization gap 从 planning draft 转成正式实现主线。
2. 先收敛 `path/link/tgz` 分发真值、published surface resolvability 与 blocking release gate，避免外部 adopter 继续建立在仓库内偶然成功路径上。
3. 在 packaged distribution 真值稳定后，把 `upgrade` 与 `workspace lifecycle` 从服务层能力提升为 adopter 可操作、可 dry-run、可 rollback 的正式 CLI 用户路径。
4. 使用真实目标仓库试点验证接入、升级、workspace 切换与回滚，而不是只在本仓库自举闭环内判断“已完成”。
5. 用 support matrix、playbook、troubleshooting 与 gate baseline 收紧对外 truthfulness，避免文档与真实分发面再次漂移。

## 2. Sprint 细化

## 2.1 sprint-001-packaging-truthfulness-failure-baseline

- Status: completed
- Sprint Goal: 固化 `path/link/tgz` 安装矩阵、packaged runtime failure taxonomy 与 published surface inventory，为后续 packaged runtime 真正 cutover 提供 deterministic baseline。
- Task Package: `TK-222`、`TK-223`、`TK-224`、`TK-225`。
- Exit Criteria:
  1. `project-020` skeleton 已建立，`current-context.md` 已切换到 `project-020 / sprint-001`，并将 `project-019 / sprint-002` 迁入 completed history。
  2. 已形成覆盖 `path / link / tgz` 的 install matrix、failure classes 与 deterministic diagnosis baseline。
  3. 已形成 published surface、runtime asset copy、entrypoint resolvability 与 release gate gap map。
  4. 已为 `sprint-002-packaged-runtime-cutover-and-release-gate-block` 冻结输入约束，而不是直接跳过 baseline 进入 opportunistic 修补。

## 2.2 sprint-002-packaged-runtime-cutover-and-release-gate-block

- Status: completed
- Sprint Goal: 修复 packaged distribution 真值，并将 clean-room packaged install 验证切为 release/GA blocking gate。
- Task Package: `TK-226`、`TK-227`、`TK-228`、`TK-229`。
- Exit Criteria:
  1. `pnpm pack` / `tgz` clean-room 路径下的 `--help -> init -> doctor -> check` 可稳定通过。
  2. published surface 不再依赖 workspace 内解析或未声明 runtime asset 偶然存在。
  3. support matrix、README、playbook、skill surface 与 release gate 的 truthfulness 口径一致。

## 2.3 sprint-003-upgrade-and-workspace-lifecycle-ux-baseline

- Status: completed
- Sprint Goal: 将 `UpgradeSchemaDiffService`、`WorkspaceMigrationService` 与相关 planner 能力切为正式 CLI 用户路径。
- Task Package: `TK-230`、`TK-231`、`TK-232`、`TK-233`。
- Exit Criteria:
  1. `upgrade` 至少具备 schema diff、migration suggestions、confirmation items 与 rollback reference。
  2. workspace migration 至少具备 dry-run、execute、rollback 与 failure summary。
  3. adopter 可以理解“将改什么、为什么阻断、如何回滚”，而不是只能消费底层服务能力。

## 2.4 sprint-004-adopter-pilot-and-documentation-closure

- Status: planned
- Sprint Goal: 用 1 到 2 个真实目标仓库试点验证分发真值与 upgrade/workspace UX，并完成 support matrix / playbook / troubleshooting closure。
- Task Package: 激活时拆分。
- Exit Criteria:
  1. 至少 1 个目标仓库可稳定完成接入与升级 rehearsal。
  2. 已形成正式 adopter playbook、support matrix 与 known limitations。
  3. pilot 发现已回灌到 docs/gates，而不是停留在一次性试点记录。

## 3. 任务拆解矩阵（WBS）

| task_id | sprint | title | 目标产出类型 | depends_on | status |
|---|---|---|---|---|---|
| TK-222 | sprint-001 | project-020 激活与执行面切换 handoff | bootstrap/governance | DA-221,project-019 sprint-002 completion audit | completed |
| TK-223 | sprint-001 | packaging/install matrix 与 failure-class baseline | package/baseline | TK-222,DA-216,DA-220 | completed |
| TK-224 | sprint-001 | published surface inventory 与 packaged-runtime resolvability audit | package/runtime | TK-223,DA-223,package.json,apps/cli/README.md | completed |
| TK-225 | sprint-001 | sprint-001 出口验收与 sprint-002 packaged cutover 输入约束 | acceptance/baseline | TK-222,TK-223,TK-224,DA-222,DA-223,DA-224 | completed |
| TK-226 | sprint-002 | sprint-002 激活与 sprint-001 closeout handoff | bootstrap/governance | DA-225,sprint-001 completion | completed |
| TK-227 | sprint-002 | packaged docs truthfulness 与 root README/playbook cutover | docs/package | TK-226,DA-224,README.md,docs/local-adoption-playbook.md | completed |
| TK-228 | sprint-002 | skill publish surface、offline install truthfulness 与 blocking gate expansion | package/gate | TK-227,DA-225,DA-227,package.json,scripts/release/verify-local-distribution.js | completed |
| TK-229 | sprint-002 | sprint-002 出口验收与 sprint-003 upgrade/workspace 输入约束 | acceptance/baseline | TK-226,TK-227,TK-228,DA-226,DA-227,DA-228 | completed |
| TK-230 | sprint-003 | sprint-003 激活与 sprint-002 closeout handoff | bootstrap/governance | DA-229,sprint-002 completion | completed |
| TK-231 | sprint-003 | upgrade command user path 与 confirmation/rollback reference baseline | cli/upgrade | TK-230,DA-229,apps/cli/src/commands/upgrade-command.ts,packages/config/src/upgrade-schema-diff-service.ts | completed |
| TK-232 | sprint-003 | workspace lifecycle CLI dry-run/execute/rollback/failure-summary baseline | cli/workspace | TK-231,packages/config/src/workspace-migration-service.ts | completed |
| TK-233 | sprint-003 | sprint-003 出口验收与 sprint-004 adopter pilot 输入约束 | acceptance/baseline | TK-230,TK-231,TK-232,DA-230 | completed |

## 4. 依赖产物策略

1. `project-020` 启动默认消费：
   - `DA-216`
   - `DA-220`
   - `DA-221`
   - `.repo-ai-governor/draft/repo-ai-governor-current-state-vs-prd-gap-assessment.md`
   - `.repo-ai-governor/draft/repo-ai-governor-priority-1-and-2-delivery-plan.md`
   - `README.md`
   - `apps/cli/README.md`
2. `sprint-001` 证据采样优先覆盖：
   - root `package.json`
   - `apps/cli`
   - `packages/config`
   - `packages/core-*`
   - clean-room / install / release gate 相关脚本与文档
3. 在 clean-room packaged install 真值未通过前，不得把 `tgz/npm` 路径写成正式支持矩阵。
4. `sprint-001` 先做 deterministic baseline 与 diagnosis contract；`sprint-002` 才做 packaged runtime cutover 与 blocking gate。
5. `sprint-003` 与 `sprint-004` 必须建立在 packaged distribution truthfulness 已收敛的前提上，不得反向跳过 support matrix 真值。

## 5. DoD（project-020）

1. `path/link/tgz` 至少两种正式支持安装模式具备 clean-room truthfulness，并纳入 blocking release gate。
2. packaged runtime 的 entrypoint、exports、dist 与 runtime assets 不再依赖 workspace 内偶然解析成功。
3. `upgrade` 与 `workspace lifecycle` 已成为 adopter 可操作的 CLI 用户路径，并具备 dry-run、rollback 与 failure summary。
4. 至少 1 个真实目标仓库完成接入、升级、workspace 切换与回滚 rehearsal。
5. support matrix、playbook、troubleshooting、release gate 与 artifact/task ledger 保持一致，不再出现“仓库内可用但外部 adopter 不稳”的文档漂移。

## 6. 里程碑记录

1. 2026-03-26：创建 `project-020-adoption-productization-and-upgrade-ux`，将 `project-019 / sprint-002` 从 active closeout surface 迁入 completed history，并激活 `sprint-001-packaging-truthfulness-failure-baseline`。
2. 2026-03-26：完成 `sprint-001-packaging-truthfulness-failure-baseline`，形成 `DA-222`、`DA-223`、`DA-224`、`DA-225`，并将 sprint-002 的输入约束冻结为 docs/skills publish surface truthfulness、offline install truthfulness 与 blocking gate cutover。
3. 2026-03-26：激活 `sprint-002-packaged-runtime-cutover-and-release-gate-block`，将 `sprint-001` 迁入 completed history，并启动 `TK-227` 收敛 root README/playbook packaged docs truthfulness。
4. 2026-03-26：完成 `sprint-002-packaged-runtime-cutover-and-release-gate-block`，形成 `DA-227`、`DA-228`、`DA-229`，确认 `.codex/skills/` 为 canonical publish path、`tgz` 为 online-only clean-room 路径，并将下一条推荐执行流切换到 `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`。
5. 2026-03-26：激活 `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`，将 `sprint-002` 迁入 completed history，并启动 `TK-231` 收敛 upgrade 命令的 adopter CLI 用户路径。
6. 2026-03-26：完成 `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`，形成 `DA-231`、`DA-232`、`DA-233`，将 `upgrade/workspace` 收敛为正式 adopter CLI 用户路径，并冻结 `sprint-004-adopter-pilot-and-documentation-closure` 输入约束。
