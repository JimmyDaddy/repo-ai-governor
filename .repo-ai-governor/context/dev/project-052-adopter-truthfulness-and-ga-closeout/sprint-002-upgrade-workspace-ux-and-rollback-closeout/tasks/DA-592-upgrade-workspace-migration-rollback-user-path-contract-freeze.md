# DA-592 upgrade workspace migration rollback user-path contract freeze

- Status: active
- Date: 2026-04-06
- Owner: AI-Agent
- Artifact ID: `DA-592`
- Produced By: `TK-592`
- Scope: `project-052-adopter-truthfulness-and-ga-closeout`

## 1. Summary

1. `workspace` 的正式 adopter 路径冻结为 `dry-run -> execute -> rollback`。
2. `upgrade` 的正式 adopter 路径冻结为 `preview -> apply -> rollback`。
3. `README*`、`docs/local-adoption-playbook*` 与 `docs/support-matrix*` 已同步到同一条 artifact hand-off 与 rollback truth，不再只停留在“分析一下”或“记得保存 plan-path”的弱提示。

## 2. Frozen Contract

### 2.1 Workspace Migration

1. `dry-run` 与 `execute` 都要求 `--workspace-mode <repo_local|tool_managed>`。
2. adopter 必须保留 `plan_path`；这是 workspace rollback 的唯一正式 hand-off 输入。
3. `execute` 会写出迁移后的 plan 与 execution artifact；如果迁移失败，应先查看 `context/workspace/<migration-id>.failure.json` 再决定是否重试。
4. `rollback` 会根据保存的 `plan-path` 恢复旧工作区，并写出 `context/workspace/<migration-id>.rollback.json`。

### 2.2 Upgrade

1. Preview 路径使用 `pnpm exec repo-ai-governor upgrade --output json`，并写出：
   - `context/upgrade/<upgrade-id>.report.json`
   - `context/upgrade/<upgrade-id>.auto-migrated-config.json`
   - `context/upgrade/<upgrade-id>.rollback-snapshot.yaml`
2. Apply 路径只接受 preview 产出的 `report_path`，并且必须显式传 `--confirm-upgrade approve`。
3. Apply 完成后会写出 apply receipt 与 verify receipt；后续 rollback 正式接受 apply receipt 或 rollback snapshot。
4. 如果 preview 暴露 blocking confirmation items，应在 apply 前先停下来处理这些项。

## 3. Updated Adopter Surfaces

1. `README.md` / `README.zh-CN.md`
   - 新增最小 `upgrade preview/apply/rollback` 命令路径。
2. `docs/local-adoption-playbook.md` / `docs/local-adoption-playbook.zh-CN.md`
   - 明确 workspace 与 upgrade 的正式 contract、artifact 位置与 rollback hand-off。
3. `docs/support-matrix.md` / `docs/support-matrix.zh-CN.md`
   - 新增 `TK-592` contract snapshot，声明 support boundary 与 canonical guide 归属。

## 4. Validation

1. `node ./dist/bin/repo-ai-governor.js upgrade --help`
2. `node ./dist/bin/repo-ai-governor.js workspace --help`
3. `pnpm run check`

## 5. Key Outputs

1. `README.md`
2. `README.zh-CN.md`
3. `docs/local-adoption-playbook.md`
4. `docs/local-adoption-playbook.zh-CN.md`
5. `docs/support-matrix.md`
6. `docs/support-matrix.zh-CN.md`
