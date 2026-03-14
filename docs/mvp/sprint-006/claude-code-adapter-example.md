# Claude Code Adapter Example

- Date: 2026-03-14
- Task: `TK-404`

## Goal

提供一套面向 Claude Code 的接入样例，把当前治理资产渲染成可直接落盘的 `system prompt` 与 `task prompt`，并给出清晰的复现与验收路径。

## What Landed

1. 新增 `src/adapters/claude-code-bundle.js`
   - 构建 Claude Code bundle 数据结构
   - 汇总 workflow、standards、slots、entry files、artifacts
   - 支持 Markdown / JSON / `system-prompt` / `task-prompt` 输出
2. 新增 `scripts/examples/render-claude-code-adapter-bundle.js`
   - 从目标仓库直接渲染 Claude Code bundle
3. 新增 `examples/adapters/claude-code/`
   - `README.md`
   - `acceptance.md`

## Bundle Shape

当前 Claude Code bundle 至少包含：

1. `adapter`
2. `runtime`
3. `workflow`
4. `standards`
5. `slots`
6. `entry`
7. `artifacts`
8. `files`
9. `prompt`

## Why This Works

1. Claude Code 预设支持 `agent-entry` 与 `runtime-context` 输入源，因此样例可以直接把 `AGENTS.md` 和 `current-context.md` 的路径与摘录带进 bundle。
2. `system prompt` 与 `task prompt` 的拆分更贴合 agent 场景：前者承载稳定治理规则，后者承载本次 command/stage 的运行时上下文。
3. `TK-302` 已提供 slot runtime，bundle 可以带上当前 stage 真正命中的 slot，而不是静态罗列全部 slot。

## Verification

1. 新增 `test/adapters/claude-code-bundle.test.js`
2. 直接执行：

```bash
node ./scripts/examples/render-claude-code-adapter-bundle.js \
  --cwd <target-repo> \
  --project demo \
  --sprint sprint-001 \
  --command plan \
  --stage plan \
  --format system-prompt
```

3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check` 通过
