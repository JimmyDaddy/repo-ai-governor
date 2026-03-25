# TK-165 desktop execution surface 与 service ops/release baseline

- Status: completed
- Date: 2026-03-26
- Owner: AI-Agent
- Priority: P0
- Project: `project-016-langgraph-runtime-productization`
- Sprint: `sprint-001-vendor-adapter-and-sidecar-baseline`

## 1. 任务目标

为 desktop execution surface 与 orchestration service packaging/ops/release 建立正式 baseline。

## 2. Depends On

1. `TK-163`
2. `TK-164`
3. `DA-157`
4. `DA-160`
5. `DA-162`
6. `DA-163`
7. `DA-164`

## 3. 预期产物

1. desktop execution transport / integration baseline。
2. service packaging、install、smoke、release gate baseline。

## 4. 实施结果

1. 已新增正式 desktop integration 资产：
   - `integrations/desktop/README.md`
   - `integrations/desktop/examples/README.md`
   - `integrations/desktop/examples/desktop-sidecar-runtime.sample.json`
2. 已新增 `check:desktop-entry-smoke` / `gate:desktop-entry-smoke`，并把 desktop sidecar smoke 接入总 `pnpm run check`。
3. `scripts/examples/check-desktop-entry-smoke.js` 现在会基于 built dist 真实拉起 `sidecar + ipc` runtime，并验证 desktop `startExecution/listExecutions/subscribeExecution` 主路径。
4. `scripts/release/check-release-ready.js` 与 `scripts/release/verify-local-distribution.js` 已同步收敛：
   - release policy 要求 desktop smoke script / scripts 存在
   - local release verification 必须通过 desktop sidecar smoke
   - packed artifact 必须包含 desktop integration 资产与 sidecar runtime 关键文件
5. integration 回归已补到 `test/desktop-entry-smoke.integration.test.ts`，验证 desktop clientSurface 在默认 sidecar mode 下的真实服务主路径。
