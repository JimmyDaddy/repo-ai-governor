# GitHub Copilot Adapter Example

该目录提供 `TK-403` 与 `TK-804` 的最小 GitHub Copilot / GitHub Copilot CLI 接入样例，目标是同时展示：

1. 官方 skills 的原生安装入口
2. 两类 Copilot 可消费的补充规则产物

补充规则产物包括：

1. IDE 侧 `copilot-instructions`
2. CLI 侧 prompt bundle

## Contents

1. `README.md`
   - 接入说明
2. `acceptance.md`
   - 可复现的验收步骤
3. `../../scripts/examples/render-github-copilot-adapter-bundle.js`
   - 从当前仓库治理资产渲染 GitHub Copilot bundle

## Integration Flow

推荐接入步骤：

1. 在目标仓库执行 `repo-ai-governor init --adapter github-copilot`
2. 安装官方 skills：

```bash
repo-ai-governor skills install --surface github-copilot
```

3. 确认仓库存在：
   - `AGENTS.md`
   - `.repo-ai-governor/context/current-context.md`
   - `.repo-ai-governor/adapters/github-copilot.yaml`
   - `.github/skills/`
4. 渲染 IDE 规则文件：

```bash
node ./scripts/examples/render-github-copilot-adapter-bundle.js \
  --cwd <target-repo> \
  --project demo \
  --sprint sprint-001 \
  --command plan \
  --stage plan \
  --format copilot-instructions
```

5. 渲染 Copilot CLI prompt：

```bash
node ./scripts/examples/render-github-copilot-adapter-bundle.js \
  --cwd <target-repo> \
  --project demo \
  --sprint sprint-001 \
  --command review \
  --stage review \
  --format copilot-cli-prompt
```

6. 将生成结果分别写入：
   - `.github/copilot-instructions.md`
   - `.repo-ai-governor/templates/github-copilot-cli.prompt.md`
7. 使用方式：
   - 优先让 GitHub Copilot 原生消费 `.github/skills/`
   - `copilot-instructions` 与 CLI prompt 作为补充规则注入

## What The Bundle Includes

1. 当前命令对应的 workflow 阶段
2. 面向 AI 的 standards 指令
3. 当前 stage 命中的 slot 摘要
4. `AGENTS.md` 与 `current-context.md` 的推荐读取路径
5. 当前 sprint 关键产物路径
6. 可直接落盘的 IDE 指令文件和 CLI prompt 文件内容

## Notes

1. 在 `GitHub Copilot` 下，官方 skills 是原生入口，`copilot-instructions` 与 CLI prompt 是补充层。
2. `plan` 适合演示 IDE instructions；`review` 适合演示 CLI prompt，因为它更依赖明确的产物路径和 CR 生命周期约束。
3. `agent-entry`、workflow、standards、slots 仍然会继续通过补充投影层被利用，而不是丢弃。
