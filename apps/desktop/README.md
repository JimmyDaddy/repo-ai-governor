# Desktop Shell Foundation

`apps/desktop` 承接桌面治理控制台的正式实现入口。

`project-065` 当前把这个包冻结为 foundation-only secondary surface：它只在已构建的 governor 源码仓和本地验证链上正式支持，不扩张为独立桌面安装器、已发布桌面 bundle 或 packaged desktop product claim。

当前阶段已落 `Phase 0 + Phase 1` foundation，并为后续 `Phase 2 + Phase 3` governance command center follow-up 保留受控 seam：

1. sidecar + IPC desktop host bootstrap
2. typed preload bridge
3. session bridge
4. governance console transport-neutral view-model
5. lifecycle / restart / service-owned artifact-pane contract baseline
6. policy trace / review lifecycle / artifact workbench / governance evidence backlinks detail surface
7. automation inbox / review queue / parallel lane / workspace summary / notification ownership overview

这个包当前不直接引入 Electron runtime，而是先冻结桌面端需要遵守的 host / preload / renderer / utility-process contract，并让 smoke、tests、release verification 都基于这条正式包级 surface 验证。

这些 seam 是后续演进输入，不代表当前已经进入 packaged desktop rollout。

## Current Non-goals

1. `project-065` 不把 `apps/desktop` 提升为首选 secondary surface；当前策略仍是 `VS Code first / desktop foundation`。
2. 当前包级 surface 不是独立 packaged desktop product 的正式承诺，也不在本项目中扩张出新的 installer story。
3. 当前没有正式支持的 standalone desktop installer、published desktop bundle 或 desktop-specific upgrader。
4. richer desktop panels 仍然只能沿着 service-owned seam 继续演进，不能倒逼当前 public support claim 扩张。

## Supported Verification Path

1. `pnpm run build`
2. `pnpm run check:desktop-entry-smoke`
3. `pnpm run release:verify-local`

renderer、preload 与 shell 继续只消费 service-owned DTO / query / command seam，不得回退到 CLI 私有状态或本地 shadow truth。
