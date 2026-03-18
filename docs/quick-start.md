# Quick Start

- Date: 2026-03-18
- Audience: first-time users and CI/automation integrators

## Goal

在一个全新目录中，跑通 `Repo AI Governor` 的可执行治理闭环：
`init -> doctor -> plan -> check -> run -> review -> review-verify -> report`。

## Prerequisites

1. Node.js `>=18`
2. 可用的 `npm` 与 `npx`

## 1. Create A Workspace

```bash
TMP_DIR="$(mktemp -d /tmp/repo-ai-governor-quickstart.XXXXXX)"
CLI="npx @cjhdev/repo-ai-governor"
echo "$TMP_DIR"
```

## 2. Initialize Governance

```bash
$CLI init \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --adapter codex \
  --language typescript \
  --locale en-US \
  --format json
```

Expected:

1. `.repo-ai-governor/governor.yaml`
2. `AGENTS.md`
3. `.repo-ai-governor/context/current-context.md`
4. `docs/demo/sprint-001/`

Notes:

1. 在 `npx` 场景下，`init` 会按默认策略处理依赖与官方 skills 安装。
2. 如需跳过自动安装，可使用 `--skip-self-install` 或 `--skip-skill-install`。

## 3. List / Install / Doctor Skills

```bash
$CLI skills list \
  --cwd "$TMP_DIR" \
  --surface codex \
  --format json

$CLI skills install \
  --cwd "$TMP_DIR" \
  --surface codex \
  --format json

$CLI skills doctor \
  --cwd "$TMP_DIR" \
  --surface codex \
  --strict \
  --format json
```

如果你不是用 `Codex`，把 `--surface` 改成：

1. `github-copilot`
2. `claude-code`

## 4. Check Repository Health

```bash
$CLI doctor \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --strict \
  --format json
```

Expected:

1. `status: "pass"`
2. no config/layout errors

## 5. Generate Plan And Task Ledger

```bash
cat > "$TMP_DIR/request.md" <<'EOF'
# Requirement

Create a repository governance demo flow.
EOF

$CLI plan \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --input "$TMP_DIR/request.md" \
  --title "Repository governance demo flow" \
  --format json
```

Expected:

1. `docs/demo/sprint-001/plan.md`
2. `docs/demo/sprint-001/tasks/checklist.md`
3. `docs/demo/sprint-001/tasks/tasks.csv`
4. 至少一个 `TK-xxx.md`

## 6. Run Governance Check

```bash
$CLI check \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --write-report \
  --format json
```

## 7. Preview Orchestration (`run`)

先看流程编译结果：

```bash
$CLI run \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --explain-process \
  --format json
```

只做流程校验，不执行阶段派发：

```bash
$CLI run \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --validate-process \
  --format json
```

做一次 dry-run 路由预览：

```bash
$CLI run \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --routing-profile single-codex \
  --input "$TMP_DIR/request.md" \
  --dry-run \
  --format json
```

## 8. Run Review

先准备一个最小示例文件：

```bash
mkdir -p "$TMP_DIR/src"
cat > "$TMP_DIR/src/demo.ts" <<'EOF'
export function demo(): number {
  return 1;
}
EOF
```

执行 review：

```bash
$CLI review \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --path src/demo.ts \
  --format json
```

Expected:

1. `docs/demo/sprint-001/code-review/` 下生成 `review_<slug>.md`

## 9. Verify Review And Advance Status

```bash
REVIEW_FILE="$(ls "$TMP_DIR"/docs/demo/sprint-001/code-review/review_*.md | head -n 1)"

$CLI review-verify \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --source "$REVIEW_FILE" \
  --format json
```

Expected:

1. `review_<slug>.md` 追加复核记录并重命名为 `verified_review_<slug>.md`

## 10. Render Final Report

```bash
$CLI report \
  --cwd "$TMP_DIR" \
  --source .repo-ai-governor/reports/latest.json \
  --format markdown \
  --dry-run
```

## Notes

1. npm 包名是 `@cjhdev/repo-ai-governor`，CLI 命令名是 `repo-ai-governor`。
2. `run` 命令支持 `--resume-from` 与 `--resume-stage`，用于 assisted 模式从检查点恢复。

## Next

1. [Getting Started Example](./getting-started-example.md)
2. [AI Repository Setup Guide](./ai-repo-setup.md)
3. [MVP Acceptance Kit](../examples/mvp-acceptance/README.md)
4. [GA Release Flow](./release-ga/sprint-001/ga-release-flow.md)
5. [Repository Long-Term Maintenance Guide](./governance/long-term-maintenance-guide.md)
