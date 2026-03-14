# GitHub Copilot Adapter Example

- Date: 2026-03-14
- Task: `TK-403`

## Goal

提供一套面向 GitHub Copilot / GitHub Copilot CLI 的接入样例，把当前治理资产渲染成可直接落盘的规则文件与 CLI prompt 片段，并给出清晰的复现与验收路径。

## What Landed

1. 新增 `src/adapters/github-copilot-bundle.js`
   - 构建 GitHub Copilot bundle 数据结构
   - 汇总 workflow、standards、slots、repository references、artifacts
   - 支持 Markdown / JSON / `copilot-instructions` / `copilot-cli-prompt` 输出
2. 新增 `scripts/examples/render-github-copilot-adapter-bundle.js`
   - 从目标仓库直接渲染 GitHub Copilot bundle
3. 新增 `examples/adapters/github-copilot/`
   - `README.md`
   - `acceptance.md`
4. 抽出 `src/adapters/bundle-shared.js`
   - 复用 bundle 基础构建逻辑，降低 `TK-404` 漂移风险

## Bundle Shape

当前 GitHub Copilot bundle 至少包含：

1. `adapter`
2. `runtime`
3. `workflow`
4. `standards`
5. `slots`
6. `references`
7. `artifacts`
8. `files`
9. `prompt`

## Why This Works

1. GitHub Copilot 预设不直接消费 `agent-entry` 内容，因此样例把 `AGENTS.md` 与 `current-context.md` 作为推荐读取路径注入到规则文件中。
2. `TK-302` 已提供 slot runtime，bundle 可以带上当前 stage 真正命中的 slot，而不是静态罗列全部 slot。
3. `copilot-instructions` 与 `copilot-cli-prompt` 两种输出分别覆盖 IDE 与 CLI 的典型入口，能更好展示 GitHub Copilot 的接入差异。

## Verification

1. 新增 `test/adapters/github-copilot-bundle.test.js`
2. 直接执行：

```bash
node ./scripts/examples/render-github-copilot-adapter-bundle.js \
  --cwd <target-repo> \
  --project demo \
  --sprint sprint-001 \
  --command plan \
  --stage plan \
  --format copilot-instructions
```

3. `PATH=/opt/homebrew/bin:$PATH /opt/homebrew/bin/npm run check` 通过
