# DA-174 sprint-003 出口验收与 sprint-004 service reuse 输入约束

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-174`
- Producer Execution: `exec-20260326-145`

## 1. 出口结论

当前判定：`accept`。

`project-015 / sprint-003-optional-plugin-mode-and-policy-hardening` 已满足本轮 sprint exit criteria：

1. `provider.module / exportName / options` 的可控解析契约已形成正式基线。
2. optional plugin mode 继续保持 allowlist / prefix / path / module policy，不允许任意模块执行。
3. plugin-enabled distribution、examples/runtime smoke、local distribution verify 与 clean-room plugin scenario 已形成独立验证路径，不再复用 default distribution 结果代替。
4. sprint-004 service reuse 进入前必须遵守的 shared loader / host surface / packaging 输入约束已形成正式文档事实源。

## 2. 本轮已成立的正式证据

1. `DA-171`
   - optional plugin allowlist / prefix / path / module policy 与 registry resolution contract 已冻结。
2. `DA-172`
   - CLI 已正式切到统一 registry loader，dual-input compatibility 与 plugin source diagnostics 已成立。
3. `DA-173`
   - plugin-enabled distribution、examples/runtime smoke、local distribution verify 与 clean-room plugin scenario 已形成正式验证链路。

## 3. sprint-003 验收结果

1. task 层状态
   - `TK-171` ~ `TK-174` 共 `4/4 completed`
2. 能力层状态
   - CLI 已可在受控 allowlist 下真实消费 `memory.provider.module`
   - default distribution 与 plugin-enabled distribution 的边界已明确分离
   - examples / local verify / clean-room 已能真实验证 plugin mode，而不是只停留在 contract 描述
3. release / quality 层状态
   - `pnpm -s tsc -p tsconfig.json --noEmit`
   - 定向 `vitest`
   - `node ./scripts/examples/check-examples-smoke.js`
   - `pnpm run build`
   - `node ./scripts/examples/check-examples-runtime.js`
   - `node ./scripts/release/verify-local-distribution.js`
   - `pnpm run build:plugin-enabled`
   - `node ./scripts/examples/check-examples-runtime.js --distribution-mode plugin-enabled`
   - `node ./scripts/release/verify-local-distribution.js --distribution-mode plugin-enabled`
   - `node ./scripts/release/verify-cleanroom-local-install.js --distribution-mode plugin-enabled`
   - `pnpm run check`
   均已给出通过证据

## 4. sprint-004 service reuse 输入约束

1. shared loader seam
   - service-backed runtime、desktop host 与 CLI 必须继续共用 `@repo-ai-governor/memory-provider-registry`
   - 不允许在 service host 内复制另一套 provider resolution 规则
2. host surface policy
   - `hostSurface` 至少要显式区分 `cli` 与 `local_orchestration_service`
   - service reuse 进入前必须明确 desktop/daemon 是否继续共享相同 plugin policy
3. runtime mode policy
   - `embedded` 与 `daemon` 必须继续作为正式输入，不能在 service reuse 时被弱化为隐式环境分支
4. packaging policy
   - default distribution 与 plugin-enabled distribution 继续分离验证
   - 若 service host 需要自己的 plugin-enabled bundle，必须独立验证，不得沿用 CLI 包结果
5. security policy
   - sprint-004 仍不得开放任意 module specifier
   - relative path / absolute path / `file:` URL 只有在单独策略任务冻结后才允许进入实现范围

## 5. project-015 当前判断

1. `project-015` 继续保持 `active`。
2. sprint-003 已达到 `accept`，但 service reuse 与更细粒度 plugin policy 仍是后续范围。
3. 下一步应进入 sprint-004 的 shared loader / service reuse 拆解，而不是继续在 sprint-003 下堆积实现。
