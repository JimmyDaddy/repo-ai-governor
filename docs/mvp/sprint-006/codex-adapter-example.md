# Codex Adapter Example

- Date: 2026-03-14
- Task: `TK-402`

## Goal

提供一套面向 Codex / Codex CLI 的接入样例，把当前治理资产渲染成 Codex 可直接消费的 bundle，并给出清晰的复现与验收路径。

## What Landed

1. 新增 `src/adapters/codex-bundle.js`
   - 构建 Codex bundle 数据结构
   - 汇总 workflow、standards、slots、agent-entry、runtime-context、artifacts
   - 支持 Markdown / JSON 输出
2. 新增 `scripts/examples/render-codex-adapter-bundle.js`
   - 从目标仓库直接渲染 Codex bundle
3. 新增 `examples/adapters/codex/`
   - `README.md`
   - `acceptance.md`

## Bundle Shape

当前 Codex bundle 至少包含：

1. `adapter`
2. `runtime`
3. `workflow`
4. `standards`
5. `slots`
6. `entry`
7. `artifacts`
8. `prompt`

## Why This Works

1. `Codex` 预设本身支持 `agent-entry` 与 `runtime-context` 输入源。
2. `TK-107` 已把当前上下文移到独立文件，bundle 可以稳定引用 `AGENTS.md` 和 `current-context.md`。
3. `TK-302` 已提供 slot runtime，bundle 可以带上当前 stage 真正命中的 slot，而不是静态罗列全部 slot。

## Verification

1. 新增 `test/adapters/codex-bundle.test.js`
2. 直接执行：

```bash
node ./scripts/examples/render-codex-adapter-bundle.js \
  --cwd <target-repo> \
  --project demo \
  --sprint sprint-001 \
  --command plan \
  --stage plan
```

3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check` 通过
