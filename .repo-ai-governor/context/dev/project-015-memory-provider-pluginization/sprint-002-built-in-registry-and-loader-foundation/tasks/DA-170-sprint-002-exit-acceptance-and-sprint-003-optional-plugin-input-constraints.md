# DA-170 sprint-002 出口验收与 sprint-003 optional plugin 输入约束

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-170`
- Producer Execution: `exec-20260326-132`

## 1. 出口结论

当前判定：`accept`。

`project-015 / sprint-002-built-in-registry-and-loader-foundation` 已满足本轮 sprint exit criteria：

1. `memory provider registry + built-in descriptor` 已形成正式 package 基线。
2. CLI 已不再在入口层硬编码 `fs-csv/sqlite-fs` 选择逻辑，legacy `storeEngine` 的 parser/selection 兼容仍然成立。
3. default distribution 与 optional built-in provider 的发布矩阵已冻结，`sqlite-fs` 不再进入默认发行载荷；默认发行包对该 optional built-in provider 仅保留 parser/selection truthfulness 与 fail-closed 语义，不宣称运行时可用。
4. sprint-003 进入 optional plugin mode 前必须满足的 allowlist / prefix / path / module policy 输入约束已形成正式文档事实源。

## 2. 本轮已成立的正式证据

1. `DA-167`
   - `@repo-ai-governor/memory-provider-registry`、built-in descriptor 与 loader 契约已成立。
2. `DA-168`
   - CLI memory provider loader cutover 已完成，`memory.provider.id` 与 legacy `storeEngine` 的 parser/selection 兼容语义已冻结，`provider.module` 当前 fail-closed。
3. `DA-169`
   - default distribution 与 optional built-in provider 的 runtime/release 边界已收紧，默认发行包不再携带 `sqlite-fs` payload，并对缺失 optional built-in provider 的运行时路径保持 fail-closed。

## 3. sprint-002 验收结果

1. task 层状态
   - `TK-167` ~ `TK-170` 共 `4/4 completed`
2. 能力层状态
   - built-in registry 已从 CLI entry 脱钩
   - CLI/config/shared contract 已统一收敛到 loader 事实源
   - optional built-in provider 已不再默认进入 distribution
3. release / quality 层状态
   - `pnpm -s tsc -p tsconfig.json --noEmit`
   - 定向 `vitest`
   - `pnpm run build`
   - `pnpm run release:verify-local`
   - `pnpm run check`
   均已给出通过证据

## 4. sprint-003 optional plugin 输入约束

1. config 扩展边界
   - 允许正式进入 `memory.provider.module / exportName / options` 路径
   - 但不得移除 `storeEngine` 的兼容解析，至少在一个过渡 sprint 内保持 dual-input 兼容
2. module resolution policy
   - 只允许解析显式 allowlist 的 package/module
   - 不允许任意裸模块名直通 `import()`
   - 不允许 `file:`、相对路径、workspace 外绝对路径直接作为 provider module
   - 在 plugin-enabled distribution 建立前，不得继续对 `sqlite_fs` legacy config 宣称默认发行包运行时兼容；只能保留 parser/selection 兼容与 fail-closed diagnostics
3. path / prefix policy
   - 若支持 repo-local provider 路径，必须限制在 workspace allowlisted 子目录
   - 必须明确禁止 `node_modules` 逃逸、父级路径回溯与隐藏目录任意装载
   - package 名称若走前缀策略，必须收敛到固定前缀，例如 `@repo-ai-governor/memory-provider-*`
4. provider contract policy
   - loader 必须继续校验导出值满足 `MemoryStoreProvider` contract
   - `provider export invalid / provider init failed / provider not found` 必须统一 fail-closed
   - optional plugin 不得覆盖 built-in descriptor 的 canonical source
5. distribution / release policy
   - plugin-enabled distribution 必须显式区分于默认发行包
   - `release:verify-local`、clean-room、examples/runtime smoke 必须新增 plugin-enabled 场景，不能复用 default distribution 结果代替
6. service reuse policy
   - Phase 2 不能把 loader 再塞回 CLI entry；应继续沿 registry/loader seam 演进，为后续 service reuse 保留共享落点

## 5. project-015 当前判断

1. `project-015` 继续保持 `active`。
2. 原因：
   - sprint-002 完成的是 Phase 1 `built-in registry + loader foundation`
   - optional plugin mode 与 service reuse 仍是后续范围
3. 下一步应进入 sprint-003 的正式拆解与任务激活，而不是继续在 sprint-002 下堆积新实现。

## 6. 后续执行约束

1. sprint-003 若未先冻结 allowlist / path / module policy，不得直接开放外部 provider module。
2. 任何 plugin resolution 实现都必须同时补齐 clean-room、release、examples/runtime smoke 和 distribution gate。
3. `sqlite-fs` 作为 optional built-in provider 的当前边界不得在 sprint-003 被默认打包回主发行面。
