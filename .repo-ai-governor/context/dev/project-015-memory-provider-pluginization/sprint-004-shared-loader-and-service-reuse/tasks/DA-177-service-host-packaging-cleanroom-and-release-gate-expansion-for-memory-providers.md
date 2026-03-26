# DA-177 service-host packaging、clean-room 与 release gate expansion for memory providers

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-177`

## 1. Packaging / Release 结论

service-host / desktop 维度的 memory provider packaging、clean-room 与 release gate 已形成独立验证链路，不再复用 CLI-only `init/check` 结果代替。

## 2. 本轮收敛结果

1. desktop smoke 已按 `distribution_mode=default|plugin-enabled` 区分验证 memory provider composition。
2. local distribution verify 已在 default / plugin-enabled 两条发行链上执行 desktop sidecar runtime smoke。
3. clean-room install 已新增 installed-package service-host scenario，直接通过已安装发行包导入 orchestration runtime，并校验 `memoryProvider` composition。
4. plugin-enabled clean-room 既保留 CLI plugin scenario，也新增 service-host plugin scenario，确保 sidecar/service host 能在 clean-room 中真实解析 optional provider。

## 3. 关键实现锚点

1. `scripts/examples/check-desktop-entry-smoke.js`
2. `scripts/release/verify-local-distribution.js`
3. `scripts/release/verify-cleanroom-local-install.js`
4. `integrations/desktop/README.md`
5. `integrations/desktop/examples/README.md`
6. `integrations/desktop/examples/desktop-sidecar-runtime.sample.json`

## 4. 验证证据

1. `pnpm run build`
2. `node ./scripts/release/verify-local-distribution.js`
3. `node ./scripts/release/verify-cleanroom-local-install.js --modes path --iterations 1 --output .tmp/release-cleanroom-sprint004-default-report.json`
4. `pnpm run build:plugin-enabled`
5. `node ./scripts/release/verify-local-distribution.js --distribution-mode plugin-enabled`
6. `node ./scripts/release/verify-cleanroom-local-install.js --distribution-mode plugin-enabled --modes path --iterations 1 --output .tmp/release-cleanroom-sprint004-plugin-enabled-report.json`
