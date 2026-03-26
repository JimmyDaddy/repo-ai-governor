# TK-227 packaged docs truthfulness 与 root README/playbook cutover

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-002-packaged-runtime-cutover-and-release-gate-block`

## 1. 任务目标

收敛根 README、adoption playbook 与 tarball docs surface 的 truthfulness，避免已发布包指向并不存在的文档入口。

## 2. Depends On

1. `TK-226`
2. `DA-224`
3. `README.md`
4. `README.zh-CN.md`
5. `docs/local-adoption-playbook.md`
6. `docs/local-adoption-playbook.zh-CN.md`

## 3. 预期产物

1. 根 README / playbook 对齐变更。
2. packaged docs surface truthfulness 结论。
3. 后续 `DA-227`

## 4. 实施计划

1. 确认 tarball 内真实可用 docs 入口。
2. 对齐根 README 与 adoption playbook 的引用关系。
3. 明确哪些文档必须打包，哪些只能保留仓库内参考角色。

## 5. 验证

1. `rg -n "local-adoption-playbook|README|tgz|path|link" README.md docs/local-adoption-playbook.md`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始盘点根 README、playbook 与 tarball docs surface 的入口对齐。
3. 2026-03-26：已完成根 README / README.zh-CN 与双语 playbook 的口径收敛，明确 `tgz` 仅在可访问 npm registry 时支持，且 tarball 现在显式包含双语 playbook 与 `.codex/skills/` 参考资产。
