# checklist

- [x] TK-175 memory provider shared loader contract 与 host surface baseline
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始收敛 CLI、desktop host 与 service-backed runtime 共用的 shared loader / host surface / runtime mode 契约。
  - 2026-03-26：完成 shared loader / host surface baseline，service-owned `memoryProvider` composition summary 与 source-sidecar loader 映射已收口，产出 `DA-175`。
- [x] TK-176 CLI、desktop host 与 service-backed runtime 的 memory provider loader reuse cutover
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始将 CLI、desktop host 与 service-backed runtime 切到同一条 loader reuse seam。
  - 2026-03-26：完成 CLI/desktop/service-backed runtime loader reuse cutover，embedded shell 与 sidecar client 已统一消费 `memoryConfig`，产出 `DA-176`。
- [x] TK-177 service-host packaging、clean-room 与 release gate expansion for memory providers
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始扩展 service-host / desktop 维度的 packaging、clean-room 与 release gate。
  - 2026-03-26：完成 service-host packaging、desktop smoke、local distribution 与 clean-room installed-package 验证扩展，产出 `DA-177`。
  - 2026-03-26：按 working-tree CR follow-up 将 service-host clean-room 校验切换到 `@cjhdev/repo-ai-governor/service-host` 公开入口，并完成 default / plugin-enabled release 验证复跑。
- [x] TK-178 sprint-004 出口验收与 project-015 completion assessment
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始汇总 sprint-004 证据链并判断 `project-015` 完成态。
  - 2026-03-26：完成 sprint-004 出口验收，判定 `project-015-memory-provider-pluginization` 达到 `completed`，产出 `DA-178` 与项目级 completion audit。
  - 2026-03-26：按 working-tree CR follow-up 明确 `active closeout surface` 例外，收紧 `current-context` / project plan / master plan 之间的完成态语义。
