# DA-593 upgrade preview apply rollback and workspace migration closeout path

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Artifact ID: `DA-593`
- Produced By: `TK-593`
- Scope: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. Summary

1. 当前仓库已有的 `upgrade` 与 `workspace` CLI/runtime 实现，已经被收敛成正式 adopter-facing 闭环，而不再只是内部能力或历史任务遗留实现。
2. `upgrade` 路径现已对外冻结为 `preview -> apply -> rollback`，其中：
   - preview 交付 `report_path`、`rollback_snapshot_path`、`auto_migrated_config_path`
   - apply 只接受 preview report，并要求显式 `--confirm-upgrade approve`
   - rollback 接受 apply receipt 或 rollback snapshot，并交付 rollback receipt + verify receipt
3. `workspace` 路径现已对外冻结为 `dry-run -> execute -> rollback`，其中：
   - dry-run 交付 `plan_path`
   - execute 交付迁移后的 `plan_path` 与 `execution_path`
   - rollback 消费保存下来的 `plan_path`，交付 `rollback_path`

## 2. Delivered Surface

1. Existing implementation truth
   - `apps/cli/src/commands/upgrade-command.ts`
   - `apps/cli/src/commands/workspace-command.ts`
2. Existing regression coverage consumed by this task
   - `apps/cli/test/cli-governance-runtime.integration.test.ts`
   - `apps/cli/test/commands/workspace-command.test.ts`
   - `apps/cli/test/cli-output-contract.integration.test.ts`
3. Adopter-facing docs updated in this window
   - `README.md` / `README.zh-CN.md`
   - `docs/local-adoption-playbook.md` / `docs/local-adoption-playbook.zh-CN.md`

## 3. Real Rehearsal Evidence

本轮在 repo 外隔离 fixture 中完成两组真实命令演练，汇总见：

1. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`

关键结论：

1. Upgrade rehearsal
   - preview：`schema_upgrade_analyze`，并真实生成 report / rollback snapshot / auto-migrated config
   - apply：`schema_upgrade_apply`，并真实生成 apply receipt / verify receipt，`verify_status=passed`
   - rollback：`schema_upgrade_rollback`，并真实生成 rollback receipt / verify receipt，`verify_status=passed`
2. Workspace rehearsal
   - dry-run：`workspace_migration_plan`，并真实生成 `plan_path`
   - execute：`workspace_migration_execute`，并在 target workspace 下生成迁移后的 `plan_path` / `execution_path`
   - rollback：`workspace_migration_rollback`，并回到 source workspace；`scratch_cleanup_status=removed`

## 4. Closeout Notes

1. 本任务窗口没有新增或修改 `apps/**`、`packages/**`、`bin/**`、`test/**` 下的 executable surface；当前工作主要是把既有实现冻结成正式 adopter path，并补充真实命令演练与文档闭环。
2. `TK-594` 将继续消费本任务形成的 contract、command rehearsal 与文档真值，补齐 troubleshooting 与 acceptance closeout。

## 5. Validation

1. `node ./dist/bin/repo-ai-governor.js upgrade --help`
2. `node ./dist/bin/repo-ai-governor.js workspace --help`
3. repo-external upgrade rehearsal:
   - `upgrade --output json`
   - `upgrade apply <report-path> --confirm-upgrade approve --output json`
   - `upgrade rollback <apply-receipt-path> --output json`
4. repo-external workspace rehearsal:
   - `workspace dry-run --workspace-mode tool_managed --workspace-root <managed-root> --output json`
   - `workspace execute --workspace-mode tool_managed --workspace-root <managed-root> --output json`
   - `workspace rollback <plan-path> --output json`

## 6. Key Outputs

1. `.tmp/project-052-sprint-002-command-rehearsal-summary.json`
2. `README.md`
3. `README.zh-CN.md`
4. `docs/local-adoption-playbook.md`
5. `docs/local-adoption-playbook.zh-CN.md`
