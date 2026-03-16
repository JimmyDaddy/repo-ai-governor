# Codex Adapter Acceptance

## Goal

验证当前仓库的治理资产可以被渲染成 Codex / Codex CLI 可消费的 bundle，并展示规范注入与流程约束。

## Steps

1. 初始化一个临时仓库：

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-codex.XXXXXX)"
node ./bin/repo-ai-governor.js init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --format json
```

2. 安装官方 skills：

```bash
node ./bin/repo-ai-governor.js skills install \
  --cwd "$TMP_DIR" \
  --surface codex \
  --format json
```

3. 生成一轮 planning 产物：

```bash
node ./bin/repo-ai-governor.js plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --title "Codex adapter acceptance" \
  --format json
```

4. 渲染 Codex bundle：

```bash
node ./scripts/examples/render-codex-adapter-bundle.js \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --command plan \
  --stage plan
```

## Expected Result

输出应至少包含：

1. `Adapter: codex`
2. `Products: codex, codex-cli`
3. `AGENTS.md` 与 `.repo-ai-governor/context/current-context.md`
4. workflow 阶段顺序
5. `plan` 面向 AI 的 standards 指令
6. 当前 stage 命中的 slot 摘要
7. `.codex/skills/governor-context-loader/SKILL.md`
8. 原生 skills + bundle 补充层的接线思路

## Optional Validation

如需演示 slot 注入，可在目标仓库启用 `official-documentation-output` 一类 slot 后再次渲染 bundle，对比 `Active Slots` 段落是否出现对应 prompt key。
