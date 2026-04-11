# checklist

- [x] TK-773 add command-based remote_api authoring to connect onboarding flow
  - 2026-04-11：任务创建并直接进入 `in_progress`，范围锁定为 `connect` 首次 remote_api 命令式配置能力。
  - 2026-04-11：在 `main.ts` 中补齐 `--remote-api-model`、`--remote-api-credential-env-var`、`--remote-api-endpoint` 的解析、runtime debug plumbing 与 connect help discoverability。
  - 2026-04-11：在 onboarding runtime 中补齐首次 `remote_api` 候选配置合成逻辑，让 `codex` / `claude-code` 可基于命令输入直接生成 provider/vendorBinding/env-var 默认值。
  - 2026-04-11：补充 runtime、CLI integration 与 help-output regression tests，并同步更新 CLI README 与本地接入文档，明确真实 API key 仍来自外部环境变量。
  - 2026-04-11：执行指定 vitest 回归集与 `pnpm run build`，验证通过。
- [x] TK-774 finalize project-085 closeout after connect remote_api command authoring
  - 2026-04-11：任务创建，状态初始化为 `planned`。
  - 2026-04-11：`TK-773` 已完成，并通过 targeted vitest 与 `pnpm run build` 验证。
  - 2026-04-11：已创建 project-level completion audit summary，切回 project/sprint `completed` 真值，并把 `project-085 / sprint-001` 从 `current-context.md` active primary stream 迁入 completed history。
  - 2026-04-11：已执行最终 ledger/status gate 核验，确认 closeout 后的 sqlite/checklist/tasks.csv、review lifecycle 与 idle context 同步无漂移。
