# checklist

- [x] TK-607 freeze VS Code secondary surface support boundary and packaging matrix
- [x] TK-608 align support matrix maintainer evidence and installer narrative for VS Code extension
- [x] TK-609 close VS Code secondary surface declaration with smoke and docs parity evidence
- [x] CR-001 sprint-001-vscode-support-boundary-and-packaging-narrative delegated review loop round 1
  - 2026-04-07：任务创建，状态初始化为 `review_pending`。
  - 2026-04-07：fresh reviewer Zeno round 1 提出 1 条 actionable finding：VS Code packaging-boundary test 只检查 `package.json.files`，不足以支撑新的 packaged-distribution support claim。
  - 2026-04-07：主 agent 已接受该 finding，补入真实 `pnpm pack --json --dry-run` artifact-level verification，并把文档表述收紧为“内部 `dist/apps/vscode-extension/**` 产物不等于正式扩展分发”。
  - 2026-04-07：修复后重跑 targeted vitest、`pnpm run build`、`pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` 与 Biome；当前 round 1 已收口为 `resolved`。
- [x] CR-002 sprint-001-vscode-support-boundary-and-packaging-narrative delegated review loop round 2
  - 2026-04-07：任务创建，状态初始化为 `review_pending`。
  - 2026-04-07：fresh reviewer Ramanujan 在第 2 轮提出 1 条 actionable finding：`docs/support-matrix*.md` 过度声明了 `pnpm run check:ide-docs-parity` 对公开支持边界文档的覆盖范围。
  - 2026-04-07：主 agent 已接受该 finding，将 `check:ide-docs-parity` 的证据表述收紧为 checked IDE template-doc parity，并把 packaged-artifact truth 明确回收到 packaging-boundary test 与 `pnpm pack --json --dry-run`。
  - 2026-04-07：修复后重跑 targeted vitest、`pnpm run build`、`pnpm pack --json --dry-run`、`pnpm run check:ide-entry-smoke`、`pnpm run check:ide-docs-parity` 与 Biome；当前 round 2 已收口为 `resolved`。
- [x] TK-640 sprint-001 closeout and sprint-002 activation handoff
  - 2026-04-07：任务创建并切换为 `in_progress`，开始执行 sprint-001 closeout 与 sprint-002 activation handoff。
  - 2026-04-07：已完成 `DA-640`、project/sprint/context/history 写回，并激活 `sprint-002` 与 `TK-610`。
