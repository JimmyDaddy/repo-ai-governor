# TK-463 improve session-shell command recap presentation and artifact formatting

- Status: completed
- Owner: AI-Agent
- Priority: P1
- Project: `project-034-session-shell-doctor-progress-first-frame-followup`
- Sprint: `sprint-002-session-shell-command-recap-presentation-polish`
- Date: 2026-03-31

## 1. 任务目标

1. 改善 Governor 在 session shell 中的 `command_recap` 输出可读性。
2. 让 `摘要 / 关键状态 / artifact` 这些 recap 行从原始文本平铺升级为更清晰的结构化 section。

## 2. 背景

当前 `command_recap` 渲染本质上还是“标题 + 文本列表”，导致 handoff 完成后的 recap 信息在视觉上没有层次，artifact 路径也和普通文本混在一起，阅读负担较高。

## 3. 实现摘要

1. 更新 `apps/cli/src/react-cli/views/transcript-pane.tsx`，将 `command_recap` presenter 改为 border card，并对 key/value recap 行进行语义拆分。
2. 支持把 `artifact=...` 渲染到独立 artifact section，把 `a · b · c` 形式的摘要拆成更易扫读的状态项。
3. 更新 `apps/cli/test/runtime/react-cli-runner.test.ts`，让渲染回归覆盖新的 recap card 输出形态。
4. 补齐 slash handoff 的 metadata seam，让 `SESSION_MESSAGE_APPENDED` 成功结果也能真正走 `command_recap` renderer，而不是停留在 plain-text fallback。

## 4. 验证

1. `pnpm exec vitest run apps/cli/test/runtime/react-cli-runner.test.ts apps/cli/test/runtime/session-shell-runner.test.ts`
2. `pnpm run build`
3. `pnpm exec vitest run apps/cli/test/runtime/session-shell-transcript-store.test.ts apps/cli/test/runtime/session-shell-runner.test.ts apps/cli/test/runtime/react-cli-runner.test.ts`

## 5. 风险与备注

1. 本次仅调整 presenter，不修改 transcript contract 或 service event payload，因此回归风险主要集中在 CLI 可视输出层。
2. 后续若要继续提升观感，可以再单独优化 `command_recap` 的 label copy 与 spacing token；这次先优先保证 slash handoff 路径真正命中新样式。
