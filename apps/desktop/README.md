# Desktop Shell Foundation

`apps/desktop` 承接桌面治理控制台的正式实现入口。

当前阶段已落 `Phase 0 + Phase 1` foundation，并继续推进 `Phase 2 + Phase 3` governance command center surface：

1. sidecar + IPC desktop host bootstrap
2. typed preload bridge
3. session bridge
4. governance console transport-neutral view-model
5. lifecycle / restart / service-owned artifact-pane contract baseline
6. policy trace / review lifecycle / artifact workbench / governance evidence backlinks detail surface
7. automation inbox / review queue / parallel lane / workspace summary / notification ownership overview

这个包当前不直接引入 Electron runtime，而是先冻结桌面端需要遵守的 host / preload / renderer / utility-process contract，并让 smoke、tests、release verification 都基于这条正式包级 surface 验证。
