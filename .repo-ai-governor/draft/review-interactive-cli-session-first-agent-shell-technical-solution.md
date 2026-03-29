# 评审：Session-First 主 Agent 终端壳层技术方案

- Status: review
- Date: 2026-03-30
- Target: `.repo-ai-governor/draft/interactive-cli-session-first-agent-shell-technical-solution.md`
- Related:
  - `.repo-ai-governor/draft/interactive-cli-react-style-technical-solution.md`
  - `.repo-ai-governor/draft/runtime-cli-run-live-react-session-shell-technical-solution.md`
  - `.repo-ai-governor/normative_knowledge_sources/product-requirements-brief.md`
  - `.repo-ai-governor/normative_knowledge_sources/technical-solutions/runtime-cli-interactive-shell/module-overview.md`
  - `apps/cli/src/main.ts`
  - `apps/cli/src/constants/cli-command.constant.ts`

## 总体判断

**方案方向正确，且已经具备 promotion 条件。** 它不是对现有 React shell 基线的推翻，而是把 `runtime.cli-interactive-shell` 从“命令内交互”提升为“session-first 本地人类入口”。主线决策基本自洽：

1. 保留现有显式子命令与自动化 contract。
2. 让无子命令默认进入会话，并把普通文本与 slash command 收敛到同一会话面。
3. 把 canonical session state 收敛到 local orchestration service，避免 CLI / desktop 双写两套状态。

## 一、评审中已收敛的问题

### 1. service-owned session state 的理由已经写清楚

方案已补充直白说明：如果 session 只保存在 CLI 进程里，那么 CLI 一退出状态就丢失，future desktop 也无法继续同一条 session。这个理由已经足够支撑“CLI 只做 client + presenter”的设计约束。

### 2. 会话控制命令已经明确

方案已显式区分：

1. 会话内：`/exit`、`/resume [session-id]`、`Ctrl+C`、`Ctrl+D`
2. 会话外：`repo-ai-governor resume [session-id]`

同时也明确解释了为什么不建议增加顶层 `repo-ai-governor exit`。

### 3. 任务编号冲突风险已经消除

原草稿中的 `TK-001 ~ TK-016` 已改为新的 `TK-401 ~ TK-416` 号段，避免与当前仓库既有 `TK-3xx` 执行流冲突。

### 4. `/model` 的语义已经降为 future setting command

当前仓库并不存在现成的顶层 `model` 命令。方案现已明确：

1. `/model` 不属于 MVP
2. 它如果后续落地，也更接近 session routing / adapter preference，而不是“直接切底层模型参数”
3. 真正实现时可以改名为 `/agent` 或 `/routing`

## 二、最终结论（2026-03-30）

1. 该 draft 已经过一轮针对性 review 收敛，关键疑点都已在正文中补清。
2. 用户已明确表示“这个技术方案我接受了”。
3. 因此，这份方案现在可以进入正式 promotion，作为 `runtime.cli-interactive-shell` 的 `v2` formal direction，而不是继续停留在 draft-only 状态。
