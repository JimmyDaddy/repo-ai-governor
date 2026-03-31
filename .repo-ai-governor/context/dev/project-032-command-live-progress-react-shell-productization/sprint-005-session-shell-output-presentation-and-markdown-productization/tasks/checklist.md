# checklist

- [x] TK-460 implement structured transcript render-kind and session-shell message renderer split
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是把 transcript item 从纯 `lines[]` 升级为 render-kind 驱动的 presenter model，并拆分 message renderer。
  - 2026-03-31：主执行流已切换到 `project-032 / sprint-005`；开始实现 transcript render-kind contract 与 renderer split。
  - 2026-03-31：已完成 transcript render-kind contract、structured backlinks、session-shell renderer split 与 command recap / system notice presenter baseline；`session-shell-transcript-store.test.ts`、`react-cli-runner.test.ts` 通过。
  - 2026-03-31：working-tree CR 已认可并修复 presenter follow-up：移除硬编码英文 recap chrome，并让 recap/backlinks 展示彻底解耦。
- [x] TK-461 integrate assistant markdown rendering and transcript presentation verification
  - 2026-03-31：任务创建，状态初始化为 `planned`；目标是接入 assistant markdown rendering、完成 transcript presentation verification，并确认不破坏 `stderr-only` / `stdout` contract。
  - 2026-03-31：已完成 assistant markdown renderer baseline 与 transcript presentation regression coverage；`session-shell-runner.test.ts`、`cli-output-contract.integration.test.ts`、`pnpm run build` 通过，并已补齐 review / closeout artifacts。
  - 2026-03-31：working-tree CR 修复后再次通过 transcript/store、session-shell runner、output contract 与 build 验证，并将 `code_review_working-tree-20260331-1438.md` 收口为 resolved。
