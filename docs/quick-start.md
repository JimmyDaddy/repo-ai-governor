# Quick Start

- Date: 2026-03-14
- Audience: first-time users

## Goal

在一个全新目录中，用最短路径跑通 `Repo AI Governor` 的最小体验，并为当前 AI 工具安装官方 skills。

## Prerequisites

1. Node.js `>=18`
2. 可用的 `npm`、`pnpm` 或 `npx`

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
  --format json
```

Expected:

1. `.repo-ai-governor/governor.yaml`
2. `AGENTS.md`
3. `.repo-ai-governor/context/current-context.md`
4. `docs/demo/sprint-001/`

## 3. Install Official Skills

```bash
$CLI skills install \
  --cwd "$TMP_DIR" \
  --surface codex \
  --format json
```

Expected:

1. `status: "installed"` 或 `status: "planned"`
2. `.codex/skills/` 下出现官方治理 skill

如果你不是用 `Codex`，可以改成：

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

## 5. Generate A Plan

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
4. at least one `TK-xxx.md`

## 6. Run Governance Check

```bash
$CLI check \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --format json
```

## 7. Preview Automation Run

可先预览一次自动化编排（单入口示例）：

```bash
$CLI run \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --input "$TMP_DIR/request.md" \
  --routing-profile single-codex \
  --dry-run \
  --format json
```

也可以先做“只解释/只校验”：

```bash
$CLI run \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --explain-process \
  --format json

$CLI run \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --validate-process \
  --format json
```

## 8. Run A Review

Prepare a simple file first:

```bash
mkdir -p "$TMP_DIR/src"
cat > "$TMP_DIR/src/demo.js" <<'EOF'
export function demo() {
  // TODO: refine
  return 1;
}
EOF
```

Then run review:

```bash
$CLI review \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --path src/demo.js \
  --format json
```

Expected:

1. a `review_<slug>.md` file under `code-review/`
2. findings for TODO markers or missing tests when applicable

## 9. Render A Report

```bash
$CLI report \
  --cwd "$TMP_DIR" \
  --source docs/demo/sprint-001/code-review/review_src-demo-js.md \
  --format json \
  --dry-run
```

说明：

1. npm 包名是 `@cjhdev/repo-ai-governor`
2. CLI 命令名仍然是 `repo-ai-governor`

## 10. Run Multi-AI Smoke Gate

```bash
$CLI run \
  --cwd "$TMP_DIR" \
  --project demo \
  --sprint sprint-001 \
  --mode assisted \
  --routing-profile multi-ai-dev-review \
  --input "$TMP_DIR/request.md" \
  --dry-run \
  --format json
```

说明：

1. 查看输出中的 `routing.routes`，确认 routeKey 到 surface 的映射符合预期。
2. 本仓库维护者可额外执行 `bash scripts/ci/run-automation-smoke.sh` 进行全量 smoke gate（包含三入口与多 AI 分工场景）。

## Next

1. [Getting Started Example](./getting-started-example.md)
2. [MVP Acceptance Kit](../examples/mvp-acceptance/README.md)
3. [GA Release Flow](./release-ga/sprint-001/ga-release-flow.md)
4. 安装完官方 skills 后，可让 AI 直接触发：
   - `$governor-plan-runner`
   - `$governor-task-implementer`
   - `$governor-delivery-finisher`
