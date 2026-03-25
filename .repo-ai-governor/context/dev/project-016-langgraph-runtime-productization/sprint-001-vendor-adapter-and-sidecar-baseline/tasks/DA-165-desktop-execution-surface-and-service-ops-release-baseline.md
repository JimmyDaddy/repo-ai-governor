# DA-165 desktop execution surface 与 service ops/release baseline

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-165`

## 1. 结论

1. `project-016` 现在已经具备正式的 desktop execution surface baseline，不再只停留在 DTO / transport seam。
2. 当前 desktop 产品化唯一推荐路径已冻结为：
   - `clientSurface=desktop`
   - `runtimeMode=sidecar_ipc`
   - `serviceHostKind=sidecar`
   - `serviceTransportKind=ipc`
3. service packaging / local release baseline 也已补齐：
   - desktop integration assets 已纳入发布内容
   - release local verification 已显式验证 desktop sidecar smoke
   - packed artifact 已要求包含 sidecar runtime 关键产物

## 2. 本轮实现

1. 新增正式 desktop integration 资产：
   - `integrations/desktop/README.md`
   - `integrations/desktop/examples/README.md`
   - `integrations/desktop/examples/desktop-sidecar-runtime.sample.json`
2. 新增 desktop smoke gate：
   - `scripts/examples/check-desktop-entry-smoke.js`
   - `package.json` 新增 `check:desktop-entry-smoke` / `gate:desktop-entry-smoke`
   - `turbo.json` 已将该 gate 接入总 `gate:check`
3. release/service ops 基线补齐：
   - `scripts/release/check-release-ready.js` 已要求 desktop smoke script 和 package scripts 存在
   - `scripts/release/verify-local-distribution.js` 已：
     - 运行 desktop sidecar smoke
     - 校验 packaged artifact 包含 desktop integration 资产
     - 校验 packaged artifact 包含 sidecar client / host / entry 与 CLI orchestration runtime 关键文件
4. integration 回归已补齐：
   - `test/desktop-entry-smoke.integration.test.ts`
   - `scripts/examples/check-desktop-entry-smoke.js`

## 3. rollout 约束

1. desktop surface 当前只承诺 `sidecar + ipc`，不承诺 `daemon + http`。
2. desktop client 继续只消费 service-owned DTO / event contract，不得旁路 runtime internals。
3. release packaging 现在必须继续携带 desktop integration assets 与 sidecar runtime 关键产物，避免 desktop baseline 在发布面失真。

## 4. 后续输入

1. `TK-166` 消费本产物，作为 sprint-001 exit acceptance 的 desktop/service-ops 正式证据。
