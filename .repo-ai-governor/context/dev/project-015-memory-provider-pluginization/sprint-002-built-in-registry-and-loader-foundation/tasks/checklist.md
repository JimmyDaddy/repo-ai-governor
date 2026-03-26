# checklist

- [x] TK-167 memory provider registry package 与 built-in descriptor 契约基线
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始建立 registry / descriptor contract 与 package boundary。
  - 2026-03-26：任务完成，已建立 `@repo-ai-governor/memory-provider-registry`、切走 CLI 入口硬编码 provider 选择逻辑，并同步 runtime distribution assets。
- [x] TK-168 CLI memory provider loader cutover 与 legacy config 兼容
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始把 CLI memory provider 组合逻辑收敛到 registry loader，并扩展 legacy `storeEngine` 兼容面。
  - 2026-03-26：任务完成，已新增 `memory.provider.id` / `provider.module` 契约槽位、将 CLI diagnostics 对齐到 loader 输出，并保持 legacy `storeEngine` 兼容。
- [x] TK-169 distribution 与 release 对 optional built-in provider 的边界收口
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始收敛 default distribution 与 optional built-in provider 的 runtime/release 边界。
  - 2026-03-26：任务完成，默认发行包已排除 `sqlite-fs` optional built-in provider 载荷，并把 verify-local / release-ready 校验同步到最小支持矩阵。
- [x] TK-170 sprint-002 出口验收与 sprint-003 optional plugin 输入约束
  - 2026-03-26：任务创建，状态初始化为 `planned`。
  - 2026-03-26：状态切换为 `in_progress`，开始汇总 `DA-167`、`DA-168`、`DA-169` 的证据链，并判定 sprint-002 是否达到 `accept`。
  - 2026-03-26：任务完成，已新增 `DA-170`，给出 sprint-002 `accept` 结论，并冻结 sprint-003 optional plugin mode 的 allowlist / prefix / path / module policy 输入约束。
  - 2026-03-26：根据 working-tree CR follow-up 收紧 truthfulness 口径，明确默认发行包对 `sqlite-fs` optional built-in provider 仅保留 parser/selection compatibility 与 fail-closed 语义，并同步回写 `DA-168/DA-170` 与 sprint/project plan。
