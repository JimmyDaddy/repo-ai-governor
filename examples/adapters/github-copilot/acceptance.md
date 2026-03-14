# GitHub Copilot Adapter Acceptance

## Goal

验证当前仓库的治理资产可以被渲染成 GitHub Copilot / GitHub Copilot CLI 可消费的规则文件与 prompt 片段，并展示规范注入与流程约束。

## Steps

1. 初始化一个临时仓库：

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-copilot.XXXXXX)"
node ./bin/repo-ai-governor.js init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter github-copilot \
  --format json
```

2. 生成一轮 planning 产物：

```bash
node ./bin/repo-ai-governor.js plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --title "GitHub Copilot adapter acceptance" \
  --format json
```

3. 渲染 IDE instructions：

```bash
node ./scripts/examples/render-github-copilot-adapter-bundle.js \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --command plan \
  --stage plan \
  --format copilot-instructions
```

4. 渲染 Copilot CLI prompt：

```bash
node ./scripts/examples/render-github-copilot-adapter-bundle.js \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --command review \
  --stage review \
  --format copilot-cli-prompt
```

## Expected Result

输出应至少包含：

1. `GitHub Copilot Instructions`
2. `AGENTS.md` 与 `.repo-ai-governor/context/current-context.md` 的读取提示
3. workflow 阶段顺序
4. `plan` / `review` 面向 AI 的 standards 指令
5. 当前 stage 命中的 slot 摘要
6. `plan.md`、`checklist.md`、`tasks.csv` 与 `code-review/` 的路径约束

## Optional Validation

如需演示 slot 注入，可在目标仓库启用 `official-security-review` 或 `official-documentation-output` 一类 slot 后再次渲染，对比 `Active Slots` 段落是否出现对应 prompt key。
