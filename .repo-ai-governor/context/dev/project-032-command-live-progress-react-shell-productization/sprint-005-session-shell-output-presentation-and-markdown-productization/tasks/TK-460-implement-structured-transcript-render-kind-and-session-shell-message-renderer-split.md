# TK-460 implement structured transcript render-kind and session-shell message renderer split

- Status: completed
- Date: 2026-03-31
- Owner: AI-Agent
- Priority: P0
- Project: `project-032-command-live-progress-react-shell-productization`
- Sprint: `sprint-005-session-shell-output-presentation-and-markdown-productization`

## 1. 任务目标

将 session-shell transcript item 从单一 `label + lines[]` 模型升级为 render-kind 驱动的 presenter model，并拆分 transcript pane 的消息 renderer。

## 2. Depends On

1. `TK-459`

## 3. 预期产物

1. transcript render-kind contract baseline
2. session-shell message renderer split
3. command recap / system notice presenter baseline

## 4. 验证

1. targeted Vitest for session-shell transcript renderer
2. `node ./scripts/governance/check-task-ledger-sync.js`
3. `node ./scripts/governance/check-sprint-plan-status-sync.js`

## 5. Execution Notes

1. 2026-03-31：任务创建，状态初始化为 `planned`。
2. 2026-03-31：将 `CliSessionShellTranscriptItem` 升级为 render-kind 驱动的 presenter model，新增 `plain_text / markdown / system_notice / command_recap`、`markdownSource` 与 structured `backlinks` 字段，同时保持 `lines[]` 兼容现有 history/search seam。
3. 2026-03-31：`CliSessionShellTranscriptStore` 现按 canonical session event 派生 render-kind；assistant completed answer 会进入 markdown path，command handoff / routing recap 会进入 `command_recap`，system lifecycle event 会进入 `system_notice`。
4. 2026-03-31：`ReactCliTranscriptPane` 已按 render-kind 分发 plain / notice / recap / markdown renderer，并新增 command recap / related backlink presenter baseline；`pnpm exec vitest run apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/react-cli-runner.test.ts` 通过。
5. 2026-03-31：working-tree CR 复核认可“硬编码英文 recap chrome”和“按 backlinks 数量裁剪 recap 正文”两项 finding；已移除 `Summary/Related` presenter chrome，并让 recap/backlinks 真正解耦，相关回归测试重新通过。
