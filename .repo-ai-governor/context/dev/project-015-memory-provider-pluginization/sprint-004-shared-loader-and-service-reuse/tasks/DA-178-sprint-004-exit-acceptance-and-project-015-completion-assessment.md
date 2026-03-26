# DA-178 sprint-004 出口验收与 project-015 completion assessment

- Status: active
- Date: 2026-03-26
- Producer Task: `TK-178`

## 1. 出口结论

当前判定：`accept`。

`project-015 / sprint-004-shared-loader-and-service-reuse` 已满足本轮 sprint exit criteria：

1. `memory-provider-registry` 已成为 CLI、desktop host 与 service-backed runtime 共用的唯一 loader / registry seam。
2. `hostSurface` 与 `runtimeMode` 已形成正式 contract，host 不再复制 provider resolution 逻辑。
3. service-host / desktop 的 packaging、clean-room 与 release gate 已与 CLI-only distribution 分离验证。
4. `project-015-memory-provider-pluginization` 已具备切换为 `completed` 的条件。

## 2. 证据链

1. `DA-175`
   - shared loader、`hostSurface`、`runtimeMode` 与 service-owned `memoryProvider` composition summary 已冻结。
2. `DA-176`
   - CLI、desktop host 与 service-backed runtime 已切到统一 loader reuse seam。
3. `DA-177`
   - service-host / desktop packaging、local distribution、clean-room 与 release gate 已形成独立验证链路。

## 3. sprint-004 验收结果

1. task 层状态
   - `TK-175` ~ `TK-178` 共 `4/4 completed`
2. 能力层状态
   - shared loader 已覆盖 CLI 与 orchestration service host
   - desktop sidecar runtime 已消费 service-owned `memoryProvider` composition
   - installed-package clean-room 已能验证 service-host memory provider resolution
3. release / quality 层状态
   - `check:desktop-entry-smoke`
   - `release:verify-local`
   - `release:verify-cleanroom-local-install`
   - `pnpm run check`
   均已给出通过证据

## 4. project-015 完成态判断

1. 当前 `project-015-memory-provider-pluginization` 可以切换为 `completed`。
2. 理由：
   - draft 技术方案中定义的 Phase 1 built-in registry、Phase 2 optional plugin mode、Phase 3 service reuse 均已完成
   - 四个 sprint 已全部完成，且 `project-015` DoD 三项已满足
   - 当前不存在阻止闭项的 residual blocker

## 5. 后续输入约束

1. 后续若继续扩大 memory provider external plugin policy、remote plugin trust model 或 service-host 长期运维能力，应新开 follow-up project/sprint，不再回退 `project-015` 的已完成基线定义。
2. `memory.provider.module` 仍必须继续受 allowlist / prefix / fail-closed 约束，不能回退到任意 module execution。
3. service-host / desktop 维度的 verification 以后必须继续独立存在，不能再用 CLI-only smoke 代替。
4. `project-015 / sprint-004` 当前可继续作为默认执行 surface 保留，直到下一条主执行流被显式激活，再统一迁入 `completed-streams-history.md`。
