# Claude Code Adapter Example

该目录提供 `TK-404` 与 `TK-804` 的最小 Claude Code 接入样例，目标是同时展示：

1. 官方 skills 的原生安装入口
2. Claude Code 可直接消费的两段补充 prompt

补充 prompt 包括：

1. `system prompt`
2. `task prompt`

## Contents

1. `README.md`
   - 接入说明
2. `acceptance.md`
   - 可复现的验收步骤
3. `../../scripts/examples/render-claude-code-adapter-bundle.js`
   - 从当前仓库治理资产渲染 Claude Code bundle

## Integration Flow

推荐接入步骤：

1. 在目标仓库执行 `repo-ai-governor init --adapter claude-code`
2. 安装官方 skills：

```bash
repo-ai-governor skills install --surface claude-code
```

3. 确认仓库存在：
   - `AGENTS.md`
   - `.repo-ai-governor/context/current-context.md`
   - `.repo-ai-governor/adapters/claude-code.yaml`
   - `.claude/skills/`
4. 渲染 Claude Code system prompt：

```bash
node ./scripts/examples/render-claude-code-adapter-bundle.js \
  --cwd <target-repo> \
  --project demo \
  --sprint sprint-001 \
  --command plan \
  --stage plan \
  --format system-prompt
```

5. 渲染 Claude Code task prompt：

```bash
node ./scripts/examples/render-claude-code-adapter-bundle.js \
  --cwd <target-repo> \
  --project demo \
  --sprint sprint-001 \
  --command review \
  --stage review \
  --format task-prompt
```

6. 将生成结果分别写入：
   - `.repo-ai-governor/templates/claude-code-system.prompt.md`
   - `.repo-ai-governor/templates/claude-code-task.prompt.md`
7. 使用方式：
   - 优先让 Claude Code 原生消费 `.claude/skills/`
   - `system prompt` 与 `task prompt` 作为补充上下文

## What The Bundle Includes

1. 当前命令对应的 workflow 阶段
2. 面向 AI 的 standards 指令
3. 当前 stage 命中的 slot 摘要
4. `AGENTS.md` 与 `current-context.md` 的路径和摘录
5. 当前 sprint 关键产物路径
6. 可直接落盘的 system prompt 和 task prompt 文件内容

## Notes

1. 在 `Claude Code` 下，官方 skills 是原生入口，prompt 是补充层。
2. `system prompt` 负责稳定治理规则，`task prompt` 负责注入本次 command/stage 的运行时上下文。
3. 原生 skill 安装路径也兼容后续与 subagent 组合的场景。
