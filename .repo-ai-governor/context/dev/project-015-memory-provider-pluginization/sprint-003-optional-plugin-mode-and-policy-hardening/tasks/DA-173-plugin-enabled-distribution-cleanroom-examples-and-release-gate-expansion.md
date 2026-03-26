# DA-173 plugin-enabled distribution、clean-room、examples 与 release gate expansion

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-173`
- Producer Execution: `exec-20260326-143`

## 1. 摘要

本产物建立了 `default distribution` 与 `plugin-enabled distribution` 的正式分离验证路径。默认发行包继续剔除 optional provider payload，而 plugin-enabled 发行包会显式携带 `@repo-ai-governor/memory-provider-sqlite-fs`，并通过 examples/runtime smoke、local distribution verify 与 clean-room install 验证真实的 `provider.module` 装载链路。

## 2. 交付内容

1. plugin-enabled build/distribution baseline
2. plugin-enabled example/runtime smoke baseline
3. plugin-enabled local verify / clean-room baseline
4. release script / support matrix sync

## 3. 关键实现

1. 双发行 build seam：
   - [copy-runtime-assets.js](/Users/jimmydaddy/study/ai-governor/scripts/build/copy-runtime-assets.js)
   - [package.json](/Users/jimmydaddy/study/ai-governor/package.json)
   - 新增 `build:plugin-enabled`
2. examples/runtime smoke 扩展：
   - [check-examples-runtime.js](/Users/jimmydaddy/study/ai-governor/scripts/examples/check-examples-runtime.js)
   - [check-examples-smoke.js](/Users/jimmydaddy/study/ai-governor/scripts/examples/check-examples-smoke.js)
   - [example-smoke.contract.json](/Users/jimmydaddy/study/ai-governor/examples/example-smoke.contract.json)
   - [optional-plugin-memory-flow](/Users/jimmydaddy/study/ai-governor/examples/optional-plugin-memory-flow/README.md)
3. local distribution verify 扩展：
   - [verify-local-distribution.js](/Users/jimmydaddy/study/ai-governor/scripts/release/verify-local-distribution.js)
   - 新增 `release:verify-local:plugin-enabled`
4. clean-room 与 release gate 扩展：
   - [verify-cleanroom-local-install.js](/Users/jimmydaddy/study/ai-governor/scripts/release/verify-cleanroom-local-install.js)
   - [check-release-ready.js](/Users/jimmydaddy/study/ai-governor/scripts/release/check-release-ready.js)
   - [render-release-notes.js](/Users/jimmydaddy/study/ai-governor/scripts/release/render-release-notes.js)
   - `release:candidate` 现在会强制执行 plugin-enabled local/tgz clean-room 验证，不再只覆盖默认发行面

## 4. 冻结的发行语义

1. default distribution
   - 不携带 `@repo-ai-governor/memory-provider-sqlite-fs`
   - 继续对 optional provider runtime fail-closed
2. plugin-enabled distribution
   - 显式携带 `@repo-ai-governor/memory-provider-sqlite-fs`
   - 必须通过 plugin example/runtime smoke 与 clean-room plugin scenario
3. release truthfulness
   - 不允许再用 default distribution 结果替代 plugin-enabled distribution 的验证

## 5. 验证证据

1. `pnpm run build`
2. `node ./scripts/examples/check-examples-runtime.js`
3. `node ./scripts/release/verify-local-distribution.js`
4. `pnpm run build:plugin-enabled`
5. `node ./scripts/examples/check-examples-runtime.js --distribution-mode plugin-enabled`
6. `node ./scripts/release/verify-local-distribution.js --distribution-mode plugin-enabled`
7. `node ./scripts/release/verify-cleanroom-local-install.js --distribution-mode plugin-enabled`
8. `node ./scripts/release/verify-cleanroom-local-install.js --distribution-mode plugin-enabled --modes tgz --iterations 1 --output .tmp/release-cleanroom-plugin-enabled-tgz-validation-report.json`
8. `pnpm run check`

## 6. 对后续任务的约束

1. `TK-174` 的 sprint acceptance 必须同时引用 default distribution 与 plugin-enabled distribution 的双轨验证证据。
2. sprint-004 若承接 service reuse，不得把 plugin-enabled packaging 和 shared loader reuse 混成单一默认发行语义。
3. 后续若新增 plugin package，必须先补 examples/runtime smoke 与 clean-room plugin scenario，再扩 allowlist。
