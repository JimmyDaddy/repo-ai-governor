# checklist

- [x] TK-1027 repair targeted biome format drift on existing working-tree files
  - 2026-04-21：任务创建，状态初始化为 `planned`。
  - 2026-04-21：`project-118 / sprint-001` 已创建并激活；当前任务切换为 `in_progress`，用于执行定向 biome format repair。
  - 2026-04-21：已执行 `pnpm exec biome format --write apps/cli/src/main.ts apps/vscode-extension/src/runtime/vscode-extension-chat-participant.ts apps/vscode-extension/src/runtime/vscode-extension-command-controller.ts apps/vscode-extension/test/vscode-extension-chat-participant.test.ts`，4 个 formatter 点名文件已完成定向写回，且未扩大 formatter 命令的作用域。
- [x] TK-1028 verify targeted format repair against build and gate outputs
  - 2026-04-21：任务创建，状态初始化为 `planned`。
  - 2026-04-21：`pnpm run build` 已通过，说明定向 biome write-back 后当前代码面仍可正常构建。
  - 2026-04-21：`pnpm run check` 已重新执行；当前失败点不再是本轮 4 个目标文件的 formatter drift，而是 scope 外 `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts:120` 的 standardized-error 违规。
  - 2026-04-21：已执行 `pnpm exec biome check --formatter-enabled=true --linter-enabled=false --organize-imports-enabled=false --assists-enabled=false` 针对 4 个目标文件的 formatter-only 校验，结果 clean。
- [x] TK-1029 finalize project-118 closeout and restore idle context
  - 2026-04-21：任务创建，状态初始化为 `planned`。
  - 2026-04-21：在 `TK-1027 / TK-1028 / CR-001` scoped clean 收口后，已完成 `project-118` completion audit、project/sprint `completed` write-back、completed history 追加与 idle context 恢复。
- [x] CR-001 review project-118 targeted format repair window
  - 2026-04-21：任务创建，状态初始化为 `review_pending`。
  - 2026-04-21：已完成 scoped review。结论是 project-118 范围内无剩余 actionable finding；4 个目标文件的 biome format drift 已修复，`pnpm run build` 与 targeted biome formatter-only check 均通过。`pnpm run check` 当前剩余失败仅来自 scope 外 `packages/core-orchestration-service/src/local-orchestration-service-sidecar-entry.ts:120` 的 standardized-error 违规，因此本任务收口为 `resolved`。
