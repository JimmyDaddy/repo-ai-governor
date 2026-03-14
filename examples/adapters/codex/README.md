# Codex Adapter Example

该目录提供 `TK-402` 的最小 Codex / Codex CLI 接入样例，目标是把当前治理资产渲染成 Codex 可直接消费的入口说明和 prompt bundle。

## Contents

1. `README.md`
   - 接入说明
2. `acceptance.md`
   - 可复现的验收步骤
3. `../../scripts/examples/render-codex-adapter-bundle.js`
   - 从当前仓库治理资产渲染 Codex bundle

## Integration Flow

推荐接入步骤：

1. 在目标仓库执行 `repo-ai-governor init --adapter codex`
2. 确认仓库存在：
   - `AGENTS.md`
   - `.repo-ai-governor/context/current-context.md`
   - `.repo-ai-governor/adapters/codex.yaml`
3. 使用渲染脚本生成 Codex bundle：

```bash
node ./scripts/examples/render-codex-adapter-bundle.js \
  --cwd <target-repo> \
  --project demo \
  --sprint sprint-001 \
  --command plan \
  --stage plan
```

4. 将生成结果作为 Codex 当前任务的补充上下文，配合 `AGENTS.md` 一起使用。

## What The Bundle Includes

1. 工作流阶段顺序
2. 面向当前命令的 AI 规范指令
3. 当前命中的 slot 摘要
4. `AGENTS.md` 与 `current-context.md` 路径
5. 当前 sprint 关键产物路径

## Notes

1. 当前样例优先覆盖 `plan` 场景，因为它最能展示 workflow + standards + slots + agent-entry 的组合效果。
2. `review`、`review-verify` 场景可通过 `--command review --stage review` 等参数复用同一渲染器。
3. `TK-403` 已沿用同一思路补齐 GitHub Copilot 样例；`TK-404` 将继续复用相同的 bundle 骨架补齐 Claude Code 样例。
