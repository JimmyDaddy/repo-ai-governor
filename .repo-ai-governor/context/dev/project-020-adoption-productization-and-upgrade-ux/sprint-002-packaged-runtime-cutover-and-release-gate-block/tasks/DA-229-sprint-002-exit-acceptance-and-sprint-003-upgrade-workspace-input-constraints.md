# DA-229 sprint-002 exit acceptance and sprint-003 upgrade workspace input constraints

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-229`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-002-packaged-runtime-cutover-and-release-gate-block`

## 1. Summary

1. `sprint-002-packaged-runtime-cutover-and-release-gate-block` 的 4 条 exit criteria 已全部满足：
   - README / playbook 与 tarball docs surface 口径一致
   - `.codex/skills/` 已确定为 canonical publish path
   - `tgz` 的 online/offline truthfulness 已收紧，不再伪装成离线自包含安装
   - blocking gate 已覆盖 docs/skills/support-matrix truthfulness
2. 当前 worktree 可暂时保留 `sprint-002` 作为 active closeout surface，但下一条推荐执行流应显式激活 `sprint-003-upgrade-and-workspace-lifecycle-ux-baseline`。

## 2. Sprint-003 Input Constraints

1. 不再回到 packaged distribution truthfulness 主线；该问题在 `sprint-002` 已收敛。
2. `sprint-003` 应聚焦把现有 upgrade / workspace 生命周期能力变成 adopter 可操作的 CLI 用户路径。
3. `sprint-003` 的最低交付面必须覆盖：
   - `upgrade` schema diff / migration suggestions
   - explicit dry-run
   - explicit rollback reference
   - failure summary / next-action guidance
4. `sprint-003` 继续默认消费 `DA-225`、`DA-227`、`DA-228`，避免重复打包真值盘点。

## 3. Key Outputs

1. [DA-226](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-002-packaged-runtime-cutover-and-release-gate-block/tasks/DA-226-sprint-002-activation-and-sprint-001-closeout-handoff.md)
2. [DA-227](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-002-packaged-runtime-cutover-and-release-gate-block/tasks/DA-227-packaged-docs-truthfulness-and-root-readme-playbook-cutover.md)
3. [DA-228](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-002-packaged-runtime-cutover-and-release-gate-block/tasks/DA-228-skill-publish-surface-offline-install-truthfulness-and-blocking-gate-expansion.md)
4. [sprint-002 plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-002-packaged-runtime-cutover-and-release-gate-block/plan.md)
