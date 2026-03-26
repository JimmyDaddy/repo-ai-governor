# DA-225 sprint-001 exit acceptance and sprint-002 packaged cutover input constraints

- Status: active
- Date: 2026-03-26
- Owner: AI-Agent
- Task: `TK-225`
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-001-packaging-truthfulness-failure-baseline`

## 1. Summary

1. `sprint-001-packaging-truthfulness-failure-baseline` 的 4 条 exit criteria 已全部满足：
   - `project-020` skeleton 与 active execution surface 已建立
   - `path/link/tgz` install matrix 与 failure taxonomy 已形成
   - published surface inventory、runtime asset copy 与 packaged-runtime resolvability audit 已形成
   - `sprint-002` 的 cutover 输入约束已经冻结
2. sprint-001 的最重要结论不是“内部 package 仍然解析失败”，而是：
   - packaged runtime resolvability 当前已通过
   - 真实剩余 gap 已转向 docs/skills/offline-install truthfulness 与 blocking gate coverage
3. 当前 worktree 可以暂时保留 `sprint-001` 作为 closeout surface，但后续真正的实现主线应显式切到 `sprint-002-packaged-runtime-cutover-and-release-gate-block`。

## 2. Sprint-002 Input Constraints

1. 不再把 `ERR_MODULE_NOT_FOUND(@repo-ai-governor/cli)` 当成默认主阻断。
   - 现有 evidence 已证明 packaged runtime resolvability 当前可以通过。
2. `sprint-002` 必须优先收敛 3 类 truthfulness gap：
   - `docs_truthfulness_gap`
   - `skills_surface_gap`
   - `offline_self_contained_install_gap`
3. `README.md` 与实际 tarball surface 必须统一：
   - 要么将 playbook 打进 tarball
   - 要么把根 README 改写为只引用 tarball 内真实存在的文档入口
4. skill surface 必须明确 canonical publish path：
   - `skills/`
   - 或 `.codex/skills/`
   - 并让 `package.json#files`、tarball manifest 与文档口径一致
5. support matrix 必须显式收紧：
   - online/registry-enabled `tgz` install：当前可通过
   - restricted-network/offline `tgz` install：当前不支持
   - 在未补齐 self-contained/offline story 之前，不得将 `tgz` 宣称为离线可复现安装
6. blocking gate 必须扩围，不只检查 runtime path suffix：
   - README-linked docs existence
   - skill surface presence
   - support matrix truthfulness

## 3. Recommended Sprint-002 Scope

1. 修正根 README / adoption playbook 的 packaged docs 口径。
2. 决定并落实 skill publish surface。
3. 明确 tarball 是否要支持 offline/self-contained install。
4. 将上述真值收敛到 release/GA blocking gate。

## 4. Key Outputs

1. [DA-223-packaging-install-matrix-and-failure-taxonomy-baseline.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-001-packaging-truthfulness-failure-baseline/tasks/DA-223-packaging-install-matrix-and-failure-taxonomy-baseline.md)
2. [DA-224-published-surface-inventory-and-packaged-runtime-resolvability-audit.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-001-packaging-truthfulness-failure-baseline/tasks/DA-224-published-surface-inventory-and-packaged-runtime-resolvability-audit.md)
3. [sprint-001 plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/sprint-001-packaging-truthfulness-failure-baseline/plan.md)
4. [project-020 plan.md](/Users/jimmydaddy/study/ai-governor/.repo-ai-governor/context/dev/project-020-adoption-productization-and-upgrade-ux/plan.md)
