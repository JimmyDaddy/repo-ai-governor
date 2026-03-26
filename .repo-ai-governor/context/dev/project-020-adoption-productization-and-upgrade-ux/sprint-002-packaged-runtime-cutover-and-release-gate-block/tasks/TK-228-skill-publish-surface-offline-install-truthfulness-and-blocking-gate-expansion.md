# TK-228 skill publish surface、offline install truthfulness 与 blocking gate expansion

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-020-adoption-productization-and-upgrade-ux`
- Sprint: `sprint-002-packaged-runtime-cutover-and-release-gate-block`

## 1. 任务目标

确定 canonical skill publish path，收敛 offline install/support matrix truthfulness，并将 release gate 扩围到 docs/skills/support-matrix 真值。

## 2. Depends On

1. `TK-227`
2. `DA-225`
3. `DA-227`
4. `package.json`
5. `scripts/release/verify-local-distribution.js`

## 3. 预期产物

1. skill surface truthfulness cutover。
2. offline install/support matrix truthfulness cutover。
3. blocking gate 扩围变更。

## 4. 实施计划

1. 决定 `skills/` 或 `.codex/skills/` 的 canonical publish path。
2. 明确 `tgz` 的 online/offline 支持矩阵。
3. 将 truthfulness 检查接入 release/GA blocking gate。

## 5. 验证

1. `node ./scripts/release/verify-local-distribution.js`

## 6. 执行记录

1. 2026-03-26：任务创建，状态初始化为 `planned`。
2. 2026-03-26：状态切换为 `in_progress`，开始将 `.codex/skills/` 固化为 canonical publish path，并扩围 release gate 到 docs/skills truthfulness。
3. 2026-03-26：已完成 `.codex/skills/` canonical publish path cutover、`package.json#files`/tarball surface 对齐、offline install truthfulness 收敛，以及 `verify-local-distribution` 对 docs/skills/support-matrix 的 blocking 校验扩围。
